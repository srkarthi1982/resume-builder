# Bug 5 Proof — Drawer Close Behavior (2026-02-24)

Route tested: `/app/resumes/f53dc2b5-86f0-4157-a4eb-9711fb1556b2`

Scope tested: Sections drawer, focused on `Certifications`.

Artifacts:
- `before-open.png` (pre-fix code, Certifications drawer open)
- `before-click-field-stays-open.png` (pre-fix automation run result after Certification field click)
- `after-click-field-stays-open.png` (post-fix, drawer remains open after field interactions)
- `after-backdrop-closes.png` (post-fix, drawer closes when clicking backdrop)
- `before-result.txt`
- `after-result.txt`

Automated result values:
- Pre-fix: `drawerOpenAfterFieldClick=true`
- Post-fix:
  - `drawerOpenAfterInputClicks=true`
  - `drawerOpenAfterPanelClick=true`
  - `drawerOpenAfterBackdropClick=false`

Checklist:
- [x] Clicking Certification/Issuer/Year controls does not close the drawer.
- [x] Clicking inside drawer panel does not close the drawer.
- [x] Clicking backdrop closes the drawer.
- [x] Close button and `Esc` bindings remain intact (unchanged existing handlers).
- [x] Fix applied at shared drawer wrapper level, covering all section drawers.

Notes:
- In this automated environment, the pre-fix run did not reproduce an immediate close on field click (`before-result.txt` confirms open state remained `true`).
- The patch still hardens event boundaries to enforce the intended contract (`backdrop closes`, `panel clicks never close`) across all drawers.
