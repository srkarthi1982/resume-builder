# Resume Builder â€“ Final Components Specification (For Codex)

This file consolidates **all missing components** needed for the Resume Builder mini-app:

- New **reusable Av components** (generic, no â€œresumeâ€ in the name)
- New **app-specific AvResume* components** (only for this app)

All components should be:

- **Pure Astro** components (`.astro` only)
- Internally using existing Av components from `@ansiversa/components`
  - e.g. `AvButton`, `AvCard`, `AvContainer`, `AvInput`, `AvTextarea`, `AvSelect`, `AvTabs`, `AvModal` (if available)
- Styled using **semantic `av-*` classes**, not raw Tailwind utilities.
- Any new styles must use semantic names like `av-page-header`, `av-toolbar`, `av-resume-editor`, etc., and be added to the appâ€™s CSS (later moved into global.css).

---

## FOLDER STRUCTURE

In the **resume-builder app** repo, create:

```text
src/
  components/
    common/        # reusable Av components (later move to @ansiversa/components)
      AvPageHeader.astro
      AvEmptyState.astro
      AvToolbar.astro
      AvConfirmDialog.astro
      AvItemList.astro
      AvChipList.astro
      AvLinkList.astro
      AvTemplateCard.astro
      AvTemplateGrid.astro

    resume/        # app-specific components for Resume Builder only
      AvResumeEditorShell.astro
      AvResumeSectionList.astro
      AvResumeSectionFormShell.astro
      AvResumeCard.astro
```

---

# PART A â€“ REUSABLE (GLOBAL) AV COMPONENTS

These are **generic UI components** that do NOT contain â€œResumeâ€ in their names.  
They should be designed so we can later move them into `@ansiversa/components` with minimal changes.

---

## 1. AvPageHeader.astro

**Path:** `src/components/common/AvPageHeader.astro`  

**Purpose:**  
Standard page header with title, description, and optional primary/secondary actions.  
Use for dashboards, editors, index pages, etc.

### Props

```ts
interface AvPageHeaderAction {
  label: string;
  href?: string;
  onClick?: string; // Alpine expression (optional)
  variant?: "primary" | "outline" | "ghost";
}

interface Props {
  title: string;
  description?: string;
  primaryAction?: AvPageHeaderAction;
  secondaryAction?: AvPageHeaderAction;
}
```

### Behavior

- Wrap content in `AvContainer`.
- Render:
  - Title with `av-page-title` / `av-section-title`.
  - Description with `av-section-lead`.
  - Actions aligned on the right using `AvButton`.

---

## 2. AvEmptyState.astro

**Path:** `src/components/common/AvEmptyState.astro`  

**Purpose:**  
Generic empty-state component used when there is no data (resumes, notes, etc.).

### Props

```ts
interface Props {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}
```

### Behavior

- Centered `AvCard` or `div` styled via `av-empty-state`.
- Displays title, description, and optional primary action (`AvButton`) if `actionHref` is provided.

---

## 3. AvToolbar.astro

**Path:** `src/components/common/AvToolbar.astro`  

**Purpose:**  
Generic top toolbar for editor-like layouts (save state, actions, etc.).

### Props

```ts
type AvSaveStatus = "idle" | "saving" | "saved" | "error";

interface ToolbarAction {
  label: string;
  href?: string;
  onClick?: string;
  variant?: "primary" | "outline" | "ghost";
}

interface Props {
  saveStatus?: AvSaveStatus;
  lastSavedAt?: string;
  leftActions?: ToolbarAction[];
  rightActions?: ToolbarAction[];
}
```

### Behavior

- Left area:
  - Save status text:
    - `saving` â†’ â€œSavingâ€¦â€
    - `saved` â†’ â€œAll changes savedâ€
    - `error` â†’ â€œError saving changesâ€
  - Optionally display `lastSavedAt`.
- Right area:
  - Map `rightActions` to `AvButton`s.

---

## 4. AvConfirmDialog.astro

**Path:** `src/components/common/AvConfirmDialog.astro`  

**Purpose:**  
Generic confirmation dialog for destructive actions (delete resume, delete item, etc.).

### Props

```ts
interface Props {
  title: string;
  description?: string;
  confirmLabel?: string; // default: "Delete"
  cancelLabel?: string;  // default: "Cancel"
}
```

### Behavior

- Uses `AvModal` (if available) or a generic modal structure styled as `av-modal`.
- Layout:
  - Title
  - Description
  - Buttons row: Cancel (secondary), Confirm (danger/primary)
- Visibility controlled by Alpine at parent level (e.g. `x-show` binding).

---

## 5. AvItemList.astro

**Path:** `src/components/common/AvItemList.astro`  

**Purpose:**  
Generic list for items like jobs, degrees, documents, etc.

### Props

```ts
interface AvItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  isActive?: boolean;
}

interface Props {
  items: AvItem[];
}
```

### Behavior

- Renders a vertical list with `av-item-list` classes.
- Each item shows:
  - Title (prominent)
  - Subtitle (muted)
  - Meta line (e.g. date + location)
- Support a named slot `"actions"` per item (for edit/delete buttons).
- Provide `data-item-id` attribute for Alpine wiring.

---

## 6. AvChipList.astro

**Path:** `src/components/common/AvChipList.astro`  

**Purpose:**  
Generic chip/pill list component for tags/skills/categories.

### Props

```ts
interface AvChip {
  id: string;
  label: string;
  category?: string;
  level?: string;
}

interface Props {
  chips: AvChip[];
}
```

### Behavior

- Renders chips using `av-chip` styles.
- Can show category/level as small text.
- Optional `"chip-actions"` slot to render action icons per chip.

---

## 7. AvLinkList.astro

**Path:** `src/components/common/AvLinkList.astro`  

**Purpose:**  
Generic external links list (LinkedIn, GitHub, portfolio, etc.).

### Props

```ts
interface AvLinkItem {
  id: string;
  label: string;
  url: string;
}

interface Props {
  links: AvLinkItem[];
}
```

### Behavior

- Shows label + URL.
- Optional `"actions"` slot for edit/remove controls.

---

## 8. AvTemplateCard.astro

**Path:** `src/components/common/AvTemplateCard.astro`  

**Purpose:**  
Generic template card for gallery views (resume templates, document templates, etc.).

### Props

```ts
interface Props {
  name: string;
  description?: string;
  accentClass?: string;   // semantic, e.g. "av-template-accent--modern"
  href?: string;          // link to "use" template
}
```

### Behavior

- Uses `AvCard`.
- Renders:
  - Template name
  - Short description
  - Primary/ghost `AvButton` â€œUse Templateâ€ if `href` provided.

---

## 9. AvTemplateGrid.astro

**Path:** `src/components/common/AvTemplateGrid.astro`  

**Purpose:**  
Generic grid wrapper for multiple `AvTemplateCard`s.

### Props

```ts
interface AvTemplate {
  key: string;
  name: string;
  description?: string;
  accentClass?: string;
  href?: string;
}

interface Props {
  templates: AvTemplate[];
}
```

### Behavior

- Wraps content in a container + `av-section-grid`.
- Loops over `templates` and renders `AvTemplateCard` for each.

---

# PART B â€“ RESUME-SPECIFIC COMPONENTS (APP-LEVEL)

These components are **specific** to the Resume Builder app.  
They can use the `AvResume*` prefix and should **stay** in this repo.

---

## 10. AvResumeEditorShell.astro

**Path:** `src/components/resume/AvResumeEditorShell.astro`  

**Purpose:**  
Layout shell for the resume editor page (sidebar + preview).

### Slots

- `sidebar` â€“ left side: section list + forms
- `preview` â€“ right side: live resume preview

### Behavior

- Uses `AvContainer`.
- Two-column layout with `av-resume-editor`, `av-resume-editor__sidebar`, `av-resume-editor__preview` classes.
- Mobile: stacked (sidebar top, preview bottom).

---

## 11. AvResumeSectionList.astro

**Path:** `src/components/resume/AvResumeSectionList.astro`  

**Purpose:**  
Sidebar section navigation for resume sections.

### Props

```ts
interface AvResumeSection {
  id: string;
  type: string;
  title: string;
  isVisible: boolean;
  isActive: boolean;
}

interface Props {
  sections: AvResumeSection[];
}
```

### Behavior

- Renders list with `av-resume-section-list` styles.
- Active section styled via `av-resume-section-list__item--active`.
- Each item has `data-section-id` for Alpine click handling.

---

## 12. AvResumeSectionFormShell.astro

**Path:** `src/components/resume/AvResumeSectionFormShell.astro`  

**Purpose:**  
Standard wrapper for any section form (Summary, Experience, Education, etc.).

### Props

```ts
interface Props {
  title: string;
  description?: string;
}
```

### Slots

- Default â†’ form fields
- `actions` â†’ buttons like â€œAdd roleâ€, â€œAdd projectâ€, etc.

### Behavior

- Uses `AvCard` with `av-resume-section-form` styles.
- Renders title + description at the top.
- Form controls in body (using default slot).
- Optional footer actions area (slot `"actions"`).

---

## 13. AvResumeCard.astro

**Path:** `src/components/resume/AvResumeCard.astro`  

**Purpose:**  
Specific card used on `/app/resumes` to represent a single resume.

### Props

```ts
interface Props {
  title: string;
  targetRole?: string;
  location?: string;
  updatedAt?: string;
  isPrimary?: boolean;
  editHref?: string;
  downloadHref?: string;
}
```

### Behavior

- Uses `AvCard`, `AvButton`.
- Layout:
  - Title
  - Target role
  - Location
  - â€œPrimaryâ€ badge if `isPrimary`
  - Footer with â€œEditâ€ and â€œDownload PDFâ€ buttons.
- Optional slot `"menu"` for extra actions (e.g. delete, make primary).

---

# IMPLEMENTATION NOTES FOR CODEX

1. **All components are pure `.astro`.**

2. **Imports:**
   - Use existing components from `@ansiversa/components` where needed:
     - `AvButton`, `AvCard`, `AvContainer`, `AvDivider`, `AvInput`, `AvTextarea`, `AvSelect`, `AvTabs`, `AvModal`, etc.

3. **Styling:**
   - No raw Tailwind in templates.
   - Use semantic class names like:
     - `av-page-header`, `av-empty-state`, `av-toolbar`, `av-item-list`, `av-chip-list`, `av-link-list`, `av-template-card`, `av-template-grid`
     - `av-resume-editor`, `av-resume-section-list`, `av-resume-section-form`, `av-resume-card`
   - Define these classes in the appâ€™s CSS file (later we will move them into global.css in the components library).

4. **Interactivity:**
   - Components are presentational.
   - Parent pages and Alpine store handle:
     - Click actions (using `onClick` strings or `data-*` attributes)
     - Open/close of dialogs
     - Selected section, selected resume, etc.

---

# HOW TO USE THIS FILE

You can instruct Codex:

> â€œIn the resume-builder app repo, create all the components described in this file under the given paths. Use only Av components internally and av-* semantic classes, no Tailwind utilities. Follow the props and behavior exactly.â€

This is the **final consolidated spec** for all missing components needed by Resume Builder.  
