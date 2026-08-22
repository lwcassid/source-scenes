#!/usr/bin/env python3
"""Build the self-contained sighted-iteration preview.
Run from the REPO ROOT: python3 tools/build_preview.py
Replaces CDN three.js tags with vendored copies and inlines every GLB as
base64, producing night-circuit-preview.html (~25MB) that runs offline —
including in headless Chromium with --enable-unsafe-swiftshader.
ALWAYS test the preview, never the CDN build, in sandboxes: no network there
means the CDN build reports noGL and you'll chase ghosts."""
import base64, re, os
os.chdir(os.path.join(os.path.dirname(__file__), '..'))
src = open('index.html').read()
V = 'tools/vendor/'
repl = {
 'three.min.js': V+'vendor_three.min.js', 'GLTFLoader.js': V+'vendor_gltfloader.js',
 'CopyShader.js': V+'vendor_CopyShader.js', 'LuminosityHighPassShader.js': V+'vendor_LuminosityHighPassShader.js',
 'EffectComposer.js': V+'vendor_EffectComposer.js', 'RenderPass.js': V+'vendor_RenderPass.js',
 'MaskPass.js': V+'vendor_MaskPass.js', 'ShaderPass.js': V+'vendor_ShaderPass.js', 'UnrealBloomPass.js': V+'vendor_UnrealBloomPass.js',
}
for tag, url in re.findall(r'(<script src="([^"]+)"[^>]*></script>)', src):
    fn = url.split('/')[-1]
    if fn in repl:
        src = src.replace(tag, '<script>' + open(repl[fn]).read() + '</script>', 1)
models = {
 'GLB_BIKE': 'akira_motorcycle.glb', 'GLB_PALMS': 'palm_trees.glb', 'GLB_CITY': 'city_buildings.glb',
 'GLB_CAR': 'cyber_car.glb', 'GLB_SIGN': 'sign_board.glb', 'GLB_STAL': 'stalagmite.glb',
 'GLB_WHALE': 'whale.glb', 'GLB_GEMS': 'gems.glb',
 'GLB_MANTA': 'manta.glb', 'GLB_JELLYS': 'jelly_s.glb', 'GLB_JELLYB': 'jelly_b.glb', 'GLB_CORAL': 'coral.glb',
 'GLB_CRAB': 'crab.glb', 'GLB_TOWER': 'tower.glb', 'GLB_ROBOT': 'robot.glb', 'GLB_FIGHTER': 'fighter.glb',
 'GLB_TUNHERO': 'tunnelhero.glb', 'GLB_BEAR': 'waterbear.glb',
}
consts = []
for name, fn in models.items():
    b64 = base64.b64encode(open('models/' + fn, 'rb').read()).decode()
    consts.append(f"const {name} = 'data:model/gltf-binary;base64,{b64}';")
    src = src.replace(f"'models/{fn}'", name)
# bitmap + audio assets referenced by scenes (e.g. assets/white-study/*.jpg,
# assets/av_wake.wav) — inline any quoted 'assets/...' path found in the
# source so the preview stays offline-only
mime = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
        '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg'}
for relpath in sorted(set(re.findall(r"'(assets/[^']+)'", src))):
    ext = os.path.splitext(relpath)[1].lower()
    b64 = base64.b64encode(open(relpath, 'rb').read()).decode()
    src = src.replace(f"'{relpath}'", f"'data:{mime.get(ext, 'application/octet-stream')};base64,{b64}'")
src = src.replace('</head>', '<script>' + '\n'.join(consts) + '</script>\n</head>', 1)
open('night-circuit-preview.html', 'w').write(src)
print('preview MB:', round(os.path.getsize('night-circuit-preview.html') / 1e6, 2))
