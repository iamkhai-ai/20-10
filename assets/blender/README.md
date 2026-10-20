# Exterior asset source

The house, window and framing tree are original Blender-authored assets for Milestone 1. The garden, path, flowers, camera and interface remain in Three.js.

## Rebuild

Blender **4.5.14 LTS**, build `62c1db4208e8`, was used. A portable official Windows archive was downloaded outside the repository. Its SHA-256 matched the official release checksum:

```text
b9533d2397ac1984db4466fb23a7a4649391cca93f6e84209f9bcc60d071c8b9
```

From the project root, set `$blenderExe` to your local Blender executable, then run:

```powershell
& $blenderExe --background --factory-startup --python assets/blender/create-exterior.py
```

To also render the source preview, append `-- --preview C:\absolute\path\preview.png`.

The script recreates the authored scene, generates and packs its texture maps, saves `exterior-house-tree.blend`, and exports `public/models/exterior-house-tree.glb`. It uses Blender's bundled Python/numpy; no project Python package is required. The preview camera and lights are saved in the editable source and excluded from the GLB. Manual `.blend` edits must be carried into the script if they should survive a rebuild.

## Coordinates and node contract

Script modeling coordinates match Three.js: X right, Y up, Z front. They are converted to Blender's Z-up system before modeling, then exported through glTF's Y-up conversion. The GLB origin is the house center at ground level; the Three.js exterior assembly applies `(-0.6, 0, 0)` once.

Required named nodes are `house`, `roof`, `upper_window`, `tree_structure`, `tree_sway`, and `window_target`. The window anchor is at `(1.08, 3.6, 1.97)` before the assembly offset. Only the foliage group sways; the camera target and structural branches stay static.

Roof tiles and architecture details are combined by material. Foliage uses four combined botanical leaf meshes. Base-color/normal images use glTF-compatible materials and are packed into the GLB; no model, texture, light or environment download occurs at runtime. The browser creates its small reflection environment locally.

## Export measurements

- GLB: **5,654,052 bytes** after the denser-canopy revision.
- Geometry: **77,744 triangles**, **30 mesh primitives**.
- Materials: **18**; embedded images: **16**.
- GLB SHA-256: `e548f10b90dab7cad02b5918e631438946d5d7e0812a7983d91e9662d78b4279`.

These counts describe the GLB alone. The full garden includes separate procedural geometry and shadows; final renderer measurements are recorded in the task verification report.

## Runtime recovery

The local loader has a **12-second** deadline. A missing, malformed, invalid-node or stalled asset selects the existing procedural exterior. Skip activated during loading queues the arrival pose. Reduced motion selects arrival immediately once the asset/fallback is ready and disables foliage sway. A request finishing after teardown is discarded and its resources released.

## References

- [Official Blender 4.5 downloads](https://download.blender.org/release/Blender4.5/)
- [Official archive checksums](https://download.blender.org/release/Blender4.5/blender-4.5.14.sha256)
- [Blender glTF material export](https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html)
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
