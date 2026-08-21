#!/usr/bin/env python3
"""Bake SCENELOG — the per-version change history the scene sidebar shows.

Every feedback round is a NEW PART FILE (the versioning law), and the commit
that ADDED that file carries the round's summary ("White Study V7: pink is
yours; the drop learns manners"). One git pass maps every part file to its
birth commit; every reg id in a file inherits that {date, message}. Files
that register a crowd of scenes at once (the original pieces packs,
part15_history.js) get a date but no message — the subject of a bulk commit
is about none of them in particular.

"Who" comes from the owners list in CLAUDE.md, not git — every session
commits as Claude, so the family's keeper is the honest answer.

Emits JSON on stdout; tools/build.sh bakes it as `const SCENELOG = ...`.
Fails soft: no git → empty log, the UI shows bare version rows.
"""
import json, re, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

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


def births():
    """part file → (date, subject) of the commit that first added it."""
    try:
        out = subprocess.run(
            ['git', 'log', '--diff-filter=A', '--name-status',
             '--format=@%ad|%s', '--date=format:%b %d %Y', '--', 'parts/'],
            cwd=ROOT, capture_output=True, text=True, timeout=60).stdout
    except Exception:
        return {}
    born, meta = {}, None
    for line in out.splitlines():
        if line.startswith('@'):
            meta = tuple(line[1:].split('|', 1))
        elif line.startswith('A\t') and meta and len(meta) == 2:
            born[line[2:].strip()] = meta  # newest-first: overwrite → earliest add wins
    return born


def birth_follow(relpath):
    """Fallback for parts renumbered in a merge — -m diffs the merge itself."""
    try:
        out = subprocess.run(
            ['git', 'log', '-m', '--diff-filter=A', '--format=%h|%ad|%s',
             '--date=format:%b %d %Y', '--', relpath],
            cwd=ROOT, capture_output=True, text=True, timeout=30).stdout.strip()
    except Exception:
        return None
    # a file reads as "added" against the parent that lacked it in EVERY later
    # merge too — the oldest hit is the actual birth
    last = out.splitlines()[-1] if out else ''
    if last.count('|') < 2:
        return None
    h, d, s = last.split('|', 2)
    if s.startswith('Merge '):
        # the round's real summary is the branch tip the merge brought in
        try:
            s2 = subprocess.run(['git', 'show', '-s', '--format=%s', h + '^2'],
                                cwd=ROOT, capture_output=True, text=True,
                                timeout=30).stdout.strip()
            if s2:
                s = s2
        except Exception:
            pass
    return (d, s)


def clean(subject, ver):
    """Drop a 'SRC-xx.y Title Vn:' prefix — the row already names the version."""
    s = subject.strip()
    if s.startswith('Merge '):
        s = re.sub(r'^Merge\s+(branch\s+)?', '', s)
        s = re.sub(r'\s+into\s+\S+.*$', '', s).strip("'\"")
    if ':' in s:
        head, tail = s.split(':', 1)
        if re.search(r'SRC-\d+', head) or re.search(r'\bV%d\b' % ver, head, re.I):
            s = tail.strip()
    if '/' in s and ' ' not in s:  # a bare branch name says nothing
        return ''
    return s


def main():
    born = births()
    log = {}
    for pf in sorted((ROOT / 'parts').glob('*.js')):
        ids = re.findall(r"id:\s*'(SRC-[^']+)'", pf.read_text(errors='replace'))
        if not ids:
            continue
        meta = born.get('parts/' + pf.name) or birth_follow('parts/' + pf.name)
        for sid in ids:
            entry = {}
            if meta:
                entry['d'] = meta[0]
                if len(ids) <= 2:  # a bulk file's commit subject is about nobody
                    vm = re.search(r'\.(\d+)', sid)
                    m = clean(meta[1], int(vm.group(1)) if vm else 1)
                    if m:
                        entry['m'] = m
            log[sid] = entry
    print(json.dumps({'owners': OWNERS, 'log': log}, separators=(',', ':')))


if __name__ == '__main__':
    main()
