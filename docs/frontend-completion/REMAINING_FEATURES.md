# Remaining Features (need backend or a decision)

| Feature | Current frontend state | Needs |
|---|---|---|
| Sign in / register / sign out | Forms + validation; submit shows not-connected | Supabase Auth, `profiles` table + trigger |
| Password recovery | Calls `requestPasswordReset`; disabled without backend | Auth email + a reset-password page (`/reset-password` not built yet) |
| Google / Apple sign-in | Buttons disabled, labelled "not available yet" | OAuth providers |
| Menu, categories, add-ons, offers, reviews | Read/write via `api.ts` | Tables + RLS |
| Ordering, POS, tracking, receipts | `placeOrder` RPC contract | `place_order` function (authoritative pricing) |
| Delivery fee / tax | `null` (not configured) | Published `store_settings`, wire into `computeTotals` config arg |
| Store / payment / maintenance settings | Local draft, honest Save | `store_settings`, `payment_settings`, `maintenance_settings` |
| Brand publish | Local draft; Publish calls `publishBrandSettings` | `brand_settings` + storefront read of published values |
| Theme selection | Applies in this browser only | Persisted theme setting |
| Contact form / newsletter | Validated; submit disabled/not-connected | `contact_messages`, `newsletter_subscribers` (+ email) |
| Customer messaging / block / notes | Real calls with confirmation; no fake success | `send_customer_message` RPC, `profiles.is_blocked`, `customer_notes` |
| Kitchen live queue | Uses `fetchOrders` + `subscribeToOrders` | Realtime on `orders` |
| Inventory | Full UI, assumed model | `inventory_items`; **confirm**: units, groups, whether orders auto-deduct stock (not implemented, needs recipe mapping) |
| Reports custom range | Start date → today | End date requires backend range params (`fetchReport*` take `days`) |
| Branches | Empty list | `branches` table + management UI |
| Notifications bell (admin) | Static icon | Notifications source |
