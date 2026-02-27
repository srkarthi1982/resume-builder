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

## 🔒 Milestones (Newest first)

### 🔒 Milestone: AI Suggestions V1 (Shipped)
- Parent AI Gateway production verified (ping + suggest + negative cases)
- Resume Builder Summary field AI suggestions integrated
- Gating: min 30 chars, max 1500
- No DB schema/data model changes
- Local proxy route used to avoid CORS
- Canonical www.ansiversa.com enforced in production for cookie stability
- Rate limiting active (429)
- Status: LOCKED
- Next: Extract reusable component AvAiAssist
- No secrets, no cookies.

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

- 2026-02-27 Added Save & Next for section drawers to streamline sequential editing: updated shared section order source in `src/modules/resume-builder/helpers.ts` (`RESUME_EDITOR_SECTION_ORDER`) and wired `/app/resumes/[id]` drawer footer to include `Save & Next` (Close → Save & Next → Save) with loading-disabled controls and last-step disabled tooltip (`No next section`). Extended `src/modules/resume-builder/store.ts` with next-section resolution (`getNextSectionKey`) that follows order `photo -> basics -> summary -> experience -> education -> skills -> projects -> certifications -> awards -> languages -> highlights -> declaration`, skips disabled/not-present sections, and advances only after successful save (blocks on error/warning/validation). Verification: `npm run typecheck` ✅, `npm run build` ✅. Edge cases handled: no auto-advance on normal Save, no advance on drawer errors/warnings, and last section keeps Save & Next disabled. Proof notes logged in `artifacts/save-next-20260227/proof.md`; interactive browser proof capture attempt hit Playwright Chromium `SIGSEGV` in this environment.
- 2026-02-26 Edit page settings-drawer refactor: moved resume configuration UI (title + template selection + save) off `/app/resumes/[id]` main panel into a dedicated right-side `Resume settings` drawer in `src/pages/app/resumes/[id].astro`, leaving main edit surface focused on section editing + preview. Added a `Resume settings` trigger in the top edit card, retained `Preview / Print` shortcut on page, and moved template/paywall + validation errors into drawer footer notices above Close/Save actions. Updated store `src/modules/resume-builder/store.ts` with `settingsDrawerOpen`/`settingsError`, open/close handlers, drawer-aware validation/error handling in `saveProjectMeta()`, and close-on-success behavior while preserving preview refresh/update logic. Verification: `npm run typecheck` ✅ (0 errors; existing hint unchanged).
- 2026-02-26 Default badge header pin fix: corrected `/app/resumes` card title-row behavior so `Default` badge stays pinned to top-right on the same row as title (no wrap under title) by enforcing explicit flex row contract in `src/styles/global.css` (`rb-resume-card-title-row`: `display:flex`, `justify-content:space-between`, `flex-wrap:nowrap`, width 100; `rb-resume-card-title` flex grow; `rb-default-badge` `margin-left:auto` + no-wrap). Verification: `npm run typecheck` ✅ (0 errors; existing hint unchanged).
- 2026-02-26 Default status badge polish on resumes cards: updated `/app/resumes` card header to keep `Default` as a dedicated top-right status badge with tighter, non-wrapping badge semantics and stable title/badge alignment on mobile (`src/pages/app/resumes/index.astro`: `rb-resume-card-title-row`, `rb-resume-card-title`, `rb-default-badge`; `src/styles/global.css`: new class rules). Note: `AvBadge` component is not currently exported by installed `@ansiversa/components`, so implementation uses existing shared badge classes with repo-scoped styling. Verification: `npm run typecheck` ✅ (0 errors; existing hint unchanged).
- 2026-02-26 Create drawer footer alignment tweak: right-aligned `/app/resumes` create drawer footer actions by replacing utility-only class usage with explicit `rb-drawer-footer-actions` hook in `src/pages/app/resumes/index.astro` and adding `width: 100%` + `justify-content: flex-end` in `src/styles/global.css` to enforce Close/Save alignment at the drawer bottom across viewports. Verification: `npm run typecheck` ✅ (0 errors; existing hint unchanged).
- 2026-02-26 Resumes list layout/action refinement follow-up: updated `/app/resumes` card grid to strict responsive cap via `src/styles/global.css` (`.av-resume-list-grid`: 1 column on small, 2 on medium, 3 max on large screens). Removed top-row bookmark control from each card and moved bookmark into the icon action row. Replaced the previous heart-based default action icon with a neutral check-in-circle inline icon in `src/pages/app/resumes/index.astro` while keeping `Set default` behavior unchanged. Verification: `npm run typecheck` ✅ (0 errors; existing hint unchanged).
- 2026-02-26 Resumes index create-drawer + icon actions pass: refactored `/app/resumes` (`src/pages/app/resumes/index.astro`) to keep a single `Create resume` primary CTA that opens right-side drawer flow (`Resume title` + template picker) using shared drawer pattern (`src/components/ResumeEditorDrawer.astro`), moved create validation/error/paywall notices into drawer footer area, and removed inline create form from main page. Updated list card actions to icon-only controls (Edit `edit`, Preview/Print `eye`, Set default `heart`, Delete `trash`) with required `aria-label` + `title`, while preserving existing delete confirmation and bookmark behavior. Updated store (`src/modules/resume-builder/store.ts`) with drawer-scoped create state (`createDrawerOpen`, `createError`), open/close handlers, double-submit guard, and post-create immediate redirect to `/app/resumes/{id}`. Verification: `npm run typecheck` ✅ (0 errors; existing hint unchanged).
- 2026-02-26 Profile links inline delete alignment: updated Profile drawer Links row in `src/pages/app/resumes/[id].astro` to wrap URL input + delete action in a dedicated inline flex container (`av-resume-link-url-row`) so the trash icon stays to the right of URL on mobile. Reused existing icon-action styling via `rb-experience-action-btn` and added `aria-label` for accessibility consistency. Added supporting responsive classes in `src/styles/global.css` (`av-resume-link-url-row`, `av-resume-link-url-input`) to enforce `flex-1` input + non-wrapping action alignment with no overflow. Verification: `npm run typecheck` ✅.
- 2026-02-26 Drawer validation placement fix: moved drawer-save validation/warning rendering to drawer-scoped notices by adding `drawerError`/`drawerWarning` state and scoped setters in `src/modules/resume-builder/store.ts`, clearing notices on open/close/save cycles, and routing save/delete/item validation messages (including education overlap warning) to the drawer when active. Updated `src/pages/app/resumes/[id].astro` to suppress page-level error/warning alerts while drawer is open and added a dedicated drawer footer alert area above Close/Save actions. Verification: `npm run typecheck` ✅. Screenshot attempt via browser tool failed in this environment due Playwright Chromium crashes (SIGSEGV), so no artifact captured.
- 2026-02-24 Dynamic drawer-header parameterization: introduced local `src/components/ResumeEditorDrawer.astro` (AvDrawer-compatible shell) with `titleExpr` / `descriptionExpr` props rendered via Alpine `x-text`, and switched resume editor drawer to pass section-specific values (`getSectionLabel(activeSectionKey)` + contextual helper line). Removed temporary header-collapse CSS hack from `src/styles/global.css`. Result: section title/description now renders in the real top drawer header for all sections (no empty top strip). Verification: `npm run typecheck` ✅.
- 2026-02-24 Drawer top-gap fix: removed empty `AvDrawer` shell header spacing for resume editor drawers by collapsing `.rb-drawer-panel .av-drawer__header` and moving body start under close control (`.av-drawer__body { padding-top: 2.9rem; }`, close button offset tuned). Result: dynamic section title/description now appears at the true top for all sections with no blank strip. Verification: `npm run typecheck` ✅.
- 2026-02-24 Drawer header dedupe pass: removed static `AvDrawer` title/description (`Edit section` / `Update section content and save.`) in `src/pages/app/resumes/[id].astro` so each drawer now shows only the section-specific dynamic heading/description block at top content. Close button/backdrop handlers unchanged (Bug 5 behavior preserved). Verification: `npm run typecheck` ✅.
- 2026-02-24 Action accessibility polish: increased shared icon-action button hit area from `32px` to `36px` (`.rb-experience-action-btn` width/min-width/height `2rem` -> `2.25rem`) in `src/styles/global.css` to improve mobile tap comfort while keeping consistent icon-first UI across drawers. Verification: `npm run typecheck` ✅.
- 2026-02-24 Section action-button consistency pass: applied Experience action style to all list-based section drawers in `src/pages/app/resumes/[id].astro` (`education`, `skills`, `projects`, `certifications`, `awards`, `languages`, `highlights`): Edit/Delete changed to icon-only `AvButton + AvIcon` with accessible `aria-label`/`title`, and Add buttons updated to plus icon + text using existing `rb-experience-add-btn` pattern. Verification: `npm run typecheck` ✅.
- 2026-02-24 Drawer section-header consistency pass: applied the Experience plain heading/subtext intro pattern to all section drawers in `src/pages/app/resumes/[id].astro` by replacing the conditional kicker block with a single `av-card-heading` bound to `getSectionLabel(activeSectionKey)` plus existing helper text logic (`photo` keeps “Uploading updates instantly.”, others keep “Save to refresh the preview.”). Verification: `npm run typecheck` ✅.
- 2026-02-24 Experience drawer intro polish: replaced the EXPERIENCE kicker pill with plain heading/subtext style to match the top Edit section hierarchy (`Experience` + `Save to refresh the preview.`) in `src/pages/app/resumes/[id].astro` (Experience-only conditional). Verification: `npm run typecheck` ✅.
- 2026-02-24 Bug 6 revised UX alignment (Experience drawer list only): changed Experience row hierarchy in `src/pages/app/resumes/[id].astro` so title remains plain content text (`.rb-experience-item-title`) and actions are icon-only buttons using existing `AvButton + AvIcon` (`edit` / `trash`) with `aria-label` + `title` (`Edit experience`, `Delete experience`). Updated `Add experience` to plus icon + text for clearer discovery (`AvIcon name=\"plus\"`). Added minimal scoped style helpers in `src/styles/global.css` (`.rb-experience-actions`, `.rb-experience-action-btn`, `.rb-experience-add-btn`) with no global component changes. Proof artifacts: `artifacts/bug6-experience-actions-20260224/` (`before-experience-text-actions.png`, `after-experience-icon-actions.png`, `proof.md`). Verification: `npm run typecheck` ✅, `npm run build` ✅.
- 2026-02-24 Bug 6 experience list title/action visual separation: scoped Experience drawer list UI update only in `src/pages/app/resumes/[id].astro` by replacing the title node with plain content element `.rb-experience-item-title` (no button/pill/hover styling) while keeping `Edit/Delete` actions as `AvButton` (`variant=\"ghost\"`, `size=\"sm\"`). Added local style in `src/styles/global.css` (`font-weight: 600`, slate text color, block/min-width behavior) to keep title clearly content-like and left-aligned with actions on the right unchanged. Verification: `npm run typecheck` ✅, `npm run build` ✅.
- 2026-02-24 Bug 5 drawer-close hardening (Certifications + all section drawers): updated drawer overlay interaction contract in `src/pages/app/resumes/[id].astro` from `@click.self="closeDrawer()"` to backdrop-level `@click="closeDrawer()"` and wrapped `<AvDrawer />` in `.rb-drawer-panel` with `@click.stop @mousedown.stop @pointerdown.stop` so inner panel interactions (inputs/selects/scroll area) cannot bubble to close logic. Added `.rb-drawer-panel { pointer-events: auto; position: relative; }` in `src/styles/global.css` to ensure panel interactivity boundary is explicit. Verification: `npm run typecheck` ✅, `npm run build` ✅, interaction artifacts in `artifacts/bug5-drawer-close-20260224/` with checklist in `proof.md` (`after-result.txt`: input/panel clicks keep drawer open; backdrop click closes).
- 2026-02-24 Added Print tip to guide users to disable browser Headers & Footers; hidden in print output. Implemented shared Print/Preview hint banner on `/app/resumes/[id]/print` (`src/pages/app/resumes/[id]/print.astro`) with calm guidance copy under the heading, added scoped hint styles + explicit print-hide rule (`@media print { .rb-print-hint { display: none !important; } }`) in `src/styles/global.css`, and captured proof artifacts in `artifacts/print-hint-20260224/` (`print-preview-with-hint.png`, `print-output-no-hint.pdf`, `print-output-no-hint-page1.png`, `proof.md`). Verification: `npm run typecheck` ✅, `npm run build` ✅.
- 2026-02-14 Fixed parent API proxy auth loss caused by apex->www redirect: both proxy routes now canonicalize parent base URL from `https://ansiversa.com` to `https://www.ansiversa.com` in production before forwarding (`src/pages/api/ai/suggest.ts`, `src/pages/api/notifications/unread-count.ts`), preventing cookie drop on cross-origin redirect hops. Verification: `npm run typecheck` (0 errors) and `npm run build` (pass).
- 2026-02-14 Fixed cross-origin AI suggestions CORS/preflight redirect failure for resume-builder subdomain by adding same-origin proxy route `src/pages/api/ai/suggest.ts` (forwards JSON body + cookie header to parent `POST /api/ai/suggest.json` and relays status/body), and updated client helper `src/lib/aiGateway.ts` to call local `/api/ai/suggest` only. Verification: `npm run typecheck` (0 errors) and `npm run build` (pass).
- 2026-02-14 Fixed Alpine runtime error `RESUME_MAX is not defined` on resume editor counters by converting all `x-text` counters in `src/pages/app/resumes/[id].astro` to plain Alpine expressions with server-inlined numeric limits (string concatenation), removing direct runtime references to module constants. Verification: `npm run typecheck` (0 errors) and `npm run build` (pass).
- 2026-02-14 Resume Builder – AI Suggestions V1 (summary field only): added parent AI Gateway client helper `src/lib/aiGateway.ts` (POST `${rootAppUrl}/api/ai/suggest.json` with `credentials: "include"`), wired Alpine store AI state/actions in `src/modules/resume-builder/store.ts` (`ai.open/loading/error/suggestions`, hardcoded `featureKey="resume.remark_suggestions"`, min-context gate `>=30` chars, client guard `>1500` blocked, append/replace/copy actions, 401/429/400/network friendly messages), and integrated UI on summary textarea in `src/pages/app/resumes/[id].astro` (✨ AI button in header + modal with suggestion list and action buttons). Added supporting modal styles in `src/styles/global.css`. Verification: `npm run typecheck` (0 errors) and `npm run build` (pass). Manual checks: summary text <30 disables AI button with tooltip; >=30 enables; AI opens modal with 3–5 suggestions; Append/Replace updates textarea; >1500 shows client-side error without API call; auth/rate-limit/server errors map to friendly messages.
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

- 2026-02-15 Print/preview polishing V2.1 verification:
  - `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
  - `npm run build` (pass).
  - Playwright screenshot artifact captured: `artifacts/print-preview-polish.png` (preview route render proof).
- 2026-02-15 Final lock verification (Resume Builder Photo V2 closeout):
  - `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
  - `npm run build` (pass; server + client build complete).
  - Smoke-route attempt via local dev (`astro dev --remote --host 127.0.0.1 --port 4337`) reached app routes but returned `302` redirect to auth without a valid local session cookie; full authenticated route smoke must be run in signed-in browser session.
  - Print/preview CSS contracts verified in code: dark links enforced, print hyphenation disabled, header/photo/contact layout aligned to approved spec.
- 2026-02-15 Photo drawer stale-state + CTA behavior fix verification:
  - `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
  - `npm run build` (pass).
  - Verified in code: Photo drawer now uses instant-upload guidance text, hides Save button (`Done/Close` only), and `openSection('photo')` re-syncs project via `loadProject()` before showing drawer to avoid stale reopen state.
- 2026-02-15 Photo section + print header/layout polish verification:
  - `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
  - `npm run build` (pass).
  - Verified in code: sections list includes virtual `Photo` entry opening drawer uploader (no `ResumeSection/ResumeItem` persistence changes), duplicate editor photo preview removed, print wrapper now renders photo-left/name-job/contacts-right with separate SUMMARY block below, and print/preview link colors forced to inherit (no light-blue default anchors).
  - Manual browser verification pending: drawer upload interaction, preview/print visual alignment across templates, and dark-link confirmation in rendered output.
- 2026-02-15 Remote data setup for user `01e5cef7-b18d-4616-999c-454175356c24`:
  - Executed remote insert script with `node --env-file=.env.local --input-type=module` + `@libsql/client` to create a complete ResumeProject dataset (all sections populated).
  - Verified project creation: title `Administrator - Senior Software Developer Resume` (new project id `f53dc2b5-86f0-4157-a4eb-9711fb1556b2`).
  - Verified totals: 11 sections, 28 items.
  - Verified required counts: `experience=4`, `projects=4`, `awards(achievements)=3`; all other sections present with at least 1 item.
- 2026-02-15 Resume photo metadata + upload pipeline verification:
  - `npm run db:push` (pass; remote schema pushed with `photoKey`, `photoUrl`, `photoUpdatedAt` on `ResumeProject`).
  - `npm run typecheck` (pass; 0 errors, 0 warnings, 1 existing hint in `src/actions/baseRepository.ts`).
  - `npm run build` (pass).
  - UI/manual checks pending in local browser: jpg/png/webp upload instant preview, refresh persistence, re-upload timestamp change, mobile alignment, and print/PDF visual verification.
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
- 2026-02-27 Middleware Standard V1 normalization: introduced config-driven middleware via `src/lib/middlewareConfig.ts` + shared template `src/middleware.ts` (standardized static bypass list, prod `ANSIVERSA_COOKIE_DOMAIN` enforcement, ordered auth flow, safe numeric admin role check, dev bypass gated to `import.meta.env.DEV`). Preserved resume-builder behavior with `protectMost`, public routes `["/", "/help"]`, and retained local paid bypass capability through `DEV_BYPASS_IS_PAID` using `process` env source in config. Updated `.env.example` with routing vars + standardized dev bypass flags. Verification: `npm run typecheck` ✅, `npm run build` ✅.
- 2026-02-27 Footer parent-origin rollout: bumped `@ansiversa/components` to `0.0.149` (lockfile refreshed) to consume shared footer absolute-parent links for Terms/Privacy/FAQ/Contact with local override support via `PUBLIC_ANSIVERSA_PARENT_ORIGIN`. Verification: `npm run build` ✅.
- 2026-02-23 Bug 2 final stabilization (top-edge + page-2 white overlap): removed Modern print pseudo-overlay paint layer usage (disabled `.rb-modern-print-root::before`) and restored sidebar column stretch in print (`.grid.lg\\:grid-cols-12.print\\:grid-cols-1 > aside { align-self: stretch; height: auto; }`) in `src/styles/global.css`. Result: page-1 header/photo no longer gets tinted edge, and page-2 sidebar remains fully dark without white overlap. Verification: `npm run typecheck` ✅, `npm run build` ✅, local PDF render check (`/tmp/modern_test_no_overlay.pdf`) confirmed expected output.
- 2026-02-23 Bug 2 regression hotfix V3 (user PDF verification): validated issue against user-provided PDF (`Administrator - Senior Software Developer Resume – Print.pdf`) showing left dark overlay bleeding into page-1 header/photo area; fixed by changing Modern print overlay positioning from `fixed` to `absolute` in `src/styles/global.css` (`.av-resume-template-underlay .rb-modern-print-root::before`) so paint starts at template root (below header) while retaining page 2+ sidebar continuity. Verification: local print PDF render check on same resume ID shows page-1 header/photo area no longer tinted and page-2 sidebar continuity preserved.
- 2026-02-23 Artifact cleanup: removed Bug 2 image/PDF proof binaries from repo-tracked artifact folders (`artifacts/modern-sidebar-print-bug2-20260223/*.{png,pdf}`, `artifacts/modern-sidebar-print-bug2-hotfix-20260223/*.{png,pdf}`) while retaining `proof.md` files for audit traceability.
- 2026-02-23 Bug 2 regression hotfix V2 (final) for photo/header layering: refined Modern print overlay stacking in `src/styles/global.css` so the fixed sidebar paint layer cannot cover the top profile/header while preserving page-2+ continuity. Changes: `.rb-modern-print-root::before` moved to `z-index: -1`, all root direct children remain lifted (`> * { z-index: 1 }`), and top profile header wrapper is explicitly elevated in print (`.av-resume-print-main > .av-container > .av-resume-standard { z-index: 2 }`). Verification: `npm run typecheck` ✅, `npm run build` ✅. Updated proof artifacts in `artifacts/modern-sidebar-print-bug2-hotfix-20260223/` (`before-photo-hidden.png`, `after-photo-visible.png`, `after-print-preview.pdf`, `proof.md`).
- 2026-02-23 Bug 2 regression hotfix (Modern print overlay stacking): fixed header/photo layering regression from `d0f89c3` by changing Modern print stack lift in `src/styles/global.css` from `.rb-modern-print-root > main` to `.rb-modern-print-root > *`, and setting root `z-index: 0` while keeping print-only fixed sidebar overlay (`::before`) and `pointer-events: none`. This keeps page 2+ sidebar continuity while ensuring page-1 photo/header are above the paint layer. Verification: `npm run typecheck` ✅, `npm run build` ✅, artifacts in `artifacts/modern-sidebar-print-bug2-hotfix-20260223/` (`before-photo-hidden.png`, `after-photo-visible.png`, `after-print-preview.pdf`, `proof.md`).
- 2026-02-23 Bug 2 fix (Modern print sidebar continuity across pages): added a Modern-only print root hook class `rb-modern-print-root` in `src/modules/resume-builder/ResumeTemplateModernTwoToneLocal.astro`, and added print-only fixed sidebar paint-layer CSS in `src/styles/global.css` (`.av-resume-template-underlay .rb-modern-print-root::before`) with `print-color-adjust` safeguards so page 2+ keeps the dark left sidebar in Chrome print/PDF output. Verification: `npm run typecheck` ✅, `npm run build` ✅; proof artifacts in `artifacts/modern-sidebar-print-bug2-20260223/` (`before-print-preview.png`, `after-print-preview.png`, `after-print-preview.pdf`, `proof.md`).
- 2026-02-23 Merged and pushed certifications fix to `main` with commit `70327f6` (`Resume Builder: Modern template render Certifications (preview + print)`). Pre-merge gates re-run: `npm run typecheck` ✅, `npm run build` ✅; scope confirmed Modern-only renderer + AGENTS log update. Production reachability check: `https://resume-builder.ansiversa.com/` returns 200, while authenticated resume routes (`/app/resumes/[id]`, `/app/resumes/[id]/print?preview=1`) return 302 to parent login when no session cookie is present; full signed-in production UI verification pending authenticated browser session.
- 2026-02-23 Modern template certifications render fix (preview + PDF): updated `src/modules/resume-builder/ResumeTemplateModernTwoToneLocal.astro` to render a conditional `CERTIFICATIONS` block from `data.certifications` (name required; optional issuer/year metadata; optional clickable link), ensuring it appears only when certifications exist and remains visible in print output. Verification: `npm run typecheck` ✅, `npm run build` ✅. Proof artifacts: `artifacts/certifications-modern-20260223/before-print-preview.png`, `artifacts/certifications-modern-20260223/after-print-preview.png`, `artifacts/certifications-modern-20260223/after-print-preview.pdf`, `artifacts/certifications-modern-20260223/proof.md`.
- 2026-02-22 FAQ content refresh (production): replaced placeholder/demo FAQ entries with real Resume Builder user FAQs (5) via `db/seed-faq-content.ts` using audience=`user`, published entries, and stable sort order; aligned content with current Resume Builder V1 behavior and ecosystem FAQ contract.
- 2026-02-22 Mini-app navbar home-link rollout: upgraded `@ansiversa/components` to `0.0.145` so `AvMiniAppBar` app title/icon area is clickable and navigates to mini-app home (`links[0].href`, fallback `/`) with accessible aria-label + focus-visible state; verified no behavior changes to 3-dot menu. Verification: `npm run build` ✅.
- 2026-02-22 FAQ shared rollout: upgraded `@ansiversa/components` to `0.0.144` (shared `FaqManager` now includes debounced search + icon actions + no numeric order UI + no sort-order input), and updated `src/pages/api/admin/faqs.json.ts` GET to support `q` filtering across question/category/audience while preserving audience filter and existing CRUD/reorder behavior. Verification: `npm run build` ✅.
- 2026-02-22 Fix: resume delete confirmation now renders selected title reliably by setting `AvConfirmDialog` title text at click-time before `AvDialog.open(...)`, resolving static `headline` prop limitation for dynamic Alpine bindings.
- 2026-02-22 UX polish: resume list delete confirmation dialog now includes the selected resume title using `AvConfirmDialog` dynamic headline with fallback `Delete this item?`; delete behavior unchanged.
- 2026-02-22 Bookmarks V1 hardening: added `scripts/apply-bookmark-triggers.ts` using `@libsql/client` (`TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN`) and wired `db:triggers` + `postdb:push`; applied trigger `bookmark_cleanup_resume_project_delete` (`ResumeProject` -> `Bookmark` cleanup for `entityType='resume'`). Verification (using `.env.production`): `npm run db:push` ✅, `npm run db:triggers` ✅, trigger query (`sqlite_master`) ✅, `npm run typecheck` ✅, `npm run build` ✅. Production checklist: pending manual smoke (delete bookmarked resume -> bookmark row auto-removed -> `/bookmarks` no orphan card).
- 2026-02-19 FAQ V1 added: faqs table + public endpoint + admin CRUD + /admin/faq using shared FaqManager.
- 2026-02-15 Modern ATS extractor artifact mitigation (bullet/highlight layer): added `atsSafeInline()` in `src/modules/resume-builder/ResumeTemplateModernTwoToneLocal.astro` to convert intra-word hyphens to spaces after sanitation for bullet-like text, and applied it to Experience bullets + Highlights rendering in print/preview route (`high-volume` -> `high volume`) to avoid lingering PDF text-layer glyph artifacts (`￾`) at hyphen positions.
- 2026-02-15 Final Modern artifact blocker pass (render + data): expanded shared sanitizer in `src/modules/resume-builder/helpers.ts` (`sanitizePrintText`) to also strip replacement glyph and all Unicode format chars (`\\ufffd`, `\\p{Cf}`), then executed one-time remote deep sanitation for user `01e5cef7-b18d-4616-999c-454175356c24` across all `ResumeItem.data` payloads (89 scanned, 3 updated) and touched related projects’ `updatedAt`; verified Experience bullet now stores plain `high-volume` text.
- 2026-02-15 Final sanitizer gap closure for bullets/tags: updated normalization coercion in `src/modules/resume-builder/helpers.ts` (`coerceStringArray`, `coerceTagArray`) and `src/modules/resume-builder/store.ts` (`toBullets`, `toTags`) to run all entries through `normalizeText` (instead of plain trim/String), plus strengthened store `normalizeText` with format/control class stripping (`\\p{Cf}` and noncharacter/control classes). This ensures Experience bullets and related arrays are sanitized before render paths, including Modern PDF output.
- 2026-02-15 Modern ATS/text-cleanliness blocker fix: updated local Modern renderer `src/modules/resume-builder/ResumeTemplateModernTwoToneLocal.astro` to apply deep render-time sanitation via shared `sanitizePrintText()` across all string fields (including experience/project summaries and bullet items), switched name rendering to a single text node (`fullName`) for cleaner ATS extraction (prevents merged-token risk), and widened Projects cards to single-column layout for better title readability (less narrow stacking).
- 2026-02-15 Modern PDF page-3 empty-space reduction: adjusted print-only Modern grid behavior in `src/styles/global.css` so sidebar no longer stretches across trailing empty area (`align-items: start` on `grid.lg\\:grid-cols-12.print\\:grid-cols-1`, and sidebar `align-self: start` + `height: fit-content`), reducing the long dark strip on final page.
- 2026-02-15 Modern PDF sidebar color retention fix: added print color preservation rules in `src/styles/global.css` (`-webkit-print-color-adjust: exact`, `print-color-adjust: exact`) at template scope and explicitly on Modern sidebar selector, plus `forced-color-adjust: none`, so dark left banner/background survives browser PDF export instead of being flattened to white.
- 2026-02-15 Modern structure update for print/preview route: added local renderer `src/modules/resume-builder/ResumeTemplateModernTwoToneLocal.astro` and wired `src/pages/app/resumes/[id]/print.astro` to use it when `templateKey === "modern"` so `Education` and `Highlights` render under `Languages` in the left sidebar (as requested), while `Projects` gets expanded room in main content.
- 2026-02-15 Modern underlay column arrangement tweak (preview/print route): in `src/styles/global.css`, swapped the bottom two-column order inside Modern main content so `Education + Highlights` render in the left column and `Projects` render in the right column for the print/preview underlay output.
- 2026-02-15 Modern print visual parity update (left sidebar banner): in `src/styles/global.css` print scope, forced Modern sidebar (`.grid.lg\\:grid-cols-12.print\\:grid-cols-1 > aside`) to retain dark background/light text in PDF (instead of `print:bg-white`), with supporting chip/divider color overrides so print matches preview’s left-banner visual language.
- 2026-02-15 Remote content alignment for Modern template (user `01e5cef7-b18d-4616-999c-454175356c24`, project `f53dc2b5-86f0-4157-a4eb-9711fb1556b2`): patched `basics` item content in remote DB to template-consistent contact/link values (fixed malformed GitHub URL to `https://github.com/ansiversa`, normalized LinkedIn/Website URLs, and location label to `Abu Dhabi - United Arab Emirates`), and touched project `updatedAt` for refresh ordering.
- 2026-02-15 Modern PDF text-cleanliness lock pass: added shared `sanitizePrintText()` in `src/modules/resume-builder/helpers.ts` (strips SHY/zero-width/BOM/noncharacters and normalizes unicode dashes) and reused it in `src/pages/app/resumes/[id]/print.astro` as last-mile deep sanitizer before rendering `ResumeBuilderShell`; also added `.resume-print/.resume-preview` alias classes on print page body and matched CSS rules in `src/styles/global.css` for `hyphens: none`, `word-break: normal`, `overflow-wrap: normal`, and link color inheritance parity. Verification: `npm run typecheck` (pass, 0 errors/0 warnings, 1 existing hint in `src/actions/baseRepository.ts`) and `npm run build` (pass).
- 2026-02-15 Modern template print parity fix: added print-only override in `src/styles/global.css` for `.grid.lg\\:grid-cols-12.print\\:grid-cols-1` (Modern layout) to preserve two-column structure and preview-like order in PDF (`aside` locked to left `span 4`, main content `span 8`, and sidebar no longer pushed to last by `print:order-2`).
- 2026-02-15 Content-level Unicode sanitization lock pass: upgraded `normalizeText` in both `src/modules/resume-builder/helpers.ts` and `src/modules/resume-builder/store.ts` to strip soft-hyphen/zero-width/noncharacter glyphs (`\u00AD`, `\u200B-\u200D`, `\uFEFF`, `\uFFFE`, `\uFFFF`) and normalize unicode dash variants (`\u2010-\u2015`, `\u2212`) to ASCII `-`; this ensures existing persisted ResumeItem text and all future edits/saves render without residual `￾` artifacts (including Achievements `multi-app` phrase).
- 2026-02-15 Final residual hyphen glyph cleanup + heading orphan polish: strengthened print data sanitization in `src/pages/app/resumes/[id]/print.astro` to normalize non-standard dash characters (`\u2010-\u2015`, `\u2212`) to ASCII `-` and remove control/noncharacter codepoints, addressing remaining `multi￾app` artifact; added print heading keep-with-next rule in `src/styles/global.css` (`.av-resume-template-underlay .resume-template h2 { break-after: avoid-page; }`) to reduce orphan section headings across pages.
- 2026-02-15 Final PDF hyphenation/artifact hardening + section grouping: added deep print-only subtree override in `src/styles/global.css` (`.av-resume-template-underlay, .av-resume-template-underlay *`) forcing `hyphens: none !important; word-break: normal !important; overflow-wrap: normal !important;` to eliminate residual Achievements soft-hyphen artifacts, and added `break-inside: avoid` / `page-break-inside: avoid` for `.resume-template aside > section` to prevent heading/content orphan splits in right-column sections.
- 2026-02-15 Additional PDF spacing tighten (post-summary): reduced `src/styles/global.css` `.av-resume-standard` bottom margin (`1rem` -> `0.5rem`) to close SUMMARY→EXPERIENCE gap, and further reduced print underlay section padding to `0.35rem` on all sides for denser left/right utilization after SUMMARY.
- 2026-02-15 Hyphenation artifact hardening (Astra review follow-up): strengthened global print scope in `src/styles/global.css` (`.av-resume-print, .av-resume-print *`) with `hyphens: none !important; word-break: normal !important; overflow-wrap: normal !important;`, and added deep text sanitization in `src/pages/app/resumes/[id]/print.astro` to strip invisible soft characters (`\u00AD`, zero-width, BOM, noncharacters) before rendering `ResumeBuilderShell`, removing residual `long￾term`/`multi￾app` artifacts in PDF output.
- 2026-02-15 Post-summary spacing reduction + PDF side-gutter tighten: in `src/styles/global.css`, reduced underlay top gap before EXPERIENCE by lowering `.av-resume-template-underlay .resume-template > main` vertical padding and forcing smaller section top padding, plus tightened section left/right padding (preview + print overrides with `!important`) so post-summary content uses more width in generated PDF.
- 2026-02-15 PDF print-width fix after SUMMARY: added print-only hard override in `src/styles/global.css` for `.av-resume-template-underlay .resume-template > main` (`max-width: none !important; padding-inline: 0 !important;`) so browser-generated PDF no longer retains narrow post-summary side gutters.
- 2026-02-15 Print/preview width utilization update after SUMMARY: widened underlay template shell in `src/styles/global.css` by overriding `.av-resume-template-underlay .resume-template > main` to `max-width: 72rem` (from template default `max-w-4xl`) and reduced side padding (`0.75rem` / `1rem` at `sm+`) so left/right white space is better utilized in preview and print.
- 2026-02-15 Print/preview contact colon alignment fix: updated `.av-resume-contact-row` grid columns in `src/styles/global.css` to fixed label/colon tracks (`8ch 1ch`) so `Email/Website/GitHub/LinkedIn` separators align vertically across rows in both preview and print outputs.
- 2026-02-15 Resume Builder — Print/Preview Polishing (V2.1): fixed SUMMARY heading break safeguards by normalizing heading word/letter spacing + break rules in print/preview scopes; corrected GitHub URL normalization to enforce `github.com/<username>` when malformed input omits slash; reinforced print/preview link color inheritance and no-hyphenation text behavior; tightened print header contact block alignment to reduce awkward wrapping.
- Keep newest first; include date and short summary.
- 2026-02-20 Resume Builder Bookmarks V1 shipped: added DB `Bookmark` table + indexes/unique constraint, added bookmark actions (`listResumeBookmarks`/`toggleBookmark`), integrated `AvBookmarkButton` on `/app/resumes` with optimistic bookmark-id state, added `/bookmarks` page using `AvBookmarksEmpty`/`AvBookmarksList`, and enabled gated mini-app menu link via `bookmarksHref=\"/bookmarks\"`. Verification: `npm run db:push` ✅, `npm run typecheck` ✅, `npm run build` ✅.
- 2026-02-19 Bumped `/components` to `0.0.141` and refreshed lockfile for latest shared FAQ order-arrow release; verification: `npm run build` ✅.
- 2026-02-19 Bumped `/components` to `0.0.140` and refreshed lockfile to consume the latest shared release; verification: `npm run build` ✅.
- 2026-02-19 Bumped `@ansiversa/components` to `0.0.139` (AvMiniAppBar AppLogo support) and verified with `npm run build` (pass).
- 2026-02-15 Print header contact typography refinement: switched right-column contacts to structured 3-column rows (`key`, `:`, `value`) so colons align vertically and labels (Email/Website/GitHub/LinkedIn) are right-aligned against the colon while values/URLs flow consistently after it.
- 2026-02-15 Print header contact alignment tweak: changed email entry format to `Email: <address>` and switched right-column contact block to left-aligned text/flow while preserving right-column placement in the header grid.
- 2026-02-15 Milestone closeout prep: completed final build/typecheck lock checks for approved print/preview/header/photo behaviors and recorded auth-gated smoke constraint; marked Resume Builder Photo V2 ready to lock.
- 2026-02-15 PDF micro-polish pass: normalized print contact list formatting to `Label: value` style with de-duplication and removed standalone `Website` line artifact, added location display normalization (`Abudhabi` -> `Abu Dhabi`) in print header, and disabled hyphenation in print scope (`.av-resume-print`) for ATS-safe text extraction.
- 2026-02-15 Print header URL label cleanup: normalized website display label to strip protocol and trailing slash (e.g., `www.ansiversa.com/` -> `www.ansiversa.com`) so manual slash removal in editor is reflected consistently.
- 2026-02-15 Print/PDF parity fix: forced classic template content grid to keep left/right two-column layout in `@media print` (overrode `print:grid-cols-1` and `print:col-span-1`) so exported PDF matches preview structure.
- 2026-02-15 Print identity spacing polish: reduced vertical spacing between job title, location, and phone by tightening top margins and splitting phone into its own compact style class (`av-resume-standard-phone`).
- 2026-02-15 Print header contact placement tweak: moved mobile number from right contact stack to left identity block (now shown below location), as requested.
- 2026-02-15 Photo crop focus fix: adjusted print header square photo to use `object-position: center 18%` so tall portrait uploads keep head/face visible instead of center-cropping too low.
- 2026-02-15 Print header photo size increase: enlarged profile photo from `96x96` to `112x112` while keeping square shape with subtle rounded corners.
- 2026-02-15 Print header identity polish: moved location from right contact stack to appear under job title in the left identity block, and changed header photo shape from circular to square with subtle rounded corners.
- 2026-02-15 Print width alignment fix: constrained `/app/resumes/[id]/print` banner/content containers from `AvContainer size=\"full\"` to default `AvContainer` so the top header and custom photo-summary block follow resume width instead of stretching full viewport.
- 2026-02-15 Print/preview top-banner CTA simplification: removed `Back to editor` button from `/app/resumes/[id]/print` header, keeping only `Print / Download PDF` as requested.
- 2026-02-15 Fixed Photo drawer UX/state regression: removed Save CTA for virtual `photo` section (drawer footer now `Done` only for photo), updated drawer helper copy to instant-upload semantics, prevented photo uploader remount by switching to `x-show` block, and made `openSection('photo')` await `loadProject()` before opening so reopen reflects latest persisted photo metadata.
- 2026-02-15 Resume Builder photo UX/layout hardening (Astra task): added virtual `Photo` entry to sections drawer (uploader moved into drawer), removed duplicate editor-side photo preview, reworked `/app/resumes/[id]/print` wrapper to standard header row (photo left, identity center, contacts right) plus separate SUMMARY block below header, and added print/preview anchor color inheritance rules to remove default light-blue link rendering.
- 2026-02-15 Created a complete remote resume dataset for user `ansiversa@gmail.com` via libSQL script using `.env.local` remote credentials: inserted one `ResumeProject` (`Administrator - Senior Software Developer Resume`) with all 11 sections, 4 experiences, 4 projects, 3 achievements (awards), plus basics/summary/education/skills/certifications/languages/highlights/declaration, and linked profile photo fields.
- 2026-02-15 Resume Builder photo integration V1: added `ResumeProject` photo metadata columns (`photoKey`, `photoUrl`, `photoUpdatedAt`), added parent-upload proxy route `src/pages/api/media/upload.json.ts`, added action `resumeUpdateProjectPhoto` with ownership guard + timestamp updates, wired editor uploader (`AvImageUploader`) and optimistic store save flow, and rendered uploaded photo in print/preview output with fixed circular 96x96 style.
- 2026-02-14 Upgraded `@ansiversa/components` to `0.0.130` (lock `0.0.130`) to consume AvAiAssist modal header UX update (single-line title row with right-aligned `X` close control). Verification: install succeeded.
- 2026-02-14 UI alignment fix: pinned Summary AI assist button to the right of the Summary label by overriding header layout in `src/styles/global.css` (`.av-resume-ai-header` nowrap + right-pinned assist control), preventing wrap-to-next-line behavior in drawer header. Verification: `npm run typecheck` (0 errors, 1 existing hint).
- 2026-02-14 Fixed summary AI button becoming incorrectly disabled after typing by switching `AvAiAssist` usage to direct textarea source binding (`valueSourceSelector=\"#summary-text\"`) in `src/pages/app/resumes/[id].astro`; upgraded dependency to `@ansiversa/components@0.0.129` (lock `0.0.129`). Verification: `npm run typecheck` (0 errors, 1 existing hint) and `npm run build` (pass).
- 2026-02-14 AvAiAssist extraction refactor + proxy origin standardization: replaced inline summary AI modal/button in `src/pages/app/resumes/[id].astro` with shared `<AvAiAssist />` from `@ansiversa/components`, simplified store AI logic to event-driven append/replace handlers in `src/modules/resume-builder/store.ts`, removed obsolete AI modal CSS from `src/styles/global.css`, added `src/server/resolveParentOrigin.ts` and switched both local proxy routes (`src/pages/api/ai/suggest.ts`, `src/pages/api/notifications/unread-count.ts`) to canonical production `https://www.ansiversa.com` with non-prod env fallback chain (`WEB_ORIGIN` / `PUBLIC_WEB_ORIGIN` / existing root envs), and upgraded dependency to `@ansiversa/components@0.0.128`. Verification: `npm run typecheck` (0 errors, 1 existing hint), `npm run build` (pass).
- 2026-02-09 Enforced repo-level AGENTS mandatory task-log update rule for Codex/AI execution.
- 2026-02-09 Verified repo AGENTS contract linkage to workspace source-of-truth.
