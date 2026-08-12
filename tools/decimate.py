#!/usr/bin/env python3
"""Vertex-clustering GLB decimator (numpy). Bakes node transforms, merges all
primitives into one, clusters vertices on a uniform grid, recomputes smooth
normals, writes a minimal single-mesh GLB. Optionally keeps COLOR_0 / TEXCOORD_0
(uv kept only with --uv; color kept if present)."""
import json, struct, sys, numpy as np

CTYPE = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

def read_glb(path):
    with open(path, 'rb') as f:
        magic, ver, ln = struct.unpack('<III', f.read(12))
        cl, ct = struct.unpack('<II', f.read(8))
        js = json.loads(f.read(cl))
        chunks = {}
        while f.tell() < ln:
            l, t = struct.unpack('<II', f.read(8))
            chunks[t] = f.read(l)
    return js, chunks.get(0x004E4942, b'')

def acc_array(js, binbuf, idx):
    a = js['accessors'][idx]
    bv = js['bufferViews'][a['bufferView']]
    off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    n = a['count']; ncomp = NCOMP[a['type']]; dt = CTYPE[a['componentType']]
    stride = bv.get('byteStride')
    itemsize = np.dtype(dt).itemsize * ncomp
    if stride and stride != itemsize:
        raw = np.frombuffer(binbuf, dtype=np.uint8, count=stride * n, offset=off).reshape(n, stride)
        arr = raw[:, :itemsize].copy().view(dt).reshape(n, ncomp)
    else:
        arr = np.frombuffer(binbuf, dtype=dt, count=n * ncomp, offset=off).reshape(n, ncomp)
    if a.get('normalized') and dt in (np.uint8, np.uint16):
        arr = arr.astype(np.float32) / np.iinfo(dt).max
    return np.asarray(arr, dtype=np.float32) if a['componentType'] == 5126 or a.get('normalized') else arr

def node_world_matrices(js):
    nodes = js['nodes']
    world = [None] * len(nodes)
    def mat_of(n):
        if 'matrix' in n:
            return np.array(n['matrix'], dtype=np.float64).reshape(4, 4).T
        m = np.eye(4)
        t = n.get('translation'); r = n.get('rotation'); s = n.get('scale')
        R = np.eye(3)
        if r:
            x, y, z, w = r
            R = np.array([
                [1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
                [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
                [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
        S = np.diag(s) if s else np.eye(3)
        m[:3, :3] = R @ S
        if t: m[:3, 3] = t
        return m
    def walk(i, parent):
        world[i] = parent @ mat_of(nodes[i])
        for c in nodes[i].get('children', []):
            walk(c, world[i])
    scene = js['scenes'][js.get('scene', 0)]
    for r in scene['nodes']:
        walk(r, np.eye(4))
    return world

def decimate(path, out, target_cells=140, keep_uv=False, keep_color=True):
    js, binbuf = read_glb(path)
    world = node_world_matrices(js)
    P, C, U, F = [], [], [], []
    base = 0
    has_color = has_uv = True
    for ni, node in enumerate(js['nodes']):
        if 'mesh' not in node: continue
        M = world[ni]
        for prim in js['meshes'][node['mesh']]['primitives']:
            if prim.get('mode', 4) != 4: continue
            pos = acc_array(js, binbuf, prim['attributes']['POSITION']).astype(np.float64)
            pos = pos @ M[:3, :3].T + M[:3, 3]
            n = len(pos)
            if 'indices' in prim:
                idx = acc_array(js, binbuf, prim['indices']).astype(np.int64).reshape(-1)
            else:
                idx = np.arange(n, dtype=np.int64)
            P.append(pos)
            if keep_color and 'COLOR_0' in prim['attributes']:
                c = acc_array(js, binbuf, prim['attributes']['COLOR_0']).astype(np.float32)
                C.append(c[:, :3] if c.shape[1] >= 3 else np.repeat(c, 3, axis=1))
            else:
                has_color = False
            if keep_uv and 'TEXCOORD_0' in prim['attributes']:
                U.append(acc_array(js, binbuf, prim['attributes']['TEXCOORD_0']).astype(np.float32))
            else:
                has_uv = False
            F.append(idx.reshape(-1, 3) + base)
            base += n
    P = np.vstack(P); F = np.vstack(F)
    C = np.vstack(C) if (has_color and keep_color and C) else None
    U = np.vstack(U) if (has_uv and keep_uv and U) else None
    lo, hi = P.min(0), P.max(0)
    cell = (hi - lo).max() / target_cells
    key = np.floor((P - lo) / cell).astype(np.int64)
    kf = key[:, 0] * 73856093 ^ key[:, 1] * 19349663 ^ key[:, 2] * 83492791
    uniq, inv = np.unique(kf, return_inverse=True)
    nv = len(uniq)
    # mean position per cluster
    newP = np.zeros((nv, 3)); cnt = np.zeros(nv)
    np.add.at(newP, inv, P); np.add.at(cnt, inv, 1)
    newP /= cnt[:, None]
    newC = None
    if C is not None:
        newC = np.zeros((nv, 3), dtype=np.float64)
        np.add.at(newC, inv, C.astype(np.float64)); newC /= cnt[:, None]
        newC = newC.astype(np.float32)
    newU = None
    if U is not None:
        newU = np.zeros((nv, 2), dtype=np.float64)
        np.add.at(newU, inv, U.astype(np.float64)); newU /= cnt[:, None]
        newU = newU.astype(np.float32)
    NF = inv[F]
    good = (NF[:, 0] != NF[:, 1]) & (NF[:, 1] != NF[:, 2]) & (NF[:, 0] != NF[:, 2])
    NF = NF[good]
    # dedupe faces (sorted key)
    sf = np.sort(NF, axis=1)
    _, fidx = np.unique(sf[:, 0] * (nv * nv) + sf[:, 1] * nv + sf[:, 2], return_index=True)
    NF = NF[np.sort(fidx)]
    # smooth normals
    e1 = newP[NF[:, 1]] - newP[NF[:, 0]]; e2 = newP[NF[:, 2]] - newP[NF[:, 0]]
    fn = np.cross(e1, e2)
    N = np.zeros((nv, 3))
    for k in range(3): np.add.at(N, NF[:, k], fn)
    ln = np.linalg.norm(N, axis=1, keepdims=True); ln[ln == 0] = 1
    N = (N / ln).astype(np.float32)
    newP = newP.astype(np.float32)
    # build GLB
    bufparts = []; views = []; accs = []; off = 0
    def add(arr, target, ctype, atype, minmax=False):
        nonlocal off
        b = arr.tobytes(); pad = (4 - len(b) % 4) % 4; b += b'\0' * pad
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': len(b) - pad, 'target': target})
        acc = {'bufferView': len(views) - 1, 'componentType': ctype, 'count': len(arr), 'type': atype}
        if minmax:
            acc['min'] = [float(x) for x in arr.min(0)]; acc['max'] = [float(x) for x in arr.max(0)]
        accs.append(acc); bufparts.append(b); off += len(b)
        return len(accs) - 1
    ai_pos = add(newP, 34962, 5126, 'VEC3', True)
    ai_nrm = add(N, 34962, 5126, 'VEC3')
    attrs = {'POSITION': ai_pos, 'NORMAL': ai_nrm}
    if newC is not None: attrs['COLOR_0'] = add(newC, 34962, 5126, 'VEC3')
    if newU is not None: attrs['TEXCOORD_0'] = add(newU, 34962, 5126, 'VEC2')
    ai_idx = add(NF.astype(np.uint32).reshape(-1), 34963, 5125, 'SCALAR')
    mat = dict(js['materials'][0])
    mat.pop('extensions', None)
    images = js.get('images'); textures = js.get('textures'); samplers = js.get('samplers')
    out_js = {
        'asset': {'version': '2.0', 'generator': 'cluster-decimate'},
        'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0, 'name': 'decimated'}],
        'meshes': [{'primitives': [{'attributes': attrs, 'indices': ai_idx, 'material': 0}]}],
        'materials': [mat], 'accessors': accs, 'bufferViews': views,
        'buffers': [{'byteLength': off}],
    }
    if keep_uv and newU is not None and textures and images:
        # carry over the baseColor texture's image bytes; rewrite refs to index 0
        pbr = mat.get('pbrMetallicRoughness', {})
        bct = pbr.get('baseColorTexture', {}).get('index', 0)
        img = images[textures[bct].get('source', 0)]
        mat = {k: v for k, v in mat.items() if k not in ('normalTexture', 'occlusionTexture', 'emissiveTexture', 'emissiveFactor')}
        pbr = {k: v for k, v in pbr.items() if 'Texture' not in k}
        pbr['baseColorTexture'] = {'index': 0}
        mat['pbrMetallicRoughness'] = pbr
        out_js['materials'] = [mat]
        bv = js['bufferViews'][img['bufferView']]
        ib = binbuf[bv.get('byteOffset', 0): bv.get('byteOffset', 0) + bv['byteLength']]
        pad = (4 - len(ib) % 4) % 4; ib += b'\0' * pad
        out_js['bufferViews'].append({'buffer': 0, 'byteOffset': off, 'byteLength': len(ib) - pad})
        bufparts.append(ib); off += len(ib)
        out_js['buffers'][0]['byteLength'] = off
        out_js['images'] = [{'mimeType': img.get('mimeType', 'image/png'), 'bufferView': len(out_js['bufferViews']) - 1}]
        out_js['samplers'] = [{}]
        out_js['textures'] = [{'source': 0, 'sampler': 0}]
    elif 'pbrMetallicRoughness' in mat:
        mat['pbrMetallicRoughness'] = {k: v for k, v in mat['pbrMetallicRoughness'].items() if 'Texture' not in k}
    binout = b''.join(bufparts)
    jb = json.dumps(out_js, separators=(',', ':')).encode()
    jb += b' ' * ((4 - len(jb) % 4) % 4)
    total = 12 + 8 + len(jb) + 8 + len(binout)
    with open(out, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(jb), 0x4E4F534A)); f.write(jb)
        f.write(struct.pack('<II', len(binout), 0x004E4942)); f.write(binout)
    print(f"{out}: {len(newP):,} verts, {len(NF):,} tris, {total/1e6:.2f}MB")

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--cells', type=int, default=140)
    ap.add_argument('--uv', action='store_true')
    args = ap.parse_args()
    decimate(args.src, args.dst, args.cells, keep_uv=args.uv)
