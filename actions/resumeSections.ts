import { asc, db, eq } from 'astro:db';
import { z } from 'zod';
import { ResumeSections } from '../db/config';
import { createId, ensureUpdateData, nowIso } from './shared';

const sectionSchema = z.object({
  resume_id: z.string().min(1, 'Resume id is required'),
  type: z.string().min(1, 'Section type is required'),
  title: z.string().min(1, 'Section title is required'),
  sort_order: z.number().int().nonnegative().default(0),
  is_visible: z.boolean().default(true),
  layout_variant: z.string().optional(),
});

const sectionUpdateSchema = sectionSchema.partial();

export type ResumeSectionInput = z.input<typeof sectionSchema>;
export type ResumeSectionUpdateInput = z.input<typeof sectionUpdateSchema>;

export async function createResumeSection(input: ResumeSectionInput) {
  const data = sectionSchema.parse(input);
  const timestamp = nowIso();

  const record = {
    ...data,
    id: createId(),
    created_at: timestamp,
    updated_at: timestamp,
  };

  await db.insert(ResumeSections).values(record);
  return record;
}

export async function listSectionsByResume(resumeId: string) {
  return db
    .select()
    .from(ResumeSections)
    .where(eq(ResumeSections.resume_id, resumeId))
    .orderBy(asc(ResumeSections.sort_order));
}

export async function getResumeSection(id: string) {
  const [section] = await db
    .select()
    .from(ResumeSections)
    .where(eq(ResumeSections.id, id))
    .limit(1);

  return section ?? null;
}

export async function updateResumeSection(id: string, input: ResumeSectionUpdateInput) {
  const parsed = sectionUpdateSchema.parse(input);
  const updates = ensureUpdateData({ ...parsed, updated_at: nowIso() });

  await db.update(ResumeSections).set(updates).where(eq(ResumeSections.id, id));
  return getResumeSection(id);
}

export async function deleteResumeSection(id: string) {
  await db.delete(ResumeSections).where(eq(ResumeSections.id, id));
  return { success: true } as const;
}
