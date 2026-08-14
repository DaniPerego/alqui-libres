# frontend-tests Specification

## Purpose
Establish a Vitest test suite for stores and key views so future regressions are caught automatically.

## Requirements

### Requirement: Vitest configuration

The system MUST configure Vitest with a DOM environment and coverage reporter.

#### Scenario: Run tests

- GIVEN the project has unit tests
- WHEN `vitest run` executes
- THEN all tests run and produce a coverage report
- AND `passWithNoTests` is not enabled

### Requirement: Auth store tests

The system MUST test login, register, logout, session restore, and error handling.

#### Scenario: Login success

- GIVEN valid Supabase credentials are mocked
- WHEN `authStore.login` is called
- THEN the user is authenticated

#### Scenario: Login failure

- GIVEN invalid credentials are mocked
- WHEN `authStore.login` is called
- THEN `error` is set and success is false

### Requirement: Property store tests

The system MUST test fetch, create, update, delete, and fallback behavior.

#### Scenario: CRUD operations

- GIVEN API responses are mocked
- WHEN each property action runs
- THEN state updates correctly

### Requirement: Search store tests

The system MUST test filters and clear behavior.

#### Scenario: Filter application

- GIVEN a set of listings
- WHEN filters change
- THEN `filteredListings` reflects the filters

### Requirement: View tests

The system MUST render `PropertyDetail`, `Dashboard`, and `Reviews` with Pinia and a mocked router.

#### Scenario: PropertyDetail renders

- GIVEN a mocked property and route
- WHEN the view mounts
- THEN it renders the property title and price

### Requirement: Coverage

The system MUST produce coverage greater than 0% and display it in the terminal.

## Verification Criteria

- `vitest run` exits 0.
- Coverage report includes stores and views.
- No `passWithNoTests` flag in config.
