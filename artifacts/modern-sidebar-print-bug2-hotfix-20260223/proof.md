# Bug 2 Regression Hotfix Proof — Modern Print Overlay Stacking (Final)

Date: 2026-02-23
Resume ID: `f53dc2b5-86f0-4157-a4eb-9711fb1556b2`
Template: `Modern`
Route: `/app/resumes/f53dc2b5-86f0-4157-a4eb-9711fb1556b2/print?preview=1`

## Artifacts
- `before-photo-hidden.png`
- `after-photo-visible.png`
- `after-print-preview.pdf`
- `after-page2-check.png` (page 2 extraction from updated PDF)

## Final hotfix change
- Kept Modern-only, print-only overlay rule.
- Adjusted overlay layering to avoid covering top profile/header while retaining page-2 continuity:
  - `.rb-modern-print-root::before { z-index: -1; }`
  - `.rb-modern-print-root > * { position: relative; z-index: 1; }`
  - `.av-resume-print-main > .av-container > .av-resume-standard { position: relative; z-index: 2; }`
- `pointer-events: none` retained on overlay.

## Checklist
- [x] Photo/header visible on page 1 after fix.
- [x] Sidebar continuity retained on page 2+.
- [x] No seam/misalignment observed in updated screenshot/PDF.
- [x] Scope remains Modern-only + print-only.
- [x] `npm run typecheck` pass.
- [x] `npm run build` pass.

## Continuity metric (page 2)
- Left 5% luminance from updated PDF page 2: `146.36` (dark sidebar present).
