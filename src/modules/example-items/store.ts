import type { Alpine } from "alpinejs";
import { AvBaseStore } from "@ansiversa/components/alpine";
import { actions } from "astro:actions";
import type { ExampleItemDTO, ExampleItemForm } from "./types";

const defaultForm = (): ExampleItemForm => ({
  title: "",
  content: "",
});

const defaultState = () => ({
  items: [] as ExampleItemDTO[],
  form: defaultForm(),
  currentItem: null as ExampleItemDTO | null,
  loading: false,
  error: null as string | null,
  success: null as string | null,
});

export class ExampleItemsStore extends AvBaseStore implements ReturnType<typeof defaultState> {
  items: ExampleItemDTO[] = [];
  form: ExampleItemForm = defaultForm();
  currentItem: ExampleItemDTO | null = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  init(initial?: Partial<ReturnType<typeof defaultState>>) {
    if (!initial) return;
    Object.assign(this, defaultState(), initial);
    this.items = (initial.items ?? []) as ExampleItemDTO[];
    this.currentItem = (initial.currentItem ?? null) as ExampleItemDTO | null;
    this.form = { ...defaultForm(), ...(initial.form ?? {}) };
  }

  private unwrapResult<T = any>(result: any): T {
    if (result?.error) {
      const message = result.error?.message || result.error;
      throw new Error(message || "Request failed.");
    }
    return (result?.data ?? result) as T;
  }

  async load(includeArchived = true) {
    this.loading = true;
    this.error = null;

    try {
      const res = await actions.exampleItems.fetchMyItems({
        includeArchived,
        limit: 200,
      });
      const data = this.unwrapResult(res) as { items: ExampleItemDTO[] };
      this.items = data.items ?? [];
    } catch (err: any) {
      this.error = err?.message || "Failed to load items.";
    } finally {
      this.loading = false;
    }
  }

  async createItem() {
    if (!this.form.title.trim()) {
      this.error = "Title is required.";
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const res = await actions.exampleItems.createItem({
        title: this.form.title,
        content: this.form.content,
      });
      const data = this.unwrapResult(res) as { item: ExampleItemDTO };
      if (data?.item) {
        this.items = [data.item, ...this.items];
        this.form = defaultForm();
      }
      this.success = "Item created.";
    } catch (err: any) {
      this.error = err?.message || "Unable to create item.";
    } finally {
      this.loading = false;
    }
  }

  setCurrent(item: ExampleItemDTO | null) {
    this.currentItem = item;
    this.form = {
      title: item?.title ?? "",
      content: item?.content ?? "",
      isArchived: item?.isArchived ?? false,
    };
  }

  async updateCurrent() {
    if (!this.currentItem) return;

    this.loading = true;
    this.error = null;
    this.success = null;

    try {
      const res = await actions.exampleItems.updateMyItem({
        id: this.currentItem.id,
        data: {
          title: this.form.title,
          content: this.form.content,
          isArchived: Boolean(this.form.isArchived),
        },
      });
      const data = this.unwrapResult(res) as { item: ExampleItemDTO };
      if (data?.item) {
        this.currentItem = data.item;
        this.items = this.items.map((item) => (item.id === data.item.id ? data.item : item));
      }
      this.success = "Item updated.";
    } catch (err: any) {
      this.error = err?.message || "Unable to update item.";
    } finally {
      this.loading = false;
    }
  }

  async deleteCurrent() {
    if (!this.currentItem) return;

    this.loading = true;
    this.error = null;

    try {
      const res = await actions.exampleItems.deleteMyItem({ id: this.currentItem.id });
      this.unwrapResult(res);
      this.items = this.items.filter((item) => item.id !== this.currentItem?.id);
      this.currentItem = null;
      this.success = "Item deleted.";
      if (typeof window !== "undefined") {
        window.location.href = "/items";
      }
    } catch (err: any) {
      this.error = err?.message || "Unable to delete item.";
    } finally {
      this.loading = false;
    }
  }
}

export const registerExampleItemsStore = (Alpine: Alpine) => {
  Alpine.store("exampleItems", new ExampleItemsStore());
};
