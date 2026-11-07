# Technical Issues

## Audit items (confirmed and addressed)

| # | Issue | Fix |
|---|---|---|
| 1 | Password recovery was a visual demo (fake "Reset link sent") | Calls `requestPasswordReset`; success only after real response; disabled with notice when no backend |
| 2 | Google/Apple buttons fake | Disabled + "not available yet" |
| 3 | Contact form fake success | `submitContactMessage`; disabled with notice |
| 4 | Newsletter did nothing | Validated form → `subscribeNewsletter` |
| 5 | Store settings not persisted (fake toast) | `saveStoreSettings` with validation; draft notice |
| 6 | Payment settings not persisted | `savePaymentSettings` with wallet-number validation |
| 7 | Maintenance mode not consumed | Storefront layout reads published setting and shows notice; admin switch is a draft saved via `saveMaintenanceSettings` |
| 8 | Brand publish only local | `publishBrandSettings`; store renamed as draft |
| 9 | Customer messaging fake | Compose box → `sendCustomerMessage`; table button opens it |
| 10 | Customer blocking fake | Confirm → `setCustomerBlocked` |
| 11 | Internal notes not saved | "Save note" → `saveCustomerNote`; notes reset when switching customer (stale state bug) |
| 12 | Favorite seeds `p1`,`p6` | Removed + migration |
| 13 | Product update wiped gallery/nutrition | Update no longer writes `gallery`/`nutrition` unless provided; `mergeGallery` keeps extra images (tested) |
| 14 | Inconsistent delivery fee (149 vs 120) | Single `null` source |
| 15 | Report custom range mapped to 7 days | Real start-date picker with validation; label stored with report |

## Additional issues found

- **Menu page never showed loaded products**: `useMemo` omitted `products` from deps (lint warning). Fixed.
- Supabase client was created with empty strings when env vars were missing (crash/console error). Fixed via `db()` guard.
- Product page loader threw → SSR 500 without backend. Now renders not-connected state.
- Staff "Reset passkey" showed fake success. Now real reset request.
- `admin.users.tsx` used `errorMessage` without importing it (would crash on error path). Fixed.
- 19 TypeScript errors pre-existing under the project's strict config (`exactOptionalPropertyTypes`, index-signature access, root `errorComponent` props, search param types). All fixed without `@ts-ignore`.
- ~1,350 Prettier lint errors (formatting) — fixed with the project's `prettier` config.
- 23 `no-explicit-any` errors in row mappers — replaced by a single documented `DbRow` type with one line-scoped disable (until generated Supabase types exist).
- `/order-success` claimed "confirmed" with no order. Fixed.
- Hardcoded blue/purple colour classes in `OrderCard` → design tokens.
- Dead `href="#"` social links removed.

## Unresolved

- 6 `react-refresh/only-export-components` warnings in shadcn `components/ui/*` (vendor pattern; harmless).
- `DbRow = any` remains until backend types are generated.
- `npm ci` not used (Bun project).
