import { ActionError, defineAction, type ActionAPIContext } from "astro:actions";
import { Bookmark, ResumeProject, and, db, desc, eq } from "astro:db";
import { z } from "astro:schema";
import { requireUser } from "./_guards";

const bookmarkEntityTypeSchema = z.enum(["resume"]);

const normalizeEntityId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ActionError({ code: "BAD_REQUEST", message: "Entity id is required" });
  }
  return trimmed;
};

export const listResumeBookmarks = defineAction({
  input: z.object({}).optional(),
  async handler(_input, context: ActionAPIContext) {
    const user = requireUser(context);

    const rows = await db
      .select({
        entityId: Bookmark.entityId,
        label: Bookmark.label,
        bookmarkedAt: Bookmark.createdAt,
        resumeId: ResumeProject.id,
        resumeTitle: ResumeProject.title,
        resumeUpdatedAt: ResumeProject.updatedAt,
      })
      .from(Bookmark)
      .leftJoin(ResumeProject, and(eq(Bookmark.entityId, ResumeProject.id), eq(ResumeProject.userId, user.id)))
      .where(and(eq(Bookmark.userId, user.id), eq(Bookmark.entityType, "resume")))
      .orderBy(desc(Bookmark.createdAt), desc(Bookmark.id));

    return {
      items: rows.map((row) => ({
        resumeId: row.resumeId ?? row.entityId,
        title: row.resumeTitle ?? row.label ?? "Untitled resume",
        updatedAt: row.resumeUpdatedAt,
        bookmarkedAt: row.bookmarkedAt,
      })),
    };
  },
});

export const toggleBookmark = defineAction({
  input: z.object({
    entityType: bookmarkEntityTypeSchema,
    entityId: z.string().min(1, "Entity id is required"),
    label: z.string().optional(),
  }),
  async handler(input, context: ActionAPIContext) {
    const user = requireUser(context);
    const entityId = normalizeEntityId(input.entityId);
    const label = input.label?.trim() || null;

    const existing = await db
      .select({ id: Bookmark.id })
      .from(Bookmark)
      .where(
        and(
          eq(Bookmark.userId, user.id),
          eq(Bookmark.entityType, input.entityType),
          eq(Bookmark.entityId, entityId),
        ),
      )
      .get();

    if (existing?.id) {
      await db.delete(Bookmark).where(eq(Bookmark.id, existing.id));
      return { active: false };
    }

    try {
      await db.insert(Bookmark).values({
        userId: user.id,
        entityType: input.entityType,
        entityId,
        label,
      });
      return { active: true };
    } catch {
      const stillExists = await db
        .select({ id: Bookmark.id })
        .from(Bookmark)
        .where(
          and(
            eq(Bookmark.userId, user.id),
            eq(Bookmark.entityType, input.entityType),
            eq(Bookmark.entityId, entityId),
          ),
        )
        .get();

      if (stillExists?.id) {
        return { active: true };
      }

      throw new ActionError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to toggle bookmark" });
    }
  },
});
