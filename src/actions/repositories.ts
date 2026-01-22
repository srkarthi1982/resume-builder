import { ResumeItem, ResumeProject, ResumeSection } from "astro:db";
import { BaseRepository } from "./baseRepository";

type ResumeProjectRow = typeof ResumeProject.$inferSelect;
type ResumeSectionRow = typeof ResumeSection.$inferSelect;
type ResumeItemRow = typeof ResumeItem.$inferSelect;

export const resumeProjectRepository = new BaseRepository<typeof ResumeProject, ResumeProjectRow>(
  ResumeProject,
);
export const resumeSectionRepository = new BaseRepository<typeof ResumeSection, ResumeSectionRow>(
  ResumeSection,
);
export const resumeItemRepository = new BaseRepository<typeof ResumeItem, ResumeItemRow>(
  ResumeItem,
);
