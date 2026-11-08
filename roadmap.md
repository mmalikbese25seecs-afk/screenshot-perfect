# Backend build roadmap (PINDI CRUST)

- [ ] 1. Database schema: all 21 tables + user_roles, grants, RLS, triggers
- [ ] 2. Order RPCs: place_order, validate_promo, track_order, log_activity, send_customer_message, notification trigger
- [ ] 3. Analytics/report RPCs (revenue trend, category sales, peak hours, growth, payment split, top products, reports)
- [ ] 4. Realtime publication for orders/order_items
- [ ] 5. Enable email/password auth; point supabaseClient at the Cloud publishable key
- [ ] 6. Regenerate DB types; typecheck + build + tests
- [ ] 7. Verify: register/login, place order end-to-end, RLS spot checks
- [ ] Later: wire published settings into storefront (store-config/pricing), ads from offers table, Google sign-in, payment gateway (needs credentials)
