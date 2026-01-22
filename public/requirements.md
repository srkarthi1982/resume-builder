✅ Codex Task: Resume Builder — User Pages + DB + CRUD + Alpine Store (No Admin)
Context

We already froze these decisions:

No admin pages (user-only app pages)

4 templates are already implemented and are the output contract

PDF/Print background must be white (print-safe)

Use app-starter structure as reference (modules folder wiring, actions style, store pattern, page layout)

Goal today: finish the user pages end-to-end with DB tables, CRUD actions, and Alpine store interactions wired to the existing template preview components.

Scope (Must do)
1) DB Tables (Astro DB)

Create Resume Builder tables (user-owned data) and link everything to the authenticated user.

Tables

ResumeProjects

id (uuid/text) primary

userId (text) required (owner)

title (text) required

templateKey (text) required (one of the 4 templates)

isDefault (boolean) default false

createdAt, updatedAt

ResumeSections

id primary

projectId FK → ResumeProjects.id (cascade delete)

key (text) required (ex: summary, experience, education, skills, projects, certifications etc.)

order (number/int) required

isEnabled (boolean) default true

timestamps

ResumeItems

id primary

sectionId FK → ResumeSections.id (cascade delete)

order (number/int) required

data (json/text) required (store item payload as JSON; keep flexible)

timestamps

Notes

Enforce ownership by always joining through ResumeProjects.userId.

Add indexes on userId, projectId, sectionId (if app-starter style supports).

Keep schema minimal and stable.

2) Actions (CRUD)

Implement actions in the same style/pattern as app-starter (server-side validation, typed DTOs).

Required actions

listResumeProjects() → returns projects for current user ordered by updatedAt desc

createResumeProject({ title, templateKey }) → creates project + seeds default sections

getResumeProject({ projectId }) → loads full project with sections + items (ownership checked)

updateResumeProject({ projectId, title?, templateKey? })

deleteResumeProject({ projectId })

setDefaultResumeProject({ projectId })

Ensure only one default per user (unset previous defaults)

upsertSection({ projectId, key, order, isEnabled }) (optional if needed)

addOrUpdateItem({ projectId, sectionKey, itemId?, order, data })

deleteItem({ projectId, itemId })

Seed behavior on create
When creating a project, seed common sections for resume (based on our template/data contract). Use a stable ordered list, example:

profile/header

summary

experience

education

skills

projects

certifications

achievements (optional)
(If our preview components already expect specific keys, match them.)

3) Alpine Store (modules)

Create a resume module store using the same app-starter approach:

state: projects, activeProject, activeProjectId, loading, error

methods:

init() (load list; select default)

createProject()

loadProject(id)

saveProjectMeta()

setDefault(id)

addItem(sectionKey)

updateItem(sectionKey, item)

deleteItem(itemId)

keep all calls going through actions.

ensure store maps DB output into the shape expected by the existing template components.

4) User Pages (2–3 core screens)

No admin routes. Only user routes.

Page A: Resume List
Route suggestion: /app/resumes

Shows list of user’s resume projects

Buttons:

Create new resume

Set default

Edit

Preview/Print

Delete

Uses Av components + shared layout.

Page B: Resume Editor
Route suggestion: /app/resumes/[id]

Left side: section list (ordered)

Clicking a section opens a right-side drawer to edit:

profile fields (name, title, contact, links)

summary text

experience items (repeatable)

education items (repeatable)

skills list

etc.

Live preview panel on the side using the existing template preview component.

Save happens automatically on changes (debounce ok) OR explicit save button (either is fine, prefer explicit save for v1 stability).

Page C: Print / Preview
Route suggestion: /app/resumes/[id]/print

Uses print-safe layout:

white page background

proper page breaks

Renders chosen template with same data.

Provide a “Print / Download PDF” button that triggers browser print.

5) Remove Example Module (IMPORTANT)

After resume-builder pages work end-to-end:

Remove app-starter example tables/actions/pages/module folders that are not needed.

Keep only what resume-builder uses.

Update imports accordingly and ensure build passes.

Acceptance Criteria

 npm run typecheck passes

 npm run build --remote passes (or normal build for repo standard)

 Logged-in user can:

create multiple resumes

set one default

edit sections/items via drawer

see live preview update

open print page and print with white background

delete a resume

 All data is correctly scoped by userId

 Example starter files removed after implementation

 AGENTS.md updated with what changed + what commands were run

Implementation Notes (to prevent errors)

Follow app-starter patterns exactly for:

guards/auth user retrieval

action validation

module wiring

Av component usage (no raw Tailwind)

Keep JSON data field flexible but stable (don’t over-normalize now).

Do not introduce admin pages or admin roles.

Deliverable

PR-ready commits with:

DB schema

actions

store module

2–3 user pages

removal of example starter code

AGENTS.md logs