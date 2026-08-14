# reservations-api Specification

## Purpose
Move reservation CRUD and status transitions from Firestore to `/api/reservations`.

## Requirements

### Requirement: Create reservation

The system MUST create a reservation via POST `/api/reservations`.

#### Scenario: Valid dates and guests

- GIVEN an authenticated guest selects valid check-in/check-out and guests
- WHEN `createReservation` runs
- THEN the API returns the created reservation
- AND the property owner receives a notification

#### Scenario: Overlapping dates

- GIVEN the property is already reserved for the selected dates
- WHEN `createReservation` runs
- THEN the API returns `409 CONFLICT`
- AND the caller receives a clear error message

### Requirement: Fetch reservations

The system MUST retrieve reservations scoped to the authenticated user or all for admins.

#### Scenario: Owner reservations

- GIVEN an authenticated owner
- WHEN `getOwnerReservations` runs
- THEN it calls `/api/reservations?mine=owner`
- AND returns the owner's reservations

#### Scenario: Guest reservations

- GIVEN an authenticated guest
- WHEN `getGuestReservations` runs
- THEN it calls `/api/reservations?mine=guest`
- AND returns the guest's reservations

#### Scenario: Status filter

- GIVEN a status filter is provided
- WHEN fetching reservations
- THEN the request includes `status={filter}`
- AND only matching reservations are returned

### Requirement: Update, confirm, reject, and cancel

The system MUST transition reservation status through the API.

#### Scenario: Owner confirms a pending reservation

- GIVEN an authenticated owner
- WHEN `confirmReservation(reservationId)` runs
- THEN the API updates the status to `confirmed`
- AND returns the updated reservation

#### Scenario: Cancel reservation

- GIVEN an authenticated owner or guest
- WHEN `cancelReservation(reservationId)` runs
- THEN the API updates the status to `cancelled`
- AND records the actor

### Requirement: Delete reservation

The system MUST delete a reservation via DELETE `/api/reservations/{id}`.

#### Scenario: Owner deletes reservation

- GIVEN an authenticated owner
- WHEN `deleteReservation` runs
- THEN the reservation is removed

### Requirement: Demo fallback

The system MUST store reservations in `localStorage` and operate on mock data when the API is unavailable.

## Verification Criteria

- Service tests mock `/api/reservations` for create, fetch, update, delete.
- Overlapping reservation returns error.
- Status transitions update the local list.
- Demo mode persists to `localStorage`.
