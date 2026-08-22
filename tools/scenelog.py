#!/usr/bin/env python3
"""Bake SCENELOG — the per-version change history the scene sidebar shows.

Every feedback round is a NEW PART FILE (the versioning law), and the commit
that ADDED that file carries the round's story: WHO, WHEN (date + time), the
subject line, and a body full of round notes. One git pass maps every part
file to its birth commit; every reg id in a file inherits that record. Files
that register a crowd of scenes at once (the original pieces packs,
part15_history.js) get who/when but no message — the subject of a bulk
commit is about none of them in particular.

WHO is never guessed. Every session commits as author "Claude", so a name
appears on a version only from real evidence, in this order:
  1. a `Round-By: <name>` trailer in the commit (the convention going
     forward — see Working agreements in CLAUDE.md);
  2. a human git author (the early hand-committed rounds);
  3. an entry in CREDITS below — manual corrections for history that
     predates the trailer, added when the person tells us.
The keeper from the owners list is shown only in the section header, labeled
"kept by" — ownership is a coordination fact, not authorship. (V1 of this
tool fell back to the keeper per row; Lance caught it misattributing his
White Study rounds to Nima. Guessed attribution is worse than none.)
The raw git author, commit hash and Claude session link ride along for the
expander, so what IS claimed stays inspectable.

Emits JSON on stdout; tools/build.sh bakes it as `const SCENELOG = ...`.
Fails soft: no git → empty log, the UI shows bare version rows.
"""
import json, re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATEFMT = '--date=format:%b %d %Y|%H:%M'
FMT = '%h|%an|%ad|%s'          # with DATEFMT the date itself splits into d|t
BODY_MAX = 700

# keep in sync with the Owners section of CLAUDE.md
OWNERS = {}
for fams, who in [
    (('SRC-15', 'SRC-10', 'SRC-01'), 'Kasia'),
    (('SRC-34', 'SRC-32', 'SRC-09', 'SRC-36', 'SRC-37', 'SRC-38',
      'SRC-39', 'SRC-40', 'SRC-41', 'SRC-42'), 'Nima'),
    (('SRC-18', 'SRC-30', 'SRC-04'), 'Lance'),
]:
    for f in fams:
        OWNERS[f] = who

# Manual attribution for pre-trailer history — exact version id → person.
# Add entries only on the person's own say-so.
CREDITS = {
    # Lance, Aug 2026: "I made all the recent changes on White Study" (V2-V7)
    **{f'SRC-34.{n}': 'Lance' for n in range(2, 8)},
}


def git(*args, timeout=60):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True,
                          text=True, timeout=timeout).stdout


def parse_meta(line):
    """'h|an|d|t|s' → dict, or None."""
    if line.count('|') < 4:
        return None
    h, an, d, t, s = line.split('|', 4)
    return {'h': h, 'a': an, 'd': d, 't': t, 's': s}


def births():
    """part file → birth-commit meta dict."""
    try:
        out = git('log', '--diff-filter=A', '--name-status',
                  '--format=@' + FMT, DATEFMT, '--', 'parts/')
    except Exception:
        return {}
    born, meta = {}, None
    for line in out.splitlines():
        if line.startswith('@'):
            meta = parse_meta(line[1:])
        elif line.startswith('A\t') and meta:
            born[line[2:].strip()] = meta  # newest-first: overwrite → earliest add wins
    return born


def birth_follow(relpath):
    """Fallback for parts renumbered in a merge — -m diffs the merge itself."""
    try:
        out = git('log', '-m', '--diff-filter=A', '--format=' + FMT, DATEFMT,
                  '--', relpath, timeout=30).strip()
    except Exception:
        return None
    # a file reads as "added" against the parent that lacked it in EVERY later
    # merge too — the oldest hit is the actual birth
    meta = parse_meta(out.splitlines()[-1]) if out else None
    if meta and meta['s'].startswith('Merge '):
        # the round's real story is the branch tip the merge brought in
        try:
            tip = git('show', '-s', '--format=' + FMT, DATEFMT,
                      meta['h'] + '^2', timeout=30).strip()
            tip_meta = parse_meta(tip)
            if tip_meta:
                meta = tip_meta
        except Exception:
            pass
    return meta


def body_of(h):
    """Commit body → (excerpt, session_url, round_by), trailers stripped."""
    try:
        raw = git('show', '-s', '--format=%b', h, timeout=30)
    except Exception:
        return '', '', ''
    session = ''
    m = re.search(r'Claude-Session:\s*(https?://\S+)', raw)
    if m:
        session = m.group(1)
    round_by = ''
    m = re.search(r'^\s*Round-By:\s*(.+?)\s*$', raw, re.M)
    if m:
        round_by = m.group(1)
    lines = [ln for ln in raw.splitlines()
             if not re.match(r'\s*(Co-Authored-By|Claude-Session|Round-By):', ln)]
    body = '\n'.join(lines).strip()
    if len(body) > BODY_MAX:
        cut = body[:BODY_MAX]
        body = cut[:max(cut.rfind('\n'), BODY_MAX - 80)].rstrip() + ' …'
    return body, session, round_by


def clean(subject, ver):
    """Drop a 'SRC-xx.y Title Vn:' prefix — the row already names the version."""
    s = subject.strip()
    if s.startswith('Merge '):
        s = re.sub(r'^Merge\s+(branch\s+)?', '', s)
        s = re.sub(r'\s+into\s+\S+.*$', '', s).strip("'\"")
    for sep in (':', ' — ', ' - '):
        if sep in s:
            head, tail = s.split(sep, 1)
            if re.search(r'SRC-\d+', head) or re.search(r'\bV%d\b' % ver, head, re.I):
                s = tail.strip()
                break
    if '/' in s and ' ' not in s:  # a bare branch name says nothing
        return ''
    return s


def main():
    born = births()
    bodies = {}
    log = {}
    for pf in sorted((ROOT / 'parts').glob('*.js')):
        ids = re.findall(r"id:\s*'(SRC-[^']+)'", pf.read_text(errors='replace'))
        if not ids:
            continue
        meta = born.get('parts/' + pf.name) or birth_follow('parts/' + pf.name)
        for sid in ids:
            if not meta:
                log[sid] = {}
                continue
            entry = {'d': meta['d'], 't': meta['t'], 'h': meta['h'], 'a': meta['a']}
            round_by = ''
            if len(ids) <= 2:  # a bulk file's commit subject is about nobody
                vm = re.search(r'\.(\d+)', sid)
                m = clean(meta['s'], int(vm.group(1)) if vm else 1)
                if m:
                    entry['m'] = m
                if meta['h'] not in bodies:
                    bodies[meta['h']] = body_of(meta['h'])
                b, sess, round_by = bodies[meta['h']]
                if b:
                    entry['b'] = b
                if sess:
                    entry['s'] = sess
            # WHO — evidence only, never a guess:
            # trailer > human git author > manual credit. Else no name.
            by = round_by \
                or (meta['a'] if 'claude' not in meta['a'].lower() else '') \
                or CREDITS.get(sid)
            if by:
                entry['by'] = by
            log[sid] = entry
    print(json.dumps({'owners': OWNERS, 'log': log}, separators=(',', ':')))


if __name__ == '__main__':
    main()
