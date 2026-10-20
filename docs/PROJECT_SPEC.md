# A Little Garden for You — Project Specification

**Status:** Proposed design for review
**Date:** 2026-10-20
**Project:** `D:\Z_PROJECT\20_10`

## Purpose

Create a small, personal 3D gift experience for October 20. The visitor starts outside a cozy two-storey home, follows a gentle camera journey toward an upstairs window, then enters a girl's bedroom to water a small plant. Tulips bloom around a greeting card; opening the card reveals the sender's message.

The project should feel like a carefully composed storybook diorama. It should run in a browser, remain light enough for mobile devices, and be straightforward for another coding agent to continue.

## Audience and core experience

- **Audience:** the recipient of a personal 20/10 gift.
- **Primary experience:** a quiet, guided visual story with one meaningful watering interaction and a personal message.
- **Tone:** warm, tender, playful, and intimate; romantic without excessive decoration.
- **Project title:** *A Little Garden for You*.

## Art direction

Use premium cozy stylized 3D: low-to-mid polygon shapes with deliberate proportions, soft edges, distinct matte materials, subtle surface variation, composed lighting, and restrained movement. Avoid photorealism, placeholder-looking primitive piles, neon color, and noisy arcade effects.

The scene's palette centers on warm ivory (`#F3E6D3`), terracotta (`#A85F48`), sage (`#81936D`), rose (`#D98591`), sunlit gold (`#E9B969`), and deep garden green (`#34463A`). Use a characterful display face for the title and a clear, quiet sans-serif for instructions and controls. Keep UI copy short and editable; the final personal greeting must be supplied separately from scene code.

The signature image is the broad, two-panel upstairs window on the right side of the house, framed by a mature tree and curved leafy branches that sweep over its top and along its right edge. The window must read as the destination from the opening composition.

## Story and milestones

### Milestone 1 — Exterior approach

Build the exterior scene and opening camera journey first.

- Show a modest two-storey suburban home, a small front yard, a clear stone path, and mixed flower beds with recognizable rose, tulip, and sunflower silhouettes.
- Give the home a warm, light facade and a softly modeled roof. Keep the scene compact and uncluttered.
- Make the wide, two-panel window on the upper-right facade the primary focal point. Include enough interior warmth through the window to invite the next scene without building the bedroom yet.
- Place a large tree beside the house. Shape its branches and foliage so they naturally frame the top and right edges of the window.
- Start on a readable three-quarter establishing view. Ease the camera toward the window as the story begins and stop at the exterior threshold for this milestone.
- Provide a keyboard-accessible “Bỏ qua phần mở đầu” control. Respect `prefers-reduced-motion` by skipping the long camera move.
- Use procedural geometry and materials for this milestone. Do not depend on externally hosted models or textures.

### Milestone 2 — Bedroom reveal

Continue the camera journey through the upstairs window into a cozy girl's bedroom. Include the bed, a study desk near the window, a small shelf, a lamp, soft textiles, and a few personal decorations. Keep the desk and plant as the composition's focus.

### Milestone 3 — Watering interaction

Let the visitor pick up or move a cute watering can toward the desk plant. Watering should be an understandable mouse, touch, and keyboard-accessible action. The bloom transition begins after five seconds of watering. Decide and record whether interruptions pause or reset progress before implementing this milestone.

### Milestone 4 — Tulips and greeting card

Grow several tulips from the pot with a gradual, readable reveal, a restrained warm glow, and a small number of soft particles. Reveal a card in the middle of the flowers. Opening it should show a Vietnamese greeting in an accessible dialog, with focus moved into the dialog and restored when it closes. Keep the greeting in a content file so it can be personalized without editing scene code.

## Milestone 1 acceptance criteria

1. The opening view clearly reads as a small two-storey home and garden, not as an indoor room or an abstract test scene.
2. The exterior includes a front path and flower beds with visibly different flower forms.
3. The upper-right two-panel window is easy to identify as the story destination in the wide view.
4. A tree beside the house frames the window from above and the right without obscuring its panes.
5. Warm late-afternoon light, soft shadows, material contrast, and a restrained palette create a calm, finished diorama.
6. The camera transition is smooth, lands on the window, can be skipped by keyboard, and respects reduced-motion settings.
7. Canvas sizing follows the viewport; controls remain visible and usable on narrow screens.
8. If WebGL cannot start, the page shows a useful message instead of an unexplained blank screen.
9. Type checking and the production build complete successfully. Manual desktop and mobile previews show no console errors or clipped controls.

## Technical direction

- Use Vite, strict TypeScript, Three.js, and GSAP. Keep the app framework-free unless a later approved requirement justifies adding one.
- Keep scene creation, exterior modeling, camera choreography, and HTML controls in focused modules with small, clear interfaces.
- Keep one renderer and reuse geometries and materials for repeated garden elements. Cap pixel ratio on high-density screens and keep shadow quality bounded for mobile.
- Drive the opening camera move with a single GSAP timeline that supports skip and reduced motion. Use the Three.js scene graph for meshes, lighting, and camera targets.
- Keep user-facing text in HTML or content modules rather than burying it in mesh construction.
- Preserve the existing Vercel project link. Configure the static build output as `dist` and verify the build locally; do not deploy as part of these milestones.
- Preserve the existing untracked `.gitignore` entry. Add only necessary ignore rules when the new toolchain requires them.

### Intended source layout

```text
index.html
src/
  main.ts
  styles.css
  experience/
    camera-story.ts
  scene/
    create-scene.ts
    exterior/
      build-house.ts
      build-garden.ts
      build-tree.ts
  ui/
    intro-controls.ts
  content/
    gift-message.ts       # Added when the card milestone begins
docs/
  PROJECT_SPEC.md
```

The first implementation should add only modules needed for the exterior and shared scene setup. Do not create empty placeholders for future milestones.

## Verification approach

For the first implementation, run the project type check and production build. Start the local Vite server and inspect the rendered scene at a desktop size and a narrow mobile size. Check the browser console, the skip control by keyboard, the reduced-motion path, resize behavior, and the WebGL fallback. Record each result as `PASS`, `FAIL`, or `NOT_RUN`; a planned check is not a passing check.

Do not add an automated test framework solely for this milestone. Add focused automated checks when a later interaction introduces state transitions that need regression coverage.

## Out of scope for Milestone 1

- Building the bedroom interior or moving the camera through the window.
- Watering can manipulation, the five-second watering state, flower growth, and card reveal.
- Final personal greeting copy, audio, analytics, authentication, or backend services.
- Publishing or deploying the site.

## Open decision before Milestone 3

Decide whether a pause in watering preserves accumulated active time or resets the five-second timer. This does not block the exterior milestone.
