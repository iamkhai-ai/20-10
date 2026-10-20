# Blender asset sources

## Milestone 2 bedroom source

The original bedroom is authored separately in `create-bedroom.py`, its
`bedroom_surfaces.py` surface/bake helper, `watering_can.py` prop builder,
and `bedroom.blend`. Rebuild from
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
staggered oak boards, tapered pale-oak desk legs and shaped leaves.
The can follows the user's photo reference: a slender upright ivory cylinder,
shallow pressed rings, an arched carrying strap, a long straight tapered spout
and a flat circular nine-hole rose. Earlier round and low oval prototypes
are superseded. The spout faces left toward the planter in this scene.
The rounded planter has milky pearl-white glaze with a slight jade cast,
10% transmission, 65% clearcoat, an ivory rim/saucer and small painted rose
flowers. Upper walls are
clean mist blue, paneling light sage and floorboards neutral blond oak,
following the user's latest color feedback. Material names such as
`Hand thrown clay`, `Dusty rose quilt`, `Sage enamel` and `Warm limewash`
remain stable for validation even
though their palette changed. Three.js owns the window-directed sunlight;
baked occlusion is attenuated for a clean wall finish.

The room export has 49,101 triangles, 36 primitives, 24 materials and
26 embedded images (4,959,256 bytes). Current GLB SHA-256:
`de001938eec63dadfa9c040220b5e53f8b97d1f3583c268b06897049ff0dfd8c`.
Validate actual packed resource,
hierarchy and size limits with `python tests/validate_bedroom_glb.py`.
The approved limits are 60,000 triangles, 50 primitives and 6,000,000 bytes.
The can is a prop at M2; watering is not implemented by the asset.

### M3 runtime calibration

The redesigned can preserves the authored pivot and rose center; its direction
now follows the straight reference spout.
`build-bedroom.ts` attaches a
runtime outlet near room `(1.407, 1.525, -0.85)` to `watering_can`, with
normalized rest direction `(-0.383, 0.355, 0)` transformed into can-local coordinates.
The soil target is `(1.10, 1.405, -0.88)` under `plant_pot`, inner radius
0.14. `build-watering.ts` rotates the can 90 degrees and places the outlet
0.24 above its soil intersection, offset `(0.065, 0, 0.045)` beside the
stem. Final validity uses current transformed outlet direction and soil
intersection, not screen coordinates. Update this calibration and its
tests if reauthoring the can or planter. Owned water effects are runtime
geometry; the packed asset has changed within the existing resource caps.
Runtime uniform can scaling remains0.82 and automatic alignment includes it.
The eight ring holes use authored radius0.0134, matching the runtime0.011
jet ring after scaling, plus one center hole.

### Targeted watering-set refresh

`refresh-watering-set.py` opens the saved `.blend`, rebuilds only the can via
the same `watering_can.py` builder used by the full script, and updates can/pot
materials. It reuses the static room AO atlas. New movable can geometry samples
a white AO patch through UV1; it never rebakes or repacks the accepted room.

```powershell
& $blenderExe --background --python assets/blender/refresh-watering-set.py
```

The final refresh and GLB validation ran. Semantic comparison of decoded geometry
attributes, indices, material names and transforms confirmed that room_shell,
desk, plant_pot, plant_rest, both curtains and window_backdrop geometry/transforms
are unchanged. Only the can geometry and intended material finishes changed.
A full clean room rebake was NOT_RUN for this targeted revision. Transmission
adds renderer submissions; capture measurements are recorded in the handoff,
without claiming physical-phone FPS.

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
