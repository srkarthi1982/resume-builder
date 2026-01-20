import type { ExampleItemDTO } from "./types";

export type ExampleItemRow = {
  id: string;
  userId: string;
  userName?: string | null;
  title: string;
  content?: string | null;
  isArchived: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export const normalizeExampleItem = (row: ExampleItemRow): ExampleItemDTO => ({
  id: row.id,
  userId: row.userId,
  userName: row.userName ?? null,
  title: row.title,
  content: row.content ?? null,
  isArchived: row.isArchived ?? false,
  createdAt: row.createdAt ? row.createdAt.toISOString() : null,
  updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
});

export const normalizeText = (value?: string | null) => {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : "";
};
