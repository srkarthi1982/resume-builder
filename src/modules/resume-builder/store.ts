import type { Alpine } from "alpinejs";
import { AvBaseStore } from "@ansiversa/components/alpine";
import { actions } from "astro:actions";
import type { ResumeItemDTO, ResumeProjectDTO, ResumeProjectDetail, ResumeSectionKey } from "./types";
import { sectionLabels } from "./helpers";

const TEMPLATE_KEYS = ["classic", "modern", "minimal", "timeline"] as const;

const defaultState = () => ({
  projects: [] as ResumeProjectDTO[],
  activeProject: null as ResumeProjectDetail | null,
  activeProjectId: null as string | null,
  loading: false,
  error: null as string | null,
  success: null as string | null,
  drawerOpen: false,
  activeSectionKey: null as ResumeSectionKey | null,
  editingItemId: null as string | null,
  formData: {} as Record<string, any>,
  previewBuster: Date.now(),
  newProject: {
    title: "",
    templateKey: "classic",
  },
  projectMeta: {
    title: "",
    templateKey: "classic",
  },
  pendingDeleteId: null as string | null,
});

const normalizeText = (value?: string | null) => {
  const trimmed = (value ?? "").toString().trim();
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

const emptyBasics = () => ({
  fullName: "",
  headline: "",
  contact: {
    email: "",
    phone: "",
    website: "",
  },
  location: {
    label: "",
    city: "",
    country: "",
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
    return {
      ...emptyBasics(),
      ...data,
      contact: {
        ...emptyBasics().contact,
        ...(data?.contact ?? {}),
      },
      location: {
        ...emptyBasics().location,
        ...(data?.location ?? {}),
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
    return {
      fullName: normalizeText(data.fullName),
      headline: normalizeText(data.headline),
      contact: {
        email: normalizeText(data?.contact?.email),
        phone: normalizeText(data?.contact?.phone),
        website: normalizeText(data?.contact?.website),
      },
      location: {
        label: normalizeText(data?.location?.label),
        city: normalizeText(data?.location?.city),
        country: normalizeText(data?.location?.country),
      },
      links: Array.isArray(data.links)
        ? data.links
            .map((link: any) => ({
              label: normalizeText(link?.label),
              url: normalizeText(link?.url),
            }))
            .filter((link: any) => link.label || link.url)
        : [],
    };
  }

  if (key === "summary") {
    return { text: normalizeText(data.text) };
  }

  if (key === "experience") {
    return {
      role: normalizeText(data.role),
      company: normalizeText(data.company),
      location: normalizeText(data.location),
      startYear: normalizeNumber(data.startYear),
      startMonth: normalizeNumber(data.startMonth),
      endYear: normalizeNumber(data.endYear),
      endMonth: normalizeNumber(data.endMonth),
      present: Boolean(data.present),
      summary: normalizeText(data.summary),
      bullets: toBullets(data.bullets),
      tags: toTags(data.tags),
    };
  }

  if (key === "education") {
    return {
      degree: normalizeText(data.degree),
      school: normalizeText(data.school),
      location: normalizeText(data.location),
      startYear: normalizeNumber(data.startYear),
      startMonth: normalizeNumber(data.startMonth),
      endYear: normalizeNumber(data.endYear),
      endMonth: normalizeNumber(data.endMonth),
      grade: normalizeText(data.grade),
      bullets: toBullets(data.bullets),
    };
  }

  if (key === "projects") {
    return {
      name: normalizeText(data.name),
      link: normalizeText(data.link),
      startYear: normalizeNumber(data.startYear),
      startMonth: normalizeNumber(data.startMonth),
      endYear: normalizeNumber(data.endYear),
      endMonth: normalizeNumber(data.endMonth),
      present: Boolean(data.present),
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
  success: string | null = null;
  drawerOpen = false;
  activeSectionKey: ResumeSectionKey | null = null;
  editingItemId: string | null = null;
  formData: Record<string, any> = {};
  previewBuster = Date.now();
  newProject = {
    title: "",
    templateKey: "classic",
  };
  projectMeta = {
    title: "",
    templateKey: "classic",
  };
  pendingDeleteId: string | null = null;

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
  }

  get sectionKeys() {
    return Object.keys(sectionLabels) as ResumeSectionKey[];
  }

  get activeSection() {
    if (!this.activeProject || !this.activeSectionKey) return null;
    return this.activeProject.sections.find((section) => section.key === this.activeSectionKey) ?? null;
  }

  get activeSectionItems() {
    return this.activeSection?.items ?? [];
  }

  getSectionLabel(key: ResumeSectionKey | null) {
    if (!key) return "Section";
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

    if (!TEMPLATE_KEYS.includes(templateKey as any)) {
      this.error = "Select a valid template.";
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const res = await actions.resumeBuilder.createResumeProject({
        title,
        templateKey: templateKey as any,
      });
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

    try {
      const res = await actions.resumeBuilder.getResumeProject({ projectId: id });
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

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const res = await actions.resumeBuilder.updateResumeProject({
        projectId: this.activeProject.project.id,
        title: this.projectMeta.title,
        templateKey: this.projectMeta.templateKey as any,
      });
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

  openSection(key: ResumeSectionKey) {
    this.activeSectionKey = key;
    this.drawerOpen = true;
    this.editingItemId = null;

    if (key === "basics" || key === "summary" || key === "declaration") {
      this.ensureSectionExists(key);
      const item = this.activeSectionItems[0];
      this.formData = toFormData(key, item?.data ?? {});
    } else {
      this.formData = defaultFormForSection(key);
    }
  }

  closeDrawer() {
    this.drawerOpen = false;
    this.activeSectionKey = null;
    this.editingItemId = null;
    this.formData = {};
  }

  editItem(item: ResumeItemDTO) {
    if (!this.activeSectionKey) return;
    this.editingItemId = item.id;
    this.formData = toFormData(this.activeSectionKey, item.data ?? {});
  }

  startNewItem() {
    if (!this.activeSectionKey) return;
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
    this.success = null;

    try {
      const payload = toPayload(sectionKey, this.formData);
      const res = await actions.resumeBuilder.addOrUpdateItem({
        projectId: this.activeProject?.project.id ?? "",
        sectionKey,
        order: section.items.length + 1,
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
    this.success = null;

    try {
      const payload = toPayload(sectionKey, this.formData);
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
