# Ansiversa Resume Builder

This repo is the Resume Builder mini-app, currently aligned to the Ansiversa app-starter baseline.
It contains the standard middleware auth guard, shared AppShell/AppAdminShell layouts, unread
notifications badge wiring, and a small Example Items module that demonstrates end-to-end CRUD.

## Freeze status

Baseline Freeze Jan-17-2026 (locked baseline).

## Quick start

1) Install dependencies

```
npm ci
```

2) Configure env vars (see `src/env.d.ts` for the full list)

- `ANSIVERSA_AUTH_SECRET`
- `ANSIVERSA_SESSION_SECRET`
- `ANSIVERSA_COOKIE_DOMAIN`
- `PUBLIC_ROOT_APP_URL` (optional)
- `PARENT_APP_URL` (optional)

Note: `ANSIVERSA_AUTH_SECRET` is reserved for future auth workflows (not used in this app yet).

3) Run the app

```
npm run dev
```

## How this app works (mental model)

Ansiversa apps run in two layers:

- **Parent app** (ansiversa.com)
  - Owns authentication, users, billing, notifications
  - Issues a shared session cookie
- **Mini-apps** (quiz.ansiversa.com, etc.)
  - Trust the shared session cookie
  - Never implement their own auth
  - Use shared layouts and middleware

This app follows that environment so you can build Resume Builder without needing
the parent app locally.

## Local dev without parent app

If you do not have the parent app session cookie, you can enable a DEV-only auth bypass
to inject a dummy session during local development:

```
DEV_BYPASS_AUTH=true npm run dev
```

Optional overrides (defaults shown):

```
DEV_BYPASS_USER_ID=dev-user
DEV_BYPASS_EMAIL=dev@local
DEV_BYPASS_ROLE_ID=1
```

⚠️ This bypass only works in local development (import.meta.env.DEV) and is ignored in
production builds.

After starting the dev server, open a protected route like `/items` or `/admin/items`
to confirm the dummy session is active.

## First run checklist

You should be able to:

- Start the app with `npm run dev`
- Open `/items` and see the Example Items list
- Open `/admin/items` and access admin CRUD (roleId = 1)
- See no redirects to the parent login when DEV_BYPASS_AUTH is enabled

If this works, your setup is correct.

## Commands

- `npm run dev`
- `npm run dev:remote`
- `npm run typecheck` (Astro check)
- `npm run build`
- `npm run build:remote`
- `npm run db:push:local`

## Example module (baseline)

Example Items live under `src/modules/example-items/` with routes at:

- `/items`
- `/items/[id]`
- `/admin/items`

Delete `src/modules/example-items/` and these routes when starting real app work.

## Evolving this mini-app

1) Remove the Example Items module and routes.
2) Add your domain tables/actions/pages.
3) Keep shared shells + middleware patterns unchanged.

### Non-negotiable standards

These files define the Ansiversa contract. Do not modify or replace them.

- `src/layouts/AppShell.astro` and `src/layouts/AppAdminShell.astro`
- `src/middleware.ts` auth guard + admin role gate
- AppShell unread notifications fetch (`/api/notifications/unread-count`)
- One global Alpine store pattern (`src/alpine.ts`)
- Always update `AGENTS.md` when completing a task

---

Ansiversa motto: Make it simple — but not simpler.
