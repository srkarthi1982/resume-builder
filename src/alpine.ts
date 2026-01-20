import type { Alpine } from "alpinejs";
import { registerAdminExampleItemsStore } from "./modules/example-items/adminStore";
import { registerExampleItemsStore } from "./modules/example-items/store";

export default function initAlpine(Alpine: Alpine) {
  registerExampleItemsStore(Alpine);
  registerAdminExampleItemsStore(Alpine);

  if (typeof window !== "undefined") {
    window.Alpine = Alpine;
  }
}
