import { ExampleItem } from "astro:db";
import { BaseRepository } from "./baseRepository";

type ExampleItemRow = typeof ExampleItem.$inferSelect;

export const exampleItemRepository = new BaseRepository<typeof ExampleItem, ExampleItemRow>(
  ExampleItem,
);
