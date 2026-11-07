# Mock Data Elimination

| Source | What it contained | Action / replacement |
|---|---|---|
| `src/lib/mock-data.ts` | Products, categories, add-ons, orders, promo codes, customers, revenue/peak/growth/payment series, best/slow sellers, addresses, notifications, activity logs, staff users | **Deleted** (no remaining imports). Types live in `src/lib/types.ts`. |
| `src/lib/store-config.ts` | Phone, WhatsApp, email, EasyPaisa/JazzCash merchant numbers, address, hours, delivery radius, 3 invented branches | Brand name + tagline kept (genuine identity). All business values now `null`; `stores = []`. UI shows "Not configured yet"/hides elements. |
| `src/lib/pricing.ts` | `DELIVERY_FEE = 149`, `TAX_RATE = 0.05` (Store page separately defaulted fee to 120) | Both `null`; single source; totals exclude unset values; UI labels "Not configured" / "Tax (not configured)". |
| `src/store/prefs.ts` | Seeded favorites `["p1","p6"]` | Empty default + persisted-state migration that drops legacy `p\d+` ids. |
| `src/store/brand.ts` | Contact phone/email/address, social handles, hours, maps URL, 12 km radius, "Free delivery above Rs 2,000" announcement, "most awarded" claim | Contact/social/hours/maps blank, radius 0, announcement disabled/empty, neutral copy. Storage key renamed to `pindi-brand-draft` (it is a local draft, not published). |
| `routes/_shop.index.tsx` | "Rated 4.9 by 3,200+", "delivered in 30 minutes", 30 min/480°C/72 hr stats, FIRSTBITE promo, "Six ways…" | Removed; empty sections hidden; single honest menu notice. Store map hidden until a branch exists. |
| `routes/welcome.tsx` | "Rated 4.9 by 3,200+" | Removed. |
| `routes/_shop.about.tsx` | Milestones (2019 founding, award, 3 branches, 1M+ pizzas), "Since 2019", Potohar sourcing, "under 30 minutes" | Removed / neutral copy; branches empty state. |
| `routes/_shop.contact.tsx` | Fake contact values, fake "Message sent!" | Not-configured values; submit calls `submitContactMessage`, disabled without backend. Map hidden. |
| `routes/_shop.order-success.tsx` | "~30 min" ETA, "order confirmed" without order | ETA removed; no order id → "No order to show". |
| `routes/_shop.privacy.tsx` | Email/phone/hours | Points to Contact page. |
| `components/shared/Receipt.tsx` | Hardcoded `+923358401426`, "Rawalpindi, Pakistan" | Uses `storeInfo` (hidden when unset). |
| `routes/admin.payments.tsx` | Merchant numbers, Rs 500 minimum, instructions | Blank with placeholders + validation. |
| `routes/admin.store.tsx` | Fee 120, free above 2000, prep 18, hours "11:00 AM – 2:00 AM" | Blank "Not set"; opening/closing time inputs. |
| `routes/admin.maintenance.tsx` | Pre-written notice, "11:00 AM" ETA | Blank with placeholders. |
| `components/admin/AdminShell.tsx` | Permanent unread-notification dot | Removed. |

## localStorage audit

| Key | Kind | Status |
|---|---|---|
| `pindi-cart` (cart store) | Legitimate client state | Kept |
| `pindi-prefs` | User preference (favorites) | Kept, legacy IDs migrated out |
| theme store | UI preference | Kept |
| `pindi-permissions` | UI-only module visibility per role (not a security boundary) | Kept, documented for backend |
| `pindi-brand` → `pindi-brand-draft` | Business config (draft only) | Kept as clearly labelled draft; publishing requires backend |
| InstallPrompt timestamp | UI state | Kept |
| `pindi-admin-preview` (sessionStorage) | Dev preview flag | New, dev-only |

## Final verification search

`rg -i "mock|sample|dummy|lorem|fake|demo|\"p[0-9]+\"|03XX numbers|+92|@pindicrust|Bahria|Satellite Town|F-7|4.9|3,200|since 2019|1M+|FIRSTBITE"` over `src/` (excluding `components/ui`) now only matches: explanatory comments, input **placeholders** (e.g. "Ayesha Khan", "+92 300 1234567") and validation hint text. No business records remain in active code. Remaining static copy (product craft descriptions on About, legal text) is brand copy, not data — confirm with the owner.
