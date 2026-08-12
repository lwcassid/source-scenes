#!/usr/bin/env python3
"""Shrink GLBs: strip textures entirely (for silhouette/re-materialed props)
or downscale them (for texture-critical assets). Rebuilds the binary buffer."""
import json, struct, sys, io, os
from PIL import Image

TINY_PNG = None  # 1x1 dark png, built lazily

def tiny_png():
    global TINY_PNG
    if TINY_PNG is None:
        b = io.BytesIO()
        Image.new('RGB', (1, 1), (20, 20, 28)).save(b, 'PNG')
        TINY_PNG = b.getvalue()
    return TINY_PNG

def load(path):
    data = open(path, 'rb').read()
    magic, ver, length = struct.unpack('<III', data[:12])
    off = 12; js = None; binc = b''
    while off < length:
        clen, ctype = struct.unpack('<II', data[off:off+8])
        chunk = data[off+8:off+8+clen]
        if ctype == 0x4E4F534A: js = json.loads(chunk)
        else: binc = chunk
        off += 8 + clen
    return js, binc

def save(path, g, binc):
    jsb = json.dumps(g, separators=(',', ':')).encode()
    jsb += b' ' * ((4 - len(jsb) % 4) % 4)
    while len(binc) % 4: binc += b'\x00'
    total = 12 + 8 + len(jsb) + 8 + len(binc)
    with open(path, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(jsb), 0x4E4F534A)); f.write(jsb)
        f.write(struct.pack('<II', len(binc), 0x004E4942)); f.write(binc)

def process(path, out, mode='strip', maxdim=512, quality=72):
    g, binc = load(path)
    imgs = g.get('images', [])
    img_bvs = set(im['bufferView'] for im in imgs if 'bufferView' in im)
    new_bin = bytearray()
    for i, bv in enumerate(g.get('bufferViews', [])):
        start = bv.get('byteOffset', 0); ln = bv['byteLength']
        blob = bytes(binc[start:start+ln])
        if i in img_bvs:
            if mode == 'strip':
                blob = tiny_png()
                # mimeType must match
                for im in imgs:
                    if im.get('bufferView') == i: im['mimeType'] = 'image/png'
            else:  # downscale
                try:
                    pim = Image.open(io.BytesIO(blob))
                    if max(pim.size) > maxdim:
                        pim.thumbnail((maxdim, maxdim))
                    b2 = io.BytesIO()
                    if pim.mode in ('RGBA', 'LA', 'P') and 'A' in pim.getbands():
                        pim.save(b2, 'PNG', optimize=True)
                        mt = 'image/png'
                    else:
                        pim.convert('RGB').save(b2, 'JPEG', quality=quality)
                        mt = 'image/jpeg'
                    blob = b2.getvalue()
                    for im in imgs:
                        if im.get('bufferView') == i: im['mimeType'] = mt
                except Exception as e:
                    print('  img skip:', e)
        # align
        while len(new_bin) % 4: new_bin.append(0)
        bv['byteOffset'] = len(new_bin)
        bv['byteLength'] = len(blob)
        new_bin.extend(blob)
    if g.get('buffers'): g['buffers'][0]['byteLength'] = len(new_bin)
    save(out, g, bytes(new_bin))
    print(f"{os.path.basename(path)}: {os.path.getsize(path)/1e6:.1f}MB -> {os.path.getsize(out)/1e6:.1f}MB ({mode})")

if __name__ == '__main__':
    path, out, mode = sys.argv[1], sys.argv[2], sys.argv[3]
    md = int(sys.argv[4]) if len(sys.argv) > 4 else 512
    process(path, out, mode, md)
