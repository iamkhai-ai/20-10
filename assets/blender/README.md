# Exterior asset source

## Milestone 2 bedroom source

The original bedroom is authored separately in `create-bedroom.py`, its
`bedroom_surfaces.py` surface/bake helper, and `bedroom.blend`. Rebuild from
the repository root with the same Blender:

```powershell
& $blenderExe --background --factory-startup --python assets/blender/create-bedroom.py
```

Optional source preview: append `-- --preview C:\absolute\path\room.png`.
The preview rig is excluded from the runtime GLB. Carry manual edits back
into the script before rebuilding. No project Python dependency is needed.
Blender's bundled NumPy generates the packed local albedo, tangent normal
and roughness maps. UV0 uses material-scale mapping; UV1 holds a 1024px
static AO atlas baked with Cycles at 48 samples. The export may take a few
minutes. Thin piping uses a small cross-section to preserve the budget.
The can, plant, curtains, glass and optional `window_backdrop` are excluded
from casting permanent baked shadows. The runtime keeps that backdrop
from casting/receiving real-time shadows, so it cannot block daylight.

Room-local coordinates are X-right, Y-up, Z-front, with floor Y=0 and the
rear window wall Z=-2.1. `bedroom` is the static root. `room_shell`, `desk`,
`plant_pot`, `plant_rest`, `watering_can`, `curtain_left`, and `curtain_right`
are separate transform roots with geometry descendants. The pot, plant and
can pivots sit at their own bases; curtain pivots sit at the rod so sway
does not rotate the entire fabric around the room origin. `window_anchor`,
`room_target`, `desk_target`, and `pot_target` are empty leaf anchors under
`bedroom`; none moves with the can/curtains/plant. The bedroom is shown in
a separate scene group during the concealed handoff; no exterior offset
is applied to it.

The current visual revision uses sewn cushions, naturally draped milk-cream bedding,
staggered oak boards, tapered desk legs, shaped leaves and a tapered can
spout with a perforated brass rose. The rounded planter has butter-yellow
glaze, a cream rim/saucer and small painted rose flowers. Upper walls are
clean mist blue, paneling light sage and floorboards neutral blond oak,
following the user's latest color feedback. Material names such as
`Hand thrown clay`, `Dusty rose quilt` and `Warm limewash` remain stable for validation even
though their palette changed. Three.js owns the window-directed sunlight;
baked occlusion is attenuated for a clean wall finish.

The room export has 45,273 triangles, 37 primitives, 24 materials and
26 embedded images (4,890,040 bytes). Final GLB SHA-256:
`fb52c2c96bb364442b465ff6ff55c9e01329cf9cbfa40bd5fdc0dec103070e56`.
Validate actual packed resource,
hierarchy and size limits with `python tests/validate_bedroom_glb.py`.
The approved limits are 60,000 triangles, 50 primitives and 6,000,000 bytes.
The can is a prop at M2; watering is not implemented by the asset.

## Milestone 1 exterior source

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
