import Alpine from "alpinejs";

// Attach Alpine globally for components relying on window.Alpine
// and start it once with a simple guard.
(window as any).Alpine = Alpine;

if (!(window as any).__avAlpineInitialized) {
  (window as any).__avAlpineInitialized = true;
  Alpine.start();
}
