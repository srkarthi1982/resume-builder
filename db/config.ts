import { defineDb } from "astro:db";
import { Bookmark, Faq, ResumeItem, ResumeProject, ResumeSection } from "./tables";

export default defineDb({
  tables: {
    ResumeProject,
    ResumeSection,
    ResumeItem,
    Faq,
    Bookmark,
  },
});
