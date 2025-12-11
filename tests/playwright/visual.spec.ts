// tests/playwright/visual.spec.ts
import { test, expect } from "@playwright/test";
import { ROUTES } from "./routes";

function routeToSnapshotName(route: string): string {
  if (route === "/") return "home";
  return route.replace(/^\//, "").replace(/\//g, "-") || "page";
}

test.describe("Ansiversa parent app - visual snapshots", () => {
  for (const route of ROUTES) {
    test(`visual snapshot for ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });

      // Small delay for fonts/layout to settle (Astro + Tailwind)
      await page.waitForTimeout(1000);

      const snapshotName = `${routeToSnapshotName(route)}.png`;

      await expect(page).toHaveScreenshot(snapshotName, {
        fullPage: true,
      });
    });
  }
});
