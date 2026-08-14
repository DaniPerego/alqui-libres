# Proposal: mvp-production-ready

## Intent

Make alqui-libres production-ready by closing 7 active bugs, unifying frontend authentication on Supabase Auth, replacing direct Firestore access with the existing Vercel API, adding frontend tests, and wiring real MercadoPago payments.

## Scope

### In Scope
- Phase 1 — Bug fixes: 7 confirmed UI/store bugs.
- Phase 2 — Auth unification: migrate `src/stores/auth.js` from Firebase Auth to Supabase Auth; keep demo/localStorage fallback; preserve Firebase for Cloud Functions notifications.
- Phase 3 — Frontend → API migration: replace Firestore calls in property, search, reservations, reviews, admin, and payment stores/services with `fetch()` to `/api/*`; keep demo fallback.
- Phase 4 — Frontend tests: Vitest + `@vitest/coverage-v8`, tests for auth, property, search stores and key views; remove `passWithNoTests`.
- Phase 5 — MercadoPago real integration: checkout flow, preference endpoint, webhook handler, payment status tracking.

### Out of Scope
- Migrating real Firestore data (assumed fresh API backend).
- Rewriting Firebase Cloud Functions (kept for notifications).
- Mobile/PWA work, marketing pages, or analytics dashboards.
- Production hosting changes beyond Vercel + existing Supabase/Firebase.

## Capabilities

### New Capabilities
- `bug-fixes-mvp`: 7 confirmed bugs in views and stores.
- `frontend-auth`: Supabase Auth client + auth store migration + demo fallback.
- `api-client`: fetch wrapper with auth token injection and demo fallback.
- `property-api`: property store backed by `/api/properties/*`.
- `search-api`: search store backed by `/api/properties`.
- `reservations-api`: reservations service backed by `/api/reservations`.
- `reviews-api`: reviews service backed by `/api/reviews`.
- `admin-api`: admin store backed by `/api/users`, `/api/properties`, `/api/subscriptions`, `/api/platform-settings`.
- `payment-api`: payment/subscription store backed by `/api/subscriptions`, `/api/payments`.
- `frontend-tests`: Vitest config + store/view tests.
- `mercadopago-integration`: real checkout + webhook + status tracking.

### Modified Capabilities
- None (no existing OpenSpec specs).

## Approach

Execute five ordered phases. Phase 2 is the critical path: Phases 3–5 require a Supabase JWT on every API call. Each migrated store preserves the existing demo fallback when Supabase is unconfigured. Admin real-time Firestore `onSnapshot` subscriptions become explicit refetch/polling against API endpoints. MercadoPago credentials move to environment variables; preferences and webhooks are handled by new Vercel functions.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/views/PropertyDetail.vue` | Modified | Use `route.params.id` to fetch real data. |
| `src/views/owner/Profile.vue` | Modified | Fix `ref()` import order. |
| `src/views/owner/Dashboard.vue` | Modified | Replace `$auth` with `authStore`. |
| `src/views/owner/Reviews.vue` | Modified | Fix `fetchProperties` → `fetchUserProperties`. |
| `src/components/layout/DemoBanner.vue` | Modified | Fix credential text. |
| `src/stores/search.js` | Modified | Reset `minBedrooms` in `clearFilters`. |
| `src/config/mercadopago.js` | Modified | Move credentials to env vars. |
| `src/config/supabase.js` | New | Frontend Supabase client. |
| `src/stores/auth.js` | Modified | Supabase Auth + demo fallback. |
| `src/services/api.js` | New | Fetch wrapper with token injection. |
| `src/stores/property.js` | Modified | API-backed CRUD. |
| `src/stores/admin.js` | Modified | API-backed admin actions. |
| `src/stores/payment.js` | Modified | Real subscription/payment flow. |
| `src/services/reservations.js` | Modified | API-backed reservations. |
| `src/services/reviews.js` | Modified | API-backed reviews. |
| `api/mercadopago/preference.js` | New | Create MercadoPago preference. |
| `api/mercadopago/webhook.js` | New | Handle payment notifications. |
| `tests/unit/` | New | Store and view tests. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Auth migration breaks all downstream API calls | High | Complete Phase 2 before Phase 3; verify token in every request. |
| Demo fallback diverges from real API shape | Med | Keep data adapters in each store; run tests against both paths. |
| Admin store complexity (877 lines, real-time subs) | High | Migrate incrementally; replace `onSnapshot` with refetch + polling. |
| MercadoPago credential exposure | Low | Move all keys to env vars; never commit secrets. |
| No existing frontend tests | Med | Add tests during/after migration; mock API responses. |

## Rollback Plan

- Phase 1: revert individual bug-fix commits.
- Phase 2: keep Firebase Auth module import available; revert `src/stores/auth.js` and `src/router/index.js` guard changes.
- Phases 3–5: Firestore/localStorage fallback code remains in stores; revert each store file to its pre-migration version if API calls fail.
- MercadoPago: fall back to demo mode when env vars are missing.

## Dependencies

- Supabase project credentials: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- MercadoPago production keys: `VITE_MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN`.
- Vercel API already deployed with Prisma/Supabase backend.

## Success Criteria

- [ ] All 7 confirmed bugs are fixed and manually verified.
- [ ] Frontend login/register/logout works with Supabase Auth in staging.
- [ ] Every migrated store call hits the Vercel API when Supabase is configured.
- [ ] Demo mode still works with no Supabase config.
- [ ] Frontend test suite runs with `vitest run` and coverage > 0%.
- [ ] MercadoPago preference creates a real checkout and webhook updates payment status.
- [ ] `vite build` passes without errors.

## Effort Estimate

| Phase | Estimate | Notes |
|-------|----------|-------|
| Phase 1 — Bug fixes | 0.5–1 day | Quick, isolated fixes. |
| Phase 2 — Auth unification | 2–3 days | Critical path; affects everything. |
| Phase 3 — Frontend → API migration | 5–7 days | Largest phase; admin store is the bottleneck. |
| Phase 4 — Frontend tests | 2–3 days | Parallel with Phase 3. |
| Phase 5 — MercadoPago real integration | 2–3 days | Depends on Phase 3 payment migration. |
| **Total** | **~12–17 days** | With one senior full-stack developer. |

## Open Questions / Assumptions

1. **Firebase removal scope**: Firebase Auth/Storage/Firestore will be removed from the frontend; Firebase Cloud Functions remain for notifications.
2. **Admin real-time updates**: Replace Firestore `onSnapshot` with explicit refetch and short-interval polling; no Server-Sent Events in this change.
3. **Data migration**: No Firestore → PostgreSQL migration is included; assume a fresh API backend or existing Prisma seed.
4. **MercadoPago credentials**: Real production/sandbox keys must be available before Phase 5 starts.
5. **Review budget**: Work will be delivered as a feature-branch chain with slices under 800 changed lines per PR.
