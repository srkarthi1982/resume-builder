# Save & Next Drawer Flow — Proof Checklist (2026-02-27)

## Artifacts
- `resumes-page.png` (captured): base route render proof.

## Checklist
- [x] Added `Save & Next` button beside `Save` in section drawer footer (non-photo sections).
- [x] `Save & Next` runs the same save pipeline as `Save`.
- [x] Navigation order uses one shared constant list: `photo -> basics -> summary -> experience -> education -> skills -> projects -> certifications -> awards -> languages -> highlights -> declaration`.
- [x] Next navigation skips disabled/not-present sections based on enabled sections in project data.
- [x] Last section behavior: `Save & Next` disabled with tooltip `No next section`.
- [x] Save failure/warning behavior: no auto-advance; drawer scoped error/warning remains visible.
- [x] Save and Save & Next disabled while loading.
- [x] Existing drawer close/backdrop contract unchanged.

## Verification Commands
- `npm run typecheck` ✅
- `npm run build` ✅

## Notes / Edge Cases
- Attempted to capture interactive screenshots for "advance to next drawer" and "validation blocks advance" using browser Playwright tool, but Chromium crashed in this environment with `SIGSEGV`, so only base render screenshot was captured this run.
