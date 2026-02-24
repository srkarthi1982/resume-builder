# Print Hint Proof — 2026-02-24

Route tested: `/app/resumes/f53dc2b5-86f0-4157-a4eb-9711fb1556b2/print?preview=1`

Artifacts:
- `print-preview-with-hint.png` (Print/Preview page with visible Print tip banner)
- `print-output-no-hint.pdf` (browser PDF export from the same route)
- `print-output-no-hint-page1.png` (page-1 image extracted from PDF for quick visual check)

Checklist:
- [x] Print/Preview page shows a clear user-facing hint near the heading.
- [x] Hint copy includes: disable browser `Headers and footers` in `More settings`.
- [x] Hint is hidden in printed output/PDF (`@media print { .rb-print-hint { display: none !important; } }`).
- [x] Applies across templates via shared `/app/resumes/[id]/print` wrapper (no template-specific edits).
