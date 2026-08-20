#!/usr/bin/env python3
"""Turn a Cave planner layout export into the SCRIMVIEW rig data.

Usage: python3 tools/cave2rig.py [docs/cave-layout-2026.json]

Reads the planner JSON (see docs/cave-layout-2026.json for how to grab it
from DevTools) and prints the PANELS / CABLES / props literals to paste into
SCRIMRIG in parts/part2d_scrimview.js. Planner axes: x -8..16, z -16..16,
y up, entrance at +z, feet everywhere. The sim recenters x so the room
middle is 0 (simX = x - 4); z and y pass through unchanged.
"""
import json, sys, math

path = sys.argv[1] if len(sys.argv) > 1 else 'docs/cave-layout-2026.json'
d = json.load(open(path))
XOFF = -4.0  # planner x -8..16 -> sim -12..12

panels, cables, props = [], [], {}
for dec in d['decor']:
    t = dec['decorType']
    p = dec.get('position', [0, 0])
    if t == 'fabric-18':
        panels.append({
            'x': round(p[0] + XOFF, 2), 'z': round(p[1], 2),
            'w': dec['width'], 'drop': dec['length'],
            'rot': round(dec.get('rotation', 0), 2), 'top': dec.get('baseY', 16),
        })
    elif t == 'obelisk' and dec.get('locked'):
        props['source'] = [round(p[0] + XOFF, 2), round(p[1], 2)]
    elif t == 'person':
        props['person'] = [round(p[0] + XOFF, 2), round(p[1], 2)]
    elif t == 'floodlight':
        props.setdefault('floods', []).append([round(p[0] + XOFF, 1), round(p[1], 1)])
    elif t == 'speaker':
        props.setdefault('speakers', []).append([round(p[0] + XOFF, 1), round(p[1], 1)])
for c in d['cables']:
    seen = []
    for a in c['anchors']:
        pt = [round(a['position'][0] + XOFF, 2), round(a['position'][1], 2), round(a['position'][2], 2)]
        if not seen or seen[-1] != pt: seen.append(pt)
    cables.append(seen)

# dedupe floodlights (the export has a doubled one)
if 'floods' in props:
    props['floods'] = sorted(set(map(tuple, props['floods'])))

panels.sort(key=lambda q: (q['z'], q['x']))
print('  // 13 fabric panels, verbatim from the planner export (sim x = planner x - 4)')
print('  PANELS: [')
for q in panels:
    print(f"    {{ x: {q['x']}, z: {q['z']}, w: {q['w']}, drop: {q['drop']}, rot: {q['rot']}, top: {q['top']} }},")
print('  ],')
print('  CABLES: [')
for seg in cables:
    print(f"    {json.dumps(seg)},")
print('  ],')
for k, v in props.items():
    print(f'  // {k}: {json.dumps(v)}')

# vantage preset spherical coords (camera = target + r*[sinφ sinθ, cosφ, sinφ cosθ])
def sph(target, pos):
    ox, oy, oz = (pos[i] - target[i] for i in range(3))
    r = math.sqrt(ox * ox + oy * oy + oz * oz)
    return round(math.atan2(ox, oz), 3), round(math.acos(oy / r), 3), round(r, 1)

src = props.get('source', [0.2, -1.5])
print('  // presets (th, ph, r around per-preset target):')
for name, tgt, pos in [
    ('AT THE SOURCE', [0, 8, -8], [src[0], 5.5, src[1] + 0.2]),
    ('AUDIENCE', [0, 8, -4], [0, 6, 12]),
    ('HEAD-ON', [0, 8, -5.63], [0, 8, 14]),
    ('OBLIQUE', [0, 8, -2], [-16, 7, 8]),
    ('OVERVIEW', [0, 6, 0], [20, 12, 26]),
]:
    th, ph, r = sph(tgt, pos)
    print(f"  //   {name}: target {tgt} th {th} ph {ph} r {r}")
