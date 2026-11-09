# Backend build roadmap (PINDI CRUST)

- [x] 1. Database schema: 23 tables + user_roles, grants, RLS, triggers (migration 0000)
- [x] 2. Order RPCs: place_order, validate_promo, track_order, log_activity, send_customer_message, notification trigger (0001)
- [x] 3. Analytics/report RPCs (0002)
- [x] 4. Realtime publication for orders/order_items/notifications (0003)
- [x] 5. Email/password auth enabled; supabaseClient reads Cloud publishable key
- [x] 6. Types regenerated; typecheck + build + 8 tests pass; pages load against live DB
- [ ] 7. First admin: user registers at /register, then promote their email to admin (SQL)
- [ ] 8. Real menu data: added by user via admin panel (no fabricated products)
- [ ] 9. E2E order test once products exist (customer order → admin realtime → kitchen)
- [ ] Later: wire published settings into storefront (store-config/pricing), Google sign-in, payment gateway (needs credentials)
