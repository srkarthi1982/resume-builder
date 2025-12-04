import { asc, db, eq } from 'astro:db';
import { z } from 'zod';
import { ResumeTemplates } from '../db/config';
import { createId, ensureUpdateData, nowIso } from './shared';

const templateSchema = z.object({
  key: z.string().min(1, 'Template key is required'),
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

const templateUpdateSchema = templateSchema.partial();

export type TemplateInput = z.input<typeof templateSchema>;
export type TemplateUpdateInput = z.input<typeof templateUpdateSchema>;

export async function createResumeTemplate(input: TemplateInput) {
  const data = templateSchema.parse(input);
  const timestamp = nowIso();

  const record = {
    ...data,
    id: createId(),
    created_at: timestamp,
    updated_at: timestamp,
  };

  await db.insert(ResumeTemplates).values(record);
  return record;
}

export async function listResumeTemplates({ includeInactive = false } = {}) {
  const baseQuery = db.select().from(ResumeTemplates);
  const filteredQuery = includeInactive
    ? baseQuery
    : baseQuery.where(eq(ResumeTemplates.is_active, true));

  return filteredQuery.orderBy(asc(ResumeTemplates.name));
}

export async function getResumeTemplateByKey(key: string) {
  const [template] = await db
    .select()
    .from(ResumeTemplates)
    .where(eq(ResumeTemplates.key, key))
    .limit(1);

  return template ?? null;
}

export async function updateResumeTemplate(key: string, input: TemplateUpdateInput) {
  const parsed = templateUpdateSchema.parse(input);
  const updates = ensureUpdateData({ ...parsed, updated_at: nowIso() });

  await db.update(ResumeTemplates).set(updates).where(eq(ResumeTemplates.key, key));
  return getResumeTemplateByKey(key);
}

export async function deleteResumeTemplate(key: string) {
  await db.delete(ResumeTemplates).where(eq(ResumeTemplates.key, key));
  return { success: true } as const;
}
