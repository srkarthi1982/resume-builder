# Resume Builder – Pages Specification (Layout Only, No Actions)

This document defines all Astro pages needed for the Resume Builder mini-app, without any actions, Alpine stores, or DB logic. Pages use static data only with Av components and semantic `av-*` classes.

## Pages

1. **Landing Page** – `src/pages/index.astro`
   - AppShell wrapper with marketing hero, problem cards, steps, templates grid, differentiators, testimonials, FAQ, and final CTA.
   - Uses `AvTemplateGrid` fed by static `templates` array.

2. **Resumes Dashboard** – `src/pages/app/resumes/index.astro`
   - AppShell + `AvPageHeader` with primary action.
   - Static `resumes` array rendered via `AvResumeCard`; fallback `AvEmptyState` when empty.

3. **New Resume Editor** – `src/pages/app/resume/new.astro`
   - AppShell + `AvPageHeader` + `AvToolbar`.
   - `AvResumeEditorShell` with sidebar `AvResumeSectionList` and `AvResumeSectionFormShell` examples; preview uses `AvCard` with dummy resume content.

4. **Existing Resume Editor** – `src/pages/app/resume/[id].astro`
   - Similar shell as new page but with filled static data, highlighted Work Experience, `AvItemList`, and preview including skills via `AvChipList`.

5. **Resume PDF Preview** – `src/pages/app/resume/[id]/pdf.astro`
   - Standalone HTML without `AppShell`; uses semantic `av-resume-pdf` classes for header, summary, experience, education, skills, and links.

6. **Templates Gallery (Optional)** – `src/pages/templates/index.astro`
   - AppShell + `AvPageHeader` and `AvTemplateGrid` using the same static templates array.

### Important Notes
- Static data only; no actions, fetch calls, Alpine stores, or database logic.
- Use Av components and semantic `av-*` classes; avoid Tailwind utilities.
- Keep CTA links pointing to `/app/resume/new` or template-specific URLs.
