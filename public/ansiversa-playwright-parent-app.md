# ✅ Playwright Visual Regression Setup — Ansiversa Parent App (`web`)

This document tells Codex exactly how to set up **Playwright visual regression testing** for the **Ansiversa parent app** (the `web` repo hosted at `www.ansiversa.com`).

> ❗ Scope: **Only the parent app (web)** for now. Do **not** touch any of the 100 mini-app repos in this step.

The goal is:

- Capture **baseline screenshots** for key pages (`/`, `/about`, `/apps`, etc.).
- On every future run (local or CI), compare the current UI against those screenshots.
- Fail the test if there is an unexpected visual change (layout broken, styles missing, etc.).

---

## 1. Dependencies — Install Playwright

In the root of the **web** repo (parent app), install Playwright test runner as a dev dependency.

If the project uses **npm**:

```bash
npm install -D @playwright/test
```

If the project uses **pnpm**:

```bash
pnpm add -D @playwright/test
```

Then install the browser binaries (we only need Chromium for now):

```bash
npx playwright install chromium
```

> ✅ Do this locally and ensure it succeeds with no errors.

Do **not** commit the installed browsers; they live in `.cache` outside the repo.

---

## 2. Project Structure for Playwright Tests

Create the following folders and files in the **web** repo:

```text
(web repo root)
├─ playwright.config.ts
├─ tests/
│  └─ playwright/
│     ├─ routes.ts
│     └─ visual.spec.ts
└─ .github/
   └─ workflows/
      └─ playwright.yml
```

If `tests/` already exists, just add the `playwright/` subfolder.

> ❗ Do **not** modify or delete any existing `src/` pages, layouts, components, or Astro files. Only add the files listed above.

---

## 3. `playwright.config.ts` (root level)

Create `playwright.config.ts` in the **root** of the `web` repo with the following content:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/playwright",
  timeout: 60_000,
  expect: {
    // Allow very small rendering differences, but fail on visible layout changes
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
    },
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }]] : [["list"], ["html", { open: "on-failure" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:4321",
    viewport: { width: 1280, height: 720 },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
```

Notes:

- `baseURL` defaults to `http://localhost:4321` (Astro default dev port).  
  - In CI we will override `PLAYWRIGHT_BASE_URL` to the **locally running dev server URL**.
- We only run **Chromium** for now to keep CI fast and simple.
- `maxDiffPixelRatio: 0.01` gives a tiny tolerance for rendering noise.

---

## 4. Define the Routes to Snapshot — `tests/playwright/routes.ts`

Create `tests/playwright/routes.ts` with the list of **public pages** we want to visually test in the parent app.

```ts
// tests/playwright/routes.ts

/**
 * List of routes in the Ansiversa parent app (web) to capture visual snapshots for.
 * Only include PUBLIC pages that do not require authentication.
 */
export const ROUTES: string[] = [
  "/",          // Home
  "/about",     // About Ansiversa
  "/apps",      // Apps listing page
  "/auth/login",
  "/auth/register",
];
```

> Later we can add more routes (e.g., blog pages, docs, etc.), but start with these.

---

## 5. Visual Regression Test — `tests/playwright/visual.spec.ts`

Create `tests/playwright/visual.spec.ts` with the following content:

```ts
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
```

What this does:

- Loops over every route from `ROUTES`.
- Navigates to that route relative to `baseURL` from the config.
- Waits for the network to be idle and layout to settle.
- Captures a full-page screenshot.
- On first run → **creates baseline images**.  
- On later runs → compares to the baseline and fails on unexpected changes.

Baseline screenshots will be created under a Playwright-managed directory inside `tests/playwright` (e.g. `__screenshots__`). These baseline images **must be committed to Git**.

---

## 6. Running Tests Locally

### 6.1 Start the Astro dev server

In one terminal (from the `web` repo root):

```bash
npm run dev
```

Assumption: this runs Astro dev on **http://localhost:4321**.  
If the port differs, either:

- Update `baseURL` in `playwright.config.ts`, or
- Run Playwright tests with `PLAYWRIGHT_BASE_URL` overridden.

### 6.2 First run — create baseline screenshots

In a second terminal:

```bash
npx playwright test tests/playwright/visual.spec.ts --update-snapshots
```

This will:

- Open each route.
- Capture screenshots.
- Store baseline snapshots.

Commit these baseline snapshots to the repo.

### 6.3 Future runs — compare against baseline

After any UI changes:

```bash
npx playwright test tests/playwright/visual.spec.ts
```

- If everything matches → tests pass.
- If there’s a visual difference → tests fail and Playwright saves:
  - Expected (baseline)
  - Actual (new)
  - Diff (highlighted changes)

You can also open the HTML report:

```bash
npx playwright show-report
```

---

## 7. Git Ignore Rules

Make sure **baseline screenshots are NOT ignored**. Check `.gitignore` and ensure there is **no rule** ignoring:

- `tests/playwright/**`
- `*.png` inside `tests/playwright`

We **do want** baseline images in Git.

Playwright’s temporary output directory (usually `playwright-report/` and `test-results/`) will be generated on each run. These can stay uncommitted.

You may optionally add to `.gitignore`:

```gitignore
playwright-report/
test-results/
```

---

## 8. GitHub Actions CI — `.github/workflows/playwright.yml`

Create the workflow file at:

`./.github/workflows/playwright.yml` with the following content:

```yaml
name: Playwright Visual Tests

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build Astro app
        run: npm run build

      - name: Start preview server
        run: npm run preview -- --host 0.0.0.0 --port 4321 &
      
      - name: Wait for preview server
        run: npx wait-on http://127.0.0.1:4321

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright visual tests
        env:
          PLAYWRIGHT_BASE_URL: "http://127.0.0.1:4321"
        run: npx playwright test tests/playwright/visual.spec.ts

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report
```

Notes:

- We **build** the Astro app and run `npm run preview` instead of dev server.  
  This is closer to the real production environment.
- `wait-on` ensures the preview server is up before tests run.  
  If `wait-on` is not installed yet, add it as a dev dependency:

  ```bash
  npm install -D wait-on
  ```

- The HTML report is uploaded as an artifact named `playwright-report` for each CI run.

---

## 9. Workflow & Best Practices

1. **When UI changes are intentional** (new layout, redesigned section):
   - Run Playwright tests locally with `--update-snapshots`.
   - Review the screenshots.
   - Commit the updated baseline images along with the UI changes.

2. **When UI changes are unintentional** (regressions):
   - CI will fail on PR.
   - Download the report/artifacts.
   - Inspect the diff images.
   - Fix the UI or revert the change.

3. **Codex must not:**
   - Delete or modify baseline images without explicit instruction.
   - Loosen thresholds (`maxDiffPixelRatio`) too much.
   - Rename the `tests/playwright` structure arbitrarily.

4. **Later** we can reuse this exact structure for mini-apps by:
   - Copying `playwright.config.ts`, `tests/playwright/*`, and the CI workflow.
   - Adjusting the `ROUTES` per app.

For now, this MD file is **only for the parent app**.

---

## 10. Summary for Codex

**Tasks for Codex in the `web` repo (parent app):**

1. Install `@playwright/test` and `wait-on` as dev dependencies.
2. Add `playwright.config.ts` at the repo root (exact content from this file).
3. Create `tests/playwright/routes.ts` with the defined routes.
4. Create `tests/playwright/visual.spec.ts` with the provided test code.
5. Ensure baseline screenshots are generated and committed when first run locally.
6. Add `.github/workflows/playwright.yml` CI workflow exactly as specified.
7. Ensure `.gitignore` does **not** block baseline screenshots and optionally ignores `playwright-report/` and `test-results/`.

After this, the Ansiversa parent app will have **stable, automatic visual regression protection** using Playwright.
