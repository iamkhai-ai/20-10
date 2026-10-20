# Shared Project Guidance

This file is the canonical, tool-neutral guidance for *A Little Garden for You*. `AGENTS.md` and `CLAUDE.md` are lightweight discovery files that point agents here.

## Project purpose

Build a warm, personal 20/10 gift as a browser-based Three.js storybook diorama. The approved product direction and milestone boundaries are in [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md). Read that specification before changing scene structure or adding a milestone.

## Current scope

Implement one milestone at a time. The user accepted the Milestone 1 exterior and approved the Milestone 2 bedroom design on 2026-10-20. Read [`docs/superpowers/specs/2026-10-20-bedroom-reveal-design.md`](docs/superpowers/specs/2026-10-20-bedroom-reveal-design.md) for the current scope: Blender-authored bedroom, concealed window-to-room transition, and camera settling at the desk plant. Implementation awaits review of the M2 plan and selection of its execution method. Watering input, bloom, and card behavior require later approved scopes.

## Technical rules

- Use Vite, strict TypeScript, Three.js, and GSAP. Do not add a UI framework or other runtime dependency without a clear need and approval.
- Keep modules focused: scene setup owns renderer/camera/lights; object builders own their geometry/materials; the experience module owns camera choreography; HTML controls remain semantic DOM.
- Reuse geometry and materials for repeated plants and stones. Avoid per-frame allocations, unbounded shadows, and expensive post-processing without measured need.
- Keep all visible text editable outside low-level mesh builders. Put the final card message in a content module when that milestone starts.
- Support responsive sizing, visible keyboard focus, a keyboard-accessible intro skip, and `prefers-reduced-motion`.
- Provide a clear fallback if WebGL initialization fails.

## Working and verification

- Preserve existing user files and deployment configuration. Never overwrite pre-existing local changes.
- Do not deploy, publish, or change the linked Vercel project as part of local implementation work.
- Before finishing a source change, run the repository's type check and production build. For visual changes, inspect a desktop and narrow mobile preview and check browser console output.
- Report checks as `PASS`, `FAIL`, or `NOT_RUN`; do not describe an unrun check as successful.
- Add or run tests only when the user requests them or an approved scope requires regression coverage.
- Keep the implementation aligned with the accepted specification. If a new requirement conflicts with it, record the conflict and ask before expanding scope.

## Shared instruction files

- Codex reads [`AGENTS.md`](AGENTS.md), which directs it to this file.
- Claude Code reads [`CLAUDE.md`](CLAUDE.md), which imports this file.
- Keep durable project guidance here so both tools use the same source of truth.
