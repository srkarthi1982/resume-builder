const defaultSections = [
  { id: "profile", type: "profile", label: "Profile", isRequired: true },
  { id: "experience", type: "experience", label: "Experience", isRequired: true },
  { id: "education", type: "education", label: "Education", isRequired: false },
  { id: "skills", type: "skills", label: "Skills", isRequired: false },
];

const defaultTemplates: any[] = [];

async function callAction(actionName: string, payload: Record<string, unknown> = {}) {
  const response = await fetch(`/actions/${actionName}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok || result.error) {
    const message = result?.error?.message ?? response.statusText ?? "Unknown error";
    throw new Error(message);
  }

  return result?.data ?? result;
}

function formatDate(value: string | number | Date | null | undefined) {
  if (!value) return "Just now";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function createResumeBuilderStore() {
  return {
    isLoading: false,
    error: null as string | null,

    resumes: [] as any[],
    templates: [] as typeof defaultTemplates,

    activeResumeId: null as string | null,
    activeTemplateId: null as string | null,
    activeSectionId: null as string | null,

    editor: {
      project: null as any,
      sections: [] as any[],
      previewHtml: "",
      isDirty: false,
      isSaving: false,
      profileId: null as number | null,
    },

    async initResumesPage() {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await callAction("listMyResumes");
        this.resumes = (data?.resumes ?? []).map((resume: any) => ({
          ...resume,
          updatedLabel: formatDate(resume.updatedAt),
        }));
      } catch (error: any) {
        this.error = error?.message ?? "Unable to load resumes.";
      } finally {
        this.isLoading = false;
      }
    },

    async initTemplatesPage() {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await callAction("listTemplates", {});
        this.templates = data?.templates ?? [];
      } catch (error: any) {
        this.error = error?.message ?? "Unable to load templates.";
      } finally {
        this.isLoading = false;
      }
    },

    async initEditorForResume(resumeId: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const [templatesResult, resumeResult] = await Promise.all([
          callAction("listTemplates", {}),
          callAction("getResume", { id: Number(resumeId) }),
        ]);

        this.templates = templatesResult?.templates ?? [];
        const resume = resumeResult?.resume ?? {};
        const profile = resumeResult?.profile ?? {};

        this.activeResumeId = `${resume.id}`;
        this.editor.project = {
          id: resume.id,
          title: resume.title ?? "Untitled resume",
          targetRole: resume.targetRole ?? profile.headline ?? "",
          targetCompany: resume.targetCompany ?? "",
          location: profile.location ?? "",
          fullName: profile.fullName ?? "",
          summary: profile.summary ?? "",
          email: profile.email ?? "",
          phone: profile.phone ?? "",
          templateId: resume.templateKey ?? "",
          templateName:
            this.templates.find((t) => t.templateKey === resume.templateKey)?.name ??
            this.templates.find((t) => t.isDefault)?.name ??
            "",
          profileId: profile.id ?? null,
        } as any;

        this.activeTemplateId = resume.templateKey ?? this.templates.find((t) => t.isDefault)?.templateKey ?? null;
        const storedSections = resume.content?.sections ?? [];
        this.editor.sections = (storedSections.length ? storedSections : defaultSections).map((section: any) => ({
          ...section,
          id: section.id ?? section.type ?? `${section.type}-${Date.now()}`,
        }));
        this.activeSectionId = this.editor.sections[0]?.id ?? null;
        this.editor.previewHtml = "";
        this.editor.profileId = profile.id ?? null;
      } catch (error: any) {
        this.error = error?.message ?? "Unable to load resume.";
      } finally {
        this.isLoading = false;
      }
    },

    async initEditorForNew(templateId?: string | null) {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await callAction("listTemplates", {});
        this.templates = data?.templates ?? [];

        const selectedTemplate = templateId
          ? this.templates.find((template) => template.templateKey === templateId)
          : this.templates.find((template) => template.isDefault) ?? this.templates[0];

        this.editor.project = {
          id: "new",
          title: "Untitled resume",
          targetRole: "",
        location: "",
          fullName: "",
          summary: "",
          email: "",
          phone: "",
          templateId: selectedTemplate?.templateKey ?? "",
          templateName: selectedTemplate?.name ?? "",
        };

        this.activeTemplateId = selectedTemplate?.templateKey ?? null;
        this.editor.sections = defaultSections.map((section) => ({ ...section }));
        this.activeSectionId = this.editor.sections[0]?.id ?? null;
        this.editor.previewHtml = "";
      } catch (error: any) {
        this.error = error?.message ?? "Unable to start a new resume.";
      } finally {
        this.isLoading = false;
      }
    },

    selectSection(sectionId: string) {
      this.activeSectionId = sectionId;
    },

    addSection(sectionType: string) {
      const newId = `${sectionType}-${Date.now()}`;
      this.editor.sections = [
        ...this.editor.sections,
        { id: newId, type: sectionType, label: sectionType.replace(/\b\w/g, (c) => c.toUpperCase()), isRequired: false },
      ];
      this.activeSectionId = newId;
      this.editor.isDirty = true;
    },

    removeSection(sectionId: string) {
      const section = this.editor.sections.find((item) => item.id === sectionId);
      if (section?.isRequired) return;
      this.editor.sections = this.editor.sections.filter((item) => item.id !== sectionId);
      if (this.activeSectionId === sectionId) {
        this.activeSectionId = this.editor.sections[0]?.id ?? null;
      }
      this.editor.isDirty = true;
    },

    moveSectionUp(sectionId: string) {
      const index = this.editor.sections.findIndex((item) => item.id === sectionId);
      if (index <= 0) return;
      const reordered = [...this.editor.sections];
      [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
      this.editor.sections = reordered;
      this.editor.isDirty = true;
    },

    moveSectionDown(sectionId: string) {
      const index = this.editor.sections.findIndex((item) => item.id === sectionId);
      if (index === -1 || index >= this.editor.sections.length - 1) return;
      const reordered = [...this.editor.sections];
      [reordered[index + 1], reordered[index]] = [reordered[index], reordered[index + 1]];
      this.editor.sections = reordered;
      this.editor.isDirty = true;
    },

    updateField(sectionId: string, field: string, value: any) {
      if (sectionId === "profile") {
        this.editor.project = { ...this.editor.project, [field]: value };
      }
      this.editor.isDirty = true;
    },

    async saveEditor() {
      if (this.editor.isSaving) return;
      this.editor.isSaving = true;
      this.error = null;

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
        // Sync the profile first so the resume references the latest info
        const profilePayload = {
          fullName: this.editor.project.fullName || "",
          headline: this.editor.project.targetRole || "",
          email: this.editor.project.email || undefined,
          phone: this.editor.project.phone || undefined,
          location: this.editor.project.location || undefined,
          summary: this.editor.project.summary || undefined,
        } as any;

        if (this.editor.profileId) {
          const profileResult = await callAction("updateProfile", {
            id: this.editor.profileId,
            ...profilePayload,
          });
          payload.profileId = profileResult?.profile?.id;
          this.editor.profileId = profileResult?.profile?.id ?? this.editor.profileId;
        } else {
          const profileResult = await callAction("createProfile", profilePayload);
          payload.profileId = profileResult?.profile?.id;
          this.editor.profileId = profileResult?.profile?.id ?? null;
        }

        if (this.editor.project.id === "new") {
          const { resume } = await callAction("createResume", payload);
          this.editor.project.id = resume.id;
          this.activeResumeId = `${resume.id}`;
          this.resumes = [{ ...resume, updatedLabel: formatDate(resume.updatedAt) }, ...this.resumes];
        } else {
          const { resume } = await callAction("updateResume", {
            id: Number(this.editor.project.id),
            ...payload,
          });
          this.resumes = this.resumes.map((item) =>
            item.id === resume.id ? { ...resume, updatedLabel: formatDate(resume.updatedAt) } : item,
          );
        }

        this.editor.isDirty = false;
      } catch (error: any) {
        this.error = error?.message ?? "Failed to save resume.";
      } finally {
        this.editor.isSaving = false;
      }
    },

    async refreshPreview() {
      this.editor.previewHtml = "Generating preview...";
      await new Promise((resolve) => setTimeout(resolve, 250));
      this.editor.previewHtml =
        "<p class=\"text-slate-200\">Preview rendering placeholder. Connect to backend to fetch rendered HTML.</p>";
    },

    async changeTemplate(templateId: string) {
      this.activeTemplateId = templateId;
      const template = this.templates.find(
        (item) => item.templateKey === templateId || item.id === templateId,
      );
      if (template) {
        this.editor.project = {
          ...this.editor.project,
          templateId: template.templateKey ?? template.id,
          templateName: template.name,
        };
      }
      await this.refreshPreview();
    },

    async createNewResumeFromTemplate(templateId: string) {
      await this.initEditorForNew(templateId);
    },

    async createBlankResume() {
      await this.initEditorForNew(null);
    },

    async duplicateResume(resumeId: string) {
      try {
        const { resume } = await callAction("getResume", { id: Number(resumeId) });
        const payload = {
          title: `${resume.title ?? "Untitled"} (Copy)`,
          targetRole: resume.targetRole ?? "",
          targetCompany: resume.targetCompany ?? "",
          templateKey: resume.templateKey ?? undefined,
          content: resume.content ?? {},
          profileId: resume.profileId ?? undefined,
        };
        const result = await callAction("createResume", payload);
        const cloned = result?.resume;
        this.resumes = [{ ...cloned, updatedLabel: formatDate(cloned?.updatedAt) }, ...this.resumes];
      } catch (error: any) {
        this.error = error?.message ?? "Unable to duplicate resume.";
      }
    },

    async deleteResume(resumeId: string) {
      try {
        await callAction("deleteResume", { id: Number(resumeId) });
        this.resumes = this.resumes.filter((item) => `${item.id}` !== `${resumeId}`);
        if (this.activeResumeId === resumeId) {
          this.activeResumeId = null;
        }
      } catch (error: any) {
        this.error = error?.message ?? "Unable to delete resume.";
      }
    },

    setError(msg: string | null) {
      this.error = msg;
    },
  };
}

function createResumeAdminStore() {
  return {
    isLoading: false,
    error: null as string | null,

    templates: [] as typeof defaultTemplates,
    sections: [] as typeof defaultSections,

    activeTemplateId: null as string | null,
    activeSectionId: null as string | null,

    async initAdmin() {
      this.isLoading = true;
      this.error = null;
      try {
        const data = await callAction("listTemplates", {});
        this.templates = data?.templates ?? [];
      } catch (error: any) {
        this.error = error?.message ?? "Unable to load templates.";
      }

      this.sections = defaultSections.map((section) => ({ ...section, enabled: true }));
      this.activeTemplateId = this.templates[0]?.templateKey ?? null;
      this.activeSectionId = this.sections[0]?.id ?? null;
      this.isLoading = false;
    },

    async createTemplate(payload: any) {
      try {
        const result = await callAction("createTemplate", {
          name: payload.name,
          description: payload.description,
          templateKey: payload.slug || payload.templateKey || payload.name,
          config: payload.config,
          isActive: true,
        });
        const template = result?.template;
        this.templates = [template, ...this.templates];
        this.activeTemplateId = template?.templateKey ?? null;
      } catch (error: any) {
        this.error = error?.message ?? "Unable to create template.";
      }
    },

    async updateTemplate(id: string, payload: any) {
      try {
        const { template } = await callAction("updateTemplate", { id: Number(id), ...payload });
        this.templates = this.templates.map((item) =>
          item.id === template.id ? { ...item, ...template } : item,
        );
      } catch (error: any) {
        this.error = error?.message ?? "Unable to update template.";
      }
    },

    async toggleTemplateEnabled(id: string) {
      const template = this.templates.find((item) => `${item.id}` === `${id}`);
      if (!template) return;

      await this.updateTemplate(id, { isActive: !template.isActive });
    },

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
    },

    async updateSection(id: string, payload: any) {
      this.sections = this.sections.map((section) =>
        section.id === id
          ? {
              ...section,
              ...payload,
            }
          : section,
      );
    },
  };
}

export default function initAlpine(Alpine: any) {
  Alpine.store("resumeBuilder", createResumeBuilderStore());
  Alpine.store("resumeAdmin", createResumeAdminStore());
}
