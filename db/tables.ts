import { column, defineTable, NOW } from "astro:db";

export const ResumeProject = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),
    title: column.text(),
    templateKey: column.text(),
    isDefault: column.boolean({ default: false }),
    photoKey: column.text({ default: "" }),
    photoUrl: column.text({ default: "" }),
    photoUpdatedAt: column.date({ default: NOW }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const ResumeSection = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    projectId: column.text(),
    key: column.text(),
    order: column.number(),
    isEnabled: column.boolean({ default: true }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const ResumeItem = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    sectionId: column.text(),
    order: column.number(),
    data: column.text(),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const Faq = defineTable({
  columns: {
    id: column.number({ primaryKey: true, autoIncrement: true }),
    audience: column.text({ default: "user" }),
    category: column.text({ optional: true }),
    question: column.text(),
    answer_md: column.text(),
    sort_order: column.number({ default: 0 }),
    is_published: column.boolean({ default: false }),
    created_at: column.date({ default: NOW }),
    updated_at: column.date({ default: NOW }),
  },
  indexes: [
    {
      name: "faq_audience_published_idx",
      on: ["audience", "is_published"],
    },
    {
      name: "faq_sort_order_idx",
      on: "sort_order",
    },
  ],
});

export const resumeBuilderTables = {
  ResumeProject,
  ResumeSection,
  ResumeItem,
  Faq,
} as const;
