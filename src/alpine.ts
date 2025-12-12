import type { Alpine } from "alpinejs";
import { actions } from "astro:actions";
import { AvBaseStore, safeErrorMessage } from "@ansiversa/components/alpine";

type CreateProfileInput = Parameters<typeof actions.createProfile>[0];
type UpdateProfileInput = Parameters<typeof actions.updateProfile>[0];

const defaultSections = [
  { id: "profile", type: "profile", label: "Profile", isRequired: true },
  { id: "experience", type: "experience", label: "Experience", isRequired: true },
  { id: "education", type: "education", label: "Education", isRequired: false },
  { id: "skills", type: "skills", label: "Skills", isRequired: false },
];

const defaultTemplates: any[] = [];

type ResumeProject = {
  id: number | "new" | null;
  title: string;
  targetRole: string;
  targetCompany: string;
  location: string;
  fullName: string;
  summary: string;
  email: string;
  phone: string;
  templateId: string;
  templateName: string;
};

const emptyProject: ResumeProject = {
  id: null,
  title: "",
  targetRole: "",
  targetCompany: "",
  location: "",
  fullName: "",
  summary: "",
  email: "",
  phone: "",
  templateId: "",
  templateName: "",
};

function formatDate(value: string | number | Date | null | undefined) {
  if (!value) return "Just now";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * ✅ Global store (ONE PER APP)
 */
class ResumeBuilderStore extends AvBaseStore {
  resumes: any[] = [];
  templates: typeof defaultTemplates = [];

  activeResumeId: string | null = null;
  activeTemplateId: string | null = null;
  activeSectionId: string | null = null;

  editor = {
    project: { ...emptyProject },
    sections: [...defaultSections],
    previewHtml: "",
    isDirty: false,
    isSaving: false,
    profileId: null as number | null,
  };

  async initResumesPage() {
    this.setLoading(true);
    this.clearError();
    try {
      const { data, error } = await actions.listMyResumes({});
      if (error) throw new Error(error.message);
      console.log('data', data)
      this.resumes = (data?.resumes ?? []).map((resume: any) => ({
        ...resume,
        updatedLabel: formatDate(resume.updatedAt),
      }));
    } catch (err) {
      this.setError(safeErrorMessage(err, "Unable to load resumes."));
    } finally {
      this.setLoading(false);
    }
  }

  async initTemplatesPage() {
    this.setLoading(true);
    this.clearError();
    try {
      const { data, error } = await actions.listTemplates({});
      if (error) throw new Error(error.message);
      this.templates = data?.templates ?? [];
    } catch (err) {
      this.setError(safeErrorMessage(err, "Unable to load templates."));
    } finally {
      this.setLoading(false);
    }
  }

  async initEditorForResume(resumeId: string) {
    this.setLoading(true);
    this.clearError();

    try {
      const [templatesResult, resumeResult] = await Promise.all([
        actions.listTemplates({}),
        actions.getResume({ id: Number(resumeId) }),
      ]);

      if (templatesResult.error) throw new Error(templatesResult.error.message);
      if (resumeResult.error) throw new Error(resumeResult.error.message);

      const templatesData = templatesResult.data;
      const resumeData = resumeResult.data;

      if (!resumeData?.resume) throw new Error("Resume not found.");

      this.templates = templatesData?.templates ?? [];

      const resume = resumeData.resume;
      const profile = resumeData.profile;

      this.activeResumeId = `${resume.id}`;
      this.editor.project = {
        ...emptyProject,
        id: resume.id,
        title: resume.title ?? "Untitled resume",
        targetRole: resume.targetRole ?? profile?.headline ?? "",
        targetCompany: resume.targetCompany ?? "",
        location: profile?.location ?? "",
        fullName: profile?.fullName ?? "",
        summary: profile?.summary ?? "",
        email: profile?.email ?? "",
        phone: profile?.phone ?? "",
        templateId: resume.templateKey ?? this.templates.find((t: any) => t.isDefault)?.templateKey ?? "",
        templateName:
          this.templates.find((t: any) => t.templateKey === resume.templateKey)?.name ??
          this.templates.find((t: any) => t.isDefault)?.name ??
          "",
        profileId: profile?.id ?? null,
      } as any;

      this.activeTemplateId =
        resume.templateKey ?? this.templates.find((t: any) => t.isDefault)?.templateKey ?? null;

      const storedSections =
        (resume.content as { sections?: typeof defaultSections } | null)?.sections ?? [];
      this.editor.sections = (storedSections.length ? storedSections : defaultSections).map((section: any) => ({
        ...section,
        id: section.id ?? section.type ?? `${section.type}-${Date.now()}`,
      }));

      this.activeSectionId = this.editor.sections[0]?.id ?? null;
      this.editor.previewHtml = "";
      this.editor.profileId = profile?.id ?? null;
    } catch (err) {
      this.setError(safeErrorMessage(err, "Unable to load resume."));
    } finally {
      this.setLoading(false);
    }
  }

  async initEditorForNew(templateId?: string | null) {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await actions.listTemplates({});
      if (error) throw new Error(error.message);

      this.templates = data?.templates ?? [];

      const selectedTemplate = templateId
        ? (this.templates as any[]).find((t) => t.templateKey === templateId)
        : (this.templates as any[]).find((t) => t.isDefault) ?? (this.templates as any[])[0];

      this.editor.project = {
        ...emptyProject,
        id: "new",
        title: "Untitled resume",
        templateId: selectedTemplate?.templateKey ?? "",
        templateName: selectedTemplate?.name ?? "",
      };

      this.activeTemplateId = selectedTemplate?.templateKey ?? null;
      this.editor.sections = defaultSections.map((s) => ({ ...s }));
      this.activeSectionId = this.editor.sections[0]?.id ?? null;
      this.editor.previewHtml = "";
    } catch (err) {
      this.setError(safeErrorMessage(err, "Unable to start a new resume."));
    } finally {
      this.setLoading(false);
    }
  }

  selectSection(sectionId: string) {
    this.activeSectionId = sectionId;
  }

  addSection(sectionType: string) {
    const newId = `${sectionType}-${Date.now()}`;
    this.editor.sections = [
      ...this.editor.sections,
      {
        id: newId,
        type: sectionType,
        label: sectionType.replace(/\b\w/g, (c) => c.toUpperCase()),
        isRequired: false,
      },
    ];
    this.activeSectionId = newId;
    this.editor.isDirty = true;
  }

  removeSection(sectionId: string) {
    const section = this.editor.sections.find((s) => s.id === sectionId);
    if (section?.isRequired) return;

    this.editor.sections = this.editor.sections.filter((s) => s.id !== sectionId);
    if (this.activeSectionId === sectionId) {
      this.activeSectionId = this.editor.sections[0]?.id ?? null;
    }
    this.editor.isDirty = true;
  }

  moveSectionUp(sectionId: string) {
    const index = this.editor.sections.findIndex((s) => s.id === sectionId);
    if (index <= 0) return;
    const reordered = [...this.editor.sections];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    this.editor.sections = reordered;
    this.editor.isDirty = true;
  }

  moveSectionDown(sectionId: string) {
    const index = this.editor.sections.findIndex((s) => s.id === sectionId);
    if (index === -1 || index >= this.editor.sections.length - 1) return;
    const reordered = [...this.editor.sections];
    [reordered[index + 1], reordered[index]] = [reordered[index], reordered[index + 1]];
    this.editor.sections = reordered;
    this.editor.isDirty = true;
  }

  updateField(sectionId: string, field: string, value: any) {
    if (sectionId === "profile") {
      this.editor.project = { ...this.editor.project, [field]: value };
    }
    this.editor.isDirty = true;
  }

  async saveEditor() {
    if (this.editor.isSaving) return;

    this.editor.isSaving = true;
    this.clearError();

    const payload = {
      title: this.editor.project.title || "Untitled resume",
      targetRole: this.editor.project.targetRole || "",
      targetCompany: this.editor.project.targetCompany || "",
      templateKey: this.activeTemplateId || this.editor.project.templateId || undefined,
      content: {
        sections: this.editor.sections,
      },
    } as any;

    try {
      const profilePayload: Partial<Omit<UpdateProfileInput, "id">> = {};

      const fullName = (this.editor.project.fullName || "").trim();
      const headline = (this.editor.project.targetRole || "").trim();
      const email = (this.editor.project.email || "").trim();
      const phone = (this.editor.project.phone || "").trim();
      const location = (this.editor.project.location || "").trim();
      const summary = (this.editor.project.summary || "").trim();

      if (fullName) profilePayload.fullName = fullName;
      if (headline) profilePayload.headline = headline;
      if (email) profilePayload.email = email;
      if (phone) profilePayload.phone = phone;
      if (location) profilePayload.location = location;
      if (summary) profilePayload.summary = summary;

      const hasProfileFields = Object.keys(profilePayload).length > 0;

      if (this.editor.profileId && hasProfileFields) {
        const { data: profileResult, error: profileError } = await actions.updateProfile({
          id: this.editor.profileId,
          ...profilePayload,
        });
        if (profileError) throw new Error(profileError.message);

        payload.profileId = profileResult?.profile?.id;
        this.editor.profileId = profileResult?.profile?.id ?? this.editor.profileId;
      } else if (!this.editor.profileId && profilePayload.fullName) {
        const createPayload: CreateProfileInput = {
          fullName: profilePayload.fullName,
          headline: profilePayload.headline,
          email: profilePayload.email,
          phone: profilePayload.phone,
          location: profilePayload.location,
          links: profilePayload.links,
          summary: profilePayload.summary,
        };

        const { data: profileResult, error: profileError } = await actions.createProfile(createPayload);
        if (profileError) throw new Error(profileError.message);

        payload.profileId = profileResult?.profile?.id;
        this.editor.profileId = profileResult?.profile?.id ?? null;
      } else if (this.editor.profileId) {
        payload.profileId = this.editor.profileId;
      }

      if (this.editor.project.id === "new") {
        const { data, error } = await actions.createResume(payload);
        if (error) throw new Error(error.message);

        const resume = data?.resume;
        if (!resume) throw new Error("Resume creation failed.");

        this.editor.project.id = resume.id;
        this.activeResumeId = `${resume.id}`;
        this.resumes = [{ ...resume, updatedLabel: formatDate(resume.updatedAt) }, ...this.resumes];
      } else {
        const { data, error } = await actions.updateResume({
          id: Number(this.editor.project.id),
          ...payload,
        });
        if (error) throw new Error(error.message);

        const resume = data?.resume;
        if (!resume) throw new Error("Resume update failed.");

        this.resumes = this.resumes.map((item) =>
          item.id === resume.id ? { ...resume, updatedLabel: formatDate(resume.updatedAt) } : item,
        );
      }

      this.editor.isDirty = false;
    } catch (err) {
      this.setError(safeErrorMessage(err, "Failed to save resume."));
    } finally {
      this.editor.isSaving = false;
    }
  }

  async refreshPreview() {
    this.editor.previewHtml = "Generating preview...";
    await new Promise((resolve) => setTimeout(resolve, 250));
    this.editor.previewHtml =
      '<p class="text-slate-200">Preview rendering placeholder. Connect to backend to fetch rendered HTML.</p>';
  }

  async changeTemplate(templateId: string) {
    this.activeTemplateId = templateId;
    const template = (this.templates as any[]).find((t) => t.templateKey === templateId || t.id === templateId);
    if (template) {
      this.editor.project = {
        ...this.editor.project,
        templateId: template.templateKey ?? template.id,
        templateName: template.name,
      };
    }
    await this.refreshPreview();
  }

  async createNewResumeFromTemplate(templateId: string) {
    await this.initEditorForNew(templateId);
  }

  async createBlankResume() {
    await this.initEditorForNew(null);
  }

  async duplicateResume(resumeId: string) {
    this.clearError();
    try {
      const { data, error } = await actions.duplicateResume({ id: Number(resumeId) });
      if (error) throw new Error(error.message);

      const cloned = data?.resume;
      if (cloned) {
        this.resumes = [{ ...cloned, updatedLabel: formatDate(cloned.updatedAt) }, ...this.resumes];
      }
    } catch (err) {
      this.setError(safeErrorMessage(err, "Unable to duplicate resume."));
    }
  }

  async setPrimaryResume(resumeId: string) {
    this.clearError();
    try {
      const { data, error } = await actions.setPrimaryResume({ id: Number(resumeId) });
      if (error) throw new Error(error.message);

      const primary = data?.resume;
      if (!primary) return;

      this.resumes = this.resumes.map((item) => {
        const isPrimary = `${item.id}` === `${primary.id}`;
        return {
          ...item,
          isPrimary,
          updatedAt: isPrimary ? primary.updatedAt : item.updatedAt,
          updatedLabel: formatDate(isPrimary ? primary.updatedAt : item.updatedAt),
        };
      });
    } catch (err) {
      this.setError(safeErrorMessage(err, "Unable to set primary resume."));
    }
  }

  async deleteResume(resumeId: string) {
    this.clearError();
    try {
      const ok = this.confirm("Delete this resume? This cannot be undone.");
      if (!ok) return;

      const { error } = await actions.deleteResume({ id: Number(resumeId) });
      if (error) throw new Error(error.message);

      this.resumes = this.resumes.filter((r) => `${r.id}` !== `${resumeId}`);
      if (this.activeResumeId === resumeId) this.activeResumeId = null;
    } catch (err) {
      this.setError(safeErrorMessage(err, "Unable to delete resume."));
    }
  }
}

/**
 * ✅ Admin store (still app-level, but separate namespace)
 */
class ResumeAdminStore extends AvBaseStore {
  templates: typeof defaultTemplates = [];
  sections: any[] = [];

  activeTemplateId: string | null = null;
  activeSectionId: string | null = null;

  async initAdmin() {
    this.setLoading(true);
    this.clearError();

    try {
      const { data, error } = await actions.listTemplates({});
      if (error) throw new Error(error.message);
      this.templates = data?.templates ?? [];

      this.sections = defaultSections.map((s) => ({ ...s, enabled: true }));
      this.activeTemplateId = (this.templates as any[])[0]?.templateKey ?? null;
      this.activeSectionId = this.sections[0]?.id ?? null;
    } catch (err) {
      this.setError(safeErrorMessage(err, "Unable to load templates."));
    } finally {
      this.setLoading(false);
    }
  }

  async createTemplate(payload: any) {
    this.clearError();
    try {
      const { data, error } = await actions.createTemplate({
        name: payload.name,
        description: payload.description,
        templateKey: payload.slug || payload.templateKey || payload.name,
        config: payload.config,
        isActive: true,
      });
      if (error) throw new Error(error.message);

      const template = data?.template;
      if (!template) throw new Error("Template creation failed.");

      this.templates = [template, ...this.templates];
      this.activeTemplateId = template.templateKey ?? null;
    } catch (err) {
      this.setError(safeErrorMessage(err, "Unable to create template."));
    }
  }

  async updateTemplate(id: string, payload: any) {
    this.clearError();
    try {
      const { data, error } = await actions.updateTemplate({ id: Number(id), ...payload });
      if (error) throw new Error(error.message);

      const template = data?.template;
      if (!template) throw new Error("Template update failed.");

      this.templates = (this.templates as any[]).map((t) => (t.id === template.id ? { ...t, ...template } : t));
    } catch (err) {
      this.setError(safeErrorMessage(err, "Unable to update template."));
    }
  }

  async toggleTemplateEnabled(id: string) {
    const template = (this.templates as any[]).find((t) => `${t.id}` === `${id}`);
    if (!template) return;
    await this.updateTemplate(id, { isActive: !template.isActive });
  }

  async createSection(payload: any) {
    const section = {
      id: `${Date.now()}`,
      label: payload.label,
      type: payload.type,
      isRequired: payload.isRequired ?? false,
      enabled: payload.enabled ?? true,
    };
    this.sections = [section, ...this.sections];
    this.activeSectionId = section.id;
  }

  async updateSection(id: string, payload: any) {
    this.sections = this.sections.map((s) => (s.id === id ? { ...s, ...payload } : s));
  }
}

export default function initAlpine(Alpine: Alpine) {
  Alpine.store("resumeBuilder", new ResumeBuilderStore());
  Alpine.store("resumeAdmin", new ResumeAdminStore());
}
