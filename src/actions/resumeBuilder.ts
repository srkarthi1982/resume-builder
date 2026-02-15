import { randomUUID } from "node:crypto";
import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { ResumeItem, ResumeProject, ResumeSection, and, asc, db, desc, eq, inArray } from "astro:db";
import { requireUser } from "./_guards";
import { buildResumeDashboardSummary } from "../dashboard/summary.schema";
import { pushResumeBuilderActivity } from "../lib/pushActivity";
import { notifyParent } from "../lib/notifyParent";
import {
  normalizeResumeItem,
  normalizeResumeProject,
  normalizeResumeSection,
  normalizeText,
  TEMPLATE_KEYS,
  isProTemplate,
} from "../modules/resume-builder/helpers";
import { RESUME_MAX, RESUME_YEAR_MIN, getResumeYearMax } from "../modules/resume-builder/constraints";
import type { ResumeSectionKey } from "../modules/resume-builder/types";

const ensureTemplateAccess = (templateKey: string, isPaid: boolean) => {
  if (isProTemplate(templateKey) && !isPaid) {
    throw new ActionError({
      code: "PAYMENT_REQUIRED",
      message: "Upgrade to Pro to use this template.",
    });
  }
};

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  templateKey: z.enum(TEMPLATE_KEYS),
});

const projectIdSchema = z.object({
  projectId: z.string().min(1),
});

const updateProjectSchema = z
  .object({
    projectId: z.string().min(1),
    title: z.string().min(1).optional(),
    templateKey: z.enum(TEMPLATE_KEYS).optional(),
  })
  .refine((input) => input.title !== undefined || input.templateKey !== undefined, {
    message: "Provide a title or template to update.",
  });

const updateProjectPhotoSchema = z.object({
  projectId: z.string().min(1),
  photoKey: z.string().min(1),
  photoUrl: z.string().min(1),
});

const sectionSchema = z.object({
  projectId: z.string().min(1),
  key: z.string().min(1),
  order: z.number().int().min(0),
  isEnabled: z.boolean().optional(),
});

const itemSchema = z.object({
  projectId: z.string().min(1),
  sectionKey: z.string().min(1),
  itemId: z.string().min(1).optional(),
  order: z.number().int().min(0),
  data: z.any(),
});

const deleteItemSchema = z.object({
  projectId: z.string().min(1),
  itemId: z.string().min(1),
});

const DEFAULT_SECTIONS = [
  { key: "basics", order: 1 },
  { key: "summary", order: 2 },
  { key: "experience", order: 3 },
  { key: "education", order: 4 },
  { key: "skills", order: 5 },
  { key: "projects", order: 6 },
  { key: "certifications", order: 7 },
  { key: "awards", order: 8 },
  { key: "languages", order: 9 },
  { key: "highlights", order: 10 },
  { key: "declaration", order: 11 },
];

const SECTION_KEYS = new Set<ResumeSectionKey>([
  "basics",
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "awards",
  "languages",
  "highlights",
  "declaration",
]);

const assertMaxLength = (value: string, max: number, label: string) => {
  if (value.length > max) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: `${label} must be ${max} characters or fewer.`,
    });
  }
};

const cleanText = (value: any, max: number, label: string, required = false) => {
  const cleaned = normalizeText(value);
  if (required && !cleaned) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: `${label} is required.`,
    });
  }
  assertMaxLength(cleaned, max, label);
  return cleaned;
};

const cleanList = (value: any, max: number, label: string, splitter: "\n" | ",") => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => cleanText(entry, max, label))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(splitter)
      .map((entry) => cleanText(entry, max, label))
      .filter(Boolean);
  }

  return [];
};

const cleanEmail = (value: any, label: string) => {
  const email = cleanText(value, RESUME_MAX.email, label);
  if (!email) return "";
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: `${label} must be a valid email address.`,
    });
  }
  return email.toLowerCase();
};

const cleanUrl = (value: any, label: string) => {
  const raw = cleanText(value, RESUME_MAX.linkUrl, label);
  if (!raw) return "";

  const compact = raw.replace(/\s+/g, "");
  const protocolFixed = compact.replace(/^(https?:\/\/)+/i, "$1");
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(protocolFixed)
    ? protocolFixed
    : `https://${protocolFixed}`;

  let normalized: URL;
  try {
    normalized = new URL(withProtocol);
  } catch {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: `${label} must be a valid URL.`,
    });
  }

  normalized.hostname = normalized.hostname.toLowerCase();
  return normalized.toString();
};

const deriveLocationLabel = (data: any) => {
  const fromText = cleanText(data?.locationText, RESUME_MAX.locationLabel, "Location");
  if (fromText) return fromText;

  const label = cleanText(data?.location?.label, RESUME_MAX.locationLabel, "Location");
  const city = cleanText(data?.location?.city, RESUME_MAX.city, "City");
  const country = cleanText(data?.location?.country, RESUME_MAX.country, "Country");
  if (label) return label;
  return [city, country].filter(Boolean).join(", ");
};

const parseYear = (value: any, label: string, required = false) => {
  if (value === "" || value === null || value === undefined) {
    if (required) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: `${label} is required.`,
      });
    }
    return undefined;
  }

  const year = Number(value);
  const max = getResumeYearMax();
  if (!Number.isInteger(year) || year < RESUME_YEAR_MIN || year > max) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: `${label} must be between ${RESUME_YEAR_MIN} and ${max}.`,
    });
  }

  return year;
};

const parseMonth = (value: any, label: string, required = false) => {
  if (value === "" || value === null || value === undefined) {
    if (required) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: `${label} is required.`,
      });
    }
    return undefined;
  }

  const month = Number(value);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: `${label} must be a valid month.`,
    });
  }

  return month;
};

const validateChronology = (values: {
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
  isPresent?: boolean;
}) => {
  const { startYear, startMonth, endYear, endMonth, isPresent } = values;

  if (isPresent && !startYear) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Start year is required when marked as present.",
    });
  }

  if (isPresent && (endYear || endMonth)) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "End date must be empty when marked as present.",
    });
  }

  if (startMonth && !startYear) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Start year is required when start month is set.",
    });
  }

  if ((endYear || endMonth) && !isPresent && !startYear) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Start year is required when end date is set.",
    });
  }

  if (!isPresent && endMonth && !endYear) {
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "End year is required when end month is set.",
    });
  }

  if (startYear && endYear) {
    const startValue = startYear * 100 + (startMonth ?? 1);
    const endValue = endYear * 100 + (endMonth ?? 12);
    if (endValue < startValue) {
      throw new ActionError({
        code: "BAD_REQUEST",
        message: "End date must be after start date.",
      });
    }
  }
};

const sanitizeSectionData = (
  sectionKey: ResumeSectionKey,
  data: any,
  _templateKey: string,
) => {
  const summaryMax = RESUME_MAX.summary;
  const bulletLineMax = RESUME_MAX.bulletLine;

  if (sectionKey === "basics") {
    const email = cleanEmail(data?.contact?.email, "Email");
    const links = Array.isArray(data?.links)
      ? data.links
          .map((link: any) => ({
            label: cleanText(link?.label, RESUME_MAX.linkLabel, "Link label"),
            url: cleanUrl(link?.url, "Link URL"),
          }))
          .filter((link: any) => link.label && link.url)
      : [];
    const dedupedLinks = links.filter((entry: { label: string; url: string }, index: number, list: { label: string; url: string }[]) => {
      const key = `${entry.label.toLowerCase()}|${entry.url.toLowerCase()}`;
      return list.findIndex((candidate: { label: string; url: string }) => {
        const candidateKey = `${candidate.label.toLowerCase()}|${candidate.url.toLowerCase()}`;
        return candidateKey === key;
      }) === index;
    });
    const primaryWebsite = cleanUrl(data?.contact?.website, "Website") || dedupedLinks[0]?.url || "";
    const locationLabel = deriveLocationLabel(data);

    return {
      fullName: cleanText(data?.fullName, RESUME_MAX.fullName, "Full name", true),
      headline: cleanText(data?.headline, RESUME_MAX.headline, "Headline"),
      contact: {
        email,
        phone: cleanText(data?.contact?.phone, RESUME_MAX.phone, "Phone"),
        website: cleanText(primaryWebsite, RESUME_MAX.website, "Website"),
      },
      location: {
        label: cleanText(locationLabel, RESUME_MAX.locationLabel, "Location"),
        city: "",
        country: "",
      },
      links: dedupedLinks,
    };
  }

  if (sectionKey === "summary") {
    return {
      text: cleanText(data?.text, summaryMax, "Summary"),
    };
  }

  if (sectionKey === "declaration") {
    return {
      text: cleanText(data?.text, RESUME_MAX.declaration, "Declaration"),
      place: cleanText(data?.place, RESUME_MAX.declarationPlace, "Place"),
      name: cleanText(data?.name, RESUME_MAX.declarationName, "Name"),
    };
  }

  if (sectionKey === "experience") {
    const startYear = parseYear(data?.startYear ?? data?.start?.year, "Start year");
    const startMonth = parseMonth(data?.startMonth ?? data?.start?.month, "Start month");
    const endYear = parseYear(data?.endYear ?? data?.end?.year, "End year");
    const endMonth = parseMonth(data?.endMonth ?? data?.end?.month, "End month");
    const isPresent = Boolean(data?.isPresent ?? data?.present);

    validateChronology({ startYear, startMonth, endYear, endMonth, isPresent });
    const start = startYear ? { year: startYear, month: startMonth } : undefined;
    const end = isPresent || !endYear ? undefined : { year: endYear, month: endMonth };

    return {
      role: cleanText(data?.role, RESUME_MAX.role, "Role", true),
      company: cleanText(data?.company, RESUME_MAX.company, "Company", true),
      location: cleanText(data?.location, RESUME_MAX.location, "Location"),
      start,
      startYear,
      startMonth,
      end,
      endYear: isPresent ? undefined : endYear,
      endMonth: isPresent ? undefined : endMonth,
      isPresent,
      present: isPresent,
      summary: cleanText(data?.summary, RESUME_MAX.experienceSummary, "Summary"),
      bullets: cleanList(data?.bullets, bulletLineMax, "Highlight", "\n"),
      tags: cleanList(data?.tags, RESUME_MAX.tagsLine, "Tag", ","),
    };
  }

  if (sectionKey === "education") {
    const startYear = parseYear(data?.startYear ?? data?.start?.year, "Start year");
    const startMonth = parseMonth(data?.startMonth ?? data?.start?.month, "Start month");
    const endYear = parseYear(data?.endYear ?? data?.end?.year, "End year");
    const endMonth = parseMonth(data?.endMonth ?? data?.end?.month, "End month");

    validateChronology({ startYear, startMonth, endYear, endMonth, isPresent: false });
    const start = startYear ? { year: startYear, month: startMonth } : undefined;
    const end = endYear ? { year: endYear, month: endMonth } : undefined;

    return {
      degree: cleanText(data?.degree, RESUME_MAX.degree, "Degree", true),
      school: cleanText(data?.school, RESUME_MAX.school, "School", true),
      location: cleanText(data?.location, RESUME_MAX.location, "Location"),
      start,
      startYear,
      startMonth,
      end,
      endYear,
      endMonth,
      grade: cleanText(data?.grade, RESUME_MAX.grade, "Grade"),
      bullets: cleanList(data?.bullets, bulletLineMax, "Note", "\n"),
    };
  }

  if (sectionKey === "projects") {
    const startYear = parseYear(data?.startYear ?? data?.start?.year, "Start year");
    const startMonth = parseMonth(data?.startMonth ?? data?.start?.month, "Start month");
    const endYear = parseYear(data?.endYear ?? data?.end?.year, "End year");
    const endMonth = parseMonth(data?.endMonth ?? data?.end?.month, "End month");
    const isPresent = Boolean(data?.isPresent ?? data?.present);

    validateChronology({ startYear, startMonth, endYear, endMonth, isPresent });
    const start = startYear ? { year: startYear, month: startMonth } : undefined;
    const end = isPresent || !endYear ? undefined : { year: endYear, month: endMonth };

    return {
      name: cleanText(data?.name, RESUME_MAX.projectName, "Project name", true),
      link: cleanUrl(data?.link, "Project link"),
      start,
      startYear,
      startMonth,
      end,
      endYear: isPresent ? undefined : endYear,
      endMonth: isPresent ? undefined : endMonth,
      isPresent,
      present: isPresent,
      summary: cleanText(data?.summary, RESUME_MAX.projectSummary, "Summary"),
      bullets: cleanList(data?.bullets, bulletLineMax, "Highlight", "\n"),
      tags: cleanList(data?.tags, RESUME_MAX.tagsLine, "Tag", ","),
    };
  }

  if (sectionKey === "skills") {
    return {
      name: cleanText(data?.name, RESUME_MAX.skill, "Skill", true),
      level: cleanText(data?.level, 30, "Skill level"),
    };
  }

  if (sectionKey === "certifications") {
    return {
      name: cleanText(data?.name, RESUME_MAX.certificationName, "Certification", true),
      issuer: cleanText(data?.issuer, RESUME_MAX.issuer, "Issuer"),
      year: parseYear(data?.year, "Year"),
      link: cleanUrl(data?.link, "Link"),
    };
  }

  if (sectionKey === "awards") {
    return {
      title: cleanText(data?.title, RESUME_MAX.awardTitle, "Title", true),
      year: parseYear(data?.year, "Year"),
      by: cleanText(data?.by, RESUME_MAX.awardBy, "By"),
      summary: cleanText(data?.summary, RESUME_MAX.awardSummary, "Summary"),
    };
  }

  if (sectionKey === "languages") {
    return {
      name: cleanText(data?.name, RESUME_MAX.language, "Language", true),
      proficiency: cleanText(data?.proficiency, 40, "Proficiency"),
    };
  }

  if (sectionKey === "highlights") {
    return {
      text: cleanText(data?.text, RESUME_MAX.highlight, "Highlight", true),
    };
  }

  return data ?? {};
};

const getOwnedProject = async (projectId: string, userId: string) => {
  const [project] = await db
    .select()
    .from(ResumeProject)
    .where(and(eq(ResumeProject.id, projectId), eq(ResumeProject.userId, userId)));

  if (!project) {
    throw new ActionError({ code: "NOT_FOUND", message: "Resume project not found." });
  }

  return project;
};

const getOwnedProjectWithTemplateAccess = async (
  projectId: string,
  userId: string,
  isPaid: boolean,
) => {
  const project = await getOwnedProject(projectId, userId);
  ensureTemplateAccess(project.templateKey, isPaid);
  return project;
};

const getProjectSections = async (projectId: string) => {
  return await db
    .select()
    .from(ResumeSection)
    .where(eq(ResumeSection.projectId, projectId))
    .orderBy(asc(ResumeSection.order));
};

const touchProject = async (projectId: string) => {
  await db
    .update(ResumeProject)
    .set({ updatedAt: new Date() })
    .where(eq(ResumeProject.id, projectId));
};

const pushDashboardActivity = async (userId: string, activity: { event: string; entityId?: string }) => {
  try {
    const summary = await buildResumeDashboardSummary(userId);
    pushResumeBuilderActivity({
      userId,
      activity: {
        event: activity.event,
        entityId: activity.entityId,
        occurredAt: new Date().toISOString(),
      },
      summary,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("pushResumeBuilderActivity failed", error);
    }
  }
};

export const listResumeProjects = defineAction({
  input: z.object({}).optional(),
  async handler(_input, context: ActionAPIContext) {
    const user = requireUser(context);
    const projects = await db
      .select()
      .from(ResumeProject)
      .where(eq(ResumeProject.userId, user.id))
      .orderBy(desc(ResumeProject.updatedAt), desc(ResumeProject.createdAt));

    return {
      items: projects.map(normalizeResumeProject),
    };
  },
});

export const createResumeProject = defineAction({
  input: projectSchema,
  async handler(input, context: ActionAPIContext) {
    const user = requireUser(context);
    ensureTemplateAccess(input.templateKey, user.isPaid);
    const title = cleanText(input.title, RESUME_MAX.projectTitle, "Title", true);

    const existing = await db
      .select({ id: ResumeProject.id })
      .from(ResumeProject)
      .where(eq(ResumeProject.userId, user.id));
    const isDefault = existing.length === 0;

    const now = new Date();
    const [project] = await db
      .insert(ResumeProject)
      .values({
        id: randomUUID(),
        userId: user.id,
        title,
        templateKey: input.templateKey,
        isDefault,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const sections = DEFAULT_SECTIONS.map((section) => ({
      id: randomUUID(),
      projectId: project.id,
      key: section.key,
      order: section.order,
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    }));

    await db.insert(ResumeSection).values(sections);

    await pushDashboardActivity(user.id, {
      event: "resume.created",
      entityId: project.id,
    });

    void notifyParent({
      appKey: "resume-builder",
      userId: user.id,
      title: "Resume created",
      message: `Resume “${project.title}” is ready.`,
      level: "success",
      meta: { resumeId: project.id },
    });

    return {
      project: normalizeResumeProject(project),
      sections: sections.map(normalizeResumeSection).map((section) => ({ ...section, items: [] })),
    };
  },
});

export const getResumeProject = defineAction({
  input: projectIdSchema,
  async handler({ projectId }, context: ActionAPIContext) {
    const user = requireUser(context);
    const project = await getOwnedProject(projectId, user.id);
    ensureTemplateAccess(project.templateKey, user.isPaid);

    const sections = await getProjectSections(projectId);
    const sectionIds = sections.map((section) => section.id);

    const items =
      sectionIds.length === 0
        ? []
        : await db
            .select()
            .from(ResumeItem)
            .where(inArray(ResumeItem.sectionId, sectionIds))
            .orderBy(asc(ResumeItem.order));

    const itemsBySection = new Map<string, ReturnType<typeof normalizeResumeItem>[]>();
    items.forEach((row) => {
      const normalized = normalizeResumeItem(row);
      const bucket = itemsBySection.get(normalized.sectionId) ?? [];
      bucket.push(normalized);
      itemsBySection.set(normalized.sectionId, bucket);
    });

    const normalizedSections = sections.map((section) => ({
      ...normalizeResumeSection(section),
      items: itemsBySection.get(section.id) ?? [],
    }));

    return {
      project: normalizeResumeProject(project),
      sections: normalizedSections,
    };
  },
});

export const updateResumeProject = defineAction({
  input: updateProjectSchema,
  async handler({ projectId, title, templateKey }, context: ActionAPIContext) {
    const user = requireUser(context);
    await getOwnedProjectWithTemplateAccess(projectId, user.id, user.isPaid);

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (title !== undefined) {
      updates.title = cleanText(title, RESUME_MAX.projectTitle, "Title", true);
    }
    if (templateKey !== undefined) {
      ensureTemplateAccess(templateKey, user.isPaid);
      updates.templateKey = templateKey;
    }

    const [project] = await db
      .update(ResumeProject)
      .set(updates)
      .where(eq(ResumeProject.id, projectId))
      .returning();

    await pushDashboardActivity(user.id, {
      event: "resume.updated",
      entityId: projectId,
    });

    if (project?.title) {
      void notifyParent({
        appKey: "resume-builder",
        userId: user.id,
        title: "Resume updated",
        message: `Resume “${project.title}” was updated.`,
        level: "info",
        meta: { resumeId: projectId },
      });
    }

    return { project: normalizeResumeProject(project) };
  },
});

export const resumeUpdateProjectPhoto = defineAction({
  input: updateProjectPhotoSchema,
  async handler({ projectId, photoKey, photoUrl }, context: ActionAPIContext) {
    const user = requireUser(context);
    await getOwnedProjectWithTemplateAccess(projectId, user.id, user.isPaid);

    const now = new Date();
    await db
      .update(ResumeProject)
      .set({
        photoKey,
        photoUrl,
        photoUpdatedAt: now,
        updatedAt: now,
      })
      .where(eq(ResumeProject.id, projectId));

    await pushDashboardActivity(user.id, {
      event: "resume.photo.updated",
      entityId: projectId,
    });

    return { ok: true };
  },
});

export const deleteResumeProject = defineAction({
  input: projectIdSchema,
  async handler({ projectId }, context: ActionAPIContext) {
    const user = requireUser(context);
    const project = await getOwnedProject(projectId, user.id);

    const sections = await getProjectSections(projectId);
    const sectionIds = sections.map((section) => section.id);

    if (sectionIds.length > 0) {
      await db.delete(ResumeItem).where(inArray(ResumeItem.sectionId, sectionIds));
      await db.delete(ResumeSection).where(inArray(ResumeSection.id, sectionIds));
    }

    await db.delete(ResumeProject).where(eq(ResumeProject.id, projectId));

    if (project.isDefault) {
      const [nextDefault] = await db
        .select()
        .from(ResumeProject)
        .where(eq(ResumeProject.userId, user.id))
        .orderBy(desc(ResumeProject.updatedAt), desc(ResumeProject.createdAt))
        .limit(1);

      if (nextDefault) {
        await db
          .update(ResumeProject)
          .set({ isDefault: true, updatedAt: new Date() })
          .where(eq(ResumeProject.id, nextDefault.id));
      }
    }

    await pushDashboardActivity(user.id, {
      event: "resume.deleted",
      entityId: projectId,
    });

    return { success: true };
  },
});

export const setDefaultResumeProject = defineAction({
  input: projectIdSchema,
  async handler({ projectId }, context: ActionAPIContext) {
    const user = requireUser(context);
    await getOwnedProjectWithTemplateAccess(projectId, user.id, user.isPaid);

    await db
      .update(ResumeProject)
      .set({ isDefault: false })
      .where(eq(ResumeProject.userId, user.id));

    const [project] = await db
      .update(ResumeProject)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(eq(ResumeProject.id, projectId))
      .returning();

    await pushDashboardActivity(user.id, {
      event: "resume.default_set",
      entityId: projectId,
    });

    return { project: normalizeResumeProject(project) };
  },
});

export const upsertSection = defineAction({
  input: sectionSchema,
  async handler({ projectId, key, order, isEnabled }, context: ActionAPIContext) {
    const user = requireUser(context);
    await getOwnedProjectWithTemplateAccess(projectId, user.id, user.isPaid);

    const [existing] = await db
      .select()
      .from(ResumeSection)
      .where(and(eq(ResumeSection.projectId, projectId), eq(ResumeSection.key, key)));

    const now = new Date();

    if (existing) {
      const [updated] = await db
        .update(ResumeSection)
        .set({
          order,
          isEnabled: isEnabled ?? existing.isEnabled ?? true,
          updatedAt: now,
        })
        .where(eq(ResumeSection.id, existing.id))
        .returning();

      await touchProject(projectId);
      await pushDashboardActivity(user.id, {
        event: "section.toggled",
        entityId: existing.id,
      });

      return {
        section: { ...normalizeResumeSection(updated), items: [] },
      };
    }

    const [created] = await db
      .insert(ResumeSection)
      .values({
        id: randomUUID(),
        projectId,
        key,
        order,
        isEnabled: isEnabled ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await touchProject(projectId);
    await pushDashboardActivity(user.id, {
      event: "section.toggled",
      entityId: created.id,
    });

    return {
      section: { ...normalizeResumeSection(created), items: [] },
    };
  },
});

export const addOrUpdateItem = defineAction({
  input: itemSchema,
  async handler({ projectId, sectionKey, itemId, order, data }, context: ActionAPIContext) {
    const user = requireUser(context);
    const project = await getOwnedProjectWithTemplateAccess(projectId, user.id, user.isPaid);
    const typedSectionKey = sectionKey as ResumeSectionKey;
    if (!SECTION_KEYS.has(typedSectionKey)) {
      throw new ActionError({ code: "BAD_REQUEST", message: "Invalid section key." });
    }

    const [section] = await db
      .select()
      .from(ResumeSection)
      .where(and(eq(ResumeSection.projectId, projectId), eq(ResumeSection.key, sectionKey)));

    if (!section) {
      throw new ActionError({ code: "NOT_FOUND", message: "Resume section not found." });
    }

    const now = new Date();
    const validatedData = sanitizeSectionData(typedSectionKey, data, project.templateKey);
    const payload = JSON.stringify(validatedData);

    if (itemId) {
      const [existing] = await db
        .select()
        .from(ResumeItem)
        .where(and(eq(ResumeItem.id, itemId), eq(ResumeItem.sectionId, section.id)));

      if (!existing) {
        throw new ActionError({ code: "NOT_FOUND", message: "Resume item not found." });
      }

      const [updated] = await db
        .update(ResumeItem)
        .set({ order, data: payload, updatedAt: now })
        .where(eq(ResumeItem.id, itemId))
        .returning();

      await touchProject(projectId);
      await pushDashboardActivity(user.id, {
        event: "item.updated",
        entityId: itemId,
      });

      return { item: normalizeResumeItem(updated) };
    }

    const [created] = await db
      .insert(ResumeItem)
      .values({
        id: randomUUID(),
        sectionId: section.id,
        order,
        data: payload,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await touchProject(projectId);
    await pushDashboardActivity(user.id, {
      event: "item.created",
      entityId: created.id,
    });

    return { item: normalizeResumeItem(created) };
  },
});

export const deleteItem = defineAction({
  input: deleteItemSchema,
  async handler({ projectId, itemId }, context: ActionAPIContext) {
    const user = requireUser(context);
    await getOwnedProjectWithTemplateAccess(projectId, user.id, user.isPaid);

    const [existing] = await db
      .select({
        id: ResumeItem.id,
        sectionId: ResumeItem.sectionId,
      })
      .from(ResumeItem)
      .where(eq(ResumeItem.id, itemId));

    if (!existing) {
      throw new ActionError({ code: "NOT_FOUND", message: "Resume item not found." });
    }

    const [section] = await db
      .select()
      .from(ResumeSection)
      .where(eq(ResumeSection.id, existing.sectionId));

    if (!section || section.projectId !== projectId) {
      throw new ActionError({ code: "NOT_FOUND", message: "Resume item not found." });
    }

    await db.delete(ResumeItem).where(eq(ResumeItem.id, itemId));
    await touchProject(projectId);
    await pushDashboardActivity(user.id, {
      event: "item.deleted",
      entityId: itemId,
    });

    return { success: true };
  },
});
