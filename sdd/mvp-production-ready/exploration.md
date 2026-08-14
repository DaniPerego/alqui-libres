# Exploration: mvp-production-ready

## Current State

### Dual data layer with zero bridge

The frontend (Vue 3 + Pinia) uses Firebase Auth + Firestore directly via SDK imports for ALL CRUD operations. A complete Vercel API backend exists (26 endpoints in `api/`) using Prisma + Supabase Auth that the frontend never calls. These two systems are completely disconnected.

**Frontend today**: Firebase Auth → Firestore → localStorage mocks
**Backend today**: Supabase JWT → Prisma → PostgreSQL
**Bridge**: None. Zero frontend code calls `/api/*`.

### Auth Flow Comparison

| Aspect | Frontend (stores/auth.js) | Backend (api/lib/auth.js) |
|--------|--------------------------|--------------------------|
| Provider | Firebase Auth SDK | Supabase Admin Client |
| Verification | `onAuthStateChanged` | `supabase.auth.getUser(token)` |
| User data | Firestore `users/{uid}` doc | Prisma `users` table (role from DB, D7) |
| Token | Firebase ID token | Supabase JWT |
| Demo fallback | localStorage mock credentials | N/A (server-side only) |

### Frontend Stores (all use Firestore directly)

- **property.js**: CRUD via Firestore paths `artifacts/alqui-libres/users/{userId}/properties` and `artifacts/alqui-libres/public/data/listings`
- **search.js**: Queries public listings collection, applies client-side filters
- **payment.js**: 100% mocked — localStorage subscriptions, mock MercadoPago preferences
- **admin.js**: Heavy Firestore — users, properties, subscriptionPlans, platformSettings collections with `onSnapshot` real-time subscriptions
- **reviews.js (service)**: localStorage-based with mock data
- **reservations.js (service)**: Firestore CRUD

### Vercel API Endpoints (26 files)

All use Prisma + Supabase Auth (`api/lib/auth.js`):

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `properties.js` | GET, POST | Public list (search, pagination), owner/admin create |
| `properties/[id].js` | GET, PATCH, DELETE | Detail, owner edit, admin moderation, cascade delete |
| `properties/mine.js` | GET | Owner's own properties |
| `users.js` | GET, POST | Admin list, self-materialize (register) + admin create |
| `users/me.js` | GET, PATCH | Own profile |
| `users/[id].js` | PATCH | Admin user management |
| `subscriptions.js` | GET | Admin subscription list |
| `subscriptions/mine.js` | GET | Own subscription |
| `plans.js` | GET | Public/admin plan catalog |
| `plans/[id].js` | PATCH, DELETE | Admin plan upsert/delete |
| `payments.js` | GET | Own/admin payments |
| `reviews.js` | GET, POST | Property reviews, owner reviews, create |
| `reservations.js` | GET, POST | Own reservations, guest create (overlap check) |
| `reservations/[id].js` | PATCH, DELETE | Status update, delete |
| `reservations/[id]/status.js` | PATCH | Confirm/reject with notifications |
| `messages.js` | GET, POST | Inbox, contact owner |
| `messages/[id].js` | PATCH | Mark read/replied |
| `notifications.js` | GET | Inbox |
| `notifications/[id].js` | PATCH | Mark read |
| `platform-settings.js` | GET, PATCH | Admin platform settings |
| `upload.js` | POST | Vercel Blob upload |
| `upload/delete.js` | POST | Vercel Blob delete |

### Demo Mode Pattern

Every store checks `if (!db)` or `if (!auth)` (Firebase availability) and falls back to localStorage/mock data. This pattern is consistent across property.js, search.js, admin.js, and auth.js. Payment.js is 100% mock regardless.

### Data Shape Mismatch

Frontend uses nested objects:
```js
{ pricing: { basePrice, cleaningFee }, capacity: { guests, bedrooms }, location: { city, state } }
```

Prisma schema uses flat columns:
```
pricingBasePrice, capacityGuests, locationCity, locationState
```

The API endpoints already handle this transformation (`parsePropertyBody` in `api-handlers/properties.js`).

---

## Confirmed Bugs

1. **PropertyDetail.vue** (line 926-994): `onMounted` ignores `route.params.id` — always sets `property.value` to hardcoded data object
2. **Profile.vue** (line 430): `ref()` called before import at line 449
3. **Dashboard.vue** (line 3): `$auth?.user?.role` — Vue 3 `<script setup>` has no `$auth` global
4. **Reviews.vue** (line 79): `propertyStore.fetchProperties()` doesn't exist — should be `fetchUserProperties(authStore.userId)`
5. **DemoBanner.vue** (line 9): Shows `demo@alquilibres.com` but actual hardcoded credential is `usuario@alquilibres.com`
6. **search.js** (line 152-170): `clearFilters` doesn't reset `minBedrooms` (missing from reset object)
7. **mercadopago.js** (line 4-9): Hardcoded sandbox `publicKey` and `accessToken` in source code

---

## Affected Areas

### Bug Fixes (Phase 1)
- `src/views/PropertyDetail.vue` — use `route.params.id` to fetch real data
- `src/views/owner/Profile.vue` — fix `ref()` import order
- `src/views/owner/Dashboard.vue` — replace `$auth` with `authStore`
- `src/views/owner/Reviews.vue` — fix `fetchProperties` → `fetchUserProperties`
- `src/components/layout/DemoBanner.vue` — fix credential text
- `src/stores/search.js` — add `minBedrooms` to `clearFilters`
- `src/config/mercadopago.js` — move credentials to env vars

### Auth Unification (Phase 2)
- `src/stores/auth.js` — replace Firebase Auth with Supabase Auth client
- NEW: `src/config/supabase.js` — Supabase client for frontend auth
- `src/router/index.js` — auth guard (already uses authStore, minimal change)

### Frontend → API Migration (Phase 3)
- NEW: `src/services/api.js` — API client helper with auth token injection
- `src/stores/property.js` — replace Firestore with `fetch('/api/properties/*')`
- `src/stores/search.js` — replace Firestore with `fetch('/api/properties?q=...')`
- `src/stores/payment.js` — replace mock with `fetch('/api/subscriptions', '/api/payments')`
- `src/stores/admin.js` — replace Firestore with `fetch('/api/users', '/api/properties', etc.)`
- `src/services/reservations.js` — replace Firestore with `fetch('/api/reservations')`
- `src/services/reviews.js` — replace localStorage with `fetch('/api/reviews')`
- `src/services/ownerStats.js` — depends on reservations service
- `src/services/storage.js` — already has Vercel Blob fallback, needs auth token
- `src/config/firebase.js` — may become optional or removed

### Frontend Tests (Phase 4)
- NEW: `tests/unit/stores/auth.test.js`
- NEW: `tests/unit/stores/property.test.js`
- NEW: `tests/unit/stores/search.test.js`
- NEW: `tests/unit/views/PropertyDetail.test.js`

### MercadoPago Real Integration (Phase 5)
- `src/config/mercadopago.js` — move to env vars
- `src/stores/payment.js` — real checkout flow with MercadoPago SDK
- NEW: `api/mercadopago/webhook.js` — webhook handler

---

## Dependency Graph

```
Phase 1: Bug Fixes (independent, can be done in parallel)
    │
Phase 2: Auth Unification ← CRITICAL PATH
    │   (Every other migration depends on Supabase Auth in frontend)
    │
Phase 3: Frontend → API Migration
    │   Order: api client → property → search → reservations → reviews → admin → payment
    │
Phase 4: Frontend Tests (can start in parallel with Phase 3)
    │
Phase 5: MercadoPago (depends on Phase 3 payment migration)
```

---

## Risks

- **Auth migration is the critical path**: Every other migration depends on having Supabase Auth working in the frontend first
- **Demo mode preservation**: Must keep localStorage fallback working throughout all phases — every store migration must maintain the `if (!supabase)` / demo fallback pattern
- **Data shape mapping**: Frontend uses nested objects, Prisma uses flat columns — the API already handles this, but store migrations need to account for the API response format (flat) vs. the current frontend format (nested)
- **No existing frontend tests**: Writing tests after migration means tests validate the new code, not catch regressions
- **Firebase removal cascade**: Firebase Auth removal affects auth.js; Firebase Storage removal affects storage.js (already has Vercel Blob fallback); Firestore removal affects ALL stores and services
- **Admin store complexity**: admin.js is 877 lines with 15+ actions, real-time Firestore subscriptions, and localStorage caching — the most complex migration target
- **Existing API tests are server-side only**: They test Prisma/Supabase directly, not the frontend-to-API contract

---

## Recommended Implementation Plan

### Phase 1: Quick Bug Fixes (no architectural change)
1. Fix PropertyDetail.vue to use `route.params.id` + API fetch or mock lookup
2. Fix Profile.vue `ref()` import order
3. Fix Dashboard.vue `$auth` → `authStore`
4. Fix Reviews.vue `fetchProperties` → `fetchUserProperties`
5. Fix DemoBanner.vue credential text
6. Fix search.js `clearFilters` missing `minBedrooms`
7. Fix mercadopago.js hardcoded credentials → env vars

### Phase 2: Auth Unification (foundation for everything)
1. Install `@supabase/supabase-js` in frontend
2. Create `src/config/supabase.js` (using `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. Rewrite `src/stores/auth.js` to use Supabase Auth client
4. Maintain demo mode fallback (localStorage mock credentials)
5. Store Supabase session in localStorage (supabase-js handles this automatically)
6. Add token refresh logic (supabase-js handles this)

### Phase 3: Frontend → API Migration
1. Create `src/services/api.js` — API client helper with auth token injection + demo mode fallback
2. Migrate `property.js` stores → `fetch('/api/properties/*')`
3. Migrate `search.js` store → `fetch('/api/properties?q=...')`
4. Migrate `reservations.js` service → `fetch('/api/reservations')`
5. Migrate `reviews.js` service → `fetch('/api/reviews')`
6. Migrate `admin.js` store → `fetch('/api/users', '/api/properties', etc.)`
7. Migrate `payment.js` store → `fetch('/api/subscriptions', '/api/payments')`
8. Keep demo mode: when no Supabase configured, use localStorage fallback

### Phase 4: Frontend Tests
1. Configure vitest for jsdom (already done in vitest.config.js)
2. Write auth store tests
3. Write property store tests (with API mocking)
4. Write search store tests
5. Write PropertyDetail component test

### Phase 5: MercadoPago Real Integration
1. Add MercadoPago SDK to frontend (`@mercadopago/js`)
2. Create preference creation endpoint (`api/mercadopago/preference.js`)
3. Add webhook handler (`api/mercadopago/webhook.js`)
4. Wire checkout flow in payment.js store

---

## Open Questions

1. **Firebase completely removed?** The storage.js service already falls back to Vercel Blob. Should Firebase be fully removed or kept as fallback? (Affects scope of Phase 3)
2. **Admin store real-time subscriptions**: The admin store uses Firestore `onSnapshot` for real-time plan/settings updates. The API has no equivalent real-time mechanism. Should we use polling, Server-Sent Events, or just refetch on demand?
3. **User ID format**: The Prisma schema uses `users.id = Supabase Auth UID` (String). The frontend mock data uses `user123`, `user456` etc. Should mock IDs be Supabase-compatible UUIDs for testing?
4. **Existing data migration**: If there's real data in Firestore, is there a migration plan? Or is this a fresh start with the API backend?
5. **MercadoPago production credentials**: The hardcoded sandbox credentials need real production keys. Does the user have these?
