import type { Alpine } from "alpinejs";
import { AvBaseStore } from "@ansiversa/components/alpine";
import { actions } from "astro:actions";
import type { ExampleItemDTO, ExampleItemForm } from "./types";

const PAGE_SIZE = 10;

export type AdminExampleItemsSort =
  | "newest"
  | "oldest"
  | "title-asc"
  | "title-desc"
  | "status-asc"
  | "status-desc";
export type AdminExampleItemsDir = "asc" | "desc";

const defaultForm = (): ExampleItemForm => ({
  title: "",
  content: "",
  isArchived: false,
});

const defaultState = () => ({
  items: [] as ExampleItemDTO[],
  total: 0,
  page: 1,
  pageSize: PAGE_SIZE,
  query: "",
  sort: "newest" as AdminExampleItemsSort,
  dir: "desc" as AdminExampleItemsDir,
  drawerOpen: false,
  editingId: null as string | null,
  form: defaultForm(),
  pendingDeleteId: null as string | null,
  loading: false,
  error: null as string | null,
  success: null as string | null,
});

export class AdminExampleItemsStore extends AvBaseStore implements ReturnType<typeof defaultState> {
  items: ExampleItemDTO[] = [];
  total = 0;
  page = 1;
  pageSize = PAGE_SIZE;
  query = "";
  sort: AdminExampleItemsSort = "newest";
  dir: AdminExampleItemsDir = "desc";
  drawerOpen = false;
  editingId: string | null = null;
  form = defaultForm();
  pendingDeleteId: string | null = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  private _queryTimer: number | null = null;

  init(initial?: Partial<ReturnType<typeof defaultState>>) {
    if (!initial) return;
    Object.assign(this, defaultState(), initial);
    this.items = (initial.items ?? []) as ExampleItemDTO[];
    this.total = Number(initial.total ?? this.total ?? 0);
    this.page = Math.max(1, Number(initial.page ?? this.page ?? 1));
    this.pageSize = Math.max(1, Number(initial.pageSize ?? this.pageSize ?? PAGE_SIZE));
    this.query = initial.query ?? "";
    this.sort = (initial.sort ?? "newest") as AdminExampleItemsSort;
    this.dir = (initial.dir ?? (this.sort === "newest" ? "desc" : "asc")) as AdminExampleItemsDir;
    this.drawerOpen = Boolean(initial.drawerOpen ?? false);
    this.editingId = initial.editingId ?? null;
    this.form = {
      ...defaultForm(),
      ...(initial.form ?? {}),
    };
    this.pendingDeleteId = initial.pendingDeleteId ?? null;
  }

  get totalPages() {
    return Math.max(1, Math.ceil((this.total || 0) / this.pageSize));
  }

  private unwrapResult<T = any>(result: any): T {
    if (result?.error) {
      const message = result.error?.message || result.error;
      throw new Error(message || "Request failed.");
    }
    return (result?.data ?? result) as T;
  }

  async load() {
    this.loading = true;
    this.error = null;

    try {
      const res = await actions.exampleItems.adminListItems({
        page: this.page,
        pageSize: this.pageSize,
        query: this.query || undefined,
        sort: this.sort,
        dir: this.dir,
      });
      const data = this.unwrapResult(res) as {
        items: ExampleItemDTO[];
        total: number;
        page: number;
        pageSize: number;
        sort?: AdminExampleItemsSort;
        dir?: AdminExampleItemsDir;
      };
      this.items = data.items ?? [];
      this.total = Number(data.total ?? this.items.length ?? 0);
      this.page = Math.max(1, Number(data.page ?? this.page));
      this.pageSize = Math.max(1, Number(data.pageSize ?? this.pageSize));
      this.sort = (data.sort ?? this.sort) as AdminExampleItemsSort;
      this.dir = (data.dir ?? this.dir) as AdminExampleItemsDir;
    } catch (err: any) {
      this.error = err?.message || "Failed to load items.";
    } finally {
      this.loading = false;
    }
  }

  setQuery(value: string) {
    this.query = value ?? "";
    this.page = 1;

    if (this._queryTimer) window.clearTimeout(this._queryTimer);
    this._queryTimer = window.setTimeout(() => {
      this.load();
      this._queryTimer = null;
    }, 250);
  }

  setSort(value: string, dir?: string) {
    if (dir) {
      const key = (value || "").trim();
      const nextDir = dir === "asc" ? "asc" : "desc";

      if (key === "title") {
        this.sort = nextDir === "asc" ? "title-asc" : "title-desc";
        this.dir = nextDir;
      } else if (key === "status") {
        this.sort = nextDir === "asc" ? "status-asc" : "status-desc";
        this.dir = nextDir;
      } else if (key === "updatedAt") {
        this.sort = nextDir === "asc" ? "oldest" : "newest";
        this.dir = nextDir;
      } else {
        this.sort = "newest";
        this.dir = "desc";
      }
    } else {
      const v = (value || "newest").trim();
      if (v === "oldest") {
        this.sort = "oldest";
        this.dir = "asc";
      } else if (v === "title-asc") {
        this.sort = "title-asc";
        this.dir = "asc";
      } else if (v === "title-desc") {
        this.sort = "title-desc";
        this.dir = "desc";
      } else if (v === "status-asc") {
        this.sort = "status-asc";
        this.dir = "asc";
      } else if (v === "status-desc") {
        this.sort = "status-desc";
        this.dir = "desc";
      } else {
        this.sort = "newest";
        this.dir = "desc";
      }
    }
    this.page = 1;
    this.load();
  }

  resetFilters() {
    this.query = "";
    this.sort = "newest";
    this.dir = "desc";
    this.page = 1;
    this.load();
  }

  openCreate() {
    this.drawerOpen = true;
    this.editingId = null;
    this.form = defaultForm();
    this.error = null;
    this.success = null;
  }

  openEdit(item: ExampleItemDTO) {
    this.drawerOpen = true;
    this.editingId = item?.id ?? null;
    this.form = {
      title: item?.title ?? "",
      content: item?.content ?? "",
      isArchived: Boolean(item?.isArchived),
    };
    this.error = null;
    this.success = null;
  }

  closeDrawer() {
    this.drawerOpen = false;
    this.editingId = null;
    this.form = defaultForm();
    this.error = null;
  }

  private validateForm() {
    const title = (this.form?.title || "").trim();
    const content = (this.form?.content || "").trim();
    if (!title) return { error: "Title is required." };
    return { title, content, isArchived: Boolean(this.form?.isArchived) } as const;
  }

  async submit() {
    const validated = this.validateForm();
    if ((validated as any).error) {
      this.error = (validated as any).error;
      return;
    }

    const { title, content, isArchived } = validated as {
      title: string;
      content: string;
      isArchived: boolean;
    };

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      if (this.editingId) {
        const res = await actions.exampleItems.adminUpdateItem({
          id: this.editingId,
          data: { title, content, isArchived },
        });
        this.unwrapResult(res);
        this.success = "Item updated.";
      } else {
        const res = await actions.exampleItems.adminCreateItem({
          title,
          content,
          isArchived,
        });
        this.unwrapResult(res);
        this.success = "Item created.";
      }

      this.closeDrawer();
      await this.load();
    } catch (err: any) {
      this.error = err?.message || "Failed to save item.";
    } finally {
      this.loading = false;
    }
  }

  setPage(value: number) {
    const next = Number(value);
    if (!Number.isFinite(next) || next < 1) return;
    this.page = next;
    this.load();
  }

  async deleteItem(id: string) {
    this.loading = true;
    this.error = null;

    try {
      const res = await actions.exampleItems.adminDeleteItem({ id });
      this.unwrapResult(res);
      this.items = this.items.filter((item) => item.id !== id);
      this.total = Math.max(0, this.total - 1);
      this.success = "Item deleted.";
      this.pendingDeleteId = null;
    } catch (err: any) {
      this.error = err?.message || "Unable to delete item.";
    } finally {
      this.loading = false;
    }
  }
}

export const registerAdminExampleItemsStore = (Alpine: Alpine) => {
  Alpine.store("adminExampleItems", new AdminExampleItemsStore());
};
