# Backend Handoff

## How to connect

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. `db()` then returns a real client; every screen starts using it with no UI changes. `isBackendConfigured` also hides the preview banners/draft notices.

## Domain models

`src/lib/types.ts` (Product, Category, AddOn, Order, OrderItem, OrderStatus, PaymentMethod, OrderSource), plus in `src/lib/api.ts`: AdminCustomer, Review, Offer, SavedAddress, Notification, PromoCode, ActivityLog, analytics/report row types, StoreSettings, PaymentSettings, MaintenanceSettings, InventoryItem. `src/lib/auth-api.ts`: Profile, ProfileRole, StaffRole.

## Tables / RPCs referenced by the frontend

| Name | Used by | Notes |
|---|---|---|
| `profiles` (id, email, name, phone, role, is_blocked) | auth-api, customers | Created by `handle_new_user` trigger; role changes staff-only |
| `categories` (name, slug, icon, image_url, is_visible, sort_order) | menu, admin | Count of available products |
| `products` (slug, name, category_id, price, old_price, image_url, gallery, short_description, description, ingredients, nutrition, badges, popular, recommended, rating, review_count, is_available) | menu, admin | Update must not clear gallery/nutrition |
| `add_ons` (name, price, group, active) | product modal, admin | |
| `orders`, `order_items` (name, qty, price, product_id, addons) | orders, POS, kitchen, tracking | Realtime required for kitchen/orders |
| RPC `place_order` | checkout, POS | Authoritative pricing incl. delivery fee + tax |
| RPC `log_activity`, table `activity_logs` | logs | |
| `reviews`, `offers`, `saved_addresses`, `notifications`, `promo_codes`, `reports` | respective pages | |
| Analytics/report RPCs (revenue trend, category sales, peak hours, growth, payment split, top products, report orders/items/payments/taxes) | analytics, reports | Accept `days`; add explicit date-range params for custom ranges |
| **New** `contact_messages`, `newsletter_subscribers` | contact, footer | |
| **New** `store_settings`, `payment_settings`, `maintenance_settings`, `brand_settings` (single row id=1) | settings screens, storefront | Storefront should read published values (replace `store-config.ts` nulls and `pricing.ts` nulls) |
| **New** RPC `send_customer_message`, table `customer_notes` | customers | |
| **New** `inventory_items` (name, group, unit, quantity, low_stock_threshold) | inventory | Assumed model; confirm |
| `branches` | home/contact/about/store | Replace `stores = []` |
| `offers.link_type`, `offers.link_target` | homepage advertisements | Proposed fields: `product` + product slug, or `external` + HTTPS URL. Validate destinations server-side before publishing. Existing offers without a destination are not displayed. |

## Advertisement preview

The advertisement editor supports a one-use, user-authored homepage draft preview in development only. It does not publish or save a banner. The homepage displays one active, valid linked advertisement per visit with a close button and automatic dismissal after 10 seconds. Publishing still requires the future offers backend contract above. Login now offers a direct development-only admin layout preview button; no authentication or permissions are created.

## Auth & authorization

Roles: customer, manager, admin, developer. Staff console gate is client-side UI only; RLS must enforce: staff-only writes on catalogue/settings, managers cannot delete/block/edit protected settings (UI already hides these), customers only read/write their own orders, addresses, notifications, reviews. Module visibility (`pindi-permissions`) is a UI preference, not a security boundary. The dev preview grants nothing and is compiled out of production builds.

## Mutations that must exist before go-live

All functions in `api.ts` under "Contracts added in the frontend-completion phase", plus existing CRUD for categories, products, add-ons, offers, promo codes, reviews, addresses, order status, staff roles, report rows.
