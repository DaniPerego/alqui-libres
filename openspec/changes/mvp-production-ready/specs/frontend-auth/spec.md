# frontend-auth Specification

## Purpose
Replace Firebase Auth in the frontend with Supabase Auth while keeping the existing demo/localStorage fallback and preserving Firebase Cloud Functions for notifications.

## Requirements

### Requirement: Supabase client configuration

The system MUST create `src/config/supabase.js` that initializes a Supabase client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

#### Scenario: Valid configuration

- GIVEN both environment variables are present and not placeholders
- WHEN the app starts
- THEN a Supabase client is available

#### Scenario: Missing configuration

- GIVEN either variable is missing or a placeholder
- WHEN the app starts
- THEN the client is `null` and the app enters demo mode

### Requirement: Login with Supabase

The system MUST authenticate via `supabase.auth.signInWithPassword` when Supabase is configured.

#### Scenario: Valid credentials

- GIVEN a registered user enters valid email and password
- WHEN login is submitted
- THEN the user receives a session
- AND the auth store exposes `user`, `isAuthenticated`, and `userId`

#### Scenario: Invalid credentials

- GIVEN a user enters invalid credentials
- WHEN login is submitted
- THEN the action returns `{ success: false, error }`
- AND the error is translated to a Spanish message

#### Scenario: Demo fallback login

- GIVEN Supabase is not configured
- WHEN a user enters demo credentials
- THEN the action authenticates against localStorage/hardcoded mock users
- AND returns `{ success: true }`

### Requirement: Registration with Supabase

The system MUST create a Supabase auth user and a platform user row when configured.

#### Scenario: New owner registers

- GIVEN a visitor submits email, password, and display name
- WHEN registration completes
- THEN a Supabase user exists
- AND the API/DB contains an `owner` row linked to that user

#### Scenario: Demo fallback registration

- GIVEN Supabase is not configured
- WHEN registration completes
- THEN the user is stored in localStorage mock credentials
- AND the auth store treats the user as authenticated

### Requirement: Session restoration

The system MUST restore the Supabase session on application start.

#### Scenario: Page refresh

- GIVEN a user is logged in and refreshes the page
- WHEN `checkAuth()` runs
- THEN the session is recovered from Supabase
- AND the store state reflects the authenticated user

### Requirement: Logout

The system MUST sign out from Supabase and clear local state.

#### Scenario: User logs out

- GIVEN an authenticated user clicks logout
- WHEN the action completes
- THEN the Supabase session is invalidated
- AND `user` is `null` and `isAuthenticated` is `false`

### Requirement: Password reset

The system MUST request a Supabase password reset email when configured, with a demo fallback.

#### Scenario: Reset request

- GIVEN a user submits a registered email
- WHEN reset is requested
- THEN Supabase sends a reset email, or demo sets a temporary password
- AND the action returns a success message

### Requirement: Token exposure for API calls

The system MUST expose the current Supabase access token so the API client can attach it to requests.

#### Scenario: Authenticated API call

- GIVEN a user is authenticated
- WHEN the API client prepares a request
- THEN it retrieves the token from the auth store/session
- AND sends `Authorization: Bearer <token>`

### Requirement: Profile and role merge

The system MUST merge platform profile fields (role, subscription, display name) into the auth store user.

#### Scenario: Authenticated user loaded

- GIVEN a user logs in
- WHEN the profile is fetched from the API or Supabase metadata
- THEN `user.role`, `user.subscription`, and `user.displayName` are populated

## Verification Criteria

- `vitest` tests cover login success/failure, registration, logout, and session restore.
- Demo mode still authenticates the three mock accounts.
- API calls include a valid Bearer token after login.
- Firebase Auth imports are removed from `src/stores/auth.js`.
