# Milestone 2 — Bedroom reveal

**Status:** Approved by the user on 2026-10-20; implementation planning authorized.

**Date:** 2026-10-20

**Project:** `D:\Z_PROJECT\20_10`

**Baseline:** `93244d0e23b921f3f44293b5b5b65b1885fa5d17` on `codex/blender-exterior`.

## Intent and authorization

The user accepted the Milestone 1 exterior and asked to continue after its handoff was pushed. The next scope is Milestone 2 in `docs/PROJECT_SPEC.md`: reveal a cozy bedroom, establish the desk and plant as the next focus, and continue the visual story from the upstairs window.

The existing specification supplies the product intent, palette, furniture list, camera continuity requirement, accessibility rules, and milestone boundaries. This approved addendum defines the concrete interior composition, asset pipeline, transition, and failure behavior for that scope. It extends the earlier house/tree Blender permission to the bedroom.

The room should have the same modeled finish as the accepted exterior. Its furniture needs softened edges, layered silhouettes, quiet surface detail, and believable material differences. A room made from exposed primitive boxes is insufficient.

## Scope and endpoint

Include the bedroom shell, window, curtains, bed, desk, chair, small shelf, lamp, rug, a restrained decoration group, desk pot with a small plant, and a watering can as a visible prop. Include the exterior-to-bedroom reveal, a short room view, and a smooth settling move toward the desk.

The final frame presents the entire pot, the can's handle and spout, and room context. This establishes where the next interaction will happen. M2 ends in `Desk settled`; it does not claim that watering works.

Watering input, water particles, the five-second timer, animated tulip growth, greeting card, dialog, personal message, audio, deployment, and changes to the linked Vercel project remain later scopes. The pause/reset watering decision is still open for M3 and does not block this reveal.

## Approaches considered

| Approach | Benefit | Cost |
|---|---|---|
| Reauthor the exterior window into animated casements and travel through it into a physically fitted room | A literal continuous passage | Changes the accepted exterior asset and must handle its static glazing, center stile, curtain meshes, and room-shadow backing, including the procedural fallback |
| Use a curtain-covered handoff between matched exterior and interior views | Preserves the accepted exterior composition; the project spec explicitly permits a hidden eased handoff | Requires careful matching of window proportions, light, movement direction, and the fully covered switch |
| Cut directly to an independent room shot | Simple integration | An exposed cut would interrupt the guided story and fail the continuity requirement |

**Approved choice:** the curtain-covered handoff. It must feel like entering the same room. Use an opaque, warm linen veil only during the concealed switch; no camera passage through visible solid geometry, black loading interstitial, or exposed camera teleport.

## Visual composition

### Visual review correction

After the first M2 render, the user requested more detail and realism and
selected “Gần đời thật, vẫn ấm áp” on 2026-10-20. For the M2 interior,
favor believable cloth volume/folds, joinery, plant shapes, wood/ceramic/
painted-metal surface response and daylight depth over toy-like shapes.
The warm palette and cutaway story composition remain the setting. Refine
the existing local Blender/PBR pipeline with normal/roughness maps and
static baked contact occlusion; keep movable props from baking persistent
contact shadows onto the desk. The existing asset caps, packed resources,
motion/accessibility behavior, and M2 endpoint remain in force.

The user's subsequent visual feedback asks for a prettier planter with a
more suitable desk silhouette, a different wall color with a clean finish,
and a more attractive floor color. Use a low rounded butter-yellow glazed
planter with a cream rim/saucer and small rose flower motifs, very pale
mist-blue upper walls, lighter sage paneling and neutral blond oak boards.
Reduce wall mottling and broad baked darkening. The new interior palette
replaces the earlier terracotta-pot/ivory-wall shorthand for this revision.
The user also rejected the rose quilt color; use milk-cream bedding with
the sage throw. Keep the planter glaze smooth, with restrained relief.
The user then requested a new watering-can design. Use a compact oval
pastel-blue enamel body, one slender swept handle, a fine long spout and
small brass rim/rose details. Keep the pot/can silhouettes separate.
The desk finish remains pale oak as specified below: use a lighter,
less red honey/blond finish for the furniture wood.

### Room view

Use a compact dollhouse cutaway room with a clean mist-blue upper wall, light sage lower paneling, slim painted skirting, and a neutral blond oak floor. Remove the camera-facing wall from the composition rather than allowing the camera to enter a solid box. Keep the ceiling open in the cutaway view so it does not obscure the desk or darken the room.

Place the double window on the rear wall, slightly to the right in the settled room composition. Match its proportions and ivory trim to the exterior's signature window. Folded linen curtains hang beside the opening; a soft patch of sunlight connects the window to the desk and floor.

The desk sits immediately beside and slightly in front of the window. The window remains visible behind or beside it in the room view. The desk's front edge, a tucked-in chair, and the pot form the principal foreground group. The chair must not block the plant or can.

Put a compact bed along the left wall, receding toward the back of the scene. Use an upholstered or curved painted headboard, an ivory mattress edge, a milk-cream quilt with a folded sage throw, and two plump pillows. Model the bedding with rounded volume and gentle seam/fold detail rather than flat stacked slabs.

A rounded rug sits between the bed and desk. Place one small shelf above or behind the bed with a few books and one neutral framed botanical picture. A small plush or fabric cushion may add a personal touch; avoid readable names, photographs, invented memories, and an inventory of unrelated props.

### Desk view

Use a pale oak desktop with beveled edges, visible thickness, slim drawer fronts, restrained joinery, and a curved or softly tapered leg profile. A small lamp contributes a warm pool of light from a side corner. Two or three closed books or a notebook may support the setting without occupying the plant's clear space.

Place the rounded butter-yellow glazed pot in the brightest, least cluttered part of the surface. Include a cream rim and saucer, small rose flower motifs, wall thickness, dark soil, and a modest leafy seedling. The plant is a resting pre-bloom state: no tulips or greeting card appear yet.

Place a compact oval pastel-blue watering can to the pot's right, separated enough that both silhouettes are visible. Include one slender swept handle, a fine long angled spout, an open filling rim, restrained brass details and soft satin highlights. Its spout should suggest its purpose without appearing to pour water. The can and pot need separate scene nodes for M3 to animate them later.

Reserve empty space above and around the pot for the eventual flower-and-card composition. Do not build those future objects now.

### Materials and light

Use the main specification's ivory, oak/oat beige, sage, dusty rose, terracotta, and restrained gold palette. The desk is warmer than the floor; the pot is more saturated than the walls; the can has a soft highlight distinct from matte fabric.

Give textiles low-contrast weave and shaped folds, oak a quiet grain, ceramic a slightly uneven profile, and paper/book edges restrained detail. Avoid large noisy textures, broad plastic gloss, or flat unlit materials.

Preserve the exterior's afternoon light direction in the window and room. Use a soft warm key and gentle fill, with one small practical lamp. Do not solve a dark interior by overexposing ivory surfaces. Additional shadow-casting lights and post-processing require a measured reason; the first version should work using the existing single-renderer pipeline.

## Camera and transition

### Normal motion

1. Preserve the existing exterior establishing view and six-second approach. The camera still reaches the established window-arrival pose.
2. Hold at that pose briefly, then advance slightly toward the same window while a curtain-colored veil eases over the image. Do not advance far enough to visibly intersect the glass, center stile, or wall. The room asset must already be usable before this phase starts.
3. At full cover, switch the active scene group, environment/light settings, and camera to the matched interior entry pose. The entry pose uses the same window landmark and warm light impression. Remove the veil into a gentle room reveal, continuing the same visual direction and easing.
4. Let the room composition read briefly. Glide toward the desk and settle on the pot and can without snapping, rolling the camera, or sweeping through furniture.
5. Stop motion in `Desk settled`. No free orbit is introduced.

A starting timing target is about 1.5 seconds for the covered handoff, a one-second room hold, and a three-second desk settle. These are tuning values; visible continuity and readability are the acceptance conditions.

The veil is a presentation element, not a loading screen. It has no focusable content and does not block the skip control. It must be removed on completion, failure, or teardown.

### Skip and reduced motion

The existing semantic `Bỏ qua phần mở đầu` button remains usable throughout the reveal. With M2 available, skipping the introduction now selects the final desk pose, including when requested before assets finish loading. This change is explicit: the complete introduction now includes entry into the bedroom.

Repeated skip requests are harmless. If the room is unavailable, skip selects the usable exterior arrival pose instead. The final status describes the scene actually visible. Do not announce room success before the room is ready.

For `prefers-reduced-motion`, show the desk pose once the room is ready, without long travel, curtain sweep, ambient sway, or a forced room tour. Keep the status and composition sufficient to understand the setting. Respond safely if the preference changes while a camera timeline is active.

### Responsive framing

Provide separate room and desk framing for landscape and narrow portrait screens. In portrait, allow peripheral decor to leave the frame while retaining the full pot, can, and the window or another clear room landmark. Do not use a very wide lens simply to squeeze every prop into the screen.

Reserve space for the title/status and skip control. Recompute camera framing from the current story phase and normalized progress during resize or orientation changes; resizing must not replay the intro, change phase, or strand the veil at partial opacity.

## Asset pipeline

Author a new room asset in Blender using the established local authoring setup. Keep a separate source and export so M2 can be iterated without rebuilding the approved exterior.

Asset files:

- `assets/blender/create-bedroom.py` — reproducible room authoring/export script.
- `assets/blender/bedroom.blend` — editable source.
- `public/models/bedroom.glb` — packed local runtime asset.
- `assets/blender/README.md` — room rebuild, axis, node, and resource documentation.

Use Y-up and a clearly documented room-local coordinate system. The room may occupy a separate scene group because its switch is concealed; literal world-space placement inside the existing house is not required. The entrance/window landmark must still match visually.

Keep these independently addressable nodes: `bedroom`, `room_shell`, `desk`, `plant_pot`, `plant_rest`, `watering_can`, `curtain_left`, and `curtain_right`. Include empty anchors for `window_anchor`, `room_target`, `desk_target`, and `pot_target`. The builder must document whether each node is a transform root or a mesh; names and required types should be validated consistently.

Merge static repetitions by material where possible. Keep the pot, can, and curtains separate from those merges so later animation does not require reconstructing the asset. Exclude source preview cameras and lamps from the exported GLB; Three.js owns runtime camera and lighting.

Serve all geometry and textures locally, packed into the GLB. Do not introduce remote assets, downloaded models with unclear provenance, new runtime dependencies, texture compression extensions requiring a new external decoder, or a font CDN.

Approved room budget: no more than 60,000 triangles, 50 mesh primitives, and 6 MB for the packed asset. These are implementation limits, not measured performance claims. Inspect the exported counts and render cost before accepting additional detail. Physical-phone smoothness cannot be inferred from these counts or a portrait desktop viewport.

## Runtime responsibilities

- `src/scene/assets/load-bedroom-model.ts` loads and validates the local room asset. Use the existing loader's cancellation, packed-resource validation, deadline, and disposal principles. Extract common loading code only if needed by these two concrete callers.
- `src/scene/interior/build-bedroom.ts` owns the imported room assembly, named animation targets, camera framing anchors, and room-specific lights. It does not bind DOM controls or own the global render loop.
- `src/experience/camera-story.ts` owns the explicit camera phases and timeline. Extend the current small story handle as needed for room/desk phases, skip, resize, reduced motion, and cancellation; avoid parallel independent camera tweens.
- `src/ui/intro-controls.ts` owns the semantic skip/status UI and the noninteractive transition veil. UI callbacks communicate with the experience; UI code does not move furniture meshes.
- `src/main.ts` coordinates asset readiness, scene activation, the single render loop, and teardown. Scene construction and furniture geometry stay outside this file.
- `src/scene/create-scene.ts` continues to own the one renderer/camera and shared environment resources. Any exterior/interior light switch must be explicit and reversible, without leaking lights or creating a second renderer.

The exact module names may follow existing repository patterns. Do not add empty M3/M4 modules, a general state-machine library, or a generic asset framework.

## States, loading, and failure

Use explicit experience phases equivalent to `Loading`, `Exterior intro`, `Window arrival`, `Bedroom reveal`, and `Desk settled`, plus the recoverable room-unavailable state. Asset readiness is separate from camera progress.

Start the room request early enough to overlap with exterior loading/intro. Room failure must not delay or discard a usable exterior. If the camera arrives before room loading completes, hold outside the window with a short truthful Vietnamese status. Keep skip usable while waiting.

Apply a bounded load/decode deadline including asynchronous parsing, as the exterior loader does. Missing files, malformed bytes, invalid required nodes, or timeout keep the exterior visible at arrival. Show a concise message and a retry action for the room. Retry creates one fresh request and cannot start duplicate timelines; it must not replay the exterior intro.

Do not switch to the bedroom until it is validated and the veil fully covers the handoff. Any room result that arrives after cancellation or teardown must be disposed instead of attached. If there is an error after an attempted transition, restore a usable exterior view and clear the veil and its animation.

Teardown aborts outstanding requests, kills camera/curtain/veil tweens, removes listeners and DOM elements, and releases room/exterior/environment resources without double-disposing shared materials or image bitmaps. Preserve the existing early-skip and delayed-parse protections.

## Visitor-facing copy

Keep Vietnamese status and controls in the UI/content layer. Suggested story copy is short and neutral:

- Exterior arrival while the room is loading: `Một chút nữa, căn phòng đang đón nắng…`
- Entering: `Ghé vào một góc nhỏ đầy nắng…`
- Desk settled: `Một chiếc bình tưới đang chờ cạnh chậu cây.`
- Room unavailable: `Căn phòng chưa mở được. Mình thử lại nhé.`
- Retry control: `Thử mở căn phòng lại`.

Do not show watering progress or instructions promising an implemented drag/hold interaction in this milestone. The visible can, plant, and final camera focus establish the next action without a nonfunctional watering button.

## Verification and review

Run the repository's type check and production build. For visual inspection, capture the accepted exterior starting view, exterior arrival, revealed room, and final desk at desktop and narrow portrait sizes. Inspect the actual rendered output for furniture finish, material separation, light, plant/can silhouette, and interface overlap.

Inspect the transition as a sequence, including frames around full cover, to detect visible geometry intersections or exposed scene switches. Exercise normal progression, early/late/repeated keyboard skip, resize during each reveal phase, and reduced motion. Check the browser console and requests for runtime errors and external dependencies.

Exercise missing/malformed room data, missing required anchors, delayed loading, deadline expiry, retry, teardown during loading and during reveal, and the existing WebGL fallback. Regression coverage should target new state transitions and cancellation behavior using applicable tooling; do not add a general test framework solely for this milestone.

Freeze the resulting source/assets for two independent read-only GPT reviews under the user's policy. Bind command results and reviews to the actual revision or file manifest checked. Report each check as `PASS`, `FAIL`, or `NOT_RUN`, with any remaining limitations. Existing M1 measurements and reviews do not prove M2 behavior.

Known baseline limitations are the desktop shader precision warning X4122, the JavaScript chunk-size warning, and unmeasured physical-phone performance. Record whether they persist; do not silently mark the console warning-free or claim mobile performance from a headless capture.

## Acceptance conditions

1. The room reads as a cared-for bedroom in the first settled interior view. Bed, shelf, rug, curtains, and lamp provide context; the desk is the main focus.
2. Furniture has shaped, softened silhouettes and differentiated materials consistent with the accepted exterior's finish.
3. Exterior arrival and interior entry connect through a fully concealed, eased handoff. There is no visible glass/wall/furniture intersection, unmasked pose jump, flash, or stranded veil.
4. The final desktop and portrait frames show the complete pot and the recognizable watering can with free space above the plant. Window/room context remains visible.
5. Normal motion completes once; skip, reduced motion, resize, retry, and teardown cannot start competing timelines or leave stale UI and scene state.
6. A failed room asset leaves the accepted exterior usable with accurate status and a working room retry.
7. New assets are local, editable, repeatably exportable, validated, and within the approved room resource budget.
8. Source/build/render/behavior/review evidence is recorded for the actual implementation. No watering, bloom, card, personal copy, or deployment is included.

## Next gate

The user approved this written design with “Đồng ý thiết kế”, then approved the implementation plan and sequential execution with “duyệt kế hoạch. Bắt đầu đi” on 2026-10-20. Its composition, Blender extension, transition, scope, and implementation are authorized. Completion still requires the implementation's verification and independent reviews; these approvals do not authorize later milestones or deployment.
