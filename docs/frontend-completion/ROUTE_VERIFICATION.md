# Route Verification

Method: Playwright (Chromium, 1280×1800) against the dev server with no Supabase env vars. Each route loaded directly by URL (also covers refresh). Admin routes checked through the dev-only local preview. Result "OK" = rendered its page heading, no uncaught page error.

| Route | File | Frontend-only state | Result |
|---|---|---|---|
| `/` | `_shop.index.tsx` | Hero + "menu not connected" notice; empty sections hidden | OK |
| `/menu` | `_shop.menu.tsx` | Empty menu | OK |
| `/categories` | `_shop.categories.tsx` | Empty | OK |
| `/product/$slug` | `_shop.product.$slug.tsx` | Backend notice via notFound (no 500) | OK |
| `/search` | `_shop.search.tsx` | No results | OK |
| `/cart` | `_shop.cart.tsx` | Empty cart; fee/tax "Not configured" | OK |
| `/checkout` | `_shop.checkout.tsx` | Empty-cart state; placing order → not-connected toast | OK |
| `/order-success` | `_shop.order-success.tsx` | "No order to show" without order id | OK |
| `/orders` | `_shop.orders.tsx` | Sign-in prompt | OK |
| `/track` | `_shop.track.tsx` | Lookup form; lookup → not-connected | OK |
| `/receipt` | `_shop.receipt.tsx` | Not-found state | OK |
| `/profile` | `_shop.profile.tsx` | Sign-in prompt | OK |
| `/addresses` | `_shop.addresses.tsx` | Sign-in prompt | OK |
| `/favorites` | `_shop.favorites.tsx` | Empty (no seeded ids) | OK |
| `/notifications` | `_shop.notifications.tsx` | Empty | OK |
| `/reviews` | `_shop.reviews.tsx` | 0 reviews, sign-in to write | OK |
| `/about` `/contact` `/privacy` `/terms` | `_shop.*.tsx` | Static; contact form disabled with notice | OK |
| `/login` `/register` `/forgot-password` `/welcome` | root routes | Forms validate; submit → not-connected | OK |
| `/admin` | `admin.tsx` + `admin.index.tsx` | Guest → "Staff access only" (+ dev preview button); preview → dashboard with "No live data" | OK |
| `/admin/orders` `pos` `customers` `reviews` | `admin.*.tsx` | Not-connected / empty states | OK |
| `/admin/kitchen` | `admin.kitchen.tsx` (**new**) | 3 empty columns + notice | OK |
| `/admin/menu` `categories` `addons` | `admin.*.tsx` | Not-connected states | OK |
| `/admin/inventory` | `admin.inventory.tsx` (**new**) | Stats 0, filters, add/edit dialog, notice | OK |
| `/admin/promotions` `advertisements` | `admin.*.tsx` | Empty | OK |
| `/admin/analytics` `reports` `logs` | `admin.*.tsx` | Chart structure, "No live data" notice | OK |
| `/admin/brand` `themes` `store` `payments` `maintenance` | `admin.*.tsx` | Draft notice, honest save | OK |
| `/admin/settings` | `admin.settings.tsx` (**new**) | Links to 5 settings screens | OK |
| `/admin/users` `developer` | `admin.*.tsx` | Empty staff list | OK |
| `/does-not-exist` | root `notFoundComponent` | 404 page | OK |

Total: 47 page routes (44 original + 3 new). Every sidebar entry in `src/lib/modules.ts` now maps to an existing route. `/admin/logs` and `/admin/maintenance` exist but are not in the module registry (reachable via Settings / direct URL) — decide whether to add them to the sidebar.

Not verified by automation: mobile viewports for every route (spot-checked layouts use existing responsive classes), keyboard-only navigation.
