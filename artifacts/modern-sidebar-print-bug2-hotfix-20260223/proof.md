# Bug 2 Regression Hotfix Proof — Modern Print Overlay Stacking

Date: 2026-02-23
Resume ID: `f53dc2b5-86f0-4157-a4eb-9711fb1556b2`
Template: `Modern`
Route: `/app/resumes/f53dc2b5-86f0-4157-a4eb-9711fb1556b2/print?preview=1`

## Artifacts
- `before-photo-hidden.png`
- `after-photo-visible.png`
- `after-print-preview.pdf`
- `after-page2-check.png` (page 2 extraction from updated PDF)

## Hotfix change
- Replaced `> main` stacking lift with `> *` stacking lift under Modern print root so header/photo + main are above overlay paint layer.
- Kept print-only overlay, width/color, and `pointer-events: none` unchanged.

## Checklist
- [x] Photo/header visible after fix (page 1 screenshot).
- [x] Sidebar continuity retained on page 2+ (PDF page 2 extraction).
- [x] No layout seam/overlap observed in updated screenshot/PDF.
- [x] Scope remains Modern-only + print-only.
- [x] `npm run typecheck` pass.
- [x] `npm run build` pass.

## Continuity metric (page 2)
- Left 5% luminance from updated PDF page 2: `146.36` (dark sidebar present).
