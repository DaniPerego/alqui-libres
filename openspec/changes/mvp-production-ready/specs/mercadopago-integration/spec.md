# mercadopago-integration Specification

## Purpose
Integrate real MercadoPago checkout, server-side preference creation, webhook notifications, and payment status tracking.

## Requirements

### Requirement: MercadoPago credentials from environment

The system MUST read public and access tokens from environment variables and MUST NOT commit keys to source control.

#### Scenario: Missing credentials

- GIVEN `VITE_MP_PUBLIC_KEY` or `MP_ACCESS_TOKEN` is missing
- WHEN checkout initializes
- THEN the app falls back to demo mode

### Requirement: Preference endpoint

The system MUST implement `api/mercadopago/preference.js` that creates a MercadoPago preference.

#### Scenario: Authenticated preference creation

- GIVEN an authenticated user submits a valid plan id
- WHEN the endpoint is called
- THEN it creates a preference with title, unit price, quantity 1, currency ARS, and back_urls
- AND returns `id`, `init_point`, `sandbox_init_point`, and `external_reference`

#### Scenario: Unauthenticated request

- GIVEN no valid Bearer token
- WHEN the endpoint is called
- THEN it returns `401 UNAUTHORIZED`

### Requirement: Webhook endpoint

The system MUST implement `api/mercadopago/webhook.js` to handle MercadoPago IPN notifications.

#### Scenario: Approved payment notification

- GIVEN MercadoPago sends an approved payment notification for a known external reference
- WHEN the webhook processes it
- THEN the related subscription is marked `active`
- AND an invoice or payment record is created

#### Scenario: Unknown reference

- GIVEN a notification references an unknown payment
- WHEN the webhook processes it
- THEN it logs the event and returns `200` to avoid retries

### Requirement: Payment status tracking

The system MUST allow the frontend to query the current payment status.

#### Scenario: Return from checkout

- GIVEN a user returns from MercadoPago with `?status=success`
- WHEN the payment result view mounts
- THEN it queries `/api/payments/status` and updates the subscription

### Requirement: Frontend checkout integration

The system MUST open the MercadoPago checkout using the returned `init_point` or `sandbox_init_point`.

#### Scenario: Production redirect

- GIVEN a preference is created in production
- WHEN the user confirms subscription
- THEN the browser redirects to MercadoPago

## Verification Criteria

- Preference endpoint is covered by unit or integration tests.
- Webhook endpoint handles approved and pending statuses.
- No MercadoPago access token is present in frontend source.
- End-to-end manual checkout succeeds in sandbox.
