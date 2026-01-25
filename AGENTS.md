⚠️ Mandatory: AI agents must read this file before writing or modifying any code in the resume-builder repo.

# AGENTS.md
## Resume Builder Repo – Session Notes (Codex)

This file records what was built/changed so far for the resume-builder repo. Read first.

---

## 1. Current Architecture (Resume Builder)

- Resume Builder mini-app baseline aligned to Ansiversa standards.
- Auth handled by parent app JWT; middleware enforces auth.
- Shared layouts: `AppShell.astro` and `AppAdminShell.astro`.
- Notification unread count fetched in AppShell via parent API (SSR).
- One global Alpine store per app pattern.
 - Includes Example Items CRUD (user + admin) and a minimal baseline landing.

---

## 2. Example Module (Deletable)

Example Items module is used to demonstrate CRUD + admin patterns:

- Module root: `src/modules/example-items/`
- Routes:
  - `/items`
  - `/items/[id]`
  - `/admin/items`

Delete this module and the routes when starting a real app.

---

## 3. DB Tables

Defined in `db/tables.ts`:

- `ExampleItem`

---

## 4. Resume Templates

- Templates are provided by `@ansiversa/components` via `ResumeBuilderShell`.
- Preview route: `/dev/resume-preview` (`src/pages/dev/resume-preview.astro`).
- Auth guard redirect lives in `src/middleware.ts` (login redirect when unauthenticated).
- `/dev/*` routes are intended for development/QA only and are not meant for production access.

To add a 5th template later:

1) Add the new template type + renderer in `@ansiversa/components`.
2) Extend the `types` array in `src/pages/dev/resume-preview.astro`.
3) Ensure any new data requirements are covered by `resumeData`.

---

## 5. Task Log (Newest first)

- 2026-01-25 Replaced features grid with timeline section and added hero CTA spacing on landing page.
- 2026-01-25 Rebuilt / landing page with hero, templates, features, how-it-works, and final CTA using Av components + local CSS; tested with `npm run typecheck` and `npm run build --remote`.
- 2026-01-25 End-to-end verification (local): web webhook returned 204 and Dashboard row inserted for appId resume-builder using file-based remote DB.
- 2026-01-25 Parent web webhook endpoint added for resume-builder activity; end-to-end verification still pending (needs live webhook response + dashboard row check).
- 2026-01-25 Added dashboard push + summary v1 for resume-builder (events: resume create/update/delete/default set, section upsert/toggle, item create/update/delete). Summary fields: version, totalResumes, defaultResumeTitle, lastUpdatedAt, templatesUsed, sectionsEnabledCount, completionHint. Test: create/update/delete resume, toggle a section, add/update/delete an item; confirm parent webhook `/api/webhooks/resume-builder-activity.json` returns 204/200 and dashboard row updates; run `npm run typecheck` + `npm run build --remote`.
- 2026-01-25 Updated db seed to use Astro DB table imports and Date timestamps for typecheck compatibility.
- 2026-01-23 Seeded four realistic demo resumes (classic/modern/minimal/timeline) directly into local DB for dev-user.
- 2026-01-23 Classic template divider changed to border for print visibility; installed @ansiversa/components 0.0.116 (local pack).
- 2026-01-23 Classic template print divider line forced visible; installed @ansiversa/components 0.0.115 (local pack).
- 2026-01-23 Classic template PDF: forced sidebar column layout in print; installed @ansiversa/components 0.0.114 (local pack).
- 2026-01-23 Classic template contact list: removed separator dots; installed @ansiversa/components 0.0.113 (local pack).
- 2026-01-23 Classic template summary now spans full width; installed @ansiversa/components 0.0.112 (local pack).
- 2026-01-23 Seeded classic template data for dev-user in local Astro DB.
- 2026-01-23 Classic template polish: inline contact row with separators + friendly URL labels; ran `npm run typecheck` and `npm run build --remote`.
- 2026-01-23 Added editable declaration section and installed @ansiversa/components 0.0.110 (local pack).
- 2026-01-23 Increased live preview iframe height.
- 2026-01-23 Installed @ansiversa/components 0.0.109 (local pack) for Classic achievements section.
- 2026-01-23 Installed @ansiversa/components 0.0.108 (local pack) to pick up Classic certifications section.
- 2026-01-23 Reduced print page side padding to 8px.
- 2026-01-23 Tightened print page side gutters to bring the resume card closer to the edges.
- 2026-01-23 Made print toolbar banner full-bleed by removing side padding and radius.
- 2026-01-23 Reduced print page side gutters by widening resume content wrapper.
- 2026-01-23 Bumped @ansiversa/components dependency to 0.0.107 for resume template Tailwind source fix.
- 2026-01-23 Wrapped print resume content in AvContainer to keep it centered.
- 2026-01-23 Added top margin to the print/preview toolbar surface for spacing.
- 2026-01-23 Added a dark toolbar surface on resume print/preview for button contrast.
- 2026-01-23 Made preview iframe use store-derived previewSrc and ensured preview buster always changes.
- 2026-01-23 Set light-theme CSS variables on resume print preview page to fix low-contrast text on white background.
- 2026-01-23 Fixed resume list Edit/Preview buttons to render as anchors so Alpine can bind hrefs.
- 2026-01-22 Standardized db push to single `db:push` script using file-based remote mode; removed local/remote split scripts.
- 2026-01-22 Removed admin leftovers (AppAdminShell, middleware guard, requireAdmin), added default reassignment on delete, standardized db push script. Ran `npm run typecheck` and `npm run build --remote`.
- 2026-01-22 Ran `npm run db:push:remote` after backing up `.astro/content.db` to `.astro/content.db.bak-2026-01-22-2139` to initialize Resume tables.
- 2026-01-22 Updated `db:push:local` to use local mode and added `db:push:remote` script.
- 2026-01-22 Built resume-builder user flow: Resume tables/actions/store, /app/resumes list/editor/print pages, removed example module/admin pages, updated home copy. Ran `npm run typecheck`.
- 2026-01-20 Clarified dev auth bypass and dev-only routes in AGENTS.
- 2026-01-20 Restored resume templates preview page and upgraded @ansiversa/components to 0.0.106.
- 2026-01-20 Updated identifiers from app-starter to resume-builder.
- 2026-01-20 Reset resume-builder to a fresh copy of app-starter after backup.
- 2026-01-17 Expanded README with mental model, first-run checklist, and standards framing.
- 2026-01-17 Added DEV_BYPASS_AUTH env defaults to enable local dummy session.
- 2026-01-17 Expanded public routes/static allowlist and simplified admin role check in middleware.
- 2026-01-17 Added DEV_BYPASS_AUTH dummy session injection for community development.
- 2026-01-17 Added freeze note to README and AGENTS (Starter Freeze Jan-17-2026).
- 2026-01-17 Fixed typecheck errors by tightening auth guard typing and SSR items typing.
- 2026-01-17 Updated admin items description and README command list for current scripts.
- 2026-01-17 Removed unused user sort branches and required cookie domain in prod.
- 2026-01-17 Aligned env typing and admin items copy with standards; enforced prod session secret check.
- 2026-01-17 Rebuilt admin landing to match web layout with a single Items card.
- 2026-01-17 Switched dev/build to persistent local DB using file-based remote mode; added db push script.
- 2026-01-17 Set admin items pagination to 10 per page.
- 2026-01-17 Tightened /items breadcrumb spacing using existing crumb styles.
- 2026-01-17 Added breadcrumb to /items SSR page.
- 2026-01-17 Made /items page read-only SSR list (removed create/update/delete UI).
- 2026-01-17 Exported adminCreateItem action to fix admin item creation.
- 2026-01-17 Added admin items create/edit drawer, user-name display, and per-user filtering to mirror roles page behavior.
- 2026-01-17 Added sorting and toolbar actions on admin items to match roles page.
- 2026-01-17 Aligned admin items page layout with web roles pattern (toolbar, empty state, pager, confirm dialog).
- 2026-01-17 Switched local dev/build scripts to non-remote Astro DB; added remote scripts.
- 2026-01-17 Verified local Astro DB via shell; created ExampleItem table and inserted a test row.
- 2026-01-17 Removed remote Astro DB credentials to use local DB defaults.
- 2026-01-16 App-starter rebuilt from quiz golden base; example CRUD module added; README/AGENTS updated.
- 2026-01-16 AppShell now calls local notification proxy; env docs updated with PARENT_APP_URL and auth secret note.
