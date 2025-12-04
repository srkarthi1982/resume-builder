import { asc, db, eq } from 'astro:db';
import { z } from 'zod';
import { ResumeSkills } from '../db/config';
import { createId, ensureUpdateData, nowIso } from './shared';

const skillSchema = z.object({
  resume_id: z.string().min(1, 'Resume id is required'),
  name: z.string().min(1, 'Skill name is required'),
  category: z.string().optional(),
  level: z.string().optional(),
  sort_order: z.number().int().nonnegative().default(0),
});

const skillUpdateSchema = skillSchema.partial();

export type ResumeSkillInput = z.input<typeof skillSchema>;
export type ResumeSkillUpdateInput = z.input<typeof skillUpdateSchema>;

export async function createResumeSkill(input: ResumeSkillInput) {
  const data = skillSchema.parse(input);
  const timestamp = nowIso();

  const record = {
    ...data,
    id: createId(),
    created_at: timestamp,
    updated_at: timestamp,
  };

  await db.insert(ResumeSkills).values(record);
  return record;
}

export async function listSkillsByResume(resumeId: string) {
  return db
    .select()
    .from(ResumeSkills)
    .where(eq(ResumeSkills.resume_id, resumeId))
    .orderBy(asc(ResumeSkills.sort_order));
}

export async function getResumeSkill(id: string) {
  const [skill] = await db
    .select()
    .from(ResumeSkills)
    .where(eq(ResumeSkills.id, id))
    .limit(1);

  return skill ?? null;
}

export async function updateResumeSkill(id: string, input: ResumeSkillUpdateInput) {
  const parsed = skillUpdateSchema.parse(input);
  const updates = ensureUpdateData({ ...parsed, updated_at: nowIso() });

  await db.update(ResumeSkills).set(updates).where(eq(ResumeSkills.id, id));
  return getResumeSkill(id);
}

export async function deleteResumeSkill(id: string) {
  await db.delete(ResumeSkills).where(eq(ResumeSkills.id, id));
  return { success: true } as const;
}
