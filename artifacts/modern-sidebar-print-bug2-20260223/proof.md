# Bug 2 Proof — Modern Print Sidebar Continuity

Date: 2026-02-23
Resume ID: `f53dc2b5-86f0-4157-a4eb-9711fb1556b2`
Template: `Modern`
Route tested: `/app/resumes/f53dc2b5-86f0-4157-a4eb-9711fb1556b2/print?preview=1`

## Artifacts
- `before-print-preview.png` (page 2 extraction from before PDF)
- `after-print-preview.png` (page 2 extraction from after PDF)
- `after-print-preview.pdf`
- Supporting full-page captures:
  - `before-print-fullpage.png`
  - `after-print-fullpage.png`
  - `before-print-preview.pdf`

## Checklist
- [x] Modern 2+ page resume tested (3 pages).
- [x] Page 1 and page 2+ keep left dark sidebar background in print/PDF output after fix.
- [x] Content remains readable and aligned (no right-column overlap observed in after full-page preview/PDF).
- [x] Chrome print/PDF path tested via Playwright Chromium `pdf` export.
- [x] Scope lock maintained (Modern print route local renderer only).

## Verification Notes
- Before vs after page-2 left-edge luminance check (lower is darker):
  - Before `left5%` avg luminance: `231.05` (near white)
  - After  `left5%` avg luminance: `146.36` (dark sidebar repaint active)
- Typecheck/build:
  - `npm run typecheck` ✅
  - `npm run build` ✅
