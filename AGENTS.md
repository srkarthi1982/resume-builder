⚠️ Mandatory: AI agents must read this file before writing or modifying any code.

MANDATORY: After completing each task, update this repo’s AGENTS.md Task Log (newest-first) before marking the task done.
This file complements the workspace-level Ansiversa-workspace/AGENTS.md (source of truth). Read workspace first.

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

- 2026-02-08 UI polish pass for `/app/resumes/[id]` and print preview: compacted template selection cards, switched sections chips to single-column mobile stack with responsive two-column enhancement, and moved print/preview header to Ansiversa dark surface with clear CTA contrast. Added reusable `av-resume-*` classes in `src/styles/global.css` and removed remaining raw utility classes/inline styling from impacted pages.
- 2026-02-08 Committed previously pending page cleanups that were left unstaged in an earlier push: `src/pages/index.astro`, `src/pages/app/resumes/index.astro`, `src/pages/app/resumes/[id]/print.astro`, and `src/pages/dev/resume-preview.astro` (Av utility/layout migration; removed page-scoped style blocks).
- 2026-02-08 Form-layer hardening pass (no template/print edits): aligned limits to architect contract (full name 60, job title 80, summary 300, experience summary 400, bullet line 120, project summary 200, declaration 180, skill 30, certification 80), switched basics editor to semantic contact inputs (email/tel + location text + labeled URL list), added input/paste truncation hooks (including per-line bullet clamp), enforced structured date payload shape (`start/end + isPresent` with legacy compatibility), added present/end exclusivity checks, and added non-blocking education overlap warning in store.
- 2026-02-08 Final visual polish sync: upgraded to `@ansiversa/components@0.0.124` to pick up template hierarchy refinements (Classic name/title/contact balance, Minimal header-contact cohesion + declaration placement treatment, Modern sidebar weight tuning, declaration closing hierarchy polish across templates).
- 2026-02-08 Final polish pass (Astra): enforced tighter form constraints and server validation (`src/modules/resume-builder/constraints.ts`, `src/actions/resumeBuilder.ts`) including year floor 1950, current-year max, stricter section limits (summary/declaration/experience/project/bullets), and template-aware Minimal caps (summary 220, bullet line 140) on save.
- 2026-02-08 Output hygiene pass: published `@ansiversa/components@0.0.123`, upgraded dependency in resume-builder, and regenerated print artifacts with bad-input data to verify dedupe/truncation behavior.
- 2026-02-08 Locked `DEV_BYPASS_IS_PAID` to DEV-only middleware branch with strict literal check (`process.env.DEV_BYPASS_IS_PAID === "true"` behind `import.meta.env.DEV`) and added one-time DEV warning when active.
- 2026-02-08 Updated `@ansiversa/components` to `0.0.122` (white-background print contract across all templates) and regenerated PDFs/screenshots under `artifacts/print-fix-20260208-v2/`.
- 2026-02-08 Added DEV-only paid bypass support in middleware via `DEV_BYPASS_IS_PAID=true` to allow local generation of Pro template print artifacts for verification.
- 2026-02-08 Updated `@ansiversa/components` to `0.0.121` (print-quality template fixes from components repo), regenerated print artifacts from local seeded data, and exported template PDFs/screenshots to `artifacts/print-fix-20260208/` for Astra visual QA.
- 2026-02-08 Enforced Ansiversa Standard B: removed all app-level custom CSS (`<style>` blocks and `rb-*` classes) across `src/pages/index.astro`, `src/pages/app/resumes/index.astro`, `src/pages/app/resumes/[id].astro`, `src/pages/app/resumes/[id]/print.astro`, and `src/pages/dev/resume-preview.astro`; added shared constraints in `src/modules/resume-builder/constraints.ts`; added UI `maxlength` + live counters + year/month selectors; added server-side payload validation and chronology checks in `src/actions/resumeBuilder.ts`.
- 2026-02-08 Freeze hardening: removed `/admin/session`, gated `/dev/resume-preview` to DEV only, narrowed middleware public routes to existing pages (`/`, `/help`), touched project `updatedAt` on section upsert, and fixed new-item order to use max(order)+1.
- 2026-02-01 Added `/help` page and wired Help link into the mini-app menu.
- 2026-01-31 Restored AvSelect import in resume editor to fix runtime ReferenceError.
- 2026-01-31 Enforced server-side Pro template access with shared guard for project mutations (PAYMENT_REQUIRED).
- 2026-01-31 Hide Pro badge for paid users in template pickers to match quiz gating UI.
- 2026-01-31 Removed landing page “Use this template” buttons (they only linked to /app/resumes without selecting a template).
- 2026-01-31 Locked templates 3/4 (minimal/timeline) behind Pro with shared template tier map, UI gating, and server-side PAYMENT_REQUIRED guards.
- 2026-01-31 Normalized payment fields in `Astro.locals.user` to avoid undefined values (stripeCustomerId/plan/planStatus/isPaid/renewalAt).
- 2026-01-31 Added locals.session payment flags in middleware/types and a temporary `/admin/session` debug page for Phase 2 verification.
- 2026-01-29 Added parent notification helper and wired resume create/update notifications.

- 2026-01-28 Reordered template card content (title → wireframe → description/button) and increased wireframe height.
- 2026-01-28 Aligned template wireframe SVGs to match Classic/Modern/Minimal/Timeline layouts.
- 2026-01-28 Added wireframe SVG placeholders to Templates cards on landing page.
- 2026-01-28 Bumped @ansiversa/components to ^0.0.119 for WebLayout mini-app links.
- 2026-01-28 Added local ASTRO_DB_REMOTE_URL in .env to prevent ActionsCantBeLoaded invalid URL in dev.
- 2026-01-28 Added resume-builder mini-app links (Home, Resumes) via AppShell props for AvMiniAppBar.
- 2026-01-28 Added local/remote dev+build scripts for dual DB mode support.
- 2026-01-28 Ran `npm run db:push` with remote envs to recreate resume-builder tables on remote DB.
- 2026-01-27 Bumped @ansiversa/components to ^0.0.118 and enabled AvMiniAppBar via APP_KEY in AppShell.
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
- 2026-01-26 Fixed Astro DB scripts overriding remote envs by removing hardcoded ASTRO_DB_REMOTE_URL; added .env.example guidance and ignored .env.local/.env.*.local so Vercel uses env vars.
- 2026-01-26 Upgraded @ansiversa/components to ^0.0.117 (published) so declaration field exists in ResumeData; typecheck/build verified.

## Verification Log

- 2026-02-08 UI polish verification:
  - `rg -n "<style" src/pages` (no matches).
  - `rg -n 'style="' src/pages` (no matches).
  - `rg -n -e 'class="[^"]*(^| )(bg-|text-|border-|grid|gap-|sm:|md:|lg:|xl:)' src/pages` (no matches).
  - `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
  - `npm run build` (pass).
  - Proof artifacts: `artifacts/ui-polish-verify-20260208/` (`template-cards-compact.png`, `sections-mobile-stack.png`, `print-header-dark.png`, `proof.json`).
- 2026-02-08 Form guardrail proof artifacts generated with Playwright under `artifacts/form-guardrails-20260208/`:
  - `full_name_clamp.png`
  - `invalid_date_blocked.png`
  - `present_toggle.png`
  - `proof.json` (captured metrics: `fullNameLen=60`, `summaryLen=400`, `bulletFirstLineLen=120`, invalid date blocked, present toggle clears/disables end date).
- 2026-02-08 `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
- 2026-02-08 `npm run build` (pass).
- 2026-02-08 `npm install @ansiversa/components@0.0.125` (pass).
- 2026-02-08 `npm run typecheck && npm run build` (pass; typecheck has 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`; build completed successfully).
- 2026-02-08 v5 visual-polish artifacts generated from live print routes via DEV bypass + Playwright + PyMuPDF under `artifacts/print-fix-20260208-v5/`:
  - `classic_v5.pdf`, `modern_v5.pdf`, `minimal_v5.pdf`, `timeline_v5.pdf`
  - `*_v5_p1.png`, `*_v5_p2.png`, and `*_v5_screen.png`
  - all four PDFs now render as 2 pages.
- 2026-02-08 copied v5 review pack to workspace mirror `mnt/data/`:
  - `classic_v5*`, `modern_v5*`, `minimal_v5*`, `timeline_v5*`.
- 2026-02-08 `npm install @ansiversa/components@0.0.124` (pass).
- 2026-02-08 `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
- 2026-02-08 `npm run build` (pass).
- 2026-02-08 v4 visual-polish artifacts generated under `artifacts/print-fix-20260208-v4/`:
  - `classic_v4.pdf`, `modern_v4.pdf`, `minimal_v4.pdf`, `timeline_v4.pdf`
  - `*_v4_p1.png`, `*_v4_p2.png`, and `*_v4_screen.png`.
- 2026-02-08 copied v4 review pack to workspace mirror `mnt/data/`:
  - `classic_v4*`, `modern_v4*`, `minimal_v4*`, `timeline_v4*`.
- 2026-02-08 `npm install @ansiversa/components@0.0.123` (pass).
- 2026-02-08 `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
- 2026-02-08 `npm run build` (pass).
- 2026-02-08 Bad-input proof dataset injected in local dev DB for verification only:
  - duplicate contact URLs/emails added to classic/modern basics links.
  - overlong summary/bullets added to minimal/timeline experience/summary sections.
- 2026-02-08 v3 artifacts generated with Playwright + PyMuPDF under `artifacts/print-fix-20260208-v3/`:
  - `classic_v3.pdf`, `modern_v3.pdf`, `minimal_v3.pdf`, `timeline_v3.pdf`
  - `*_v3_p1.png`, `*_v3_p2.png`, plus `*_v3_screen.png`.
- 2026-02-08 Text extraction checks from v3 PDFs:
  - Classic dedupe: `priyamenon.design` appears once in rendered PDF text.
  - Modern dedupe: duplicate email/portfolio labels removed; contact+links only show normalized unique entries.
  - Minimal guardrails: ellipsis present in extracted text for overlong summary/bullets.
  - Timeline guardrails: ellipsis present in extracted text for overlong bullets.
- 2026-02-08 Date guardrails verification:
  - UI selectors now sourced from constraints with floor `1950` and max `currentYear`.
  - Server validation enforces chronology and year range in `src/actions/resumeBuilder.ts` (`parseYear` + `validateChronology`).
- 2026-02-08 `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
- 2026-02-08 `npm run build` (pass).
- 2026-02-08 `npm run preview -- --host 127.0.0.1 --port 4424` (not supported by `@astrojs/vercel` adapter; command exits with adapter error).
- 2026-02-08 Production output proof (`.vercel/output/functions/_render.func/dist/server/_astro-internal_middleware.mjs`) shows `const isDevBypassEnabled = false;` proving bypass is dead in production builds.
- 2026-02-08 DEV bypass runtime checks via `npx astro dev --host 127.0.0.1 --port 4324`:
  - with `DEV_BYPASS_IS_PAID=false`, opening Pro resume editor embeds `PAYMENT_REQUIRED` in initial state payload.
  - with `DEV_BYPASS_IS_PAID=true`, same Pro resume loads with `isPaid:true` payload and logs: `⚠️ DEV_BYPASS_IS_PAID enabled — Pro gating bypassed for local verification only.`
- 2026-02-08 `rg -n "DEV_BYPASS_IS_PAID" -S src AGENTS.md`:
  - resume-builder matches only `src/middleware.ts` (+ this AGENTS log line).
  - components repo has zero matches.
- 2026-02-08 Copied final v2 PDF/PNG artifacts to workspace mirror path `mnt/data/` with Astra filenames (`classic_v2*`, `modern_v2*`, `minimal_v2*`, `timeline_v2*`) because system `/mnt/data` is not writable in this environment.
- 2026-02-08 `npm install @ansiversa/components@0.0.122` (pass).
- 2026-02-08 `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
- 2026-02-08 `npm run build` (pass).
- 2026-02-08 White-background contract verification artifacts: `classic_fixed.pdf`, `modern_fixed.pdf`, `minimal_fixed.pdf`, `timeline_fixed.pdf` (+ `*_p1.png`, `*_p2.png`) exported to `artifacts/print-fix-20260208-v2/` (all four PDFs are 2 pages).
- 2026-02-08 `npm install @ansiversa/components@0.0.121` (pass).
- 2026-02-08 `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
- 2026-02-08 `npm run build` (pass).
- 2026-02-08 PDF export run (local seeded data, DEV bypass): `classic_fixed.pdf` (2 pages), `modern_fixed.pdf` (2 pages), `minimal_fixed.pdf` (1 page), `timeline_fixed.pdf` (1 page) saved in `artifacts/print-fix-20260208/`.
- 2026-02-08 Screenshot export from generated PDFs: `*_p1.png` and `*_p2.png` where page 2 exists (`minimal`/`timeline` include `*_p2_missing.txt` marker files because PDF is single-page).
- 2026-02-08 `rg -n "<style|rb-|#[0-9a-fA-F]{3,8}" src -S` (pass; no matches).
- 2026-02-08 `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
- 2026-02-08 `npm run build` (pass).
- 2026-02-08 `npm run lint` (not available; script missing in `package.json`).
- 2026-02-08 `npm run typecheck` (pass; 0 errors, 0 warnings, 1 hint in baseRepository).
- 2026-02-01 `npm run typecheck` (pass; 1 hint in baseRepository).
- 2026-02-01 `npm run build` (pass).
- 2026-01-31 Pending manual check: free user cannot mutate Pro project via update/setDefault/upsertSection/addOrUpdateItem/deleteItem (PAYMENT_REQUIRED); deleteResumeProject still allowed.
- 2026-01-31 Pending manual check: free user blocked from minimal/timeline in UI + server returns PAYMENT_REQUIRED; paid user can select/print all templates.
- 2026-01-31 Pending manual check: paid user sees non-null fields; free user sees null/false in `Astro.locals.user`.
- 2026-01-31 Pending manual check: `/admin/session` shows isPaid true for paid user and false for free user.
- 2026-01-29 `npm run typecheck` (pass; 1 hint in baseRepository).
- 2026-01-29 `npm run build` (pass).
- 2026-01-29 Smoke test: not run (manual create/update resume).

## Task Log (Recent)
- Keep newest first; include date and short summary.
- 2026-02-09 Enforced repo-level AGENTS mandatory task-log update rule for Codex/AI execution.
- 2026-02-09 Verified repo AGENTS contract linkage to workspace source-of-truth.
