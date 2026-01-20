import { defineDb } from "astro:db";
import { ExampleItem } from "./tables";

export default defineDb({
  tables: {
    ExampleItem,
  },
});
