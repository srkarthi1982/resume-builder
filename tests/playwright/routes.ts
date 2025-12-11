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
