# Blender-Authored Exterior Assets — Design

**Status:** Approved by the user on 2026-10-20

**Date:** 2026-10-20

**Project:** `D:\Z_PROJECT\20_10`

**Scope:** Visual asset pipeline for Milestone 1 only

## Purpose

Improve the exterior scene's visual finish after review showed that its large forms still read as primitive shapes. The house, signature upstairs window, and framing tree are the primary focal assets; their current silhouettes, material detail, and window layering need more deliberate modeling.

The user approved trying Blender-authored GLB assets for the house and framing tree. The intended look remains a warm, intimate storybook scene, with more believable architecture, foliage, and surface materials. This is stylized realism rather than a photoreal architectural walkthrough.

## Existing constraints and proposed clarification

The current `docs/PROJECT_SPEC.md` says Milestone 1 must use procedural geometry and materials. This design proposes one narrow clarification: Blender-authored local geometry may replace the procedural house and framing tree. The rest of the milestone remains in force: the garden, path, and flower clusters stay procedural; the camera ends outside the upstairs window; later bedroom, watering, bloom, and greeting-card work remains out of scope.

All other art direction, accessibility, responsive behavior, and no-remote-assets requirements remain unchanged. This document supplements the current project spec and does not edit the user's existing working changes there.

## Approaches considered

| Approach | Benefits | Costs |
|---|---|---|
| Refine all geometry in Three.js | No asset authoring setup; immediate iteration in the existing builders | Continues to make complex roof, window, branch, and foliage silhouettes laborious to shape and inspect |
| Use a premade downloaded model | Quick way to test a more detailed asset | Likely style mismatch; provenance, license, and fit with the camera are uncertain |
| Author the hero exterior in Blender and export local GLB | Full control of silhouette, bevels, UVs, and material finish; one packed local asset; no remote dependency | Requires Blender for authoring and an asynchronous GLB load path |

**Recommendation:** use the third approach for the house and framing tree only. Keep Three.js for the scene, garden, animation, responsive camera, and interaction controls.

## Asset design

Create one Blender scene and export one `public/models/exterior-house-tree.glb`. Keep an editable Blender source and a small repeatable export script in `assets/blender/` so the model can be revised without rebuilding it from memory.

The GLB should use separate named nodes for the house, roof, upper window assembly, tree trunk/branches, and foliage. Include named `window_target` and `tree_sway` nodes so Three.js can preserve the existing camera destination and gentle tree movement. Keep Y as up, the house front facing positive Z, and the current house scale/origin so camera poses and the procedural garden continue to align.

Use rounded architectural edges, layered roof/eaves, a readable two-casement window, and a tree canopy that frames the upper and right window edges without covering the glass. Model curtains as folded fabric behind the glazing. Use distinct PBR materials for plaster, roof tile, painted trim, wood, bark, foliage, and glass. Keep local textures packed into the GLB; use texture detail only where it reads at the approved camera distances.

The model must not include the ground, path, flower beds, text, UI, lighting rig, or camera animation. Those remain owned by the existing Three.js modules.

## Runtime integration

Use `GLTFLoader` from the Three.js package's `three/addons/loaders/GLTFLoader.js` entry point; do not add a runtime dependency or fetch assets from a remote host.

At startup, keep the procedural house and tree as a fallback while the local GLB loads. When the GLB has loaded and its required named nodes are present, replace only those two procedural groups before the camera intro begins. Keep the garden group and use the imported `window_target` to build the arrival pose. Drive the imported `tree_sway` node with the existing reduced-motion-aware GSAP behavior.

If loading fails or required nodes are missing, keep the current procedural house and tree, show the usable exterior, and log a concise diagnostic. Do not leave a blank canvas or prevent skip/reduced-motion behavior. Dispose of the replaced fallback's geometries, materials, and textures, and dispose of imported resources during runtime teardown.

## Module boundaries

- `assets/blender/`: editable Blender source and reproducible export script.
- `public/models/exterior-house-tree.glb`: locally served production asset.
- `src/scene/assets/load-exterior-model.ts`: GLB loading and required-node validation.
- `src/scene/exterior/build-exterior.ts`: preserve the procedural fallback, garden, window target contract, and camera pose creation; coordinate model replacement through a small typed result.
- `src/main.ts`: await or coordinate the local asset load before starting the camera story; retain current teardown, skip, reduced-motion, and resize behavior.
- `src/scene/create-scene.ts`: continue owning scene-wide renderer resources and cleanup.

No bedroom, watering, bloom, card, audio, framework, analytics, backend, or deployment changes are included.

## Loading, failure, and performance

The GLB is a local static asset so normal use does not depend on a network service. The page should retain its title and a short Vietnamese loading status while it loads. The camera intro starts only after either the GLB is ready or the procedural fallback has been selected.

Pack related surfaces into a small number of texture atlases and merge repeated static details where that improves draw calls. Keep leaf meshes grouped by material; do not create one draw call for every leaf. Start with modest texture dimensions and inspect the result at mobile pixel density. Record the GLB byte size, triangle count, and draw-call count during verification; reduce these if the narrow viewport preview shows a performance problem.

The existing renderer pixel-ratio cap, bounded shadows, and no-post-processing baseline remain. Do not add HDRI downloads or external textures. Blender is an authoring tool and is not part of the browser runtime.

## Verification and acceptance

1. The wide establishing frame reads as a complete two-storey home and garden; the roof and tree are not cropped.
2. The upper-right double window is the clear destination in both establishing and arrival frames.
3. The tree frames the window without hiding either pane; curtains are visible behind transparent glazing.
4. Plaster, roof, wood, glass, bark, and leaves have visibly different surface finishes without noisy high-contrast wall detail or broad plastic shine.
5. The narrow portrait view keeps the window readable and controls usable.
6. The GLB is loaded from the project locally; no external model or texture request is required.
7. A missing or invalid GLB selects the procedural fallback without a blank scene or broken camera controls.
8. Skip, reduced-motion behavior, resize handling, and runtime cleanup still work.
9. `npm run typecheck` and `npm run build` pass. Manual desktop and narrow mobile previews show no console errors.

Report each check as `PASS`, `FAIL`, or `NOT_RUN`. Do not implement future milestones as part of this change.

## Risks and decisions

- **Blender availability:** Blender is not currently installed. Implementation needs an approved local authoring setup; Blender must remain outside the web runtime.
- **Material conversion:** Blender shader nodes may not export exactly as intended. Use glTF-compatible materials and inspect the result in the actual Three.js renderer.
- **Coordinate mismatch:** a different origin or forward axis could break the camera arrival pose. Validate the named anchors and coordinate convention in the rendered scene.
- **Asset weight:** detailed foliage can grow the GLB and draw-call count. Keep repeated leaves grouped/instanced and verify the mobile preview before acceptance.
- **Fallback quality:** the current procedural models remain as recovery assets, so a load failure is functional but visibly less polished. Show a short status and retain the established safe behavior.

## Implementation handoff

After this design is approved, write a separate implementation plan with ordered Blender setup, modeling/export, loader integration, fallback, and verification tasks. Do not install Blender, add files, or change project code until the design and implementation plan gates are complete.
