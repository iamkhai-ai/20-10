# Exterior Approach Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Follow the repository's `AGENT.md`. Implement only Milestone 1 in this plan.

**Goal:** Replace the existing indoor prototype with the first polished, responsive exterior approach for *A Little Garden for You*.

**Architecture:** Migrate the single-file CDN prototype to a Vite and strict TypeScript app with one Three.js renderer. Keep the exterior in focused house, tree, and garden builders; use GSAP for the guided camera intro, with semantic DOM controls for skip and status. The deliverable stops at the upstairs window; the bedroom, watering, bloom, and card remain future milestones.

**Tech Stack:** Vite, TypeScript in strict mode, Three.js, GSAP, npm.

**Spec:** `docs/PROJECT_SPEC.md` — approved product direction, detailed art direction, Milestone 1 scope, architecture constraints, and acceptance criteria.

## Global Constraints

- Keep the current implementation scope to Milestone 1: the exterior establishing scene and arrival at the upstairs window.
- Use Vite, strict TypeScript, Three.js, and GSAP; do not add a UI framework.
- Replace the Three.js CDN import map with local npm imports and commit a lockfile using exact dependency versions.
- Use procedural geometry/materials for the exterior; do not add remote model or texture dependencies.
- Put visible copy and controls in semantic HTML, outside low-level mesh builders.
- Support desktop and narrow portrait layouts, keyboard skip, visible focus, and `prefers-reduced-motion`.
- Cap the renderer pixel ratio at 1.5, reuse repeated geometry/materials, and keep shadows bounded; the scene must work without post-processing.
- Keep the build output at `dist`. Do not deploy, publish, or change the linked Vercel project or `.vercel` metadata.
- Preserve the existing `.gitignore` entry for `.vercel`; add only the Vite-required ignore entries for `node_modules` and `dist`.
- The current worktree already has an uncommitted `docs/PROJECT_SPEC.md` change and an untracked `.gitignore`. Do not stage or commit the spec change. When updating `.gitignore`, preserve its existing content and review the staged diff before any commit.
- Do not build the bedroom, watering interaction, flower bloom, greeting card, or audio in this milestone.
- Do not add an automated test framework for this milestone. Run the type check and production build, then perform the visual/manual checks listed below. Report each check as `PASS`, `FAIL`, or `NOT_RUN`.

## Review Focus

- **Desktop composition:** At a wide viewport, the complete house and garden fit, and the double window reads as the destination without foliage covering its panes. Verify in Tasks 2, 3, and 5.
- **Portrait composition:** At a narrow portrait viewport, the house remains recognizable, the window remains visible, and controls stay within safe areas. Verify in Task 5.
- **Reduced motion:** With `prefers-reduced-motion: reduce`, the camera starts at the arrival pose and ambient sway is disabled. Verify in Task 4.
- **Skip and resize:** Skip works during the camera move, repeated activation is harmless, and resizing mid-move does not restart or strand the camera. Verify in Tasks 4 and 5.
- **WebGL failure:** If renderer initialization fails, show a useful Vietnamese fallback instead of a blank or stuck loading screen. Verify in Tasks 1 and 5; if the browser cannot simulate failure, report `NOT_RUN` for the runtime simulation.

---

### Task 1: Migrate the project shell and create the renderer runtime

**Files:**
- Create: `package.json`, `package-lock.json`, `tsconfig.json`
- Modify: `.gitignore` (append only the required Vite entries; preserve `.vercel`)
- Modify: `index.html`
- Create: `src/main.ts`, `src/styles.css`, `src/scene/create-scene.ts`
- Delete: `main.js` after the new Vite entry is in place

**Interfaces:**
- `createScene(host: HTMLElement): SceneRuntime`
- `SceneRuntime` exposes `scene: THREE.Scene`, `camera: THREE.PerspectiveCamera`, `renderer: THREE.WebGLRenderer`, `resize(): void`, and `dispose(): void`.
- `main.ts` creates the runtime, mounts the renderer canvas into `#scene-root`, handles startup failure, wires viewport resize, and owns teardown.

- [ ] **Step 1: Add the Vite and TypeScript package configuration**

  Install current stable dependencies with exact versions recorded in `package.json`: runtime `three` and `gsap`; development `vite`, `typescript`, and `@types/three`. Create the npm lockfile. Add scripts `dev`, `typecheck` (`tsc --noEmit`), `build` (type check followed by Vite build), and `preview`. Configure TypeScript with `strict: true`, DOM libraries, ES modules, and bundler module resolution.

- [ ] **Step 2: Replace the static entry document and add the minimal accessible shell**

  Change `index.html` to the Vite root entry, remove the CDN import map and inline global error handler, and load `/src/main.ts`. Create a full-viewport scene host, a DOM title, a status region for short Vietnamese copy/fallback, and responsive styles with visible focus styling and safe-area padding. Keep the Three.js canvas decorative to assistive technology.

- [ ] **Step 3: Implement the shared renderer lifecycle**

  In `src/scene/create-scene.ts`, create one renderer, a perspective camera, a calm warm background, and the initial directional/hemisphere fill. Cap pixel ratio at `1.5`, set output color handling/tone mapping deliberately, size to the host element, and expose `resize()` and `dispose()`. Do not add post-processing.

- [ ] **Step 4: Wire startup and graceful WebGL fallback**

  In `src/main.ts`, catch renderer initialization errors and replace the loading/status copy with a concise Vietnamese explanation while keeping the title readable. Add one resize listener and remove it during teardown. Replace the old `main.js` reference before deleting the old file so the Vite page has exactly one application entry.

- [ ] **Step 5: Verify the project shell**

  Run `npm run typecheck` and `npm run build`; both must exit successfully. Run `npm run dev -- --host 127.0.0.1` and confirm the Vite page loads with the canvas and no console errors. Check the fallback branch if a WebGL-disabled browser is available; otherwise record that runtime check as `NOT_RUN`.

- [ ] **Step 6: Commit the foundation only**

  Stage only the package/configuration, entry, style, and runtime files from this task (including `.gitignore` only if its complete staged contents retain `.vercel` and add only the approved ignore entries). Do not stage `docs/PROJECT_SPEC.md` or unrelated files. Commit as `build: migrate garden to Vite and TypeScript`.

### Task 2: Build the house and signature upstairs window

**Files:**
- Create: `src/scene/exterior/materials.ts`
- Create: `src/scene/exterior/build-house.ts`
- Modify: `src/main.ts` to add the house group to the scene

**Interfaces:**
- `createExteriorMaterials(): ExteriorMaterials` returns the small shared material set used by exterior builders.
- `buildHouse(materials: ExteriorMaterials): HouseBuildResult` returns `{ group: THREE.Group; windowTarget: THREE.Vector3 }`.
- Coordinate convention: Y is up; the front facade faces positive Z. Keep the house origin at its ground-level center.

- [ ] **Step 1: Define reusable exterior materials from the approved palette**

  Add warm plaster, muted roof, light window trim, warm wood, and foliage/stone base materials using the palette in the spec. Use matte or restrained satin finishes and avoid a high-contrast brick wall texture.

- [ ] **Step 2: Build the two-storey house silhouette**

  Compose front and side wall planes, a readable roof with eaves, foundation, and a small number of secondary openings. Use softened edges or layered geometry on major visible forms; do not leave the house as an unmodified-box blockout.

- [ ] **Step 3: Build the upper-right two-panel window as the focal asset**

  Add layered trim, a clear center stile, subtle glass, curtains, and a warm interior glow. Return a world-space target just outside the window for camera choreography. The two casements and window opening must read in the establishing view.

- [ ] **Step 4: Inspect and verify the static house composition**

  Run `npm run typecheck` and `npm run build`. In the browser, confirm the front and one side of the house are readable, the window sits on the upper-right facade, and the roof/house are not cropped at a desktop viewport. Adjust geometry/materials before proceeding if the window does not draw the eye.

- [ ] **Step 5: Commit the house slice**

  Stage only the new exterior material/house files and the scene wiring from this task. Commit as `feat: model exterior house and signature window`.

### Task 3: Add the framing tree, path, and flower beds

**Files:**
- Create: `src/scene/exterior/build-tree.ts`
- Create: `src/scene/exterior/build-garden.ts`
- Create: `src/scene/exterior/build-exterior.ts`
- Modify: `src/main.ts` to use the assembled exterior

**Interfaces:**
- `buildTree(materials: ExteriorMaterials, windowTarget: THREE.Vector3): TreeBuildResult` returns `{ group: THREE.Group; swayTargets: THREE.Object3D[] }`.
- `buildGarden(materials: ExteriorMaterials): THREE.Group` returns reusable ground, path, and flower-bed geometry.
- `buildExterior(): ExteriorBuildResult` returns `{ group: THREE.Group; windowTarget: THREE.Vector3; swayTargets: THREE.Object3D[]; cameraPoses(aspect: number): CameraPosePair }`.
- `CameraPose` is `{ position: THREE.Vector3; target: THREE.Vector3 }`; `CameraPosePair` is `{ intro: CameraPose; arrival: CameraPose }`.

- [ ] **Step 1: Build the mature tree around, not over, the window**

  Use rounded tapering branches and layered matte foliage. Sweep branches across the top and right edge of the upstairs window while keeping the glass and two-panel silhouette visible. Return a small number of leaf/branch groups as sway targets; avoid per-leaf animation.

- [ ] **Step 2: Build the compact garden and recognizable flower silhouettes**

  Add lawn/soil, irregular warm stone slabs leading toward the entrance, and coordinated small flower clusters. Include rose clusters, cup-shaped tulips, and sunflower discs with radial petals. Reuse geometry/materials for repeated elements and keep the foreground and flower beds uncluttered.

- [ ] **Step 3: Assemble the exterior and choose responsive camera poses**

  In `build-exterior.ts`, compose the house, tree, and garden with the house slightly left of center and the window upper-right. Return start and arrival poses from `cameraPoses(aspect)` so portrait framing can be tuned separately without changing object geometry. The desktop intro pose must show the entire house, path, and flower groups; the arrival pose must favor the window.

- [ ] **Step 4: Verify the complete still scene before adding motion**

  Run `npm run typecheck` and `npm run build`. Inspect the static exterior at desktop and narrow portrait sizes. Confirm that the house silhouette, tree arch, path, and three flower types are recognizable and that the tree does not cover the window. Do not add camera animation until this still composition works.

- [ ] **Step 5: Commit the exterior composition slice**

  Stage only the new tree/garden/assembly files and the relevant scene wiring. Commit as `feat: compose garden and framing tree`.

### Task 4: Add the camera story, skip control, and reduced-motion behavior

**Files:**
- Create: `src/experience/camera-story.ts`
- Create: `src/ui/intro-controls.ts`
- Modify: `src/main.ts`, `src/styles.css`, and `src/scene/exterior/build-tree.ts` as needed for motion wiring

**Interfaces:**
- `createCameraStory(camera: THREE.PerspectiveCamera, getPoses: (aspect: number) => CameraPosePair, options: { reducedMotion: boolean; onArrive: () => void }): CameraStoryHandle`.
- `CameraStoryHandle` exposes `skip(): void`, `reframe(): void`, and `dispose(): void`.
- `createIntroControls(onSkip: () => void): { setStatus(message: string): void; dispose(): void }`.

- [ ] **Step 1: Implement a single interruptible GSAP camera timeline**

  Begin automatically at the three-quarter establishing pose and move to the window arrival pose over five to seven seconds with gentle easing. Interpolate both camera position and look target from the current responsive pose pair. Complete the arrival callback once only.

- [ ] **Step 2: Implement the semantic skip control**

  Add the visible Vietnamese control “Bỏ qua phần mở đầu”, make it a real button with a visible focus state, and connect it to `skip()`. Skip must land at the same arrival pose, remain safe when clicked repeatedly, and stop the active timeline cleanly.

- [ ] **Step 3: Implement reduced motion and ambient sway**

  Read `prefers-reduced-motion` at startup. When reduced motion is requested, start at the arrival pose, call the arrival behavior once, and do not start leaf sway. Otherwise, animate only the returned tree sway targets with a subtle looping GSAP motion and retain/kill the tween handles during teardown.

- [ ] **Step 4: Handle live resize without replaying the story**

  On viewport changes, resize the renderer/camera and call `reframe()` on the camera story. Recompute the pose pair for the new aspect while keeping the current timeline progress; do not restart the intro or snap back to the start pose.

- [ ] **Step 5: Verify camera and control behavior**

  Run `npm run typecheck` and `npm run build`. Manually verify normal intro duration, keyboard activation of skip during motion, repeated skip activation, reduced-motion arrival with no sway, and resize mid-move without replay or camera stranding. Record any unavailable check as `NOT_RUN`.

- [ ] **Step 6: Commit the story interaction slice**

  Stage only the camera story, intro UI, and scene wiring from this task. Commit as `feat: add accessible window intro`.

### Task 5: Tune responsive framing, lighting, and final Milestone 1 quality

**Files:**
- Modify: `src/scene/create-scene.ts`, `src/scene/exterior/build-exterior.ts`, `src/scene/exterior/materials.ts`, `src/styles.css`, and focused builders as needed

**Interfaces:**
- Keep the public interfaces from Tasks 1–4 stable unless an observed rendering issue requires a small, coordinated change. If a signature changes, update every consumer in the same task and keep the names consistent.

- [ ] **Step 1: Tune the actual render against the approved art direction**

  Calibrate the warm directional key, soft hemisphere fill, background/fog, window glow, shadow bounds, and material roughness as one composition. Keep saturation strongest on the flower accents; avoid a dark purple backdrop, plastic highlights, noisy wall detail, or excessive effects.

- [ ] **Step 2: Tune desktop and portrait camera composition**

  Use `cameraPoses(aspect)` to keep the full house and garden readable at `1440×900` and the destination window visible at `390×844`. Keep the title/skip UI out of the window and flower focal area and inside mobile safe areas.

- [ ] **Step 3: Check resize, fallback, and cleanup paths**

  Confirm resize does not restart the story, initialization failure replaces loading copy with the fallback, and disposal stops renderer animation, GSAP work, and listeners. Check the browser console for errors during load, skip, resize, and teardown/reload.

- [ ] **Step 4: Run final Milestone 1 verification**

  Run `npm run typecheck` and `npm run build`. Start the production preview with `npm run preview -- --host 127.0.0.1`; inspect the establishing and arrival frames at both target viewports, then repeat with reduced motion. Confirm no clipped house/tree/controls, no console errors, a visible keyboard focus state, and a useful fallback if WebGL failure can be simulated. Record each result as `PASS`, `FAIL`, or `NOT_RUN`.

- [ ] **Step 5: Commit final visual refinements**

  Stage only the implementation files changed by this task and commit as `polish: refine responsive garden presentation`. Do not include the pre-existing `docs/PROJECT_SPEC.md` diff or unrelated local files.

## Completion Record

Before reporting this milestone complete, provide the final revision/commit identity and a concise checklist with results for type check, production build, desktop preview, portrait preview, keyboard skip, reduced motion, resize mid-intro, console output, and WebGL fallback. Use `NOT_RUN` where the environment prevented a check; do not infer a pass from the implementation plan.

## Technical References

- [Vite Getting Started](https://vite.dev/guide/)
- [Three.js Installation](https://threejs.org/manual/en/installation.html)
- [GSAP Installation](https://gsap.com/docs/v3/Installation/)
