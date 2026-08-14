# api-client Specification

## Purpose
Provide a single HTTP wrapper that injects the Supabase JWT and routes to demo fallbacks when the API is unavailable.

## Requirements

### Requirement: Authenticated fetch wrapper

The system MUST provide `src/services/api.js` exporting request helpers that call `/api/*` with `Authorization: Bearer <token>` when a session exists.

#### Scenario: Authenticated GET

- GIVEN a user is authenticated
- WHEN the client calls an API endpoint
- THEN the request includes the current access token in the `Authorization` header

#### Scenario: Unauthenticated request

- GIVEN no active session
- WHEN the client calls a public endpoint
- THEN no `Authorization` header is sent

### Requirement: JSON body handling

The system MUST set `Content-Type: application/json` for POST/PUT/PATCH requests and parse JSON responses.

#### Scenario: POST with payload

- GIVEN the client sends a JSON payload
- WHEN the server responds with JSON
- THEN the returned promise resolves to the parsed body

### Requirement: Error contract handling

The system MUST normalize API errors into `{ success: false, error: { code, message } }` or throw a consistent error object.

#### Scenario: Server validation error

- GIVEN the API returns `400 { error: { code: 'VALIDATION', message: '...' } }`
- WHEN the client processes the response
- THEN the caller receives a normalized error with code and message

#### Scenario: Network failure

- GIVEN the request fails because of a network error
- WHEN the client catches it
- THEN it returns/throws a user-friendly message without leaking internal details

### Requirement: Demo mode bypass

The system MUST detect an unconfigured Supabase client and skip API calls in favor of store-level mock/localStorage fallbacks.

#### Scenario: Supabase not configured

- GIVEN `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing
- WHEN a store action runs
- THEN the store uses local data instead of calling `/api/*`

## Verification Criteria

- Unit tests mock `fetch` and assert header injection.
- Missing token does not break public endpoints.
- Demo mode never invokes `/api/*`.
- Error responses expose `code` and `message` only.
