# bug-fixes-mvp Specification

## Purpose
Close the 7 confirmed UI/store bugs so the MVP renders and behaves correctly before the auth and API migrations.

## Requirements

### Requirement: PropertyDetail fetches the property from the route id

The system MUST load the property identified by `route.params.id` instead of using hardcoded demo data.

#### Scenario: Property exists

- GIVEN a visitor navigates to `/propiedad/{id}` for an existing property
- WHEN the view mounts
- THEN the store/service fetches the property matching `{id}`
- AND the detail page renders title, images, price, capacity, and location

#### Scenario: Property not found

- GIVEN a visitor navigates to `/propiedad/{id}` for a missing property
- WHEN the fetch completes
- THEN the view shows a "not found" state or error message
- AND it does not render hardcoded demo content

### Requirement: Owner Profile script imports are ordered correctly

The system MUST import `ref` and other Vue composition helpers before they are used in `<script setup>`.

#### Scenario: Profile view mounts

- GIVEN the owner profile view is opened
- WHEN it mounts
- THEN no "ref is not defined" runtime error occurs
- AND all tabs render

### Requirement: Owner Dashboard reads role from the auth store

The system MUST use `authStore.user.role` instead of the non-existent global `$auth.user.role`.

#### Scenario: Owner opens dashboard

- GIVEN an authenticated owner navigates to `/panel`
- WHEN the dashboard renders
- THEN the full owner sidebar is visible

#### Scenario: Guest opens dashboard

- GIVEN an authenticated guest navigates to `/panel`
- WHEN the dashboard renders
- THEN only the router-view content is shown
- AND the owner sidebar is hidden

### Requirement: Owner Reviews loads the correct properties

The system MUST call the property store's `fetchUserProperties` method, not `fetchProperties`.

#### Scenario: Owner views reviews

- GIVEN an authenticated owner with properties opens `/panel/resenas`
- WHEN the view mounts
- THEN `fetchUserProperties` is invoked with the current user id
- AND reviews are aggregated from those properties

### Requirement: Demo banner credentials match the demo data

The system MUST display demo credentials that match the configured mock users.

#### Scenario: Demo mode banner

- GIVEN the app is running without Supabase/Firebase configuration
- WHEN the demo banner renders
- THEN it shows the owner and admin emails and passwords that exist in the mock data and auth store

### Requirement: Search store resets minBedrooms on clearFilters

The system MUST reset `filters.minBedrooms` to `0` when `clearFilters()` is called.

#### Scenario: Clear search filters

- GIVEN a user set `minBedrooms` greater than 0
- WHEN `clearFilters()` runs
- THEN `minBedrooms` equals `0`
- AND all other filter fields return to their defaults

### Requirement: MercadoPago public key is read from environment

The system MUST read `VITE_MP_PUBLIC_KEY` and MUST NOT hardcode a production key in source control.

#### Scenario: Missing payment key

- GIVEN `VITE_MP_PUBLIC_KEY` is unset or a placeholder
- WHEN the payment store initializes
- THEN it falls back to demo mode
- AND no real MercadoPago key is committed to the repository

## Verification Criteria

- Manual click-through of each fixed view passes without console errors.
- Unit test for `clearFilters` asserts `minBedrooms === 0`.
- Demo banner snapshot matches current mock credentials.
- Source search for hardcoded MercadoPago keys returns none.
