⚠️ Mandatory: AI agents must read this file before writing or modifying any code in the resume-builder repo.

# AGENTS.md
## Resume Builder Repo – Session Notes (Codex)

This file records what was built/changed so far for the resume-builder repo. Read first.

---

## 1. Scope

- Astro mini-app for resume creation and template previews.
- Uses @ansiversa/components for shared UI and resume templates.

---

## 2. Task Log (Newest first)

- 2026-01-20 Committed resume builder templates implementation changes.
- 2026-01-19 Updated @ansiversa/components dependency to 0.0.106 after publish to restore ResumeBuilderShell export.
- 2026-01-19 Added legacy `page-break-after: always;` to print styles for resume preview for cross-browser PDF stability.
- 2026-01-19 Added a dev preview page to render all resume templates for visual QA and print checks.
