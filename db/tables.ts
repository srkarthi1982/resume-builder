import { column, defineTable, NOW } from "astro:db";

/**
 * Core profile for a user – reused across multiple resumes.
 */
export const ResumeProfiles = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    ownerId: column.text(), // parent Users.id

    fullName: column.text(),
    headline: column.text({ optional: true }), // e.g. "Senior Software Developer"
    email: column.text({ optional: true }),
    phone: column.text({ optional: true }),
    location: column.text({ optional: true }), // "Dubai, UAE"

    // Links like LinkedIn, GitHub, Portfolio, etc.
    links: column.json({ optional: true }),

    // Short summary / about
    summary: column.text({ optional: true }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

/**
 * Individual resume document/version.
 * Example: "General Resume", "Backend Engineer Resume", etc.
 */
export const Resumes = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    ownerId: column.text(), // parent Users.id
    profileId: column.number({
      references: () => ResumeProfiles.columns.id,
      optional: true,
    }),

    title: column.text(),                  // internal name: "Senior Dev Resume"
    targetRole: column.text({ optional: true }), // "Senior Backend Engineer"
    targetCompany: column.text({ optional: true }),

    // Which template/layout is used
    templateKey: column.text({ optional: true }),

    // Main structured content of the resume:
    // sections like experiences, education, skills, projects, etc.
    // Example structure:
    // {
    //   experiences: [...],
    //   education: [...],
    //   skills: [...],
    //   projects: [...],
    //   extras: [...]
    // }
    content: column.json({ optional: true }),

    isPrimary: column.boolean({ default: false }),

    // Last exported PDF or DOCX info (optional)
    lastExportUrl: column.text({ optional: true }),
    lastExportedAt: column.date({ optional: true }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

/**
 * Layout templates for resumes.
 * Can be system-defined or user-defined.
 */
export const ResumeTemplates = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    // null or "system" for built-ins, or a user ID for custom templates
    ownerId: column.text({ optional: true }),

    name: column.text(),        // "Clean ATS", "Modern Left Sidebar", etc.
    description: column.text({ optional: true }),

    // Template identifier used in code / rendering
    templateKey: column.text(),

    // Configuration for layout:
    // fonts, spacing, which sections visible, accent color, etc.
    config: column.json({ optional: true }),

    isActive: column.boolean({ default: true }),
    isDefault: column.boolean({ default: false }),

    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

/**
 * AI and export jobs for resume operations.
 */
export const ResumeJobs = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),

    resumeId: column.number({
      references: () => Resumes.columns.id,
      optional: true,
    }),

    userId: column.text({ optional: true }),

    jobType: column.text({
      enum: [
        "ai_suggest_bullets",
        "ai_rewrite_section",
        "ai_tailor_to_job",
        "export_pdf",
        "export_docx",
        "other",
      ],
      default: "ai_suggest_bullets",
    }),

    input: column.json({ optional: true }),
    output: column.json({ optional: true }),

    status: column.text({
      enum: ["pending", "completed", "failed"],
      default: "pending",
    }),

    createdAt: column.date({ default: NOW }),
  },
});

export const resumeBuilderTables = {
  ResumeProfiles,
  Resumes,
  ResumeTemplates,
  ResumeJobs,
} as const;
