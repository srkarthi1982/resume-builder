# App Spec: resume-builder

## 1) App Overview
- **App Name:** Resume Builder
- **Category:** Career / Documents
- **Version:** V1
- **App Type:** Hybrid
- **Purpose:** Help an authenticated user create resumes from structured sections, choose templates, preview/print output, and manage resume-specific assets such as profile photos.
- **Primary User:** A single signed-in user building personal resumes.

## 2) User Stories
- As a user, I want to create a resume project and choose a template, so that I can start from a structured resume layout.
- As a user, I want to edit section content such as basics, summary, experience, education, and skills, so that the final resume matches my current profile.
- As a user, I want print/preview output and saved projects, so that I can reuse and export my resumes later.

## 3) Core Workflow
1. User signs in and opens `/app/resumes`.
2. User creates a resume project and chooses a template.
3. User opens `/app/resumes/[id]` and edits structured sections through drawer-based forms.
4. User previews and prints the generated resume output from the saved project state.
5. User can bookmark saved resumes and return later to continue editing.

## 4) Functional Behavior
- Resume Builder persists projects, sections, items, bookmarks, and FAQs in Astro DB per authenticated user.
- The editor is section-based, with ordered/default sections such as basics, summary, experience, education, skills, projects, certifications, awards, languages, highlights, and declaration.
- Print/preview output is generated from persisted resume content rather than an unsaved temporary draft only.
- Profile photo upload is supported via the repo’s media upload route and stored on the project record.
- Current implementation includes AI suggestions for the summary field and Pro template gating for premium templates.
- The app supports bookmarks and parent integration hooks while keeping auth, billing, and notifications parent-owned.

## 5) Data & Storage
- **Storage type:** Astro DB plus uploaded media/print output
- **Main entities:** `ResumeProject`, `ResumeSection`, `ResumeItem`, `Bookmark`, `Faq`
- **Persistence expectations:** Resume projects persist per authenticated user and drive both the editor and print/preview surfaces.
- **User model:** Single-user ownership of each resume project

## 6) Special Logic (Optional)
- Default sections are created in a fixed order and then managed through section/item editing flows.
- Field cleaners and validators normalize emails, URLs, date/year values, and text limits before save.
- AI suggestions are scoped to the summary field rather than acting as a general autonomous resume writer.

## 7) Edge Cases & Error Handling
- Invalid ownership: Project, section, and item mutations should reject non-owned IDs.
- Invalid URLs/emails/text limits: Field validation should fail clearly before saving malformed data.
- Premium template access: Pro-only templates should return a truthful gate for unpaid users.
- Print output: Browser print settings can affect final rendering, so user guidance remains relevant even when project data is valid.

## 8) Tester Verification Guide
### Core flow tests
- [ ] Create a resume, edit multiple sections, and confirm the preview updates from saved content.
- [ ] Upload a photo and confirm it persists on the project and appears where supported.
- [ ] Open the print/preview route and confirm the output reflects the current saved project data.

### Safety tests
- [ ] Enter invalid email or URL values and confirm the app rejects them clearly.
- [ ] Attempt to use a Pro-only template as a free user and confirm the gate is truthful.
- [ ] If summary AI suggestions are enabled, confirm they stay scoped to the summary field and do not alter unrelated resume sections implicitly.

### Negative tests
- [ ] Confirm Resume Builder does not own standalone auth or billing in this repo.
- [ ] Confirm print output derives from saved resume state rather than unsaved local-only editor state.

## 9) Out of Scope (V1)
- Collaborative editing
- Resume submission tracking
- Broad autonomous AI rewriting across all sections
- Standalone billing implementation inside the mini-app

## 10) Freeze Notes
- V1 freeze: this document reflects the current structured resume editor, media support, and print/preview workflow.
- Browser QA should still verify drawer editing, print preview, and media upload because those are runtime-sensitive surfaces.
- During freeze, only verification fixes, cleanup, and documentation updates are allowed.
