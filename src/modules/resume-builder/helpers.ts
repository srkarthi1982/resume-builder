import type { ResumeData } from "@ansiversa/components";
import type { ResumeItemDTO, ResumeProjectDTO, ResumeSectionDTO } from "./types";

export type ResumeProjectRow = {
  id: string;
  userId: string;
  title: string;
  templateKey: string;
  isDefault?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type ResumeSectionRow = {
  id: string;
  projectId: string;
  key: string;
  order: number;
  isEnabled?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type ResumeItemRow = {
  id: string;
  sectionId: string;
  order: number;
  data: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export const normalizeText = (value?: string | null) => {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : "";
};

const safeParseJson = (value?: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const normalizeResumeProject = (row: ResumeProjectRow): ResumeProjectDTO => ({
  id: row.id,
  userId: row.userId,
  title: row.title,
  templateKey: row.templateKey as ResumeProjectDTO["templateKey"],
  isDefault: Boolean(row.isDefault),
  createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
});

export const normalizeResumeSection = (row: ResumeSectionRow): Omit<ResumeSectionDTO, "items"> => ({
  id: row.id,
  projectId: row.projectId,
  key: row.key as ResumeSectionDTO["key"],
  order: Number(row.order ?? 0),
  isEnabled: row.isEnabled ?? true,
  createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
});

export const normalizeResumeItem = (row: ResumeItemRow): ResumeItemDTO => ({
  id: row.id,
  sectionId: row.sectionId,
  order: Number(row.order ?? 0),
  data: safeParseJson(row.data) ?? {},
  createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
});

export const createEmptyResumeData = (): ResumeData => ({
  version: "1.0",
  basics: {
    fullName: "",
    headline: "",
    summary: "",
    location: {
      label: "",
      city: "",
      country: "",
    },
    contact: {
      email: "",
      phone: "",
      website: "",
    },
    links: [],
  },
  highlights: [],
  skills: [],
  experience: [],
  projects: [],
  education: [],
  certifications: [],
  languages: [],
  awards: [],
  declaration: {
    text: "",
    place: "",
    name: "",
  },
  settings: {
    showSkillsAs: "chips",
    paper: "A4",
  },
});

const coerceNumber = (value: any) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const coerceStringArray = (value: any) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const coerceTagArray = (value: any) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const getSectionItems = (sections: ResumeSectionDTO[], key: string): ResumeItemDTO[] => {
  return sections.find((section) => section.key === key)?.items ?? [];
};

export const buildResumeDataFromSections = (
  sections: ResumeSectionDTO[],
): ResumeData => {
  const base = createEmptyResumeData();
  const enabledSections = sections.filter((section) => section.isEnabled);

  const basicsItems = getSectionItems(enabledSections, "basics");
  const basics = basicsItems[0]?.data ?? {};
  base.basics = {
    ...base.basics,
    ...basics,
    contact: {
      ...base.basics.contact,
      ...(basics?.contact ?? {}),
    },
    location: {
      ...base.basics.location,
      ...(basics?.location ?? {}),
    },
    links: Array.isArray(basics?.links) ? basics.links : [],
  };

  const summaryItems = getSectionItems(enabledSections, "summary");
  const summary = summaryItems[0]?.data ?? {};
  if (summary?.text) {
    base.basics.summary = summary.text;
  }

  base.highlights = getSectionItems(enabledSections, "highlights").map((item) => {
    if (typeof item.data === "string") return item.data;
    return item.data?.text ? String(item.data.text) : "";
  }).filter(Boolean);

  base.skills = getSectionItems(enabledSections, "skills").map((item) => ({
    name: normalizeText(item.data?.name ?? ""),
    level: item.data?.level || undefined,
    keywords: Array.isArray(item.data?.keywords) ? item.data.keywords : undefined,
  })).filter((skill) => skill.name);

  base.experience = getSectionItems(enabledSections, "experience")
    .map((item) => {
      const endYear = coerceNumber(item.data?.end?.year ?? item.data?.endYear);
      const endMonth = coerceNumber(item.data?.end?.month ?? item.data?.endMonth);

      return {
        id: item.data?.id ?? item.id,
        role: normalizeText(item.data?.role ?? ""),
        company: normalizeText(item.data?.company ?? ""),
        location: normalizeText(item.data?.location ?? "") || undefined,
        start: {
          year:
            coerceNumber(item.data?.start?.year ?? item.data?.startYear) ??
            new Date().getFullYear(),
          month: coerceNumber(item.data?.start?.month ?? item.data?.startMonth),
        },
        end: item.data?.present
          ? undefined
          : endYear
            ? {
                year: endYear,
                month: endMonth,
              }
            : undefined,
        present: Boolean(item.data?.present),
        summary: normalizeText(item.data?.summary ?? "") || undefined,
        bullets: coerceStringArray(item.data?.bullets),
        tags: coerceTagArray(item.data?.tags),
      };
    })
    .filter((entry) => entry.role || entry.company);

  base.projects = getSectionItems(enabledSections, "projects")
    .map((item) => {
      const startYear = coerceNumber(item.data?.startYear);
      const startMonth = coerceNumber(item.data?.startMonth);
      const endYear = coerceNumber(item.data?.endYear);
      const endMonth = coerceNumber(item.data?.endMonth);

      return {
        id: item.data?.id ?? item.id,
        name: normalizeText(item.data?.name ?? ""),
        link: normalizeText(item.data?.link ?? "") || undefined,
        start: startYear || startMonth
          ? {
              year: startYear ?? new Date().getFullYear(),
              month: startMonth,
            }
          : undefined,
        end: item.data?.present
          ? undefined
          : endYear
            ? {
                year: endYear,
                month: endMonth,
              }
            : undefined,
        present: Boolean(item.data?.present),
        summary: normalizeText(item.data?.summary ?? "") || undefined,
        bullets: coerceStringArray(item.data?.bullets),
        tags: coerceTagArray(item.data?.tags),
      };
    })
    .filter((entry) => entry.name);

  base.education = getSectionItems(enabledSections, "education")
    .map((item) => {
      const startYear = coerceNumber(item.data?.startYear);
      const startMonth = coerceNumber(item.data?.startMonth);
      const endYear = coerceNumber(item.data?.endYear);
      const endMonth = coerceNumber(item.data?.endMonth);

      return {
        id: item.data?.id ?? item.id,
        degree: normalizeText(item.data?.degree ?? ""),
        school: normalizeText(item.data?.school ?? ""),
        location: normalizeText(item.data?.location ?? "") || undefined,
        start: startYear || startMonth
          ? {
              year: startYear ?? new Date().getFullYear(),
              month: startMonth,
            }
          : undefined,
        end: endYear
          ? {
              year: endYear,
              month: endMonth,
            }
          : undefined,
        grade: normalizeText(item.data?.grade ?? "") || undefined,
        bullets: coerceStringArray(item.data?.bullets),
      };
    })
    .filter((entry) => entry.degree || entry.school);

  base.certifications = getSectionItems(enabledSections, "certifications").map((item) => ({
    id: item.data?.id ?? item.id,
    name: normalizeText(item.data?.name ?? ""),
    issuer: normalizeText(item.data?.issuer ?? "") || undefined,
    year: coerceNumber(item.data?.year),
    link: normalizeText(item.data?.link ?? "") || undefined,
  })).filter((entry) => entry.name);

  base.languages = getSectionItems(enabledSections, "languages").map((item) => ({
    name: normalizeText(item.data?.name ?? ""),
    proficiency: item.data?.proficiency || undefined,
  })).filter((entry) => entry.name);

  base.awards = getSectionItems(enabledSections, "awards").map((item) => ({
    id: item.data?.id ?? item.id,
    title: normalizeText(item.data?.title ?? ""),
    year: coerceNumber(item.data?.year),
    by: normalizeText(item.data?.by ?? "") || undefined,
    summary: normalizeText(item.data?.summary ?? "") || undefined,
  })).filter((entry) => entry.title);

  const declarationItems = getSectionItems(enabledSections, "declaration");
  const declaration = declarationItems[0]?.data ?? {};
  base.declaration = {
    text: normalizeText(declaration.text ?? "") || undefined,
    place: normalizeText(declaration.place ?? "") || undefined,
    name: normalizeText(declaration.name ?? "") || undefined,
  };

  return base;
};

export const sectionLabels: Record<string, string> = {
  basics: "Profile",
  summary: "Summary",
  highlights: "Highlights",
  skills: "Skills",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  certifications: "Certifications",
  awards: "Achievements",
  languages: "Languages",
  declaration: "Declaration",
};
