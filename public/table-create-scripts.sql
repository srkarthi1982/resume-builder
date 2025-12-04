-- SQL CREATE statements for resume builder tables

CREATE TABLE ResumeTemplates (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE Resumes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  target_role TEXT,
  target_industry TEXT,
  location TEXT,
  summary TEXT,
  template_key TEXT NOT NULL REFERENCES ResumeTemplates(key),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  last_used_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX idx_resumes_user_id ON Resumes (user_id);
CREATE INDEX idx_resumes_template_key ON Resumes (template_key);

CREATE TABLE ResumeSections (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL REFERENCES Resumes(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  layout_variant TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_sections_resume_id ON ResumeSections (resume_id);
CREATE INDEX idx_sections_resume_sort ON ResumeSections (resume_id, sort_order);

CREATE TABLE ResumeItems (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES ResumeSections(id),
  title TEXT NOT NULL,
  subtitle TEXT,
  location TEXT,
  start_date TEXT,
  end_date TEXT,
  is_current BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  bullets TEXT,
  metadata TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_items_section_id ON ResumeItems (section_id);
CREATE INDEX idx_items_section_sort ON ResumeItems (section_id, sort_order);

CREATE TABLE ResumeSkills (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL REFERENCES Resumes(id),
  name TEXT NOT NULL,
  category TEXT,
  level TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_skills_resume_id ON ResumeSkills (resume_id);

CREATE TABLE ResumeLinks (
  id TEXT PRIMARY KEY,
  resume_id TEXT NOT NULL REFERENCES Resumes(id),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_links_resume_id ON ResumeLinks (resume_id);
