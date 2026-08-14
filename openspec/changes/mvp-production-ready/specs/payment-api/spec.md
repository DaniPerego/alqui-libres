# payment-api Specification

## Purpose
Move subscriptions and payments from mocks to `/api/subscriptions` and `/api/payments` while preserving the demo fallback.

## Requirements

### Requirement: Fetch current subscription

The system MUST retrieve the active user's subscription from `/api/subscriptions/current`.

#### Scenario: Active subscription

- GIVEN a user has an active subscription
- WHEN `fetchCurrentSubscription` runs
- THEN it returns plan id, status, start, expiry, and auto-renew flag

#### Scenario: No subscription

- GIVEN a user has no subscription
- WHEN `fetchCurrentSubscription` runs
- THEN `currentSubscription` is `null`

### Requirement: Create checkout preference

The system MUST create a MercadoPago preference via POST `/api/payments/create-preference`.

#### Scenario: Valid plan

- GIVEN an authenticated user selects a plan
- WHEN `createPreference(planId)` runs
- THEN the API returns `id`, `init_point`, `sandbox_init_point`, and `back_urls`

#### Scenario: Invalid plan

- GIVEN an invalid plan id
- WHEN `createPreference` runs
- THEN it returns a not-found or validation error

### Requirement: Subscribe to a plan

The system MUST redirect the user to MercadoPago checkout in production and simulate success in development.

#### Scenario: Production checkout

- GIVEN the app runs in production with valid keys
- WHEN the user subscribes
- THEN the browser navigates to the MercadoPago checkout URL

#### Scenario: Development fallback

- GIVEN the app runs in development without redirect
- WHEN the user subscribes
- THEN the store simulates a successful payment
- AND activates the subscription locally

### Requirement: Change, cancel, and reactivate subscription

The system MUST PATCH `/api/subscriptions/{id}` for plan changes and status transitions.

#### Scenario: Cancel subscription

- GIVEN a user cancels an active subscription
- WHEN `cancelSubscription` runs
- THEN the status becomes `cancelled`
- AND `autoRenew` becomes false

#### Scenario: Change plan

- GIVEN an active or pending subscription and a different active plan
- WHEN `changePlan(newPlanId)` runs with API available
- THEN the store PATCHes `/api/subscriptions/{id}` with `{ status: 'plan_change', planId }`
- AND the subscription becomes `pending` on the new plan
- AND `preferenceId` is cleared (the previous preference must not be reused)
- AND a new `pending` Payment row is created for the attempt
- AND the frontend redirects to the checkout, where `createPreference` builds the new MercadoPago preference and reuses the pending subscription

#### Scenario: Change plan validations

- GIVEN `planId` is missing
- THEN the PATCH returns `400 VALIDATION`
- AND changing to the current plan returns `409 CONFLICT`
- AND an unknown or inactive plan returns `404 NOT_FOUND`
- AND changing a cancelled subscription returns `409 CONFLICT`

### Requirement: Fetch invoices

The system MUST retrieve payment invoices from `/api/payments/invoices`.

#### Scenario: User has invoices

- GIVEN a user has previous payments
- WHEN `fetchInvoices` runs
- THEN it returns a list of invoices with date, amount, status, and plan name

### Requirement: Demo fallback

The system MUST use mock preferences and localStorage subscriptions when MercadoPago keys are missing.

## Verification Criteria

- Payment store tests mock preference and subscription endpoints.
- Production redirect uses `init_point`; development uses `sandbox_init_point` or simulation.
- Cancel and reactivate update status and `autoRenew`.
- Plan change resets the subscription to `pending` on the new plan, clears `preferenceId`, and records a new pending payment.
- Missing `VITE_MP_PUBLIC_KEY` triggers demo mode.
