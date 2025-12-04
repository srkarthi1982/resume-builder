import { column, defineDb, defineTable } from 'astro:db';

export const ResumeTemplates = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    key: column.text({ unique: true }),
    name: column.text(),
    description: column.text({ optional: true }),
    is_default: column.boolean({ default: false }),
    is_active: column.boolean({ default: true }),
    created_at: column.text(),
    updated_at: column.text(),
  },
});

export const Resumes = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    user_id: column.text(),
    title: column.text(),
    target_role: column.text({ optional: true }),
    target_industry: column.text({ optional: true }),
    location: column.text({ optional: true }),
    summary: column.text({ optional: true }),
    template_key: column.text({ references: () => ResumeTemplates.columns.key }),
    is_primary: column.boolean({ default: false }),
    last_used_at: column.text({ optional: true }),
    created_at: column.text(),
    updated_at: column.text(),
    deleted_at: column.text({ optional: true }),
  },
  indexes: [
    { on: ['user_id'] },
    { on: ['template_key'] },
  ],
});

export const ResumeSections = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    resume_id: column.text({ references: () => Resumes.columns.id }),
    type: column.text(),
    title: column.text(),
    sort_order: column.number({ default: 0 }),
    is_visible: column.boolean({ default: true }),
    layout_variant: column.text({ optional: true }),
    created_at: column.text(),
    updated_at: column.text(),
  },
  indexes: [
    { on: ['resume_id'] },
    { on: ['resume_id', 'sort_order'] },
  ],
});

export const ResumeItems = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    section_id: column.text({ references: () => ResumeSections.columns.id }),
    title: column.text(),
    subtitle: column.text({ optional: true }),
    location: column.text({ optional: true }),
    start_date: column.text({ optional: true }),
    end_date: column.text({ optional: true }),
    is_current: column.boolean({ default: false }),
    description: column.text({ optional: true }),
    bullets: column.text({ optional: true }),
    metadata: column.text({ optional: true }),
    sort_order: column.number({ default: 0 }),
    created_at: column.text(),
    updated_at: column.text(),
  },
  indexes: [
    { on: ['section_id'] },
    { on: ['section_id', 'sort_order'] },
  ],
});

export const ResumeSkills = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    resume_id: column.text({ references: () => Resumes.columns.id }),
    name: column.text(),
    category: column.text({ optional: true }),
    level: column.text({ optional: true }),
    sort_order: column.number({ default: 0 }),
    created_at: column.text(),
    updated_at: column.text(),
  },
  indexes: [{ on: ['resume_id'] }],
});

export const ResumeLinks = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    resume_id: column.text({ references: () => Resumes.columns.id }),
    label: column.text(),
    url: column.text(),
    sort_order: column.number({ default: 0 }),
    created_at: column.text(),
    updated_at: column.text(),
  },
  indexes: [{ on: ['resume_id'] }],
});

export default defineDb({
  tables: {
    ResumeTemplates,
    Resumes,
    ResumeSections,
    ResumeItems,
    ResumeSkills,
    ResumeLinks,
  },
});
