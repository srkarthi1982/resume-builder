import { ResumeProject, ResumeSection, and, count, db, desc, eq, inArray } from "astro:db";

export type ResumeBuilderDashboardSummaryV1 = {
  appId: "resume-builder";
  version: 1;
  totalResumes: number;
  defaultResumeTitle: string | null;
  lastUpdatedAt: string;
  templatesUsed: string[];
  sectionsEnabledCount?: number;
  completionHint?: number;
};

const TOTAL_SECTIONS_PER_RESUME = 11;

const toIsoString = (value?: Date | string | null) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const pickLatestIso = (items: Array<{ updatedAt?: Date | string | null; createdAt?: Date | string | null }>) => {
  let latest: string | null = null;
  items.forEach((item) => {
    const candidate = toIsoString(item.updatedAt) ?? toIsoString(item.createdAt);
    if (!candidate) return;
    if (!latest || new Date(candidate).getTime() > new Date(latest).getTime()) {
      latest = candidate;
    }
  });
  return latest;
};

export const buildResumeDashboardSummary = async (
  userId: string,
): Promise<ResumeBuilderDashboardSummaryV1> => {
  const projects = await db
    .select({
      id: ResumeProject.id,
      title: ResumeProject.title,
      templateKey: ResumeProject.templateKey,
      isDefault: ResumeProject.isDefault,
      updatedAt: ResumeProject.updatedAt,
      createdAt: ResumeProject.createdAt,
    })
    .from(ResumeProject)
    .where(eq(ResumeProject.userId, userId))
    .orderBy(desc(ResumeProject.updatedAt), desc(ResumeProject.createdAt));

  const totalResumes = projects.length;
  const defaultProject = projects.find((project) => project.isDefault);
  const defaultResumeTitle = defaultProject?.title ?? null;
  const templatesUsed = Array.from(
    new Set(projects.map((project) => project.templateKey).filter(Boolean)),
  );

  const lastUpdatedAt =
    pickLatestIso(projects) ?? new Date().toISOString();

  let sectionsEnabledCount: number | undefined;
  let completionHint: number | undefined;

  if (projects.length > 0) {
    const projectIds = projects.map((project) => project.id);
    const [{ value: enabledCountRaw } = { value: 0 }] = await db
      .select({ value: count() })
      .from(ResumeSection)
      .where(and(inArray(ResumeSection.projectId, projectIds), eq(ResumeSection.isEnabled, true)));

    sectionsEnabledCount = Number(enabledCountRaw ?? 0);

    const denom = projects.length * TOTAL_SECTIONS_PER_RESUME;
    completionHint =
      denom > 0
        ? Math.max(0, Math.min(100, Math.round((sectionsEnabledCount / denom) * 100)))
        : 0;
  }

  return {
    appId: "resume-builder",
    version: 1,
    totalResumes,
    defaultResumeTitle,
    lastUpdatedAt,
    templatesUsed,
    ...(sectionsEnabledCount !== undefined ? { sectionsEnabledCount } : {}),
    ...(completionHint !== undefined ? { completionHint } : {}),
  };
};
