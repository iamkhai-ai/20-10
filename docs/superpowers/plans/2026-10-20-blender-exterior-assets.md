# Blender Exterior Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Follow `AGENT.md` and the personal GPT-only orchestration policy; its two independent reviewers and model restrictions override the skills' default reviewer choices.

**Goal:** Replace the rough procedural house and framing tree with a locally authored Blender GLB that gives Milestone 1 believable forms and differentiated materials.

**Architecture:** Keep the existing garden and procedural house/tree fallback. Load and validate one packed GLB, replace the fallback architecture before the intro starts, and derive the camera destination and foliage sway from named model nodes. Three.js retains rendering, camera choreography, semantic controls, responsive behavior, and resource ownership.

**Tech Stack:** Blender as a local authoring tool; existing Vite, strict TypeScript, Three.js, and GSAP packages; `GLTFLoader` from the existing Three.js dependency.

**Spec:** `docs/superpowers/specs/2026-10-20-blender-exterior-assets-design.md`, approved on 2026-10-20. Read it alongside `docs/PROJECT_SPEC.md`; the approved addendum supersedes only the Milestone 1 procedural-only restriction for the house and tree.

## Global Constraints

- The camera ends outside the upstairs window; garden, path, and flowers remain procedural.
- Keep the look warm and intimate, with believable architecture, foliage, and surface materials.
- Keep Y as up, the house front facing positive Z, and the current house scale/origin.
- Use local assets; do not add a runtime dependency, remote texture, HDRI download, or external model request.
- Keep the renderer pixel-ratio cap at 1.5, bounded shadows, and the no-post-processing baseline.
- Preserve keyboard skip, `prefers-reduced-motion`, resize behavior, WebGL fallback, and cleanup.
- Preserve all pre-existing changes, including `docs/PROJECT_SPEC.md`, the existing exterior approach plan, source refinements, and `.vercel` metadata. Keep this work uncommitted unless the user authorizes commits.
- Do not implement bedroom, watering, bloom, card, audio, backend, or deployment work.
- Use repository typecheck/build and manual checks. Do not add a test framework. Report actual outcomes as `PASS`, `FAIL`, or `NOT_RUN`.

## Review Focus

- Missing, malformed, or incomplete GLB: retain a usable procedural exterior and start the story once; exercise in Tasks 2–3.
- Slow load, resize, or skip before loading completes: keep controls responsive and preserve the selected skip/arrival state; exercise in Task 3.
- Teardown during an outstanding load: abort the fetch or dispose the late result; never attach it to a disposed scene; exercise in Tasks 2–3.
- Shared fallback/garden materials: replacing the house/tree must not dispose resources still used by flowers or ground; exercise in Task 2.
- Exported materials and model coordinates: inspect the actual Three.js render, including glazing, curtains, window target, and mobile framing; exercise in Tasks 1 and 4.

---

## File Structure and Contracts

| File | Responsibility |
|---|---|
| `assets/blender/create-exterior.py` | Reproducible Blender scene creation, texture baking, source save, and GLB export |
| `assets/blender/exterior-house-tree.blend` | Editable asset source with packed images |
| `assets/blender/README.md` | Blender version, export command, axes, node contract, and rebuild instructions |
| `public/models/exterior-house-tree.glb` | Packed production house/tree asset |
| `src/scene/assets/load-exterior-model.ts` | Load local GLB and validate named nodes |
| `src/scene/dispose-object-resources.ts` | Dispose retired geometry/material/texture resources without touching retained resources |
| `src/scene/exterior/build-exterior.ts` | Existing garden/fallback assembly, architecture replacement, light and camera anchors |
| `src/main.ts` | Loading lifecycle, queued skip, story startup, resize, and teardown |
| `src/scene/create-scene.ts` | Reuse resource cleanup for full-scene teardown; retain renderer ownership |

`ImportedExterior` is defined in `load-exterior-model.ts`:

```ts
interface ImportedExterior {
  group: THREE.Group;
  windowTarget: THREE.Object3D;
  swayTargets: THREE.Object3D[];
}
```

The loader exports `loadExteriorModel(url: string, signal: AbortSignal): Promise<ImportedExterior>`. The existing `ExteriorBuildResult` gains `replaceArchitecture(model: ImportedExterior): void`; its current `group`, `windowTarget`, `swayTargets`, and `cameraPoses(aspect)` contracts remain. Resource cleanup exports `disposeObjectResources(roots: readonly THREE.Object3D[], retainedRoots?: readonly THREE.Object3D[]): void`.

### Task 1: Author and validate the Blender asset

**Files:** Create the three `assets/blender/` files and the production GLB listed above.

**Interfaces:** Export named nodes `house`, `roof`, `upper_window`, `tree_structure`, `tree_sway`, and `window_target`. `tree_sway` contains only movable foliage and small upper limbs; trunk and structural branches stay static. `window_target` is an empty node at the outside center of the upper window.

- [ ] **Step 1: Prepare Blender locally.** Locate an existing executable first. If unavailable, obtain a portable stable Blender archive from its official distribution into the Codex task's `work/tools/` directory, outside the repository. Record the actual version and available integrity metadata. Run the executable's version command; stop with the actual error if it cannot run.
- [ ] **Step 2: Establish coordinates and hero silhouettes.** In `create-exterior.py`, author around the current local house footprint (about 4.7 units wide, 3.7 deep, 5.7 high). Keep the upper-window target near `(1.18, 3.62, 1.92)` before the existing assembly offset `(-0.6, 0, 0)`. Convert Blender's axes through the glTF exporter so the loaded asset is Y-up and faces +Z. Shape real roof/eaves profiles, layered beveled trim, casements, and tapered trunk/branches with roots.
- [ ] **Step 3: Finish focal details and materials.** Add roof tile relief/seams, restrained plaster variation, wood/bark detail, folded curtains behind glazing, and grouped botanical leaf silhouettes. Use glTF-compatible Principled BSDF materials; bake procedural surface detail to UV image maps when needed. Pack images into the `.blend` and GLB. Merge static leaves by material inside the sway group; avoid per-leaf draw calls and opaque canopy spheres as the finished silhouette.
- [ ] **Step 4: Save, export, and inspect.** Make the script save the `.blend` and export only the architecture/tree nodes to the production GLB, including anchors and textures, excluding cameras/lights/garden. Run Blender in background mode with the script, then open the source or render a source preview to inspect bevels, window layers, and canopy framing. An attractive Blender render is provisional until Task 4 checks the Three.js result.
- [ ] **Step 5: Validate the asset contract.** Read the GLB JSON chunk using a temporary standard-library script under task `work/`; confirm required unique node names, nonempty meshes, embedded buffers/images, and no external URIs. Record bytes and triangle count. Document the exact rebuild command and Blender version in `README.md`.

### Task 2: Load the model and replace the fallback safely

**Files:** Create the loader and shared resource cleanup module; modify `build-exterior.ts` and `create-scene.ts`.

**Interfaces:** Implement the three signatures in File Structure and Contracts. Camera poses continue to read the same mutable `windowTarget` vector. Architecture replacement is allowed once, before story/tweens start.

- [ ] **Step 1: Implement resource ownership.** Collect unique geometries, materials, and directly referenced textures from retired roots. Exclude every resource reachable from retained roots before disposing. Replace the private scene cleanup with this helper, retaining separate background texture/renderer disposal.
- [ ] **Step 2: Implement loading and validation.** Fetch the local GLB using the supplied abort signal, reject failed HTTP responses, and parse its buffer with `GLTFLoader.parseAsync`. Require the six named nodes from Task 1, finite transforms, and mesh geometry. Return the imported group plus the window anchor and sway group. Dispose any parsed invalid or aborted result before rejecting; do not import a decoder dependency.
- [ ] **Step 3: Implement `replaceArchitecture`.** Retain references to the existing procedural house/tree groups. Apply their shared `(-0.6, 0, 0)` assembly offset to the imported model, add it, update matrices, and copy the anchor position into the existing exterior-local target. Update the window light from that target, replace the sway-target array contents, remove fallback groups, and dispose only their exclusive resources while retaining the garden/imported group. Prevent a second replacement.
- [ ] **Step 4: Verify replacement and failure cases manually.** Load the normal GLB; confirm one house/tree and unchanged garden materials. Use temporary local fixtures outside tracked source for malformed bytes and a valid GLB missing `window_target`; each load must reject cleanly and leave the fallback intact. Use the browser's request blocking for a missing asset. Check abort/late-result cleanup with a delayed request. Remove temporary diagnostic wiring after inspection.
- [ ] **Step 5: Run repository checks.** Run `npm run typecheck` and `npm run build`; expect exit 0. Record existing/new warnings distinctly.

### Task 3: Coordinate startup, loading controls, and teardown

**Files:** Modify `src/main.ts`; modify `src/ui/intro-controls.ts` only if the existing callback/status interface cannot support the lifecycle.

**Interfaces:** Keep `createCameraStory(...)` and `CameraStoryHandle` unchanged. Create controls before awaiting the asset. Store nullable story state, a queued skip flag, an abort controller, and a disposed flag owned by startup.

- [ ] **Step 1: Wire loading before the intro.** Construct the fallback exterior, show the title/loading status, and load `/models/exterior-house-tree.glb`. Keep architecture hidden until asset selection settles so a visibly different fallback does not flash. On success replace it; on failure retain it and issue one concise diagnostic. Reveal the selected exterior and start one story. Abort loading after 12 seconds so a stalled asset selects the fallback; document this operational deadline in the asset README and clear its timer when loading settles.
- [ ] **Step 2: Preserve early input and motion preferences.** Before story creation, skip queues arrival; afterward it calls `story.skip()`. Start directly at arrival for reduced motion or a queued skip. Ambient sway depends only on the actual reduced-motion preference. Keep all loading/failure/status copy outside mesh builders.
- [ ] **Step 3: Make asynchronous teardown safe.** Register cleanup before the first await, abort outstanding loading, stop frame/tween/story work, remove controls/listeners/observer, and dispose the runtime once. Guard every async continuation against teardown. Resize updates the renderer during loading and reframes the story only after it exists.
- [ ] **Step 4: Verify lifecycle cases in a browser.** Throttle the asset request; activate skip by keyboard while loading, resize before and during the intro, and reload before loading finishes. Expect no duplicate intro, late attachment, stranded camera, or console exception. Repeat with reduced motion: direct arrival and no sway. Confirm asset failures reach the procedural arrival view and WebGL startup failure still shows its existing friendly message.
- [ ] **Step 5: Run `npm run typecheck` and `npm run build`.** Expect exit 0; record manual checks separately from build results.

### Task 4: Tune the real render and collect final evidence

**Files:** Adjust the Blender source/export, `build-exterior.ts`, `create-scene.ts`, or focused styles only where the actual render shows a problem. Update the asset README with final measurements.

**Interfaces:** Preserve the loader, replacement, and story contracts established above.

- [ ] **Step 1: Inspect still compositions first.** In the actual Three.js renderer, capture establishing and arrival frames at `1440×900` and `390×844`. Check the complete two-storey silhouette, upper-right destination, tree arch, pane visibility, curtain depth, material separation, and safe controls. Adjust modeling, roughness/normal textures, exposure, and camera poses together. Do not accept another blockout simply because it uses GLB.
- [ ] **Step 2: Check performance and local assets.** Record GLB bytes, triangles, and renderer draw calls at arrival. Inspect mobile rendering and network requests; all model/texture requests must stay local. Reduce leaf geometry/material splits or texture dimensions if rendering stutters. Do not claim physical-device performance from a resized desktop viewport.
- [ ] **Step 3: Run final gates on the frozen result.** Run `npm run typecheck`, `npm run build`, and `git diff --check`. Inspect production preview with `npm run preview -- --host 127.0.0.1`, including console output, keyboard skip, repeated skip, reduced motion, resize, model failure, and WebGL fallback. Record each result and any unavailable capability explicitly.
- [ ] **Step 4: Obtain independent reviews.** Record baseline HEAD, source diff digest, design/plan hashes, and GLB hash. Request two separate read-only native reviewer tasks against this same frozen result using only `gpt-6-luna` at `high` or `xhigh`, after confirming availability. Keep findings independent until both finish. Correct supported findings and repeat affected verification and both reviews after relevant changes. Report correlated-model limitations honestly.
- [ ] **Step 5: Hand over the rendered result.** Keep the live local preview available and show the actual scene captures with a concise change/check report. Preserve existing dirty files and do not deploy or commit without authorization. Final acceptance depends on the visible result, not just a successful build.

## Plan Self-Review

- Asset source, repeatable export, material compatibility, anchors, and local packing: Task 1.
- Loader validation, shared-resource safety, replacement, and recovery: Task 2.
- Loading status, early skip, reduced motion, resize, cancellation, and teardown: Task 3.
- Render quality, portrait composition, local requests, measurements, repository gates, and two independent reviews: Task 4.
- All imported types and method names match the contracts above. No automated test framework or future milestone is included.

## Execution Handoff

Recommended method: root implements sequentially in this chat, then obtains the two independent read-only reviews required by personal policy. Modeling, export, and camera calibration are tightly coupled; one implementer can iterate the complete visual result without handoff drift. Alternatively, use sequential subagent implementation tasks under the same model/review restrictions. Review this plan and select the execution method before implementation begins.
