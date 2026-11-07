# PINDI CRUST — Frontend Completion Report

Date: 2026-11-07. Scope: frontend only. No backend was created or connected.

## Final condition (evidence-based)

| Check | Command | Result |
|---|---|---|
| TypeScript | `tsgo -b --noEmit` (project tsconfig, strict + exactOptionalPropertyTypes) | 0 errors |
| Lint | `eslint src` | 0 errors, 6 warnings (shadcn `components/ui/*` fast-refresh export warnings — pre-existing vendor files, left as-is) |
| Tests | `vitest run` | 4/4 passed (routing, pricing defaults, gallery preservation) |
| Build | Lovable build pipeline (`vite build`) | "build OK" (see `/tmp/observability/build-errors.log`) |
| Runtime | Playwright, every route, no Supabase env vars | 47/47 page routes render; 0 uncaught page errors; only console errors are expected HTTP 404s for the 404 test route and the unknown product slug |

`npm ci` was not run: the project uses Bun (`bun.lock`); dependencies were installed with `bun add`.

## What changed

1. **Frontend/backend boundary** — `src/lib/supabaseClient.ts` now exposes `db()`, `isBackendConfigured`, `BackendNotConfiguredError`, `isBackendNotConfigured()`. The Supabase client is only created when both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` exist. Every service function in `api.ts`/`auth-api.ts` keeps its signature and calls `db()`; without config it throws the typed error. Realtime subscriptions return a no-op; `fetchMyProfile` returns `null` (guest) — no fake session.
2. **Shared honest states** — `src/components/shared/BackendNotice.tsx`: `BackendPreviewBanner` (top strip in storefront and console), `BackendNotice`, `QueryErrorState` (not-connected vs. genuine error), `DraftNotice` (settings screens). `errorMessage()` maps the error to the standard sentence, so every mutation toast is honest automatically. React Query does not retry the not-configured error.
3. **Mock data eliminated** — see `MOCK_DATA_ELIMINATION.md`.
4. **Missing admin routes built** — `/admin/kitchen`, `/admin/inventory`, `/admin/settings`.
5. **Functional fixes** — see `TECHNICAL_ISSUES.md` (15 audit items + additional bugs found, e.g. the menu page never displaying loaded products).
6. **Admin local preview** — `src/lib/preview.ts`: opt-in button on the staff sign-in screen, dev builds only (`import.meta.env.DEV`), sessionStorage-scoped, labelled "Local preview only", never modifies `useAuth`, grants no backend permission.
7. **Maintenance mode is consumed** — the storefront layout reads the published maintenance setting and replaces the page with the notice (staff exempt).

## Design

Brand identity, tokens and layouts preserved. Hardcoded blue/purple status colours in `OrderCard` were moved to chart tokens. Dead social links (`href="#"`) removed from the footer. Note: headless-Chromium screenshots in this sandbox render the oklch palette with a pink cast; computed CSS values were verified to be the intended cream/red tokens.

## Not complete / honest caveats

See `REMAINING_FEATURES.md` and `PROGRESS.md`. In particular: no real persistence, auth, payments, messaging or realtime exist yet, by design for this phase.
