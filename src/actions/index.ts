import { defineAction } from "astro:actions";
import { z } from "zod";
import {
  createResume,
  getResumeById,
  listResumesByUser,
  softDeleteResume,
  updateResume,
} from "../../actions/resumes";
import { nowIso } from "../../actions/shared";

export const server = {
  createResume: defineAction({
    accept: "form",
    input: z.object({
      userId: z.string().min(1, "User is required"),
      title: z.string().min(1, "Title is required"),
      templateKey: z.string().min(1, "Template key is required"),
      targetRole: z.string().optional(),
      targetIndustry: z.string().optional(),
      location: z.string().optional(),
      summary: z.string().optional(),
    }),
    handler: async (input) => {
      const saved = await createResume({
        user_id: input.userId,
        title: input.title,
        template_key: input.templateKey,
        target_role: input.targetRole,
        target_industry: input.targetIndustry,
        location: input.location,
        summary: input.summary,
        last_used_at: nowIso(),
      });

      return { resume: saved, savedAt: saved.updated_at };
    },
  }),

  updateResume: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1, "Resume id is required"),
      userId: z.string().min(1, "User is required"),
      title: z.string().min(1, "Title is required"),
      templateKey: z.string().min(1, "Template key is required"),
      targetRole: z.string().optional(),
      targetIndustry: z.string().optional(),
      location: z.string().optional(),
      summary: z.string().optional(),
    }),
    handler: async (input) => {
      const existing = await getResumeById(input.id);

      if (!existing) {
        throw new Error("Resume not found");
      }

      const updated = await updateResume(input.id, {
        user_id: input.userId,
        title: input.title,
        template_key: input.templateKey,
        target_role: input.targetRole,
        target_industry: input.targetIndustry,
        location: input.location,
        summary: input.summary,
      });

      return { resume: updated, savedAt: updated?.updated_at };
    },
  }),

  deleteResume: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1, "Resume id is required"),
    }),
    handler: async ({ id }) => {
      await softDeleteResume(id);
      return { deletedId: id };
    },
  }),

  listResumes: defineAction({
    accept: "json",
    input: z.object({
      userId: z.string().min(1, "User is required"),
      includeDeleted: z.boolean().optional(),
    }),
    handler: async ({ userId, includeDeleted }) => {
      const resumes = await listResumesByUser(userId, { includeDeleted });
      return { resumes };
    },
  }),

  getResume: defineAction({
    accept: "json",
    input: z.object({
      id: z.string().min(1, "Resume id is required"),
      includeDeleted: z.boolean().optional(),
    }),
    handler: async ({ id, includeDeleted }) => {
      const resume = await getResumeById(id, { includeDeleted });
      return { resume };
    },
  }),
};
