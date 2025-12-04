import { asc, db, eq } from 'astro:db';
import { z } from 'zod';
import { ResumeItems } from '../db/config';
import { createId, ensureUpdateData, nowIso } from './shared';

const itemSchema = z.object({
  section_id: z.string().min(1, 'Section id is required'),
  title: z.string().min(1, 'Item title is required'),
  subtitle: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_current: z.boolean().default(false),
  description: z.string().optional(),
  bullets: z.string().optional(),
  metadata: z.string().optional(),
  sort_order: z.number().int().nonnegative().default(0),
});

const itemUpdateSchema = itemSchema.partial();

export type ResumeItemInput = z.input<typeof itemSchema>;
export type ResumeItemUpdateInput = z.input<typeof itemUpdateSchema>;

export async function createResumeItem(input: ResumeItemInput) {
  const data = itemSchema.parse(input);
  const timestamp = nowIso();

  const record = {
    ...data,
    id: createId(),
    created_at: timestamp,
    updated_at: timestamp,
  };

  await db.insert(ResumeItems).values(record);
  return record;
}

export async function listItemsBySection(sectionId: string) {
  return db
    .select()
    .from(ResumeItems)
    .where(eq(ResumeItems.section_id, sectionId))
    .orderBy(asc(ResumeItems.sort_order));
}

export async function getResumeItem(id: string) {
  const [item] = await db
    .select()
    .from(ResumeItems)
    .where(eq(ResumeItems.id, id))
    .limit(1);

  return item ?? null;
}

export async function updateResumeItem(id: string, input: ResumeItemUpdateInput) {
  const parsed = itemUpdateSchema.parse(input);
  const updates = ensureUpdateData({ ...parsed, updated_at: nowIso() });

  await db.update(ResumeItems).set(updates).where(eq(ResumeItems.id, id));
  return getResumeItem(id);
}

export async function deleteResumeItem(id: string) {
  await db.delete(ResumeItems).where(eq(ResumeItems.id, id));
  return { success: true } as const;
}
