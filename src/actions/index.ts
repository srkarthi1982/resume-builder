import type { ActionAPIContext } from "astro:actions";
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import {
  db,
  eq,
  and,
  ResumeProfiles,
  Resumes,
  ResumeTemplates,
  ResumeJobs,
} from "astro:db";

function requireUser(context: ActionAPIContext) {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;

  if (!user) {
    throw new ActionError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }

  return user;
}

export const server = {
  createProfile: defineAction({
    input: z.object({
      fullName: z.string().min(1, "Full name is required"),
      headline: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      links: z.record(z.string(), z.any()).optional(),
      summary: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [profile] = await db
        .insert(ResumeProfiles)
        .values({
          ownerId: user.id,
          fullName: input.fullName,
          headline: input.headline,
          email: input.email,
          phone: input.phone,
          location: input.location,
          links: input.links,
          summary: input.summary,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return { profile };
    },
  }),

  updateProfile: defineAction({
    input: z.object({
      id: z.number().int(),
      fullName: z.string().min(1).optional(),
      headline: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      links: z.record(z.string(), z.any()).optional(),
      summary: z.string().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const { id, ...rest } = input;

      const [existing] = await db
        .select()
        .from(ResumeProfiles)
        .where(and(eq(ResumeProfiles.id, id), eq(ResumeProfiles.ownerId, user.id)))
        .limit(1);

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Profile not found.",
        });
      }

      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== "undefined") {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return { profile: existing };
      }

      const [profile] = await db
        .update(ResumeProfiles)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(ResumeProfiles.id, id), eq(ResumeProfiles.ownerId, user.id)))
        .returning();

      return { profile };
    },
  }),

  listProfiles: defineAction({
    input: z.object({}).optional(),
    handler: async (_, context) => {
      const user = requireUser(context);

      const profiles = await db
        .select()
        .from(ResumeProfiles)
        .where(eq(ResumeProfiles.ownerId, user.id));

      return { profiles };
    },
  }),

  createResume: defineAction({
    input: z.object({
      title: z.string().min(1, "Title is required"),
      profileId: z.number().int().optional(),
      targetRole: z.string().optional(),
      targetCompany: z.string().optional(),
      templateKey: z.string().optional(),
      content: z.record(z.string(), z.any()).optional(),
      isPrimary: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      if (input.profileId) {
        const [profile] = await db
          .select()
          .from(ResumeProfiles)
          .where(
            and(eq(ResumeProfiles.id, input.profileId), eq(ResumeProfiles.ownerId, user.id))
          )
          .limit(1);

        if (!profile) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Linked profile not found.",
          });
        }
      }

      if (input.isPrimary) {
        await db
          .update(Resumes)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(eq(Resumes.ownerId, user.id));
      }

      const [resume] = await db
        .insert(Resumes)
        .values({
          ownerId: user.id,
          profileId: input.profileId,
          title: input.title,
          targetRole: input.targetRole,
          targetCompany: input.targetCompany,
          templateKey: input.templateKey,
          content: input.content,
          isPrimary: input.isPrimary ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return { resume };
    },
  }),

  updateResume: defineAction({
    input: z.object({
      id: z.number().int(),
      title: z.string().min(1).optional(),
      profileId: z.number().int().nullable().optional(),
      targetRole: z.string().optional(),
      targetCompany: z.string().optional(),
      templateKey: z.string().optional(),
      content: z.record(z.string(), z.any()).optional(),
      isPrimary: z.boolean().optional(),
      lastExportUrl: z.string().url().optional(),
      lastExportedAt: z.coerce.date().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const { id, profileId, ...rest } = input;

      const [existing] = await db
        .select()
        .from(Resumes)
        .where(and(eq(Resumes.id, id), eq(Resumes.ownerId, user.id)))
        .limit(1);

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Resume not found.",
        });
      }

      if (typeof profileId !== "undefined" && profileId !== null) {
        const [profile] = await db
          .select()
          .from(ResumeProfiles)
          .where(and(eq(ResumeProfiles.id, profileId), eq(ResumeProfiles.ownerId, user.id)))
          .limit(1);

        if (!profile) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Linked profile not found.",
          });
        }
      }

      if (rest.isPrimary) {
        await db
          .update(Resumes)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(eq(Resumes.ownerId, user.id));
      }

      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== "undefined") {
          updateData[key] = value;
        }
      }

      if (typeof profileId !== "undefined") {
        updateData.profileId = profileId;
      }

      if (Object.keys(updateData).length === 0) {
        return { resume: existing };
      }

      const [resume] = await db
        .update(Resumes)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(Resumes.id, id), eq(Resumes.ownerId, user.id)))
        .returning();

      return { resume };
    },
  }),

  deleteResume: defineAction({
    input: z.object({
      id: z.number().int(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [deleted] = await db
        .delete(Resumes)
        .where(and(eq(Resumes.id, input.id), eq(Resumes.ownerId, user.id)))
        .returning();

      if (!deleted) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Resume not found.",
        });
      }

      return { resume: deleted };
    },
  }),

  getResume: defineAction({
    input: z.object({
      id: z.number().int(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      const [resume] = await db
        .select()
        .from(Resumes)
        .where(and(eq(Resumes.id, input.id), eq(Resumes.ownerId, user.id)))
        .limit(1);

      if (!resume) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Resume not found.",
        });
      }

      const [profile] =
        resume.profileId != null
          ? await db
              .select()
              .from(ResumeProfiles)
              .where(
                and(
                  eq(ResumeProfiles.id, resume.profileId),
                  eq(ResumeProfiles.ownerId, user.id)
                )
              )
              .limit(1)
          : [null];

      return { resume, profile: profile ?? null };
    },
  }),

  listMyResumes: defineAction({
    input: z
      .object({
        profileId: z.number().int().optional(),
        onlyPrimary: z.boolean().optional(),
      })
      .optional(),
    handler: async (input, context) => {
      const user = requireUser(context);

      const filters = [eq(Resumes.ownerId, user.id)];
      if (input?.profileId) {
        filters.push(eq(Resumes.profileId, input.profileId));
      }
      if (input?.onlyPrimary) {
        filters.push(eq(Resumes.isPrimary, true));
      }

      const whereClause = filters.length === 1 ? filters[0] : and(...filters);

      const resumes = await db.select().from(Resumes).where(whereClause);

      return { resumes };
    },
  }),

  createTemplate: defineAction({
    input: z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      templateKey: z.string().min(1, "Template key is required"),
      config: z.record(z.string(), z.any()).optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      if (input.isDefault) {
        await db
          .update(ResumeTemplates)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(ResumeTemplates.ownerId, user.id));
      }

      const [template] = await db
        .insert(ResumeTemplates)
        .values({
          ownerId: user.id,
          name: input.name,
          description: input.description,
          templateKey: input.templateKey,
          config: input.config,
          isActive: input.isActive ?? true,
          isDefault: input.isDefault ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return { template };
    },
  }),

  updateTemplate: defineAction({
    input: z.object({
      id: z.number().int(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      templateKey: z.string().optional(),
      config: z.record(z.string(), z.any()).optional(),
      isActive: z.boolean().optional(),
      isDefault: z.boolean().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const { id, ...rest } = input;

      const [existing] = await db
        .select()
        .from(ResumeTemplates)
        .where(and(eq(ResumeTemplates.id, id), eq(ResumeTemplates.ownerId, user.id)))
        .limit(1);

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Template not found or you do not have access.",
        });
      }

      if (rest.isDefault) {
        await db
          .update(ResumeTemplates)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(and(eq(ResumeTemplates.ownerId, user.id), eq(ResumeTemplates.isDefault, true)));
      }

      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== "undefined") {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return { template: existing };
      }

      const [template] = await db
        .update(ResumeTemplates)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(and(eq(ResumeTemplates.id, id), eq(ResumeTemplates.ownerId, user.id)))
        .returning();

      return { template };
    },
  }),

  listTemplates: defineAction({
    input: z
      .object({
        includeInactive: z.boolean().optional(),
      })
      .optional(),
    handler: async (input, context) => {
      const user = requireUser(context);
      const includeInactive = input?.includeInactive ?? false;

      const templates = await db.select().from(ResumeTemplates);

      const filtered = templates.filter((template) => {
        const matchesOwner =
          template.ownerId === null ||
          typeof template.ownerId === "undefined" ||
          template.ownerId === user.id;
        const matchesActive = includeInactive ? true : template.isActive;
        return matchesOwner && matchesActive;
      });

      return { templates: filtered };
    },
  }),

  createJob: defineAction({
    input: z.object({
      resumeId: z.number().int().optional(),
      jobType: z.enum([
        "ai_suggest_bullets",
        "ai_rewrite_section",
        "ai_tailor_to_job",
        "export_pdf",
        "export_docx",
        "other",
      ]),
      input: z.any().optional(),
      status: z.enum(["pending", "completed", "failed"]).optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);

      if (input.resumeId) {
        const [resume] = await db
          .select()
          .from(Resumes)
          .where(and(eq(Resumes.id, input.resumeId), eq(Resumes.ownerId, user.id)))
          .limit(1);

        if (!resume) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Resume not found.",
          });
        }
      }

      const [job] = await db
        .insert(ResumeJobs)
        .values({
          resumeId: input.resumeId,
          userId: user.id,
          jobType: input.jobType,
          input: input.input,
          status: input.status ?? "pending",
          createdAt: new Date(),
        })
        .returning();

      return { job };
    },
  }),

  updateJob: defineAction({
    input: z.object({
      id: z.number().int(),
      status: z.enum(["pending", "completed", "failed"]).optional(),
      output: z.any().optional(),
    }),
    handler: async (input, context) => {
      const user = requireUser(context);
      const { id, ...rest } = input;

      const [existing] = await db
        .select()
        .from(ResumeJobs)
        .where(and(eq(ResumeJobs.id, id), eq(ResumeJobs.userId, user.id)))
        .limit(1);

      if (!existing) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Job not found.",
        });
      }

      const updateData: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(rest)) {
        if (typeof value !== "undefined") {
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return { job: existing };
      }

      const [job] = await db
        .update(ResumeJobs)
        .set(updateData)
        .where(and(eq(ResumeJobs.id, id), eq(ResumeJobs.userId, user.id)))
        .returning();

      return { job };
    },
  }),

  listJobs: defineAction({
    input: z
      .object({
        resumeId: z.number().int().optional(),
        status: z.enum(["pending", "completed", "failed"]).optional(),
      })
      .optional(),
    handler: async (input, context) => {
      const user = requireUser(context);

      const filters = [eq(ResumeJobs.userId, user.id)];
      if (input?.resumeId) {
        filters.push(eq(ResumeJobs.resumeId, input.resumeId));
      }
      if (input?.status) {
        filters.push(eq(ResumeJobs.status, input.status));
      }

      const whereClause = filters.length === 1 ? filters[0] : and(...filters);

      const jobs = await db.select().from(ResumeJobs).where(whereClause);

      return { jobs };
    },
  }),
};
