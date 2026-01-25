import { randomUUID } from "node:crypto";
import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { z } from "astro:schema";
import { ResumeItem, ResumeProject, ResumeSection, and, asc, db, desc, eq, inArray } from "astro:db";
import { requireUser } from "./_guards";
import { buildResumeDashboardSummary } from "../dashboard/summary.schema";
import { pushResumeBuilderActivity } from "../lib/pushActivity";
import {
  normalizeResumeItem,
  normalizeResumeProject,
  normalizeResumeSection,
  normalizeText,
} from "../modules/resume-builder/helpers";

const templateKeys = ["classic", "modern", "minimal", "timeline"] as const;

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  templateKey: z.enum(templateKeys),
});

const projectIdSchema = z.object({
  projectId: z.string().min(1),
});

const updateProjectSchema = z
  .object({
    projectId: z.string().min(1),
    title: z.string().min(1).optional(),
    templateKey: z.enum(templateKeys).optional(),
  })
  .refine((input) => input.title !== undefined || input.templateKey !== undefined, {
    message: "Provide a title or template to update.",
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
    const title = normalizeText(input.title);
    if (!title) {
      throw new ActionError({ code: "BAD_REQUEST", message: "Title is required." });
    }

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
    await getOwnedProject(projectId, user.id);

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (title !== undefined) {
      const normalized = normalizeText(title);
      if (!normalized) {
        throw new ActionError({ code: "BAD_REQUEST", message: "Title is required." });
      }
      updates.title = normalized;
    }
    if (templateKey !== undefined) {
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

    return { project: normalizeResumeProject(project) };
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
    await getOwnedProject(projectId, user.id);

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
    await getOwnedProject(projectId, user.id);

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
    await getOwnedProject(projectId, user.id);

    const [section] = await db
      .select()
      .from(ResumeSection)
      .where(and(eq(ResumeSection.projectId, projectId), eq(ResumeSection.key, sectionKey)));

    if (!section) {
      throw new ActionError({ code: "NOT_FOUND", message: "Resume section not found." });
    }

    const now = new Date();
    const payload = JSON.stringify(data ?? {});

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
    await getOwnedProject(projectId, user.id);

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
