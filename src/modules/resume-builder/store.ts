import type { Alpine } from "alpinejs";
import { AvBaseStore } from "@ansiversa/components/alpine";
import { actions } from "astro:actions";
import type { AvMediaUploadResult } from "@ansiversa/components";
import type { ResumeItemDTO, ResumeProjectDTO, ResumeProjectDetail, ResumeSectionKey } from "./types";
import { TEMPLATE_KEYS, TEMPLATE_OPTIONS, isProTemplate, sectionLabels } from "./helpers";
import { RESUME_MAX, RESUME_MONTH_OPTIONS, getResumeYearOptions } from "./constraints";

const PAYWALL_MESSAGE = "Template 3 & 4 are Pro templates. Upgrade to unlock.";
type ResumeEditorSectionKey = ResumeSectionKey | "photo";

const defaultState = () => ({
  projects: [] as ResumeProjectDTO[],
  activeProject: null as ResumeProjectDetail | null,
  activeProjectId: null as string | null,
  loading: false,
  error: null as string | null,
  warning: null as string | null,
  success: null as string | null,
  drawerOpen: false,
  activeSectionKey: null as ResumeEditorSectionKey | null,
  editingItemId: null as string | null,
  formData: {} as Record<string, any>,
  previewBuster: Date.now(),
  isPaid: false,
  paywallMessage: null as string | null,
  templateOptions: TEMPLATE_OPTIONS,
  newProject: {
    title: "",
    templateKey: "classic",
  },
  projectMeta: {
    title: "",
    templateKey: "classic",
  },
  pendingDeleteId: null as string | null,
  rootAppUrl: null as string | null,
});

const normalizeText = (value?: string | null) => {
  const trimmed = (value ?? "")
    .toString()
    .replace(/[\u00ad\u200b\u200c\u200d\ufeff\ufffe\uffff]/gu, "")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/gu, "-")
    .trim();
  return trimmed ? trimmed : "";
};

const normalizeNumber = (value: any) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const toBullets = (value: any) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const toTags = (value: any) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const fromArrayToText = (value?: string[] | null) => {
  if (!value || value.length === 0) return "";
  return value.join("\n");
};

const fromArrayToTags = (value?: string[] | null) => {
  if (!value || value.length === 0) return "";
  return value.join(", ");
};

const getAtPath = (source: Record<string, any>, path: string) => {
  return path.split(".").reduce<any>((cursor, segment) => {
    if (!cursor || typeof cursor !== "object") return undefined;
    return cursor[segment];
  }, source);
};

const setAtPath = (target: Record<string, any>, path: string, value: any) => {
  const segments = path.split(".");
  let cursor: Record<string, any> = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (!cursor[segment] || typeof cursor[segment] !== "object") {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  }
  cursor[segments[segments.length - 1]] = value;
};

const toDateKey = (year?: number, month?: number) => {
  if (!year) return undefined;
  return year * 100 + (month ?? 1);
};

const emptyBasics = () => ({
  fullName: "",
  headline: "",
  locationText: "",
  contact: {
    email: "",
    phone: "",
  },
  links: [{ label: "", url: "" }],
});

const emptySummary = () => ({ text: "" });

const emptyExperience = () => ({
  role: "",
  company: "",
  location: "",
  startYear: "",
  startMonth: "",
  endYear: "",
  endMonth: "",
  isPresent: false,
  present: false,
  summary: "",
  bullets: "",
  tags: "",
});

const emptyEducation = () => ({
  degree: "",
  school: "",
  location: "",
  startYear: "",
  startMonth: "",
  endYear: "",
  endMonth: "",
  grade: "",
  bullets: "",
});

const emptyProject = () => ({
  name: "",
  link: "",
  startYear: "",
  startMonth: "",
  endYear: "",
  endMonth: "",
  isPresent: false,
  present: false,
  summary: "",
  bullets: "",
  tags: "",
});

const emptySkill = () => ({
  name: "",
  level: "",
});

const emptyCertification = () => ({
  name: "",
  issuer: "",
  year: "",
  link: "",
});

const emptyAward = () => ({
  title: "",
  year: "",
  by: "",
  summary: "",
});

const emptyLanguage = () => ({
  name: "",
  proficiency: "",
});

const emptyHighlight = () => ({
  text: "",
});

const emptyDeclaration = () => ({
  text: "",
  place: "",
  name: "",
});

const defaultFormForSection = (key: ResumeSectionKey) => {
  if (key === "basics") return emptyBasics();
  if (key === "summary") return emptySummary();
  if (key === "experience") return emptyExperience();
  if (key === "education") return emptyEducation();
  if (key === "projects") return emptyProject();
  if (key === "skills") return emptySkill();
  if (key === "certifications") return emptyCertification();
  if (key === "awards") return emptyAward();
  if (key === "languages") return emptyLanguage();
  if (key === "declaration") return emptyDeclaration();
  return emptyHighlight();
};

const toFormData = (key: ResumeSectionKey, data: any) => {
  if (key === "basics") {
    const locationText = normalizeText(
      data?.locationText ?? data?.location?.label ?? [data?.location?.city, data?.location?.country].filter(Boolean).join(", "),
    );
    return {
      ...emptyBasics(),
      ...data,
      locationText,
      contact: {
        ...emptyBasics().contact,
        ...(data?.contact ?? {}),
      },
      links: Array.isArray(data?.links) && data.links.length > 0 ? data.links : emptyBasics().links,
    };
  }

  if (key === "summary") {
    return { text: data?.text ?? "" };
  }

  if (key === "experience") {
    return {
      ...emptyExperience(),
      ...data,
      bullets: fromArrayToText(data?.bullets),
      tags: fromArrayToTags(data?.tags),
      startYear: data?.startYear ?? data?.start?.year ?? "",
      startMonth: data?.startMonth ?? data?.start?.month ?? "",
      endYear: data?.endYear ?? data?.end?.year ?? "",
      endMonth: data?.endMonth ?? data?.end?.month ?? "",
      isPresent: Boolean(data?.isPresent ?? data?.present),
      present: Boolean(data?.isPresent ?? data?.present),
    };
  }

  if (key === "education") {
    return {
      ...emptyEducation(),
      ...data,
      bullets: fromArrayToText(data?.bullets),
      startYear: data?.startYear ?? data?.start?.year ?? "",
      startMonth: data?.startMonth ?? data?.start?.month ?? "",
      endYear: data?.endYear ?? data?.end?.year ?? "",
      endMonth: data?.endMonth ?? data?.end?.month ?? "",
    };
  }

  if (key === "projects") {
    return {
      ...emptyProject(),
      ...data,
      bullets: fromArrayToText(data?.bullets),
      tags: fromArrayToTags(data?.tags),
      startYear: data?.startYear ?? data?.start?.year ?? "",
      startMonth: data?.startMonth ?? data?.start?.month ?? "",
      endYear: data?.endYear ?? data?.end?.year ?? "",
      endMonth: data?.endMonth ?? data?.end?.month ?? "",
      isPresent: Boolean(data?.isPresent ?? data?.present),
      present: Boolean(data?.isPresent ?? data?.present),
    };
  }

  if (key === "skills") return { ...emptySkill(), ...data };
  if (key === "certifications") return { ...emptyCertification(), ...data };
  if (key === "awards") return { ...emptyAward(), ...data };
  if (key === "languages") return { ...emptyLanguage(), ...data };
  if (key === "declaration") return { ...emptyDeclaration(), ...data };

  return { ...emptyHighlight(), ...data };
};

const toPayload = (key: ResumeSectionKey, data: Record<string, any>) => {
  if (key === "basics") {
    const locationText = normalizeText(data.locationText);
    const links = Array.isArray(data.links)
      ? data.links
          .map((link: any) => ({
            label: normalizeText(link?.label),
            url: normalizeText(link?.url),
          }))
          .filter((link: any) => link.label && link.url)
      : [];

    return {
      fullName: normalizeText(data.fullName),
      headline: normalizeText(data.headline),
      contact: {
        email: normalizeText(data?.contact?.email),
        phone: normalizeText(data?.contact?.phone),
        website: links[0]?.url ?? "",
      },
      location: {
        label: locationText,
        city: "",
        country: "",
      },
      locationText,
      links,
    };
  }

  if (key === "summary") {
    return { text: normalizeText(data.text) };
  }

  if (key === "experience") {
    const startYear = normalizeNumber(data.startYear);
    const startMonth = normalizeNumber(data.startMonth);
    const endYear = normalizeNumber(data.endYear);
    const endMonth = normalizeNumber(data.endMonth);
    const isPresent = Boolean(data.isPresent ?? data.present);

    return {
      role: normalizeText(data.role),
      company: normalizeText(data.company),
      location: normalizeText(data.location),
      start: startYear ? { year: startYear, month: startMonth } : undefined,
      startYear,
      startMonth,
      end: isPresent || !endYear ? undefined : { year: endYear, month: endMonth },
      endYear: isPresent ? undefined : endYear,
      endMonth: isPresent ? undefined : endMonth,
      isPresent,
      present: isPresent,
      summary: normalizeText(data.summary),
      bullets: toBullets(data.bullets),
      tags: toTags(data.tags),
    };
  }

  if (key === "education") {
    const startYear = normalizeNumber(data.startYear);
    const startMonth = normalizeNumber(data.startMonth);
    const endYear = normalizeNumber(data.endYear);
    const endMonth = normalizeNumber(data.endMonth);

    return {
      degree: normalizeText(data.degree),
      school: normalizeText(data.school),
      location: normalizeText(data.location),
      start: startYear ? { year: startYear, month: startMonth } : undefined,
      startYear,
      startMonth,
      end: endYear ? { year: endYear, month: endMonth } : undefined,
      endYear,
      endMonth,
      grade: normalizeText(data.grade),
      bullets: toBullets(data.bullets),
    };
  }

  if (key === "projects") {
    const startYear = normalizeNumber(data.startYear);
    const startMonth = normalizeNumber(data.startMonth);
    const endYear = normalizeNumber(data.endYear);
    const endMonth = normalizeNumber(data.endMonth);
    const isPresent = Boolean(data.isPresent ?? data.present);

    return {
      name: normalizeText(data.name),
      link: normalizeText(data.link),
      start: startYear ? { year: startYear, month: startMonth } : undefined,
      startYear,
      startMonth,
      end: isPresent || !endYear ? undefined : { year: endYear, month: endMonth },
      endYear: isPresent ? undefined : endYear,
      endMonth: isPresent ? undefined : endMonth,
      isPresent,
      present: isPresent,
      summary: normalizeText(data.summary),
      bullets: toBullets(data.bullets),
      tags: toTags(data.tags),
    };
  }

  if (key === "skills") {
    return {
      name: normalizeText(data.name),
      level: normalizeText(data.level) || undefined,
    };
  }

  if (key === "certifications") {
    return {
      name: normalizeText(data.name),
      issuer: normalizeText(data.issuer),
      year: normalizeNumber(data.year),
      link: normalizeText(data.link),
    };
  }

  if (key === "awards") {
    return {
      title: normalizeText(data.title),
      year: normalizeNumber(data.year),
      by: normalizeText(data.by),
      summary: normalizeText(data.summary),
    };
  }

  if (key === "languages") {
    return {
      name: normalizeText(data.name),
      proficiency: normalizeText(data.proficiency),
    };
  }

  if (key === "declaration") {
    return {
      text: normalizeText(data.text),
      place: normalizeText(data.place),
      name: normalizeText(data.name),
    };
  }

  return {
    text: normalizeText(data.text),
  };
};

export class ResumeBuilderStore extends AvBaseStore implements ReturnType<typeof defaultState> {
  projects: ResumeProjectDTO[] = [];
  activeProject: ResumeProjectDetail | null = null;
  activeProjectId: string | null = null;
  loading = false;
  error: string | null = null;
  warning: string | null = null;
  success: string | null = null;
  drawerOpen = false;
  activeSectionKey: ResumeEditorSectionKey | null = null;
  editingItemId: string | null = null;
  formData: Record<string, any> = {};
  previewBuster = Date.now();
  isPaid = false;
  paywallMessage: string | null = null;
  templateOptions = TEMPLATE_OPTIONS;
  yearOptions = getResumeYearOptions();
  monthOptions = RESUME_MONTH_OPTIONS;
  newProject = {
    title: "",
    templateKey: "classic",
  };
  projectMeta = {
    title: "",
    templateKey: "classic",
  };
  pendingDeleteId: string | null = null;
  rootAppUrl: string | null = null;
  private aiAppendListener: ((event: Event) => void) | null = null;
  private aiReplaceListener: ((event: Event) => void) | null = null;

  init(initial?: Partial<ReturnType<typeof defaultState>>) {
    if (!initial) return;
    Object.assign(this, defaultState(), initial);
    this.projects = (initial.projects ?? []) as ResumeProjectDTO[];
    this.activeProject = (initial.activeProject ?? null) as ResumeProjectDetail | null;
    this.activeProjectId = initial.activeProjectId ?? this.activeProject?.project?.id ?? null;
    this.newProject = {
      title: initial.newProject?.title ?? "",
      templateKey: (initial.newProject?.templateKey ?? "classic") as string,
    };
    if (this.activeProject?.project) {
      this.projectMeta = {
        title: this.activeProject.project.title,
        templateKey: this.activeProject.project.templateKey,
      };
    }
    this.isPaid = Boolean(initial.isPaid);
    this.rootAppUrl = typeof initial.rootAppUrl === "string" ? initial.rootAppUrl : null;
    this.bindAiAssistEvents();
  }

  get activeSection() {
    if (!this.activeProject || !this.activeSectionKey || this.activeSectionKey === "photo") return null;
    return this.activeProject.sections.find((section) => section.key === this.activeSectionKey) ?? null;
  }

  get activeSectionItems() {
    return this.activeSection?.items ?? [];
  }

  isTemplateLocked(templateKey: string) {
    return isProTemplate(templateKey) && !this.isPaid;
  }

  selectNewTemplate(templateKey: string) {
    if (this.isTemplateLocked(templateKey)) {
      this.paywallMessage = PAYWALL_MESSAGE;
      return;
    }
    this.paywallMessage = null;
    this.newProject.templateKey = templateKey;
  }

  selectProjectTemplate(templateKey: string) {
    if (this.isTemplateLocked(templateKey)) {
      this.paywallMessage = PAYWALL_MESSAGE;
      return;
    }
    this.paywallMessage = null;
    this.projectMeta.templateKey = templateKey;
  }

  getSectionLabel(key: ResumeEditorSectionKey | null) {
    if (!key) return "Section";
    if (key === "photo") return "Photo";
    return sectionLabels[key] ?? "Section";
  }

  itemLabel(item: ResumeItemDTO) {
    if (!this.activeSectionKey) return "Item";
    const data = item?.data ?? {};

    if (this.activeSectionKey === "experience") {
      return normalizeText(`${data.role ?? ""} ${data.company ? `@ ${data.company}` : ""}`) || "Experience";
    }

    if (this.activeSectionKey === "education") {
      return normalizeText(`${data.degree ?? ""} ${data.school ? `- ${data.school}` : ""}`) || "Education";
    }

    if (this.activeSectionKey === "projects") {
      return normalizeText(data.name ?? "") || "Project";
    }

    if (this.activeSectionKey === "skills") {
      return normalizeText(data.name ?? "") || "Skill";
    }

    if (this.activeSectionKey === "certifications") {
      return normalizeText(data.name ?? "") || "Certification";
    }

    if (this.activeSectionKey === "awards") {
      return normalizeText(data.title ?? "") || "Achievement";
    }

    if (this.activeSectionKey === "languages") {
      return normalizeText(data.name ?? "") || "Language";
    }

    if (this.activeSectionKey === "highlights") {
      return normalizeText(data.text ?? "") || "Highlight";
    }

    if (this.activeSectionKey === "declaration") {
      return "Declaration";
    }

    return "Item";
  }

  enforceLimit(path: string, max: number) {
    const current = getAtPath(this.formData, path);
    if (typeof current !== "string") return;
    if (current.length <= max) return;
    setAtPath(this.formData, path, current.slice(0, max));
  }

  enforceLineLimit(path: string, maxPerLine: number) {
    const current = getAtPath(this.formData, path);
    if (typeof current !== "string") return;
    const clamped = current
      .split("\n")
      .map((line) => line.slice(0, maxPerLine))
      .join("\n");
    if (clamped !== current) {
      setAtPath(this.formData, path, clamped);
    }
  }

  togglePresent(flagPath = "present") {
    const active = Boolean(getAtPath(this.formData, flagPath));
    setAtPath(this.formData, "present", active);
    setAtPath(this.formData, "isPresent", active);
    if (active) {
      setAtPath(this.formData, "endYear", "");
      setAtPath(this.formData, "endMonth", "");
    }
  }

  private validateDateRules(sectionKey: ResumeSectionKey, payload: Record<string, any>) {
    if (!["experience", "education", "projects"].includes(sectionKey)) {
      return;
    }

    const startYear = Number(payload.startYear) || undefined;
    const startMonth = Number(payload.startMonth) || undefined;
    const endYear = Number(payload.endYear) || undefined;
    const endMonth = Number(payload.endMonth) || undefined;
    const isPresent = Boolean(payload.isPresent ?? payload.present);
    const maxYear = this.yearOptions[0];
    const minYear = this.yearOptions[this.yearOptions.length - 1];

    if ((startYear && (startYear < minYear || startYear > maxYear)) || (endYear && (endYear < minYear || endYear > maxYear))) {
      throw new Error(`Years must be between ${minYear} and ${maxYear}.`);
    }

    if (isPresent && (endYear || endMonth)) {
      throw new Error("End date must be empty when marked as present.");
    }

    if (startMonth && !startYear) {
      throw new Error("Start year is required when start month is selected.");
    }

    if (endMonth && !endYear) {
      throw new Error("End year is required when end month is selected.");
    }

    if ((endYear || endMonth) && !startYear) {
      throw new Error("Start year is required when end date is selected.");
    }

    const startKey = toDateKey(startYear, startMonth);
    const endKey = toDateKey(endYear, endMonth ?? 12);
    if (startKey && endKey && endKey < startKey) {
      throw new Error("End date must be after start date.");
    }
  }

  private warnOnEducationOverlap(nextPayload: Record<string, any>, editingItemId?: string | null) {
    if (this.activeSectionKey !== "education" || !this.activeSection) return;

    const currentStart = toDateKey(
      Number(nextPayload.startYear) || undefined,
      Number(nextPayload.startMonth) || undefined,
    );
    const currentEnd = toDateKey(
      Number(nextPayload.endYear) || undefined,
      Number(nextPayload.endMonth) || 12,
    );

    if (!currentStart || !currentEnd) return;

    const hasOverlap = this.activeSection.items
      .filter((item) => item.id !== editingItemId)
      .some((item) => {
        const otherStart = toDateKey(
          Number(item.data?.startYear ?? item.data?.start?.year) || undefined,
          Number(item.data?.startMonth ?? item.data?.start?.month) || undefined,
        );
        const otherEnd = toDateKey(
          Number(item.data?.endYear ?? item.data?.end?.year) || undefined,
          Number(item.data?.endMonth ?? item.data?.end?.month) || 12,
        );
        if (!otherStart || !otherEnd) return false;
        return currentStart <= otherEnd && otherStart <= currentEnd;
      });

    if (hasOverlap) {
      this.warning = "Education dates overlap with another entry. Please verify chronology.";
    }
  }

  private unwrapResult<T = any>(result: any): T {
    if (result?.error) {
      const message = result.error?.message || result.error;
      throw new Error(message || "Request failed.");
    }
    return (result?.data ?? result) as T;
  }

  private setProjectMeta(project: ResumeProjectDTO) {
    this.projectMeta = {
      title: project.title,
      templateKey: project.templateKey,
    };
  }

  private refreshPreview() {
    const now = Date.now();
    this.previewBuster = now === this.previewBuster ? now + 1 : now;
  }

  private async ensureSectionExists(key: ResumeSectionKey) {
    if (!this.activeProject?.project?.id) return;
    const existing = this.activeProject.sections.find((section) => section.key === key);
    if (existing) return;

    const orderMap: Record<ResumeSectionKey, number> = {
      basics: 1,
      summary: 2,
      experience: 3,
      education: 4,
      skills: 5,
      projects: 6,
      certifications: 7,
      awards: 8,
      languages: 9,
      highlights: 10,
      declaration: 11,
    };

    try {
      const res = await actions.resumeBuilder.upsertSection({
        projectId: this.activeProject.project.id,
        key,
        order: orderMap[key],
        isEnabled: true,
      });
      const data = this.unwrapResult(res) as { section: any };
      if (data?.section) {
        this.activeProject.sections = [...this.activeProject.sections, data.section];
      }
    } catch {
      // ignore; handled when saving
    }
  }

  get previewSrc() {
    if (!this.activeProjectId) return "";
    return `/app/resumes/${this.activeProjectId}/print?preview=1&t=${this.previewBuster}`;
  }

  private updateProjectInList(project: ResumeProjectDTO) {
    this.projects = this.projects.map((item) => (item.id === project.id ? project : item));
  }

  async loadProjects() {
    this.loading = true;
    this.error = null;

    try {
      const res = await actions.resumeBuilder.listResumeProjects({});
      const data = this.unwrapResult(res) as { items: ResumeProjectDTO[] };
      this.projects = data.items ?? [];
    } catch (err: any) {
      this.error = err?.message || "Failed to load resumes.";
    } finally {
      this.loading = false;
    }
  }

  async createProject() {
    const title = normalizeText(this.newProject.title);
    const templateKey = (this.newProject.templateKey || "classic") as string;

    if (!title) {
      this.error = "Title is required.";
      return;
    }
    if (title.length > RESUME_MAX.projectTitle) {
      this.error = `Title must be ${RESUME_MAX.projectTitle} characters or fewer.`;
      return;
    }

    if (!TEMPLATE_KEYS.includes(templateKey as any)) {
      this.error = "Select a valid template.";
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;
    this.paywallMessage = null;

    try {
      const res = await actions.resumeBuilder.createResumeProject({
        title,
        templateKey: templateKey as any,
      });
      if (res?.error?.code === "PAYMENT_REQUIRED") {
        this.paywallMessage = res.error.message || PAYWALL_MESSAGE;
        return;
      }
      const data = this.unwrapResult(res) as ResumeProjectDetail;
      if (data?.project) {
        this.projects = [data.project, ...this.projects];
        this.newProject = { title: "", templateKey: templateKey };
        this.activeProject = data;
        this.activeProjectId = data.project.id;
        this.setProjectMeta(data.project);
      }
      this.success = "Resume created.";
    } catch (err: any) {
      this.error = err?.message || "Unable to create resume.";
    } finally {
      this.loading = false;
    }
  }

  async loadProject(id: string) {
    if (!id) return;

    this.loading = true;
    this.error = null;
    this.paywallMessage = null;

    try {
      const res = await actions.resumeBuilder.getResumeProject({ projectId: id });
      if (res?.error?.code === "PAYMENT_REQUIRED") {
        this.paywallMessage = res.error.message || PAYWALL_MESSAGE;
        return;
      }
      const data = this.unwrapResult(res) as ResumeProjectDetail;
      this.activeProject = data;
      this.activeProjectId = data.project?.id ?? id;
      this.setProjectMeta(data.project);
      this.refreshPreview();
    } catch (err: any) {
      this.error = err?.message || "Unable to load resume.";
    } finally {
      this.loading = false;
    }
  }

  async saveProjectMeta() {
    if (!this.activeProject?.project) return;
    const title = normalizeText(this.projectMeta.title);
    if (!title) {
      this.error = "Title is required.";
      return;
    }
    if (title.length > RESUME_MAX.projectTitle) {
      this.error = `Title must be ${RESUME_MAX.projectTitle} characters or fewer.`;
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;
    this.paywallMessage = null;

    try {
      const res = await actions.resumeBuilder.updateResumeProject({
        projectId: this.activeProject.project.id,
        title,
        templateKey: this.projectMeta.templateKey as any,
      });
      if (res?.error?.code === "PAYMENT_REQUIRED") {
        this.paywallMessage = res.error.message || PAYWALL_MESSAGE;
        return;
      }
      const data = this.unwrapResult(res) as { project: ResumeProjectDTO };
      if (data?.project) {
        this.activeProject.project = data.project;
        this.updateProjectInList(data.project);
        this.setProjectMeta(data.project);
        this.refreshPreview();
      }
      this.success = "Resume details updated.";
    } catch (err: any) {
      this.error = err?.message || "Unable to update resume.";
    } finally {
      this.loading = false;
    }
  }

  async saveProjectPhoto(media: AvMediaUploadResult) {
    if (!this.activeProject?.project?.id) return;

    const nextPhotoUrl = normalizeText(media?.url);
    const nextPhotoKey = normalizeText(media?.key);
    if (!nextPhotoUrl || !nextPhotoKey) {
      this.error = "Uploaded image is invalid.";
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const previous = {
      photoKey: this.activeProject.project.photoKey,
      photoUrl: this.activeProject.project.photoUrl,
      photoUpdatedAt: this.activeProject.project.photoUpdatedAt,
    };

    const nowIso = new Date().toISOString();
    this.activeProject.project.photoKey = nextPhotoKey;
    this.activeProject.project.photoUrl = nextPhotoUrl;
    this.activeProject.project.photoUpdatedAt = nowIso;

    try {
      const res = await actions.resumeBuilder.resumeUpdateProjectPhoto({
        projectId: this.activeProject.project.id,
        photoKey: nextPhotoKey,
        photoUrl: nextPhotoUrl,
      });
      this.unwrapResult<{ ok: true }>(res);

      this.projects = this.projects.map((item) =>
        item.id === this.activeProject?.project.id
          ? {
              ...item,
              photoKey: nextPhotoKey,
              photoUrl: nextPhotoUrl,
              photoUpdatedAt: nowIso,
            }
          : item,
      );
      this.refreshPreview();
      this.success = "Profile photo updated.";
    } catch (err: any) {
      this.activeProject.project.photoKey = previous.photoKey;
      this.activeProject.project.photoUrl = previous.photoUrl;
      this.activeProject.project.photoUpdatedAt = previous.photoUpdatedAt;
      this.error = err?.message || "Unable to save profile photo.";
    } finally {
      this.loading = false;
    }
  }

  async setDefault(id: string) {
    if (!id) return;
    this.loading = true;
    this.error = null;

    try {
      const res = await actions.resumeBuilder.setDefaultResumeProject({ projectId: id });
      const data = this.unwrapResult(res) as { project: ResumeProjectDTO };
      if (data?.project) {
        this.projects = this.projects.map((item) => ({
          ...item,
          isDefault: item.id === data.project.id,
        }));
        if (this.activeProject?.project?.id === data.project.id) {
          this.activeProject.project = data.project;
        }
      }
    } catch (err: any) {
      this.error = err?.message || "Unable to set default.";
    } finally {
      this.loading = false;
    }
  }

  async deleteProject(id: string) {
    if (!id) return;
    this.loading = true;
    this.error = null;

    try {
      const res = await actions.resumeBuilder.deleteResumeProject({ projectId: id });
      this.unwrapResult(res);
      this.projects = this.projects.filter((item) => item.id !== id);
      if (this.activeProject?.project?.id === id) {
        this.activeProject = null;
        this.activeProjectId = null;
      }
      this.success = "Resume deleted.";
    } catch (err: any) {
      this.error = err?.message || "Unable to delete resume.";
    } finally {
      this.loading = false;
    }
  }

  async openSection(key: ResumeEditorSectionKey) {
    this.activeSectionKey = key;
    this.editingItemId = null;
    this.warning = null;

    if (key === "photo") {
      if (this.activeProject?.project?.id) {
        await this.loadProject(this.activeProject.project.id);
      }
      this.formData = {};
      this.drawerOpen = true;
      return;
    }

    if (key === "basics" || key === "summary" || key === "declaration") {
      this.ensureSectionExists(key);
      const item = this.activeSectionItems[0];
      this.formData = toFormData(key, item?.data ?? {});
    } else {
      this.formData = defaultFormForSection(key);
    }
    this.drawerOpen = true;
  }

  closeDrawer() {
    this.drawerOpen = false;
    this.activeSectionKey = null;
    this.editingItemId = null;
    this.formData = {};
    this.warning = null;
  }

  private bindAiAssistEvents() {
    if (typeof window === "undefined") return;

    if (this.aiAppendListener) {
      window.removeEventListener("av:ai-append", this.aiAppendListener as EventListener);
    }
    if (this.aiReplaceListener) {
      window.removeEventListener("av:ai-replace", this.aiReplaceListener as EventListener);
    }

    this.aiAppendListener = (event: Event) => {
      const suggestion = this.readAiSuggestion(event);
      if (!suggestion) return;
      this.applySummarySuggestion("append", suggestion);
    };

    this.aiReplaceListener = (event: Event) => {
      const suggestion = this.readAiSuggestion(event);
      if (!suggestion) return;
      this.applySummarySuggestion("replace", suggestion);
    };

    window.addEventListener("av:ai-append", this.aiAppendListener as EventListener);
    window.addEventListener("av:ai-replace", this.aiReplaceListener as EventListener);
  }

  private readAiSuggestion(event: Event) {
    const detailText = (event as CustomEvent<{ text?: unknown }>).detail?.text;
    return normalizeText(typeof detailText === "string" ? detailText : "");
  }

  private applySummarySuggestion(mode: "append" | "replace", suggestion: string) {
    if (this.activeSectionKey !== "summary") return;
    const current = normalizeText(this.formData?.text);
    const needsNewline = mode === "append" && current.length > 0;
    const nextValue =
      mode === "replace"
        ? suggestion
        : `${current}${needsNewline ? "\n" : ""}${suggestion}`;
    this.formData.text = nextValue.slice(0, RESUME_MAX.summary);
  }

  editItem(item: ResumeItemDTO) {
    if (!this.activeSectionKey) return;
    if (this.activeSectionKey === "photo") return;
    this.editingItemId = item.id;
    this.formData = toFormData(this.activeSectionKey, item.data ?? {});
  }

  startNewItem() {
    if (!this.activeSectionKey) return;
    if (this.activeSectionKey === "photo") return;
    this.editingItemId = null;
    this.formData = defaultFormForSection(this.activeSectionKey);
  }

  addLink() {
    if (!this.formData?.links) {
      this.formData.links = [];
    }
    this.formData.links.push({ label: "", url: "" });
  }

  removeLink(index: number) {
    if (!Array.isArray(this.formData?.links)) return;
    this.formData.links.splice(index, 1);
    if (this.formData.links.length === 0) {
      this.formData.links.push({ label: "", url: "" });
    }
  }

  async addItem(sectionKey: ResumeSectionKey) {
    const section = this.activeProject?.sections.find((entry) => entry.key === sectionKey);
    if (!section) return;

    this.loading = true;
    this.error = null;
    this.warning = null;
    this.success = null;

    try {
      const payload = toPayload(sectionKey, this.formData);
      this.validateDateRules(sectionKey, payload);
      this.warnOnEducationOverlap(payload, null);
      const nextOrder =
        section.items.reduce((max, entry) => Math.max(max, Number(entry.order) || 0), 0) + 1;
      const res = await actions.resumeBuilder.addOrUpdateItem({
        projectId: this.activeProject?.project.id ?? "",
        sectionKey,
        order: nextOrder,
        data: payload,
      });
      const data = this.unwrapResult(res) as { item: ResumeItemDTO };
      if (data?.item) {
        section.items = [...section.items, data.item];
        this.startNewItem();
        this.refreshPreview();
      }
      this.success = "Saved.";
    } catch (err: any) {
      this.error = err?.message || "Unable to save item.";
    } finally {
      this.loading = false;
    }
  }

  async updateItem(sectionKey: ResumeSectionKey, item: ResumeItemDTO) {
    if (!item?.id) return;
    this.loading = true;
    this.error = null;
    this.warning = null;
    this.success = null;

    try {
      const payload = toPayload(sectionKey, this.formData);
      this.validateDateRules(sectionKey, payload);
      this.warnOnEducationOverlap(payload, item.id);
      const res = await actions.resumeBuilder.addOrUpdateItem({
        projectId: this.activeProject?.project.id ?? "",
        sectionKey,
        itemId: item.id,
        order: item.order ?? 0,
        data: payload,
      });
      const data = this.unwrapResult(res) as { item: ResumeItemDTO };
      if (data?.item) {
        const section = this.activeProject?.sections.find((entry) => entry.key === sectionKey);
        if (section) {
          section.items = section.items.map((entry) => (entry.id === data.item.id ? data.item : entry));
        }
        this.refreshPreview();
      }
      this.success = "Saved.";
    } catch (err: any) {
      this.error = err?.message || "Unable to save item.";
    } finally {
      this.loading = false;
    }
  }

  async saveSingleSection(sectionKey: ResumeSectionKey) {
    if (!this.activeProject || !this.activeSection) return;

    const existing = this.activeSection.items[0];
    if (existing) {
      await this.updateItem(sectionKey, existing);
    } else {
      await this.addItem(sectionKey);
    }
  }

  async saveActiveItem() {
    if (!this.activeSectionKey) return;
    if (this.activeSectionKey === "photo") return;

    if (this.activeSectionKey === "basics" || this.activeSectionKey === "summary" || this.activeSectionKey === "declaration") {
      await this.ensureSectionExists(this.activeSectionKey);
      await this.saveSingleSection(this.activeSectionKey);
      return;
    }

    if (this.editingItemId) {
      const item = this.activeSectionItems.find((entry) => entry.id === this.editingItemId);
      if (item) {
        await this.updateItem(this.activeSectionKey, item);
      }
      return;
    }

    await this.addItem(this.activeSectionKey);
  }

  async deleteItem(itemId: string) {
    if (!this.activeProject?.project?.id) return;
    this.loading = true;
    this.error = null;

    try {
      const res = await actions.resumeBuilder.deleteItem({
        projectId: this.activeProject.project.id,
        itemId,
      });
      this.unwrapResult(res);
      if (this.activeSection) {
        this.activeSection.items = this.activeSection.items.filter((item) => item.id !== itemId);
      }
      this.refreshPreview();
      this.success = "Item removed.";
    } catch (err: any) {
      this.error = err?.message || "Unable to delete item.";
    } finally {
      this.loading = false;
    }
  }
}

export const registerResumeBuilderStore = (Alpine: Alpine) => {
  Alpine.store("resumeBuilder", new ResumeBuilderStore());
};
