# Bug 6 (Revised) Proof — Experience Row Hierarchy

Route tested: `/app/resumes/f53dc2b5-86f0-4157-a4eb-9711fb1556b2`

Section tested: `Experience` drawer list only

Artifacts:
- `before-experience-text-actions.png`
- `after-experience-icon-actions.png`

Checklist:
- [x] Experience title is plain content text (no pill/button style, no hover treatment).
- [x] Edit action is icon-only (`edit`) with accessible label.
- [x] Delete action is icon-only (`trash`) with accessible label.
- [x] Add experience uses plus icon + text (`Add experience`) for clarity.
- [x] Layout remains title left, actions right.
- [x] No changes to other section drawers or template rendering.
- [x] `npm run typecheck` passed.
- [x] `npm run build` passed.
