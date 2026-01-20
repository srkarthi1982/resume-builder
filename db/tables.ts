import { column, defineTable, NOW } from "astro:db";

export const ExampleItem = defineTable({
  columns: {
    id: column.text({ primaryKey: true }),
    userId: column.text(),
    title: column.text(),
    content: column.text({ optional: true }),
    isArchived: column.boolean({ default: false }),
    createdAt: column.date({ default: NOW }),
    updatedAt: column.date({ default: NOW }),
  },
});

export const resumeBuilderTables = {
  ExampleItem,
} as const;
