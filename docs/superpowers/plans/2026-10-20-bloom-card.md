# M4 execution note

User instruction: “Bắt đầu luôn M4 đi. Nhanh tôi vội lắm rồi”. Execute the
already specified M4 in PROJECT_SPEC, locally from M3 HEAD `6d63957` on
`codex/bloom-card`. This note is not a separately approved new design.

Ruling: the user's direct instruction to start immediately takes precedence
over skill requests for additional approval rounds. Reuse the existing M4
product requirements; do not claim approval of artifacts not yet presented.
Use root implementation and the personal policy's two final independent reviews.
The clean main checkout is used to keep the user's preview and source together;
the M3 branch and detached audit worktree remain intact. No remote action.

## Concrete scope

Five modeled tulips: curved stems, shaped leaves, cup buds and separately opening
petals in dusty rose/cream. About 4.4 seconds, staggered stems → buds → petals →
ivory paper card. Reduced motion presents the finished arrangement immediately.
Keep accepted room/camera/GLBs unchanged. No particles, post-processing or new
dependency. Readable native card button mirrors canvas picking. A native modal
dialog shows editable Vietnamese text, handles Escape/close and restores focus.
At the time this plan was written, the sender had not yet supplied personal
text. **Superseded by the 2026-10-20 user amendment in `docs/PROJECT_SPEC.md`:**
the sender has supplied personal text in `src/content/gift-message.ts`; preserve
its exact salutation and four paragraphs.

## Implementation and evidence

1. Write focused failing browser checks for view, UI, one-shot handoff and app.
2. Build reusable petal/leaf/stem geometry, card surface and owned disposal.
3. Add semantic card controls/dialog and coordinator; integrate after watering
   completion in the existing RAF, preserving room retry, resize and teardown.
4. Run focused M4 checks, affected M3/M2 experience regressions, strict typecheck
   and build. Inspect actual desktop/portrait, normal/reduced and dialog renders.
5. Freeze source; two independent read-only Luna/high reviewers on that revision.
   Correct supported findings and repeat affected verification/reviews. Save
   results and handoff, update existing preview4176. No merge/push/deploy.

Risks: stems/petals/card must fit the existing portrait frame and avoid the can;
the new handoff intentionally replaces M3's terminal status/panel. Update only
experience expectations for that documented change. Dispose owned geometry,
materials/texture/listeners once before GLB disposal; restore the seedling.
Hidden pages pause bloom time. Resize does not restart it. A live reduced-motion
change finishes presentation without replay or auto-opening the dialog.
