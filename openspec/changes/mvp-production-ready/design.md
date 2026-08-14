# Design: mvp-production-ready

## Technical Approach

Unify frontend authentication on Supabase Auth, replace direct Firestore access with the existing Vercel API, and preserve the demo/localStorage fallback. Execute five ordered phases: bug fixes, auth, API migration, frontend tests, and MercadoPago integration. Each phase leaves the application runnable.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|---|---|---|---|
| Auth provider | Supabase Auth client | Keep Firebase Auth | Proposal requires Supabase JWTs for API calls; backend already validates them in `api/lib/auth.js` |
| Demo detection | `src/config/supabase.js` exports `null` when env vars are placeholders | Per-store checks | Single source of truth; mirrors the existing Firebase placeholder pattern |
| Real-time updates | Polling + manual refetch | Server-Sent Events | `admin-api` spec explicitly excludes SSE; polling is simpler and sufficient |
| API client | Thin `src/services/api.js` wrapper over `fetch` | Axios | Project already uses native fetch; keeps bundle small and avoids a new dependency |
| Payment provider | MercadoPago via server endpoints | Stripe | Existing SDK and spec target MercadoPago |

## Data Flow

### Auth flow
```
LoginForm → authStore.login()
                ↓
      supabase.auth.signInWithPassword
                ↓
      authStore.user = { id, email, role, ... }
                ↓
      api.get() attaches Authorization: Bearer <token>
                ↓
      /api/users/me → Prisma → PostgreSQL
```

### Property CRUD flow
```
PropertyEditor → propertyStore.createProperty(userId, data)
                         ↓
                  api.post('/api/properties', data)
                         ↓
                  Prisma inserts row, ownerId forced from JWT
                         ↓
                  store prepends returned property to local list
```

### Reservation flow
```
Guest → submitReservation → reservationsService.createReservation(data)
                                   ↓
                            api.post('/api/reservations', data)
                                   ↓
                            overlap check → 409 or insert
                                   ↓
                            notification row inserted for owner
```

### Payment flow
```
Subscription.vue → paymentStore.subscribeToPlan(planId)
                            ↓
                   api.post('/api/payments/create-preference', { planId })
                            ↓
                   MercadoPago preference → init_point / sandbox_init_point
                            ↓
                   window.location.href = checkoutUrl
                            ↓
                   MercadoPago sends IPN → /api/mercadopago/webhook
                            ↓
                   PaymentResult.vue polls subscription/payment status
```

## File Changes

| File | Action | Description |
|---|---|---|
| `src/config/supabase.js` | Create | Supabase client with placeholder detection |
| `src/services/api.js` | Create | Fetch wrapper with token injection and error normalization |
| `src/stores/auth.js` | Modify | Supabase Auth + demo fallback |
| `src/stores/property.js` | Modify | API-backed CRUD + demo fallback |
| `src/stores/search.js` | Modify | API search + client filters; reset `minBedrooms` |
| `src/stores/admin.js` | Modify | API-backed admin actions; polling replaces `onSnapshot` |
| `src/stores/payment.js` | Modify | Real preferences/subscriptions |
| `src/services/reservations.js` | Modify | API-backed reservation CRUD and status transitions |
| `src/services/reviews.js` | Modify | API-backed reviews + rating aggregation |
| `src/config/mercadopago.js` | Modify | Read `VITE_MP_PUBLIC_KEY`; no hardcoded keys |
| `src/views/PropertyDetail.vue` | Modify | Fetch property by `route.params.id`; show not-found state |
| `src/views/owner/Profile.vue` | Modify | Fix `ref` import order |
| `src/views/owner/Dashboard.vue` | Modify | Replace `$auth.user.role` with `authStore.user.role` |
| `src/views/owner/Reviews.vue` | Modify | Call `fetchUserProperties(authStore.userId)` |
| `src/views/owner/Subscription.vue` | Modify | Wire real subscription/payment flows |
| `src/views/owner/Checkout.vue` | Modify | Trigger API preference creation |
| `src/views/owner/PaymentResult.vue` | Modify | Poll subscription/payment status |
| `src/components/layout/DemoBanner.vue` | Modify | Display credentials that match mock data |
| `src/router/index.js` | Modify | Remove any Firebase Auth assumptions; keep role guards |
| `src/main.js` | Modify | Remove hardcoded console demo credentials |
| `api/mercadopago/preference.js` | Create | Create MercadoPago preference |
| `api/mercadopago/webhook.js` | Create | Handle IPN notifications |
| `vitest.config.js` | Modify | Remove `passWithNoTests`, add coverage reporter |
| `tests/unit/` | Create | Store and view tests |

No files are deleted.

## Interfaces / Contracts

`src/services/api.js` exports request helpers:

```js
export async function apiGet(path, params) { ... }
export async function apiPost(path, body) { ... }
export async function apiPatch(path, body) { ... }
export async function apiPut(path, body) { ... }
export async function apiDelete(path) { ... }
```

All helpers:
- Attach `Authorization: Bearer <token>` when the auth store exposes a session token.
- Set `Content-Type: application/json` for mutations.
- Parse JSON responses and return `{ success: true, data }` or `{ success: false, error: { code, message } }`.

Error `code` values map directly to the backend contract in `api/lib/http.js`: `VALIDATION`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `METHOD`, `CONFLICT`, `INTERNAL`.

When `supabase` is `null` (unconfigured), stores skip the API client entirely and use their existing mock/localStorage branches.

## Store Migration Pattern

For each migrated store:

1. Replace `if (!db)` checks with `if (!supabase)` using `src/config/supabase.js`.
2. In real mode, call the `api.*` helpers and update local state with the returned data.
3. In demo mode, keep the existing mock/localStorage behavior unchanged.
4. Remove Firestore imports once the store is fully migrated.
5. Replace Firestore `onSnapshot` listeners with an explicit `refetch()` action and an optional short-interval poll.

## Component Changes

| View / Component | Change |
|---|---|
| `PropertyDetail.vue` | Fetch property by `route.params.id`; render not-found state instead of hardcoded data |
| `owner/Profile.vue` | Move `ref` and composition imports before usage |
| `owner/Dashboard.vue` | Use `authStore.user.role` instead of `$auth.user.role` |
| `owner/Reviews.vue` | Use `propertyStore.fetchUserProperties(authStore.userId)` |
| `owner/Subscription.vue` | Use real subscription status and checkout flow |
| `owner/Checkout.vue` / `PaymentResult.vue` | Use API preferences and status polling |
| `components/layout/DemoBanner.vue` | Read credentials from mock data/auth store |

No new view components are required.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | `src/services/api.js` | Mock `global.fetch`, assert headers and error normalization |
| Unit | Auth store | Mock Supabase client, test login/register/logout/session restore |
| Unit | Property/search/admin/payment stores | Mock API responses, assert state changes |
| Unit | Search `clearFilters` | Assert `filters.minBedrooms === 0` |
| View | `PropertyDetail`, `Dashboard`, `Reviews` | Mount with Pinia and mocked Vue Router |
| E2E | MercadoPago sandbox | Manual checkout verification |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

Phased rollout per proposal:

1. **Bug fixes** — isolated changes, revert per commit.
2. **Auth migration** — critical path; keep Firebase Auth imports available initially. Roll back by reverting `src/stores/auth.js` and router guard changes.
3. **Frontend → API migration** — Firestore/localStorage fallback code remains in stores; revert any store file if its API calls fail.
4. **Frontend tests** — add alongside migration.
5. **MercadoPago integration** — fall back to demo mode when `VITE_MP_PUBLIC_KEY` or `MP_ACCESS_TOKEN` are missing.

**Demo mode preservation**: `src/config/supabase.js` returns `null` when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing or placeholders. Each store keeps its existing mock/localStorage fallback branch.

**Incremental testing**: each phase must pass `vite build` and `vitest run` before the next begins.

**Rollback strategy**: revert changed files per phase; keep Git tags at phase boundaries.

## Open Questions

- [ ] Are the Prisma seed data and Supabase project already provisioned for staging?
- [ ] Which Supabase redirect URL should be configured for password reset emails?
- [ ] Should the frontend poll `/api/subscriptions/mine` after checkout, or do we need a dedicated `/api/payments/status` endpoint?
