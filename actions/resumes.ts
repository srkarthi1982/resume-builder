import { and, asc, db, eq, isNull } from 'astro:db';
import { z } from 'zod';
import { Resumes } from '../db/config';
import { createId, ensureUpdateData, nowIso } from './shared';

const resumeSchema = z.object({
  user_id: z.string().min(1, 'User id is required'),
  title: z.string().min(1, 'Title is required'),
  target_role: z.string().optional(),
  target_industry: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
  template_key: z.string().min(1, 'Template key is required'),
  is_primary: z.boolean().default(false),
  last_used_at: z.string().optional(),
});

const resumeUpdateSchema = resumeSchema.partial().extend({
  deleted_at: z.string().nullable().optional(),
});

export type ResumeInput = z.input<typeof resumeSchema>;
export type ResumeUpdateInput = z.input<typeof resumeUpdateSchema>;

export async function createResume(input: ResumeInput) {
  const data = resumeSchema.parse(input);
  const timestamp = nowIso();

  const record = {
    ...data,
    id: createId(),
    created_at: timestamp,
    updated_at: timestamp,
    deleted_at: null as string | null,
  };

  await db.insert(Resumes).values(record);
  return record;
}

export async function listResumesByUser(userId: string, { includeDeleted = false } = {}) {
  const baseWhere = eq(Resumes.user_id, userId);

  if (includeDeleted) {
    return db.select().from(Resumes).where(baseWhere).orderBy(asc(Resumes.created_at));
  }

  return db
    .select()
    .from(Resumes)
    .where(and(baseWhere, isNull(Resumes.deleted_at)))
    .orderBy(asc(Resumes.created_at));
}

export async function getResumeById(id: string, { includeDeleted = false } = {}) {
  const baseWhere = eq(Resumes.id, id);
  const whereClause = includeDeleted ? baseWhere : and(baseWhere, isNull(Resumes.deleted_at));

  const [resume] = await db
    .select()
    .from(Resumes)
    .where(whereClause)
    .limit(1);

  return resume ?? null;
}

export async function updateResume(id: string, input: ResumeUpdateInput) {
  const parsed = resumeUpdateSchema.parse(input);
  const updates = ensureUpdateData({ ...parsed, updated_at: nowIso() });

  await db.update(Resumes).set(updates).where(eq(Resumes.id, id));
  return getResumeById(id, { includeDeleted: true });
}

export async function softDeleteResume(id: string) {
  const timestamp = nowIso();

  await db
    .update(Resumes)
    .set({ deleted_at: timestamp, updated_at: timestamp })
    .where(eq(Resumes.id, id));

  return { success: true } as const;
}
