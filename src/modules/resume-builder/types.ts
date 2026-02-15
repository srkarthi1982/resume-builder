import type { ResumeTemplateType } from "@ansiversa/components";

export type ResumeSectionKey =
  | "basics"
  | "summary"
  | "highlights"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "certifications"
  | "languages"
  | "awards"
  | "declaration";

export type ResumeProjectDTO = {
  id: string;
  userId: string;
  title: string;
  templateKey: ResumeTemplateType;
  isDefault: boolean;
  photoKey: string;
  photoUrl: string;
  photoUpdatedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ResumeSectionDTO = {
  id: string;
  projectId: string;
  key: ResumeSectionKey;
  order: number;
  isEnabled: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  items: ResumeItemDTO[];
};

export type ResumeItemDTO = {
  id: string;
  sectionId: string;
  order: number;
  data: any;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ResumeProjectDetail = {
  project: ResumeProjectDTO;
  sections: ResumeSectionDTO[];
};
