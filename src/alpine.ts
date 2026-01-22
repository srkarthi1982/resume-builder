import type { Alpine } from "alpinejs";
import { registerResumeBuilderStore } from "./modules/resume-builder/store";

export default function initAlpine(Alpine: Alpine) {
  registerResumeBuilderStore(Alpine);

  if (typeof window !== "undefined") {
    window.Alpine = Alpine;
  }
}
