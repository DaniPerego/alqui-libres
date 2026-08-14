# property-api Specification

## Purpose
Move property CRUD from Firestore to the Vercel `/api/properties` endpoint while keeping the demo fallback.

## Requirements

### Requirement: Fetch owner properties

The system MUST retrieve the current owner's properties from `/api/properties?mine=owner`.

#### Scenario: Owner has properties

- GIVEN an authenticated owner
- WHEN `fetchUserProperties` runs
- THEN it calls the endpoint with a Bearer token
- AND stores the returned `data` array

#### Scenario: Owner has no properties

- GIVEN an authenticated owner without properties
- WHEN the action runs
- THEN it receives an empty array
- AND `properties` is empty

### Requirement: Fetch a property by id

The system MUST retrieve a single property from the properties API using its id.

#### Scenario: Existing property

- GIVEN a valid property id
- WHEN `fetchProperty` runs
- THEN the API returns the property
- AND `currentProperty` is set

#### Scenario: Missing property

- GIVEN an invalid property id
- WHEN `fetchProperty` runs
- THEN the action returns `{ success: false, error: 'Property not found' }`
- AND `currentProperty` remains `null`

### Requirement: Create property

The system MUST create a property via POST `/api/properties`.

#### Scenario: Valid property data

- GIVEN an authenticated owner submits valid property data
- WHEN `createProperty` runs
- THEN the API returns the created property
- AND the new property appears in the local list

#### Scenario: Missing required fields

- GIVEN required fields are absent
- WHEN `createProperty` runs
- THEN the API returns a validation error
- AND the action returns `{ success: false, error }`

### Requirement: Update property

The system MUST update a property via PUT/PATCH `/api/properties/{id}`.

#### Scenario: Valid update

- GIVEN an authenticated owner submits changes to an owned property
- WHEN `updateProperty` runs
- THEN the API persists the changes
- AND the local property object reflects the update

### Requirement: Delete property

The system MUST delete a property via DELETE `/api/properties/{id}`.

#### Scenario: Existing property

- GIVEN an authenticated owner deletes an owned property
- WHEN `deleteProperty` runs
- THEN the property is removed from the API
- AND it is removed from the local list

### Requirement: Demo fallback

The system MUST use `mockProperties` and in-memory updates when Supabase/API is unavailable.

#### Scenario: API unavailable

- GIVEN Supabase is not configured
- WHEN CRUD actions run
- THEN changes apply to local state only
- AND a demo message is returned

## Verification Criteria

- Store tests mock `/api/properties` responses.
- Actions return `{ success: true/false }` shape consistently.
- Demo mode updates local state without network calls.
