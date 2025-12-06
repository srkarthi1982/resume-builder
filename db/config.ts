import { defineDb } from "astro:db";
import {
  ResumeProfiles,
  Resumes,
  ResumeTemplates,
  ResumeJobs,
} from "./tables";

export default defineDb({
  tables: {
    ResumeProfiles,
    Resumes,
    ResumeTemplates,
    ResumeJobs,
  },
});
