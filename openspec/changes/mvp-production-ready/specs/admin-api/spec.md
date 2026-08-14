# admin-api Specification

## Purpose
Replace Firestore admin operations and real-time subscriptions with API calls to `/api/users`, `/api/properties`, `/api/subscriptions`, and `/api/platform-settings`.

## Requirements

### Requirement: Manage users

The system MUST perform admin user operations via the users API.

#### Scenario: Fetch users

- GIVEN an authenticated admin
- WHEN `fetchUsers` runs
- THEN it calls `/api/users`
- AND populates `users`

#### Scenario: Update user role

- GIVEN an admin selects a new role for a user
- WHEN `updateUserRole` runs
- THEN the API persists the role
- AND the local user object updates

#### Scenario: Toggle user status

- GIVEN an admin suspends or activates a user
- WHEN `toggleUserStatus` runs
- THEN the API persists `isActive`
- AND the local user object updates

#### Scenario: Create user

- GIVEN an admin creates a new owner account
- WHEN `createUser` runs
- THEN the API creates the user with a temporary password
- AND returns the generated password

### Requirement: Manage subscriptions

The system MUST manage subscription plans and user subscriptions via the subscriptions API.

#### Scenario: Fetch plans

- GIVEN an admin opens subscription settings
- WHEN `initPlans` runs
- THEN it calls `/api/subscription-plans`
- AND seeds default plans if none exist

#### Scenario: Update plan

- GIVEN an admin edits a plan
- WHEN `updateSubscriptionPlan` runs
- THEN the API persists the changes

#### Scenario: Update user subscription

- GIVEN an admin assigns a plan to a user
- WHEN `updateUserSubscription` runs
- THEN the API links the subscription to the user

### Requirement: Moderate properties

The system MUST moderate properties via `/api/properties?scope=all`.

#### Scenario: Fetch all properties

- GIVEN an authenticated admin
- WHEN `fetchAllProperties` runs
- THEN it calls `/api/properties?scope=all`
- AND returns properties of any status

#### Scenario: Approve property

- GIVEN an admin approves a pending property
- WHEN `updatePropertyStatus` runs
- THEN the API updates the status to `active`
- AND `isActive` becomes true

#### Scenario: Delete property

- GIVEN an admin deletes a property
- WHEN `deleteProperty` runs
- THEN the property is removed from the API and local list

### Requirement: Platform settings

The system MUST read and update platform settings via `/api/platform-settings`.

#### Scenario: Load settings

- GIVEN an admin opens platform settings
- WHEN `initPlatformSettings` runs
- THEN it calls `/api/platform-settings`
- AND populates `platformSettings`

#### Scenario: Update settings

- GIVEN an admin changes a setting
- WHEN `updatePlatformSettings` runs
- THEN the API persists the change

### Requirement: Replace real-time subscriptions

The system MUST remove Firestore `onSnapshot` listeners and use explicit refetch or short-interval polling.

#### Scenario: Settings change

- GIVEN the admin is viewing settings
- WHEN a background update occurs
- THEN the UI refreshes on the next poll or manual refetch

### Requirement: Compute admin stats

The system MUST derive dashboard stats from fetched users, properties, and subscriptions.

#### Scenario: Stats updated

- GIVEN users, properties, and subscriptions are loaded
- WHEN `updateStats` runs
- THEN totals for users, properties, active subscriptions, and pending approvals are correct

### Requirement: Demo fallback

The system MUST use hardcoded/mock localStorage data when the API is unavailable.

## Verification Criteria

- Admin store tests mock all admin endpoints.
- No Firestore `onSnapshot` calls remain in `src/stores/admin.js`.
- Polling/refetch interval is configurable.
- Stats match computed values from mocked data.
