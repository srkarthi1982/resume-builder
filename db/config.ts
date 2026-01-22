import { defineDb } from "astro:db";
import { ResumeItem, ResumeProject, ResumeSection } from "./tables";

export default defineDb({
  tables: {
    ResumeProject,
    ResumeSection,
    ResumeItem,
  },
});
