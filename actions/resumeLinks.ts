import { asc, db, eq } from 'astro:db';
import { z } from 'zod';
import { ResumeLinks } from '../db/config';
import { createId, ensureUpdateData, nowIso } from './shared';

const linkSchema = z.object({
  resume_id: z.string().min(1, 'Resume id is required'),
  label: z.string().min(1, 'Link label is required'),
  url: z.string().url('Link URL must be valid'),
  sort_order: z.number().int().nonnegative().default(0),
});

const linkUpdateSchema = linkSchema.partial();

export type ResumeLinkInput = z.input<typeof linkSchema>;
export type ResumeLinkUpdateInput = z.input<typeof linkUpdateSchema>;

export async function createResumeLink(input: ResumeLinkInput) {
  const data = linkSchema.parse(input);
  const timestamp = nowIso();

  const record = {
    ...data,
    id: createId(),
    created_at: timestamp,
    updated_at: timestamp,
  };

  await db.insert(ResumeLinks).values(record);
  return record;
}

export async function listLinksByResume(resumeId: string) {
  return db
    .select()
    .from(ResumeLinks)
    .where(eq(ResumeLinks.resume_id, resumeId))
    .orderBy(asc(ResumeLinks.sort_order));
}

export async function getResumeLink(id: string) {
  const [link] = await db
    .select()
    .from(ResumeLinks)
    .where(eq(ResumeLinks.id, id))
    .limit(1);

  return link ?? null;
}

export async function updateResumeLink(id: string, input: ResumeLinkUpdateInput) {
  const parsed = linkUpdateSchema.parse(input);
  const updates = ensureUpdateData({ ...parsed, updated_at: nowIso() });

  await db.update(ResumeLinks).set(updates).where(eq(ResumeLinks.id, id));
  return getResumeLink(id);
}

export async function deleteResumeLink(id: string) {
  await db.delete(ResumeLinks).where(eq(ResumeLinks.id, id));
  return { success: true } as const;
}
