# Tasks: mvp-production-ready

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2000 (additions + deletions) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → PR 6 → PR 7 |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Fix 7 confirmed bugs | PR 1 | `vite build` + manual click-through | Manual verification of each view | Revert individual commits per view/store |
| 2 | Infra: Supabase client + API wrapper | PR 2 | `vite build` | N/A — no runtime behavior change | Remove 2 new files |
| 3 | Auth migration to Supabase | PR 3 | `vitest run` (auth tests) + manual login/logout | Real Supabase auth or demo mode | Revert `src/stores/auth.js` + `src/router/index.js` |
| 4 | Property + Search + Reviews + Reservations stores | PR 4 | `vitest run` + `vite build` | Demo mode and real API if configured | Revert each store file independently |
| 5 | Admin store migration (largest single file) | PR 5 | `vitest run` + `vite build` | Admin panel with polling | Revert `src/stores/admin.js` |
| 6 | Payment store + MercadoPago endpoints + views | PR 6 | `vitest run` + manual MercadoPago sandbox checkout | Sandbox checkout flow | Revert `src/stores/payment.js` + `api/mercadopago/*` |
| 7 | Frontend test suite | PR 7 | `vitest run --coverage` | N/A | Remove `tests/unit/` |

## Phase 1: Bug Fixes

- [x] 1.1 Fix `src/views/owner/Profile.vue`: reorder `ref` import before usage (~5 lines changed)
- [x] 1.2 Fix `src/views/owner/Dashboard.vue`: replace `$auth.user.role` with `authStore.user.role` (~5 lines changed)
- [x] 1.3 Fix `src/views/owner/Reviews.vue`: call `fetchUserProperties(authStore.userId)` instead of `fetchProperties` (~5 lines changed)
- [x] 1.4 Fix `src/components/layout/DemoBanner.vue`: display credentials matching mock data (~10 lines changed)
- [x] 1.5 Fix `src/stores/search.js`: reset `minBedrooms` to `0` in `clearFilters` (~2 lines changed)
- [x] 1.6 Fix `src/config/mercadopago.js`: read `VITE_MP_PUBLIC_KEY` from env; remove hardcoded key (~10 lines changed)
- [x] 1.7 Fix `src/views/PropertyDetail.vue`: use `route.params.id` to fetch property; add not-found state (~50 lines changed)

## Phase 2: Auth Foundation

- [x] 2.1 Create `src/config/supabase.js`: Supabase client init with placeholder detection, exports `null` in demo mode (~40 lines created)
- [x] 2.2 Create `src/services/api.js`: fetch wrapper with `apiGet/apiPost/apiPatch/apiPut/apiDelete`, token injection from auth store, error normalization (~80 lines created)

## Phase 3: Auth Store Migration

- [x] 3.1 Rewrite `src/stores/auth.js`: replace Firebase Auth imports with Supabase Auth; keep demo/localStorage fallback; expose session token getter; remove all `firebase/auth` and `firebase/firestore` imports (~200 lines changed)

## Phase 4: API-Backed Stores

- [x] 4.1 Migrate `src/stores/property.js`: replace Firestore CRUD with `api.*` calls to `/api/properties`; keep `mockProperties` fallback when `!supabase` (~90 lines changed)
- [x] 4.2 Migrate `src/stores/search.js`: fetch from `/api/properties` with query params; apply client-side filters for amenities/minBedrooms; keep `mockProperties` fallback (~70 lines changed)
- [x] 4.3 Migrate `src/services/reviews.js`: replace localStorage with `api.*` calls to `/api/reviews`; keep localStorage fallback (~30 lines changed)
- [x] 4.4 Migrate `src/services/reservations.js`: replace Firestore with `api.*` calls to `/api/reservations`; keep localStorage fallback (~50 lines changed)
- [x] 4.5 Update `src/views/PropertyDetail.vue`: use API-backed `fetchProperty`; show owner profile from API (or mock in demo) (~30 lines changed)
- [x] 4.6 Update related views (`Search.vue`, `owner/Reservations.vue`, `owner/Reviews.vue`): use updated search/reservations/reviews services (~40 lines changed)
- [ ] 4.7 Update `src/views/owner/Dashboard.vue`: use `authStore` instead of `$auth` (~5 lines)
- [ ] 4.8 Update `src/views/owner/Reviews.vue`: use `propertyStore.fetchUserProperties(authStore.userId)` (~5 lines)
- [ ] 4.9 Update `src/views/owner/Subscription.vue`: wire real subscription status and checkout (~30 lines)
- [ ] 4.10 Update `src/views/owner/Checkout.vue`: trigger API preference creation (~20 lines)
- [ ] 4.11 Update `src/views/owner/PaymentResult.vue`: poll subscription/payment status (~30 lines)
- [ ] 4.12 Remove Firebase Auth from `src/main.js`: remove hardcoded demo credentials (~5 lines)
- [ ] 4.13 Update `src/router/index.js`: remove Firebase Auth assumptions in guards (~10 lines)

## Phase 5: Admin Store Migration

- [x] 5.1 Migrate `src/stores/admin.js`: remove Firestore/Firebase imports; use `isSupabaseConfigured`, `apiGet/apiPost/apiPatch/apiPut/apiDelete`; keep demo/localStorage fallback; replace `onSnapshot` with explicit `refetch()` + `startPolling()`/`stopPolling()`; migrate users, properties, plans, subscriptions, and platform-settings actions (~300 lines changed)
- [x] 5.2 Update admin views (`AdminDashboard.vue`, `AdminUsers.vue`, `AdminPlans.vue`, `AdminProperties.vue`, `AdminSettings.vue`) to work with the migrated store; add background polling to `AdminDashboard.vue` (~10 lines changed)

## Phase 6: Frontend Tests

- [ ] 6.1 Update `vitest.config.js`: remove `passWithNoTests`, add `@vitest/coverage-v8` reporter (~10 lines changed)
- [ ] 6.2 Create `tests/unit/services/api.test.js`: mock `global.fetch`, test header injection, error normalization, demo bypass (~60 lines)
- [ ] 6.3 Create `tests/unit/stores/auth.test.js`: mock Supabase client, test login/logout/register/session-restore/demo-fallback (~80 lines)
- [ ] 6.4 Create `tests/unit/stores/property.test.js`: mock API responses, test CRUD actions and demo fallback (~70 lines)
- [ ] 6.5 Create `tests/unit/stores/search.test.js`: test filter application, `clearFilters` resets `minBedrooms`, client-side amenity filter (~50 lines)
- [x] 6.6 Create `tests/unit/stores/admin.test.js`: mock admin endpoints, test user/subscription/property/settings CRUD (~280 lines)
- [ ] 6.7 Create `tests/unit/stores/payment.test.js`: mock subscription/payment endpoints, test checkout and cancel flows (~50 lines)
- [ ] 6.8 Create `tests/unit/views/PropertyDetail.test.js`: mount with Pinia + mocked router, assert title/price render (~40 lines)

## Phase 7: MercadoPago Integration

- [ ] 6.1 Create `api/mercadopago/preference.js`: authenticated endpoint, create MercadoPago preference with plan details, return `init_point` (~65 lines)
- [ ] 6.2 Create `api/mercadopago/webhook.js`: handle IPN notifications, update subscription status, create invoice record (~65 lines)
- [ ] 6.3 Update `src/config/mercadopago.js`: export public key from env, detect missing keys for demo mode (~10 lines)

## Key Learnings

1. The admin store at 877 lines is the single largest migration risk — its Firestore `onSnapshot` subscriptions must become polling without breaking real-time UX.
2. The feature-branch-chain strategy keeps each PR diff focused while the tracker branch accumulates the full integration for final merge.
3. Auth is the critical path — every downstream store and API call depends on the Supabase JWT being correctly exposed through the auth store.
4. Demo fallback preservation is pervasive — each store must maintain its `!supabase` branch, and tests must cover both paths.
5. The PropertyDetail.vue at 1833 lines is large but the actual changes are small (route param + fetch), keeping the PR diff manageable.
