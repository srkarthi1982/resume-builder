# Resume Builder – Database Tables (Ansiversa Standard)

This file defines the **core tables for the Resume Builder mini-app**.

- Storage is assumed to be **Turso/libSQL (SQLite)**.
- Auth lives in the **parent Ansiversa app**, so we only store `userId` as a foreign key reference to the parent `Users.id`.
- This schema is designed for:
  - Multiple resumes per user
  - Flexible sections (experience, education, skills, etc.)
  - Re-ordering sections and items
  - Future AI helpers (suggestions, rewrites)

Use this as the **single source of truth** for creating tables and Astro DB models.

---

## 1. `resume_templates`

Master list of templates available in the app (Modern Blue, Minimal White, etc.).

```sql
CREATE TABLE resume_templates (
  id              TEXT PRIMARY KEY,                -- ulid / uuid
  key             TEXT NOT NULL UNIQUE,            -- e.g. 'modern-blue', 'minimal-white'
  name            TEXT NOT NULL,                   -- Display name
  description     TEXT,                            -- Short description for UI
  is_default      INTEGER NOT NULL DEFAULT 0,      -- 1 = default template when user creates a resume
  is_active       INTEGER NOT NULL DEFAULT 1,      -- 1 = visible in template picker
  created_at      TEXT NOT NULL,                   -- ISO timestamp
  updated_at      TEXT NOT NULL                    -- ISO timestamp
);
```

Notes:
- Seed with the templates shown on the landing page:
  - `modern-blue`
  - `minimal-white`
  - `two-column-professional`
  - `creative-accent`
  - `executive-serif`
  - `clean-monoline`

---

## 2. `resumes`

One record per resume a user creates.

```sql
CREATE TABLE resumes (
  id                TEXT PRIMARY KEY,               -- ulid / uuid
  user_id           TEXT NOT NULL,                  -- references parent Users.id (string)
  title             TEXT NOT NULL,                  -- internal name, e.g. 'Product Manager Resume'
  target_role       TEXT,                           -- e.g. 'Senior Product Manager'
  target_industry   TEXT,                           -- e.g. 'Fintech', 'Healthcare'
  location          TEXT,                           -- e.g. 'Dubai, UAE'
  summary           TEXT,                           -- optional top summary / objective
  template_key      TEXT NOT NULL,                  -- FK to resume_templates.key
  is_primary        INTEGER NOT NULL DEFAULT 0,     -- 1 if this is the primary resume for the user
  last_used_at      TEXT,                           -- last time user opened/edited this resume
  created_at        TEXT NOT NULL,                  -- ISO timestamp
  updated_at        TEXT NOT NULL                   -- ISO timestamp
  deleted_at        TEXT                            -- soft delete, NULL if active
);

CREATE INDEX idx_resumes_user_id ON resumes (user_id);
CREATE INDEX idx_resumes_template_key ON resumes (template_key);
```

Notes:
- `template_key` allows the user to switch templates but still know the current one.
- `summary` here is a **high-level summary**; sections can also contain more detailed text.

---

## 3. `resume_sections`

Flexible, ordered sections inside each resume:
- Experience
- Education
- Skills
- Projects
- Certifications
- Achievements
- Links
- Custom sections

```sql
CREATE TABLE resume_sections (
  id              TEXT PRIMARY KEY,                 -- ulid / uuid
  resume_id       TEXT NOT NULL,                    -- FK -> resumes.id
  type            TEXT NOT NULL,                    -- e.g. 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements', 'links', 'custom'
  title           TEXT NOT NULL,                    -- Display title, e.g. 'Work Experience', 'Education'
  sort_order      INTEGER NOT NULL DEFAULT 0,       -- order of sections in the resume
  is_visible      INTEGER NOT NULL DEFAULT 1,       -- 1 = shown on resume, 0 = hidden
  layout_variant  TEXT,                             -- optional, e.g. 'two-column', 'compact', 'full-width'
  created_at      TEXT NOT NULL,                    -- ISO timestamp
  updated_at      TEXT NOT NULL                     -- ISO timestamp
);

CREATE INDEX idx_sections_resume_id ON resume_sections (resume_id);
CREATE INDEX idx_sections_resume_sort ON resume_sections (resume_id, sort_order);
```

Notes:
- `type` is stored as TEXT so we can add new types later without migrations.
- Section order is controlled by `sort_order`.

---

## 4. `resume_items`

Individual items within a section.  
For example:
- Each job in the **Experience** section
- Each degree in **Education**
- Each project in **Projects**
- Each certification in **Certifications**

```sql
CREATE TABLE resume_items (
  id              TEXT PRIMARY KEY,                 -- ulid / uuid
  section_id      TEXT NOT NULL,                    -- FK -> resume_sections.id
  title           TEXT NOT NULL,                    -- e.g. 'Senior Software Engineer', 'B.Tech Computer Science'
  subtitle        TEXT,                             -- e.g. company or institution name
  location        TEXT,                             -- e.g. 'Chennai, India'
  start_date      TEXT,                             -- ISO date (YYYY-MM-DD) or NULL
  end_date        TEXT,                             -- ISO date or NULL
  is_current      INTEGER NOT NULL DEFAULT 0,       -- 1 if ongoing
  description     TEXT,                             -- optional paragraph/description
  bullets         TEXT,                             -- JSON-encoded array of bullet strings (for achievements)
  metadata        TEXT,                             -- JSON-encoded extra fields (for future use)
  sort_order      INTEGER NOT NULL DEFAULT 0,       -- order within section
  created_at      TEXT NOT NULL,                    -- ISO timestamp
  updated_at      TEXT NOT NULL                     -- ISO timestamp
);

CREATE INDEX idx_items_section_id ON resume_items (section_id);
CREATE INDEX idx_items_section_sort ON resume_items (section_id, sort_order);
```

Notes:
- Use `bullets` (JSON as TEXT) for achievement-driven bullet points.
- `metadata` can store things like:
  - {"gpa": "8.9/10"}
  - {"employment_type": "Full-time"}

---

## 5. `resume_skills`

Structured skills that can be shown in a grouped or pill-based section.

```sql
CREATE TABLE resume_skills (
  id              TEXT PRIMARY KEY,                 -- ulid / uuid
  resume_id       TEXT NOT NULL,                    -- FK -> resumes.id
  name            TEXT NOT NULL,                    -- e.g. 'TypeScript', 'React', 'Team Leadership'
  category        TEXT,                             -- e.g. 'Technical', 'Soft Skill', 'Tool'
  level           TEXT,                             -- e.g. 'Beginner', 'Intermediate', 'Advanced', or numeric later
  sort_order      INTEGER NOT NULL DEFAULT 0,       -- order in the skills list
  created_at      TEXT NOT NULL,                    -- ISO timestamp
  updated_at      TEXT NOT NULL                     -- ISO timestamp
);

CREATE INDEX idx_skills_resume_id ON resume_skills (resume_id);
```

Notes:
- UI can group skills by category.
- `level` can be rendered as badges or progress bars later.

---

## 6. `resume_links`

External links to portfolio, LinkedIn, GitHub, personal site, etc.

```sql
CREATE TABLE resume_links (
  id              TEXT PRIMARY KEY,                 -- ulid / uuid
  resume_id       TEXT NOT NULL,                    -- FK -> resumes.id
  label           TEXT NOT NULL,                    -- e.g. 'LinkedIn', 'Portfolio', 'GitHub'
  url             TEXT NOT NULL,                    -- full URL
  sort_order      INTEGER NOT NULL DEFAULT 0,       -- order in links row
  created_at      TEXT NOT NULL,                    -- ISO timestamp
  updated_at      TEXT NOT NULL                     -- ISO timestamp
);

CREATE INDEX idx_links_resume_id ON resume_links (resume_id);
```

---

## 7. (Optional – Phase 2) `resume_ai_suggestions`

Table to log AI suggestions & rewrites (for “Improve my summary”, “Rewrite professionally”, etc.).  
This is **optional** for Phase 1 but architected for future.

```sql
CREATE TABLE resume_ai_suggestions (
  id               TEXT PRIMARY KEY,                -- ulid / uuid
  resume_id        TEXT NOT NULL,                   -- FK -> resumes.id
  section_id       TEXT,                            -- optional FK -> resume_sections.id
  item_id          TEXT,                            -- optional FK -> resume_items.id
  suggestion_type  TEXT NOT NULL,                   -- e.g. 'summary_rewrite', 'bullet_improvement'
  input_text       TEXT NOT NULL,                   -- original user text
  suggested_text   TEXT NOT NULL,                   -- AI suggestion
  applied          INTEGER NOT NULL DEFAULT 0,      -- 1 if user accepted/applied
  created_at       TEXT NOT NULL                    -- ISO timestamp
);

CREATE INDEX idx_ai_resume_id ON resume_ai_suggestions (resume_id);
```

---

## Summary for Codex

**Minimum tables for v1 (must create now):**

1. `resume_templates`
2. `resumes`
3. `resume_sections`
4. `resume_items`
5. `resume_skills`
6. `resume_links`

**Optional (Phase 2, can be added later):**

7. `resume_ai_suggestions`

All timestamps are stored as **TEXT ISO strings** for simplicity and to align with typical Astro DB / Turso usage.
All booleans are stored as **INTEGER (0/1)** for SQLite compatibility.
