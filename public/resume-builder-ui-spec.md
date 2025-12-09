
# Ansiversa Resume Builder – UI & Alpine Store Spec (MVP)

This document defines the **UI-only implementation** for the Ansiversa **Resume Builder** mini-app.

- Backend (DB, `astro:db`, `astro:actions`) is **already wired** → **do not modify** DB schema or actions.
- Focus on:
  - Pages and routes
  - Layout structure and components
  - Alpine.js store usage (using existing Alpine entrypoint)
  - Clean, reusable UI with `Av*` components

> Goal: Codex should be able to implement this UI **without guessing** architecture or breaking existing patterns.

---

## 1. Tech & Conventions

### 1.1 Stack Assumptions

- Framework: **Astro**
- Styling/UI: **`@ansiversa/components`** (Av* components) + Tailwind tokens via global.css
- State: **Alpine.js** via `@astrojs/alpinejs` integration
- Auth + layout: inherited from global Ansiversa layout (navbar, footer, etc.)

### 1.2 Important DO / DON’T

**DO**

- Use existing layout & Av components (e.g., `AvButton`, `AvCard`, `AvTable`, `AvInput`, `AvSelect`, `AvBadge`, `AvModal`, `AvTabs`, `AvToggle`, etc.).
- Use **Alpine `x-data`**, `x-init`, `x-model`, `x-on:*`, `x-show`, `x-transition` patterns.
- Use actions or internal API endpoints **only in JS** (fetch) or `<form method="POST">` as already done in the project.
- Follow existing **class naming / layout patterns** used in other apps (grid, responsive stack, etc.).

**DON’T**

- Don’t reconfigure or reinitialize Alpine manually in each page.
- Don’t change `astro.config.mjs` Alpine integration.
- Don’t modify DB schema / tables.
- Don’t implement your own CSS outside of the existing tokens unless absolutely necessary.

---

## 2. Routes & Pages (MVP Scope)

We freeze the following routes for **Resume Builder**:

| Page                         | Route               | Purpose                                  |
|------------------------------|---------------------|------------------------------------------|
| Resume List                  | `/resumes`          | Overview of all user resumes             |
| Resume Editor (new/existing) | `/resume/new`, `/resume/[id]` | Main resume builder/editor      |
| Templates Gallery            | `/templates`        | Choose template before/while editing     |
| Admin                        | `/admin`            | Manage templates, sections, presets      |

> Landing `/` already exists for this app and is **out of scope** here (only content tweaks later).

File suggestions (can be adapted to project style):

- `src/pages/resumes.astro`
- `src/pages/resume/new.astro` (or `src/pages/resume/index.astro` reading query params)
- `src/pages/resume/[id].astro`
- `src/pages/templates.astro`
- `src/pages/admin/index.astro`

---

## 3. Alpine Integration

### 3.1 Entry Point Pattern

Alpine is already installed and configured via `@astrojs/alpinejs`.

There should be a **single entrypoint** for this app, for example:

- `src/alpine.ts`

This file is loaded by the plugin via a **virtual entrypoint**. To keep it working:

- **Do NOT rename** this file.
- **Do NOT remove** the default export used by the plugin.

Example pattern to follow (in `src/alpine.ts`):

```ts
// src/alpine.ts
export default function initAlpine(Alpine: any) {
  // Register global stores here
  Alpine.store("resumeBuilder", createResumeBuilderStore());
  Alpine.store("resumeAdmin", createResumeAdminStore());
}

function createResumeBuilderStore() {
  return {
    // shared data for list/templates/editor
  };
}

function createResumeAdminStore() {
  return {
    // admin-only data
  };
}
```

> ⚠️ Important: If there is already logic in `src/alpine.ts`, **extend it**. Don’t overwrite/remove existing stores or exports.

### 3.2 Store Names & Responsibilities

We use two main Alpine stores:

1. **`resumeBuilder` store** – shared between:
   - `/resumes`
   - `/templates`
   - `/resume/[id]` & `/resume/new`

2. **`resumeAdmin` store** – used only by `/admin`.

#### 3.2.1 `resumeBuilder` store – Suggested Shape

```ts
function createResumeBuilderStore() {
  return {
    // Loading / error flags
    isLoading: false,
    error: null as string | null,

    // Collections
    resumes: [] as any[],      // Filled on /resumes
    templates: [] as any[],    // Filled on /templates and editor

    // Active selections
    activeResumeId: null as string | null,
    activeTemplateId: null as string | null,
    activeSectionId: null as string | null,

    // Editor state
    editor: {
      project: null as any | null,   // ResumeProject
      sections: [] as any[],         // Ordered list of sections
      previewHtml: "",               // Rendered resume HTML (server or client)
      isDirty: false,
      isSaving: false,
    },

    // ------- INIT HELPERS -------
    async initResumesPage() { /* Fetch list */ },
    async initTemplatesPage() { /* Fetch templates */ },
    async initEditorForResume(resumeId: string) { /* Fetch resume by id */ },
    async initEditorForNew(templateId?: string | null) { /* Create new draft */ },

    // ------- LIST PAGE ACTIONS -------
    async createNewResumeFromTemplate(templateId: string) { /* server call */ },
    async createBlankResume() { /* server call */ },
    async duplicateResume(resumeId: string) { /* server call */ },
    async deleteResume(resumeId: string) { /* soft delete or remove */ },

    // ------- EDITOR ACTIONS -------
    selectSection(sectionId: string) { /* set active section */ },
    addSection(sectionType: string) { /* add new section */ },
    removeSection(sectionId: string) { /* remove */ },
    moveSectionUp(sectionId: string) { /* reorder */ },
    moveSectionDown(sectionId: string) { /* reorder */ },
    updateField(sectionId: string, field: string, value: any) { /* x-model handler */ },

    async saveEditor() { /* call action to save */ },
    async refreshPreview() { /* fetch preview HTML */ },

    // ------- TEMPLATE ACTIONS (from editor) -------
    async changeTemplate(templateId: string) { /* server call to re-render preview */ },

    // Utils
    setError(msg: string | null) { this.error = msg; },
  };
}
```

> Codex: The above is a **guide**. Match it to existing API/action names in the repo and adapt types as needed. The key is to keep a **single shared store** for all resume-related pages.

#### 3.2.2 `resumeAdmin` store – Suggested Shape

```ts
function createResumeAdminStore() {
  return {
    isLoading: false,
    error: null as string | null,

    templates: [] as any[],
    sections: [] as any[],

    activeTemplateId: null as string | null,
    activeSectionId: null as string | null,

    async initAdmin() { /* fetch templates + sections */ },

    async createTemplate(payload: any) { /* call action */ },
    async updateTemplate(id: string, payload: any) { /* call action */ },
    async toggleTemplateEnabled(id: string) { /* call action */ },

    async createSection(payload: any) { /* call action */ },
    async updateSection(id: string, payload: any) { /* call action */ },
  };
}
```

**Important:** Admin store should be **simple** and stick to CRUD UI.

---

## 4. Page Specs

### 4.1 Resume List Page – `/resumes`

**File:** `src/pages/resumes.astro`

**Purpose:** Show all resumes for the logged-in user and allow quick actions.

#### 4.1.1 Layout

- Use global layout wrapper (same as other apps).
- Content width: typical center container (`av-page`, `max-w-5xl` or whatever pattern exists).

**Suggested structure:**

- Page header
  - Title: **“Your resumes”**
  - Description: short helper text.
  - Primary action: `New resume` button.
- Filters (optional for later): search by name, maybe target role.
- Resume list: **cards** or **table-like list**.

#### 4.1.2 Alpine Wiring

Top-level wrapper:

```html
<section
  class="av-page av-page--content"
  x-data
  x-init="$store.resumeBuilder.initResumesPage()"
>
```

- Use global store via `$store.resumeBuilder` (no inline state duplication here).

#### 4.1.3 Components

**Header:**

- `AvPageHeader` (if exists) or layout using:
  - `h1` with `text-2xl font-semibold`
  - `p` with subtle text class
  - Right-aligned `AvButton` with label **“New resume”**

**New resume button interactions:**
- If templates exist:
  - On click → open modal:
    - Options: “Start from template” (show template picker) and “Start from blank”.
- Simpler V1:
  - Click → route to `/resume/new` (blank resume).
  - Inside `/resume/new`, allow template selection.

**List / Cards:**

- Use `AvCard` for each resume row, or `AvTable` if table pattern is preferred.
- Display columns/fields:
  - Resume name
  - Target role / job title (if stored)
  - Last updated date
  - Status badge (Draft / Final)

Example card body:

```html
<div class="av-resume-card">
  <div class="av-resume-card-main">
    <h3 class="av-resume-card-title">
      {{ resume.title }}
    </h3>
    <p class="av-resume-card-subtitle">
      {{ resume.targetRole }} · Updated {{ resume.updatedAtRelative }}
    </p>
  </div>

  <div class="av-resume-card-actions">
    <AvButton size="sm" href={`/resume/${resume.id}`}>Edit</AvButton>
    <AvButton size="sm" variant="ghost" x-on:click="$store.resumeBuilder.duplicateResume(resume.id)">Duplicate</AvButton>
    <AvButton size="sm" variant="ghost" x-on:click="$store.resumeBuilder.downloadPdf(resume.id)">Download PDF</AvButton>
    <AvButton size="sm" variant="ghost" color="danger" x-on:click="$store.resumeBuilder.deleteResume(resume.id)">
      Delete
    </AvButton>
  </div>
</div>
```

> Codex: Use the **actual** AvButton props (variant, size, etc.) from components library. Above is conceptual.

**Empty state:**

If `resumes.length === 0`, show an empty state card:

- Title: “No resumes yet”
- Text: “Create your first resume in minutes.”
- Primary button: “Create resume” → `/resume/new`

#### 4.1.4 Loading/Error UI

- If `$store.resumeBuilder.isLoading` → show a loader or skeleton list.
- If `$store.resumeBuilder.error` → show `AvAlert` or equivalent near top.

---

### 4.2 Resume Editor Page – `/resume/new`, `/resume/[id]`

**Files:**

- `src/pages/resume/new.astro` – create new
- `src/pages/resume/[id].astro` – edit existing

**Purpose:** Main resume builder with sidebar sections, edit form, and live preview.

#### 4.2.1 Layout

Overall layout: **three-column** at desktop, stacked on mobile.

- **Left sidebar** – sections list & controls (25% width)
- **Middle panel** – section form (40–45% width)
- **Right panel** – resume preview (35–40% width)

Use responsive classes so that on small screens:

- Sidebar collapses into top tabs or `Disclosure` style.
- Preview can be toggled with a button (“Show preview”).

#### 4.2.2 Alpine Wiring

Top-level wrapper:

```html
<section
  class="av-page av-page--content av-resume-editor"
  x-data
  x-init="
    $store.resumeBuilder.error = null;
    $store.resumeBuilder.isLoading = true;
    (async () => {
      const id = /* read from dataset or server-injected variable */;
      if (id) {
        await $store.resumeBuilder.initEditorForResume(id);
      } else {
        const templateId = $el.dataset.templateId || null;
        await $store.resumeBuilder.initEditorForNew(templateId);
      }
      $store.resumeBuilder.isLoading = false;
    })()
  "
  x-bind:data-resume-id="Astro.props.resumeId"
  x-bind:data-template-id="Astro.props.templateId"
>
```

> Codex: Use Astro server-side props (`const { resumeId, templateId } = Astro.props`) and inject them as `data-*` attributes if needed. Don’t do complex JS string building.

#### 4.2.3 Header

Top area of editor:

- Left side:
  - Breadcrumb: `Resumes > {Resume Title}`
  - Editable title field using `AvInput`:
    - `x-model="$store.resumeBuilder.editor.project.title"`
- Right side:
  - Template name (badge)
  - Save status (`Saved`, `Saving…`)
  - Buttons:
    - `Change template`
    - `Export PDF`
    - (Later) `Share`

Example:

```html
<header class="av-resume-editor-header">
  <div class="av-resume-editor-title">
    <p class="av-breadcrumb">Resumes / <span x-text="$store.resumeBuilder.editor.project.title || 'Untitled resume'"></span></p>
    <AvInput
      name="resumeTitle"
      label="Resume title"
      x-model="$store.resumeBuilder.editor.project.title"
      x-on:input="$store.resumeBuilder.editor.isDirty = true"
    />
  </div>

  <div class="av-resume-editor-actions">
    <span class="av-template-pill" x-text="$store.resumeBuilder.editor.project.templateName"></span>
    <span class="av-save-indicator" x-text="$store.resumeBuilder.editor.isSaving ? 'Saving…' : 'Saved'"></span>
    <AvButton size="sm" variant="outline" x-on:click="$store.resumeBuilder.openChangeTemplateModal()">Change template</AvButton>
    <AvButton size="sm" x-on:click="$store.resumeBuilder.downloadPdf($store.resumeBuilder.editor.project.id)">Export PDF</AvButton>
  </div>
</header>
```

#### 4.2.4 Sidebar – Sections List

Left column: list of all sections in the resume.

The data comes from `$store.resumeBuilder.editor.sections` with each section having:

- `id`
- `type` (e.g., "profile", "experience", "education", "skills", "projects", "custom")
- `label`
- `isRequired` (optional)
- `isCollapsed` (optional)

UI behaviors:

- Clicking on a section → calls `selectSection(section.id)`.
- Show selected state with border/background highlight.
- Show simple icons for drag/reorder (no need for real drag-and-drop; use up/down buttons).

Pseudo-HTML:

```html
<aside class="av-resume-editor-sidebar">
  <div class="av-sidebar-header">
    <h2>Sections</h2>
    <AvButton size="sm" variant="ghost" x-on:click="$store.resumeBuilder.openAddSectionModal()">+ Add section</AvButton>
  </div>

  <ul class="av-section-list">
    <template x-for="section in $store.resumeBuilder.editor.sections" :key="section.id">
      <li
        class="av-section-item"
        x-bind:class="{
          'av-section-item--active': section.id === $store.resumeBuilder.activeSectionId
        }"
        x-on:click="$store.resumeBuilder.selectSection(section.id)"
      >
        <div class="av-section-item-main">
          <span class="av-section-item-label" x-text="section.label"></span>
          <span
            class="av-section-item-required"
            x-show="section.isRequired"
          >
            Required
          </span>
        </div>
        <div class="av-section-item-controls">
          <button type="button" x-on:click.stop="$store.resumeBuilder.moveSectionUp(section.id)">↑</button>
          <button type="button" x-on:click.stop="$store.resumeBuilder.moveSectionDown(section.id)">↓</button>
          <button
            type="button"
            x-on:click.stop="$store.resumeBuilder.removeSection(section.id)"
            x-show="!section.isRequired"
          >
            ✕
          </button>
        </div>
      </li>
    </template>
  </ul>
</aside>
```

#### 4.2.5 Middle Panel – Section Form

This panel shows **inputs** for the currently selected section.

- Use `x-effect` / `x-show` to show form only for active section.
- Each section type has different fields:
  - **Profile:** Name, headline, summary, location, contact info.
  - **Experience:** List of jobs with role, company, dates, bullets.
  - **Education:** List with degree, institute, year.
  - **Skills:** Skill groups, tags, proficiency.
  - **Projects:** Title, stack, description, link.
  - **Custom section:** Title + rich text.

We can use **conditional templates** based on `section.type`:

```html
<main class="av-resume-editor-main">
  <template x-if="$store.resumeBuilder.activeSectionId">
    <div>
      <template
        x-for="section in $store.resumeBuilder.editor.sections"
        :key="section.id"
      >
        <div x-show="section.id === $store.resumeBuilder.activeSectionId">
          <h2 class="av-section-form-title" x-text="section.label"></h2>
          <!-- Different partials per section.type -->
          <template x-if="section.type === 'profile'">
            <div class="av-section-form">
              <AvInput label="Full name" x-model="section.data.fullName" x-on:input="$store.resumeBuilder.editor.isDirty = true" />
              <AvInput label="Headline" x-model="section.data.headline" />
              <AvTextarea label="Summary" x-model="section.data.summary" rows="4" />
              <!-- Contact fields... -->
            </div>
          </template>

          <template x-if="section.type === 'experience'">
            <div class="av-section-form">
              <template x-for="(item, index) in section.items" :key="item.id">
                <AvCard class="av-section-item-card">
                  <AvInput label="Job title" x-model="item.title" />
                  <AvInput label="Company" x-model="item.company" />
                  <div class="av-inline-fields">
                    <AvInput label="Start date" x-model="item.startDate" />
                    <AvInput label="End date" x-model="item.endDate" />
                  </div>
                  <AvTextarea label="Highlights" x-model="item.description" rows="3" />
                  <AvButton size="xs" variant="ghost" x-on:click="$store.resumeBuilder.removeExperience(section.id, item.id)">Remove</AvButton>
                </AvCard>
              </template>

              <AvButton size="sm" variant="outline" x-on:click="$store.resumeBuilder.addExperience(section.id)">
                + Add experience
              </AvButton>
            </div>
          </template>

          <!-- Add similar blocks for education, skills, projects, custom -->
        </div>
      </template>
    </div>
  </template>
</main>
```

> Codex: Look at existing patterns in other mini-apps for lists of items (e.g., FlashNote, Quiz). Reuse the same AvCard, spacing, and buttons style.

#### 4.2.6 Right Panel – Live Preview

Right column shows a **PDF-like preview**.

Options for implementation (UI-only description, backend decides):

- The preview can be **HTML** returned from the server using the selected template and current data.
- Or a simplified on-the-fly render on the client.

UI behaviour:

- When the editor loads, preview is fetched once.
- On save or change template, preview is refreshed.
- Allow scroll inside preview area.

Example markup:

```html
<aside class="av-resume-editor-preview">
  <div class="av-preview-header">
    <h2>Preview</h2>
    <AvButton size="xs" variant="ghost" x-on:click="$store.resumeBuilder.refreshPreview()">Refresh</AvButton>
  </div>

  <div
    class="av-preview-frame"
    x-html="$store.resumeBuilder.editor.previewHtml"
  ></div>
</aside>
```

> Codex: Ensure `x-html` input is sanitized on the server side or uses trusted template output. Don’t do any unsafe client-side templating here.

#### 4.2.7 Autosave / Save Button

- On any change (`x-model`), mark `isDirty = true`.
- Provide a **Save** button at the bottom of the middle panel.
- When saving:
  - Set `isSaving = true`, `isDirty = false` when done.
  - Optionally auto-refresh preview.

```html
<footer class="av-resume-editor-footer">
  <span x-show="$store.resumeBuilder.editor.isDirty && !$store.resumeBuilder.editor.isSaving">Unsaved changes</span>
  <span x-show="$store.resumeBuilder.editor.isSaving">Saving…</span>
  <AvButton
    x-on:click="$store.resumeBuilder.saveEditor()"
    :disabled="$store.resumeBuilder.editor.isSaving || !$store.resumeBuilder.editor.isDirty"
  >
    Save
  </AvButton>
</footer>
```

---

### 4.3 Templates Page – `/templates`

**File:** `src/pages/templates.astro`

**Purpose:** Let users choose a template before starting or while editing a resume.

#### 4.3.1 Layout

- Header:
  - Title: **“Templates”**
  - Description: “Pick a layout that matches your style. You can change templates anytime.”
- Filters row:
  - Dropdowns: Category (Simple/Modern/Creative), Role/Industry, Experience level.
- Templates grid:
  - Each card shows:
    - Thumbnail/preview
    - Template name
    - Tags/pills (e.g., “ATS-friendly”, “One-page”, “Creative”)
    - Primary button: **Use this template**
    - Secondary: **Preview**

#### 4.3.2 Alpine Wiring

Top-level:

```html
<section
  class="av-page av-page--content"
  x-data
  x-init="$store.resumeBuilder.initTemplatesPage()"
>
```

Filter controls use `x-model` to set local filter props (e.g., `$store.resumeBuilder.templateFilters` or simple local `x-data` object).

Template card:

```html
<template x-for="template in $store.resumeBuilder.templates" :key="template.id">
  <AvCard class="av-template-card">
    <div class="av-template-thumbnail">
      <!-- Could be an image, or a simplified preview block -->
    </div>
    <div class="av-template-body">
      <h3 x-text="template.name"></h3>
      <p x-text="template.description"></p>
      <div class="av-template-tags">
        <AvBadge
          size="sm"
          x-text="tag"
          x-for="tag in template.tags"
        ></AvBadge>
      </div>
      <div class="av-template-actions">
        <AvButton
          size="sm"
          x-on:click="$store.resumeBuilder.createNewResumeFromTemplate(template.id)"
        >
          Use this template
        </AvButton>
        <AvButton
          size="sm"
          variant="ghost"
          x-on:click="$store.resumeBuilder.openTemplatePreview(template.id)"
        >
          Preview
        </AvButton>
      </div>
    </div>
  </AvCard>
</template>
```

**Preview modal:**

- Use `AvModal` or similar component.
- `x-show="$store.resumeBuilder.modals.templatePreview.isOpen"`.

---

### 4.4 Admin Page – `/admin`

**File:** `src/pages/admin/index.astro`

**Purpose:** Internal admin tools to manage **templates**, **sections**, and optionally **content presets**.

#### 4.4.1 Access Control

- UI assumption: Access is already controlled at the route or middleware level.
- Don’t add complex permission logic in the page itself; rely on server.

#### 4.4.2 Layout

- Page header: “Resume Builder Admin”.
- Tabs:
  - `Templates`
  - `Sections`
  - (Optional later: `Presets`)

Use `AvTabs` or simple tab buttons with `x-data="{ tab: 'templates' }"`.

#### 4.4.3 Alpine Wiring

Top-level:

```html
<section
  class="av-page av-page--content"
  x-data="{ tab: 'templates' }"
  x-init="$store.resumeAdmin.initAdmin()"
>
```

#### 4.4.4 Templates Tab

- Table of templates:
  - Name
  - Key/slug
  - Type (Simple/Modern/etc.)
  - Enabled (toggle)
- Actions per row:
  - Edit
  - Duplicate (optional)
  - Delete (only if not in use or allowed by backend)

Use `AvTable` + `AvSwitch` for status.

Row example:

```html
<tr>
  <td x-text="template.name"></td>
  <td x-text="template.slug"></td>
  <td x-text="template.style"></td>
  <td>
    <AvSwitch
      x-model="template.enabled"
      x-on:change="$store.resumeAdmin.toggleTemplateEnabled(template.id)"
    />
  </td>
  <td>
    <AvButton size="xs" variant="ghost" x-on:click="$store.resumeAdmin.openEditTemplate(template.id)">Edit</AvButton>
  </td>
</tr>
```

**Create/Edit Template Modal:**

- Fields:
  - Name
  - Slug
  - Style (select)
  - Page layout options (1-column, 2-column, etc.)
  - Default font family
  - Default accent color
- Save via `resumeAdmin.createTemplate` or `resumeAdmin.updateTemplate`.

#### 4.4.5 Sections Tab

- List all available section types in a table:
  - Label
  - Type key (`profile`, `experience`, etc.)
  - Required? (boolean)
  - Enabled? (boolean)
- Use similar pattern of `AvTable` + actions.

**Creation/edit modal** defines:

- Label shown in UI
- Type key used in schema
- Fields configuration (for now, keep simple free text/JSON blob or limited set; details depend on existing DB).

> Codex: Reuse patterns from any existing admin-like page in other apps (if present) to keep UI consistent.

---

## 5. Shared UI Patterns

### 5.1 Loading State

At the top of each page, show a lightweight loading indicator when the relevant store is loading:

```html
<div x-show="$store.resumeBuilder.isLoading" class="av-loading-bar"></div>
```

Or use `AvSkeleton` style components for list/cards.

### 5.2 Toasts / Notifications

If the project has a shared toast mechanism (global store), use it:

- On successful save: “Resume saved”
- On error: show message from `error` field.

If not, use a simple `x-show` block near top.

### 5.3 Responsive Behavior

Key rules:

- `resumes` page: cards stack on small screens, two columns on medium, three on large (depending on design tokens).
- `resume` editor: three columns on desktop → stacked vertical on small screens, with preview toggled via button.
- `templates` grid: 1 column on mobile, 2 on tablet, 3+ on desktop.

---

## 6. Checklist for Codex

When implementing, **verify each item**:

1. ✅ **Do not change** `astro.config.mjs` Alpine config or remove existing `src/alpine.ts` exports.
2. ✅ Add/extend `resumeBuilder` and `resumeAdmin` stores in `src/alpine.ts` only.
3. ✅ Create/verify pages:
   - `/resumes`
   - `/resume/new`
   - `/resume/[id]`
   - `/templates`
   - `/admin`
4. ✅ Use only `@ansiversa/components` (Av* components) and existing Tailwind tokens.
5. ✅ Wire Alpine via `$store.resumeBuilder` and `$store.resumeAdmin` instead of local inline state duplication.
6. ✅ Use backend actions only through fetch or forms; **don’t** modify action implementations.
7. ✅ Implement clean empty states, loading states, and error views.
8. ✅ Ensure layout matches global Ansiversa design (spacing, typography, radius, etc.).
9. ✅ Test:
   - Creating a new resume
   - Editing sections
   - Changing template (if wired)
   - Viewing templates
   - Admin: editing templates & sections.

If something in the backend is unclear, **stop and keep UI generic** rather than inventing new DB fields or action names.

---

End of spec.
