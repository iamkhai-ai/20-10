# A Little Garden for You — Detailed Project Specification

**Status:** Approved for Milestone 1 planning
**Revision:** 3
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

### Chosen direction

Use **Premium Stylized Low-Poly, B+ approaching C at the focal details**. The whole scene stays efficient enough for a browser, while the window, tree, desk, watering can, flowers, and card receive enough shape and material work to feel like a crafted gift. This is a cozy 3D storybook diorama in its composition and finish; it is not a floating miniature island, a photoreal house, or a rough low-poly prototype.

The world should feel warm, clear, romantic, gentle, and private: a small remembered place in late-afternoon light. Keep it feminine and affectionate without making it sugary. Slight idealization is welcome; visual clutter, uncanny realism, and rigid toy blocks are not.

### Shape language and detail budget

- Favor softened corners, bevels, rounded silhouettes, and gently exaggerated proportions over sharp architectural edges.
- Give each important object a readable outline at a distance. The house silhouette, two window leaves, tree arch, tulip cups, sunflower discs, watering-can handle, and card shape should remain identifiable while the camera moves.
- Build major forms from composed meshes with bevels, layered silhouettes, and intentional overlap. A collection of unmodified boxes, spheres, and cylinders is a blockout, not a finished asset.
- Use detail in tiers. The opening view needs strong composition and large forms; the close view earns richer trim, petals, wood grain, ceramic edges, and paper texture.
- Keep small repeated details grouped and sparse. Avoid tiny bricks across every wall, many unrelated props, and decorative particles that compete with the window or card.
- Use original procedural geometry and subtle procedural textures for the first milestone. A Blender/glTF asset may replace a procedural object later if it materially improves the focal view and stays within the browser performance budget.

### Palette

Use this palette as the shared starting point. Adjust lighting and material values together; do not use the hex values as flat, unlit fills for every mesh.

| Token | Color | Primary use |
|---|---|---|
| Warm ivory | `#F3E6D3` | Main plaster, curtains, paper |
| Oat beige | `#D5BFA4` | Stone path, trim shadows, textiles |
| Terracotta | `#A85F48` | Roof, ceramic pot, warm accents |
| Sage | `#81936D` | Foliage, shutters, soft fabric |
| Dusty rose | `#D98591` | Tulips, roses, restrained romantic accents |
| Sunlit gold | `#E9B969` | Sunflowers, afternoon highlights, card details |
| Deep garden green | `#34463A` | Foliage shadow, stems, distant garden |

Flower colors may also include muted cream and soft red. Keep saturation strongest on flowers and the card; walls, roof, and ground should support them rather than compete.

### Materials and surface finish

- **Exterior plaster:** warm cream or blush-ivory, matte, with only a very fine value variation. Do not use a high-contrast brick texture as the main wall finish.
- **Roof:** muted terracotta or deep dusty sage. Use a readable roof silhouette and restrained tile seams; avoid a flat cone cap and avoid hundreds of noisy individual tiles.
- **Window and trim:** painted ivory or light wood, softly beveled. The two casements share a clear center seam. Glass catches a faint warm reflection but remains transparent enough to hint at curtains and interior light.
- **Tree and leaves:** layered greens with slight hue/value variation. Leaves are matte-to-satin, not waxy or metallic; branches have rounded, tapering curves.
- **Stone path:** warm beige stones with slight edge variation and small gaps. The path should guide the eye and remain visually distinct from the lawn.
- **Desk and bedroom wood:** warm, quiet grain visible only at close range. Keep large planks from producing repetitive stripe noise.
- **Pot and watering can:** ceramic or satin-painted materials with a soft highlight. The pot feels handmade; the can is rounded, small, and inviting rather than industrial.
- **Paper card:** warm ivory stock, subtle edge thickness, a restrained border or pressed floral mark, and legible type. Do not make it a glowing billboard.

Materials should remain physically plausible enough to distinguish plaster, wood, glass, foliage, ceramic, water, and paper, while retaining a stylized finish. Avoid plastic-like gloss on broad surfaces.

### Lighting and atmosphere

- Set the story in a calm golden hour: warm key light from one side, a soft sky/hemisphere fill, and a gentle warm interior glow behind the upstairs window.
- Use directional light for the readable house and garden shadows, with a bounded shadow map and a soft fill to preserve detail in shaded leaves.
- Keep the sky and distant background quiet. A subtle warm-to-sage atmosphere is preferable to a flat black canvas or a saturated purple gradient.
- Let the window glow become more visible as the camera approaches. In the bedroom, daylight enters from the window while a small practical lamp contributes a private warm pool.
- During the tulip bloom, lift the plant area gently with a warm glow. Bloom, if used, must be restrained and localized; ambient occlusion or depth effects are optional and may be added only if they remain smooth on mobile.
- Calibrate exposure after the full composition is placed. Do not compensate for weak lighting by saturating every material.

### Typography and on-screen copy

Use a characterful display face for the project title and a calm, highly legible sans-serif for instructions, progress, and controls. Bundle fonts locally if a chosen family is added; provide sensible system fallbacks. The title should feel like the cover of a small storybook, not a game HUD.

Keep interface copy short, warm, and specific to the action. Use the title *A Little Garden for You* and Vietnamese microcopy for controls. The recipient's name and the final greeting remain editable content, not fixed in scene-building code. Do not invent personal details.

### Motion language

Motion is part of the storytelling, not a stream of effects. Use one clear camera introduction, slow environmental movement, and one carefully staged bloom. Leaves and curtains sway only a little; the watering stream is delicate; the plant responds softly. Avoid sharp overshoot, rapid shaking, large particle bursts, flashing, neon, and arcade-like counters.

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

Continue the camera journey through the upstairs window into a cozy girl's bedroom. The room is a dollhouse-like cutaway in the same world, not a realistic architectural walkthrough. Include a compact bed with pastel bedding, a study desk directly near the window, a small shelf, a warm table lamp, a soft rug, curtains, and only a few personal decorations such as a framed picture or plush toy. The desk and plant remain the composition's focus; the bed and decor establish that this is a cared-for bedroom without becoming a prop inventory.

The exterior-to-interior transition must feel continuous. Prefer a camera move through the open window aperture with coordinated curtain movement. If a technically clean traversal is not possible, use a hidden, eased handoff between matched camera poses; the viewer must not see the camera collide with glass, clip through a wall, or jump to an unrelated angle.

### Milestone 3 — Watering interaction

Let the visitor pick up or move a cute watering can toward the desk plant. The can has a rounded body, soft handle, short spout, and pastel finish (sage, baby blue, dusty rose, or warm ivory). Its silhouette must remain clear against the desk and room.

The interaction should have a clear start and finish: the can is visibly available, can be picked up, and can be aimed toward the pot. Show a gentle water stream and small drops only while watering is valid. The pot and leaves respond with a subtle wobble. Accumulate five seconds of valid watering before starting the bloom. Mouse, touch, and keyboard users must all be able to complete the action; provide a semantic hold/activate control as an alternative to dragging the 3D can.

Initial behavior proposal: when watering stops or moves away from the pot, preserve accumulated active watering time and pause the progress. Confirm this detail before implementing Milestone 3; the exterior milestone is not blocked by it.

### Milestone 4 — Tulips and greeting card

Grow several tulips from the pot with a gradual, readable reveal. The stems rise first, buds become visible, and petals open in a short staggered sequence. The plant should feel magical but botanical: no sudden explosion or oversized glow. Add a restrained warm highlight and only a few slow particles if they improve the moment.

Reveal a small card in the middle of the flowers after the bloom has settled. The card may lift and turn slightly to present itself, then becomes a clear interactive target. Clicking, tapping, Enter, or Space opens the card. Mirror the 3D target with a semantic DOM control so keyboard and assistive-technology users can activate it. Show the Vietnamese greeting in a readable dialog, move focus into the dialog, close it with a labeled button and Escape, and restore focus to the card control. Keep recipient name and greeting in a content module; the sender supplies the final message.

## Scene composition and layout

### Exterior composition

- Use a three-quarter view that shows the front facade and one side wall. Keep enough elevation to read the yard and path, but not so much that the window becomes a roof plan.
- Place the house slightly left of center so the mature tree can rise beside its right wall and the upstairs window remains visually framed.
- The opening frame should contain the entire house, the path entering from the lower foreground, two or three flower clusters, and the upper window. Do not crop the roof, tree arch, or house base at common desktop sizes.
- The window sits in the upper-right portion of the facade. A useful desktop composition target is roughly 60–70% of the viewport width and 30–45% of its height; adjust for portrait screens while keeping the destination clear.
- The stone path leads toward the entrance and creates a secondary line toward the house. Flower clusters sit along its sides and around the facade rather than filling every empty patch of ground.
- Use a shallow foreground edge and quiet background context to make the home feel situated in a small suburban garden. Do not add a visible floating plinth.
- Keep title and controls in safe negative space in the HTML overlay. They must never cover the window or primary flower bed.

### Bedroom composition

The window remains visible behind or beside the desk so the visitor understands how the camera entered the room. Put the desk close to the window, with the pot in the brightest, cleanest part of the work surface and the watering can offset to one side. Keep the bed, shelf, lamp, and textile details behind the desk in a soft hierarchy. Avoid placing objects directly in front of the pot or blocking the eventual flower-and-card silhouette.

### Pot and card close-up

The camera's close framing should show the full pot rim, soil, can spout, rising stems, and entire card at once. The card needs enough on-screen space to read as an invitation to click. During card focus, soften the background through composition, light falloff, or a subtle blur only if it stays readable and performs well.

## Camera choreography

The camera is the narrator. It should feel guided and intentional, with smooth easing and no user-controlled free orbit during the short gift story.

1. **Establish:** show the full home, yard, path, and garden from a three-quarter exterior angle. Hold briefly so the viewer can read the scene.
2. **Approach:** glide toward the upstairs window over approximately five to seven seconds. The window grows steadily in frame; the tree branches create natural foreground parallax. Keep the horizon and verticals stable.
3. **Arrive:** stop just outside the window for Milestone 1. The frame now favors the window, curtains, and warm interior light. Later, this pose is the starting point for the bedroom reveal.
4. **Enter:** in Milestone 2, continue through the aperture or perform the approved hidden handoff to a matched bedroom pose.
5. **Focus plant:** move from the room view to the desk without snapping; settle before the watering interaction begins.
6. **Present card:** after the bloom, bring the card into a comfortable reading angle. Keep the card opening animation separate from the DOM dialog transition.

The opening move starts automatically to match the concept. A visible “Bỏ qua phần mở đầu” control jumps to the arrival pose. `prefers-reduced-motion` goes directly to that pose and disables ambient sway. The timeline must be interruptible by the skip action and must not restart unexpectedly on resize.

## Asset catalogue and visual priority

Build in this order. The first item is a composition landmark; the later items support it.

| Priority | Asset group | Visual requirements |
|---|---|---|
| P0 | Two-storey house shell | Clear two-level proportions, soft cream plaster, readable front and side planes, roof silhouette and eaves. Keep the wall treatment quiet. |
| P0 | Upper-right double window | Wide two-panel opening with center stile, layered trim, subtle glass, visible soft curtains, warm room glow. It must be recognizable in the establishing shot. |
| P0 | Mature framing tree | Trunk beside the right wall, tapering curved branches sweeping over the window and down its right edge, layered leaves that frame without obscuring panes. |
| P0 | Garden ground and path | Compact lawn/soil shapes and irregular warm stone slabs that lead the eye toward the front entrance. |
| P0 | Flower beds | Three distinct silhouettes: rose clusters with layered rounded petals, tulips with cup-shaped heads, and sunflowers with a clear central disc and radial petals. Mix them in small coordinated clusters. |
| P1 | Exterior secondary details | Door, lower windows, roof trim, foundation, a small number of shrubs, window boxes or low planters only where they improve composition. |
| P1 | Bedroom shell and furniture | Soft wall/floor palette, compact bed, desk by window, shelf, lamp, rug, curtains, restrained personal decor. |
| P0 for M3 | Pot and watering can | Handmade ceramic pot with soil; rounded pastel can with handle, body, and short spout; both readable and easy to raycast. |
| P0 for M4 | Tulip plant and card | Stems and buds that can animate independently; petals that open visibly; small upright card with a clear click target and editable greeting. |

Prefer shared, reusable geometry/materials for repeated flowers, leaves, stones, and trim. A single flower variant can be cloned with varied scale, rotation, and color rather than building every plant independently. Do not spend time detailing assets that are never seen by the camera.

## Interaction and experience states

The full experience should use a small explicit state model rather than a collection of unrelated booleans. The names may change during implementation, but the transitions and user-visible behavior should remain clear:

| State | User sees | Allowed transition |
|---|---|---|
| Exterior intro | Wide garden view and opening copy | Camera advances automatically or skip moves to `Window arrival` |
| Window arrival | Close exterior window and interior glow | Milestone 2 enters the bedroom |
| Bedroom reveal | Bedroom and desk, camera settles | Reveal `Ready to water` |
| Ready to water | Pot, can, and concise instruction | Valid can-to-pot watering starts `Watering` |
| Watering | Water stream and accessible progress | Five seconds of valid watering starts `Blooming`; cancel/leave pauses according to approved rule |
| Blooming | Stems grow, buds open, card appears | Finished bloom enters `Card ready` |
| Card ready | Card in flowers with a clear action | Pointer, touch, Enter, or Space enters `Card open` |
| Card open | Greeting dialog over softened scene | Close button or Escape returns to `Card ready` |

Only the exterior intro and window arrival are implemented in Milestone 1. Later states are documented here to preserve story continuity, not as permission to implement them early.

## Existing project baseline and transition

The repository currently has a single `main.js` that imports Three.js `0.160.0` and `RoomEnvironment` through an import map in `index.html`. It contains an early indoor room, a basic desk, pot, can, seed/flower placeholder, custom texture generation, a camera zoom, pointer drag behavior, sound synthesis, and a modal. The scene does not yet provide the intended suburban exterior composition or refined storybook art direction.

The migration should replace the remote import map with pinned npm dependencies and a lockfile, then move the implementation into the Vite/TypeScript structure below. Preserve the linked Vercel project and existing `.vercel` metadata. The already-present untracked `.gitignore` contains `.vercel`; leave it intact. Build `dist` locally and verify output settings without deploying.

## Implementation order and quality gates

Keep the work ordered so polish is not deferred until after a generic blockout:

1. **Foundation:** create the Vite + strict TypeScript app, pin Three.js and GSAP dependencies, establish the renderer lifecycle and semantic HTML shell, and confirm the production build works.
2. **Art contract:** implement the palette, light direction, camera aspect framing, and house/window/tree silhouettes before adding small decoration.
3. **Exterior composition:** build the house facade, roof, right-side wall, window, framing tree, ground, path, and three flower silhouettes. Confirm the still composition reads before animation.
4. **Materials and lighting:** add soft material variation, warm afternoon key light, window glow, controlled shadows, and restrained background atmosphere.
5. **Story movement:** choreograph the opening camera, skip action, reduced-motion path, and gentle ambient leaf movement.
6. **Responsive and failure paths:** check landscape and portrait framing, safe-area UI, resize handling, WebGL error copy, and cleanup.
7. **Visual review:** inspect the rendered desktop and mobile scenes, remove details that distract from the window, and re-check the build after changes.

Do not animate a weak still scene to hide composition problems. Complete each gate before moving to the next: silhouette and layout, then materials/light, then motion, then refinement.

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

### Future milestone acceptance criteria

These criteria describe the intended complete experience. They do not expand the current implementation scope beyond Milestone 1.

**Milestone 2 — Bedroom reveal**

- The room reads as a warm, cared-for bedroom from the first settled interior frame; the desk beside the window is the clear next focus.
- The bed, shelf, lamp, rug, curtains, and a few decorations are visible as supporting context without competing with the desk plant.
- The camera transition from the exterior arrival pose to the bedroom does not visibly clip through the window, wall, or furniture, and has no unexplained pose jump.
- After the camera settles, the experience communicates that the visitor can interact with the watering can.

**Milestone 3 — Watering interaction**

- A first-time visitor can identify the can, understand how to water, and finish the action with pointer, touch, or keyboard input.
- Water appears only while the can is aimed at the pot and the watering action is active; the plant and pot give restrained visual feedback.
- The bloom starts after five seconds of accumulated valid watering, using the pause/reset behavior approved before this milestone.
- Progress and instructions are available in semantic HTML as well as through the 3D scene; the interaction does not depend on color alone.
- Releasing input, moving away from the pot, and using the page at narrow mobile widths do not leave the can stuck or water streaming unintentionally.

**Milestone 4 — Bloom and card**

- The bloom has a readable sequence from stems to buds to open petals and finishes with the card unobstructed.
- The card is visibly actionable and can be opened with pointer, touch, Enter, and Space.
- The dialog displays the supplied Vietnamese message legibly, receives focus on open, closes with its labeled control or Escape, and restores focus to the card control.
- The card text can be personalized in the content module without editing geometry or animation code.

## Technical direction

### Runtime and module boundaries

- Use Vite, strict TypeScript, Three.js, and GSAP. Keep the app framework-free unless a later approved requirement justifies adding one. Use pinned npm dependencies and commit the package lockfile so another machine gets the same dependency graph.
- `src/main.ts` owns application startup and teardown. It creates the scene, binds the DOM controls, starts the experience, and handles a renderer startup failure without leaving half-initialized listeners behind.
- `src/scene/create-scene.ts` owns the renderer, camera, scene, lights, and shared render lifecycle. It exposes a small scene API; it must not contain all object-building logic.
- Object builders such as `build-house.ts`, `build-tree.ts`, and `build-garden.ts` receive shared materials or a small build context, return a `Group` (and optional animation handles), and do not reach into the DOM.
- `src/experience/camera-story.ts` owns the intro timeline and its skip/reduced-motion behavior. It must be safe to call skip more than once and must not leave a running timeline after teardown.
- `src/ui/intro-controls.ts` owns semantic buttons, status text, and UI event binding. It coordinates with the experience through callbacks rather than modifying Three.js meshes directly.
- Put scene-wide colors and tunable values in a small configuration module once they are used in more than one builder. Avoid a generic configuration framework for a single scene.
- Keep the Three.js scene graph as the source of truth for 3D positions. Keep text, buttons, progress announcements, and the future greeting in HTML/content modules for legibility and accessibility.

### Rendering and resource lifecycle

- Create one `WebGLRenderer` for the page and size it from the actual drawing area. Cap device pixel ratio (initial target: 1.5) so high-density phones do not multiply fill cost without a visible gain.
- Set the output color space and tone mapping deliberately, then calibrate material colors under the chosen lighting. Do not switch to unlit materials just to make palette swatches match their hex values.
- Use one render loop for the scene. Update time-based sway from elapsed time so its speed is stable across frame rates; do not create new vectors, geometries, or materials every frame.
- Reuse geometries and materials for repeated stones, petals, leaves, and trim. Vary transforms and a small set of approved colors instead of creating many nearly identical resources.
- Keep shadows restricted to important forms and bound the shadow camera to the house/garden composition. Use a capped shadow map and disable unnecessary shadow casting on tiny foliage details.
- Treat bloom, ambient occlusion, depth blur, and other post-processing as optional. The exterior must work without post-processing; add an effect only after visual inspection shows a clear benefit and mobile performance remains acceptable.
- On resize, update the camera aspect/projection and renderer dimensions without restarting the story timeline. On teardown, stop GSAP timelines, remove event listeners, dispose renderer-owned resources, and release GPU resources created by the scene.

### Input, accessibility, and motion

- Use semantic HTML buttons for skip and future action alternatives. A 3D drag affordance must never be the only way to complete an interaction.
- Provide visible keyboard focus, descriptive accessible names, and concise Vietnamese action copy. Announce watering progress through a restrained status region when that milestone is implemented; do not make a screen reader announce every animation frame.
- Support pointer, touch, and keyboard as separately considered input paths. Avoid hover-only instructions, tiny targets, and gestures that require precise dragging on a phone.
- Respect `prefers-reduced-motion`: skip the long intro movement, disable ambient sway, and keep state changes immediate or gently faded. The result must still communicate the scene and destination.
- Keep the canvas decorative to assistive technology when equivalent controls and status are provided in DOM. Do not put essential instructions only in a texture or 3D mesh.
- The future card dialog must have a clear accessible name, move focus into the dialog, keep the close action reachable, respond to Escape, and return focus to its opener.

### Responsive behavior and fallback

- Use a stable design for both landscape desktop and portrait mobile; do not merely shrink the desktop camera view until objects become unreadable.
- Reframe the camera target/FOV for narrow viewports so the house remains the subject and the upstairs window stays visible. Keep HTML controls inside safe-area insets and out of the window/flower focal area.
- Keep the intro skip available while the camera moves. Resize and orientation changes must not reset, replay, or strand the camera midway through its timeline.
- If WebGL context creation fails, show a short, friendly Vietnamese fallback and keep any available non-3D title or message readable. Do not leave a blank page or a permanently disabled loading state.

### Dependency and deployment boundaries

- Keep the app static and client-side for these milestones. No backend, analytics, account system, or remote asset dependency is required.
- Preserve the existing Vercel project link and `.vercel` metadata. Set the local build output to `dist` and verify it locally; do not deploy as part of these milestones.
- Preserve the existing untracked `.gitignore` entry. Add only the ignore rules required by Vite/TypeScript and do not overwrite unrelated user changes.

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

For visual review, inspect the actual render rather than judging source geometry alone. At minimum, capture the establishing frame and the final window-arrival frame at desktop and narrow portrait sizes. Check the silhouette and focal hierarchy first, then material separation and lighting, then motion and controls. Inspect once with normal motion and once with reduced motion. At future milestones, also inspect the bedroom settled frame, watering start/stop behavior, bloom completion, card activation, and dialog focus behavior as applicable.

Use the repository's actual type-check and build scripts. If a check cannot be run because a dependency, browser, or WebGL context is unavailable, mark it `NOT_RUN` and state the blocker; do not substitute a source-level guess. Do not add an automated test framework solely for Milestone 1. Add focused automated checks when a later interaction introduces state transitions that need regression coverage.

## Content and personalization

- Keep the project title, Vietnamese controls, watering instruction, and fallback copy in one clear content location or UI module rather than spreading strings through scene builders.
- Keep the recipient name and final greeting separate from scene geometry and animation. The message must be editable without rebuilding the house, plant, or camera choreography.
- Do not invent the recipient's name, relationship details, shared memories, or sender identity. Until supplied, use clearly marked neutral defaults that are easy to replace before delivery.
- Use Vietnamese for visitor-facing instructions and the final greeting. The internal project title may remain *A Little Garden for You*.

## Delivery expectations

The complete gift should start directly in the browser with no setup screen, account, or technical knowledge required from the recipient. It should communicate the next action at each story beat, allow the intro to be skipped, remain usable on a phone, and make the final message the emotional focus. The implementation is finished only when the visual sequence, interaction, responsive presentation, and personalization path all work together; a successful build alone is not enough.

## Out of scope for Milestone 1

- Building the bedroom interior or moving the camera through the window.
- Watering can manipulation, the five-second watering state, flower growth, and card reveal.
- Final personal greeting copy, audio, analytics, authentication, or backend services.
- Publishing or deploying the site.

## Milestone 3 watering-time decision

Resolved by the user on 2026-10-20: **preserve accumulated valid watering time when input stops or the can moves away from the pot**. Resume from that amount until five valid seconds have accumulated; do not reset progress on a pause. Reloading the page starts a fresh experience.

The user approved both the proposed M3 interaction flow and the detailed [watering design](superpowers/specs/2026-10-20-watering-interaction-design.md). The [implementation plan](superpowers/plans/2026-10-20-watering-interaction.md) is ready for user review and execution-method selection before product-code changes.
