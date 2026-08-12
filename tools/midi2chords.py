#!/usr/bin/env python3
# Parse a reference MIDI into notes + per-bar stacks, for scene harmony work.
# See .claude/skills/sound-craft/SKILL.md for how to turn the output into
# a scene's music.chords spec.
import sys, struct

if len(sys.argv) < 2:
    print('usage: python3 tools/midi2chords.py <file.mid>'); sys.exit(1)
data = open(sys.argv[1], 'rb').read()

def rd_vlq(d, i):
    v = 0
    while True:
        b = d[i]; i += 1
        v = (v << 7) | (b & 0x7f)
        if not (b & 0x80): return v, i

assert data[:4] == b'MThd'
hlen = struct.unpack('>I', data[4:8])[0]
fmt, ntrk, div = struct.unpack('>HHH', data[8:14])
print(f'format {fmt}, tracks {ntrk}, division {div} ticks/quarter')

i = 8 + hlen
NOTE = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
for tr in range(ntrk):
    assert data[i:i+4] == b'MTrk'
    tlen = struct.unpack('>I', data[i+4:i+8])[0]
    j = i + 8; end = j + tlen
    t = 0; run = None
    notes = []   # (start_tick, note, vel, dur)
    active = {}
    tempo = 500000
    while j < end:
        dt, j = rd_vlq(data, j)
        t += dt
        b = data[j]
        if b == 0xFF:
            typ = data[j+1]; ln, j2 = rd_vlq(data, j+2)
            payload = data[j2:j2+ln]
            if typ == 0x51:
                tempo = int.from_bytes(payload, 'big')
                print(f'  t={t} tempo {60_000_000/tempo:.1f} bpm')
            elif typ == 0x58:
                print(f'  t={t} timesig {payload[0]}/{2**payload[1]} clocks={payload[2]}')
            elif typ in (0x01,0x03):
                print(f'  t={t} text/name: {payload.decode(errors="replace")}')
            j = j2 + ln
            run = None
        elif b == 0xF0 or b == 0xF7:
            ln, j2 = rd_vlq(data, j+1); j = j2 + ln; run = None
        else:
            if b & 0x80:
                st = b; j += 1; run = st
            else:
                st = run
            ev = st & 0xF0
            if ev in (0x80, 0x90):
                note, vel = data[j], data[j+1]; j += 2
                if ev == 0x90 and vel > 0:
                    active[note] = (t, vel)
                else:
                    if note in active:
                        st0, v0 = active.pop(note)
                        notes.append((st0, note, v0, t - st0))
            elif ev in (0xA0, 0xB0, 0xE0):
                j += 2
            elif ev in (0xC0, 0xD0):
                j += 1
    i = end
    if notes:
        notes.sort()
        print(f'  track {tr}: {len(notes)} notes, span {notes[0][0]}..{max(n[0]+n[3] for n in notes)} ticks')
        q = div  # ticks per quarter
        for st0, note, vel, dur in notes:
            beat = st0 / q
            print(f'    beat {beat:7.3f}  {NOTE[note%12]}{note//12-1:<2} (n{note:3d}) vel {vel:3d} dur {dur/q:.3f}beats')
