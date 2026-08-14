# search-api Specification

## Purpose
Replace Firestore public-listings queries with calls to `/api/properties` and preserve client-side filters.

## Requirements

### Requirement: Search listings from API

The system MUST fetch active listings from `/api/properties` with query parameters matching the current filters.

#### Scenario: Basic search

- GIVEN filters for city, guests, and price range are set
- WHEN `searchListings` runs
- THEN the request includes `city`, `guests`, `priceMin`, and `priceMax`
- AND `listings` and `filteredListings` are populated

#### Scenario: Text search

- GIVEN a search query `q` is entered
- WHEN `searchListings` runs
- THEN the request includes `q`
- AND results are ranked by relevance

### Requirement: Client-side filters

The system MUST apply filters not supported server-side (amenities, localFeatures, minBedrooms) in `applyClientFilters`.

#### Scenario: Amenity filter

- GIVEN the user selects "WiFi" and "Parrilla"
- WHEN `applyClientFilters` runs
- THEN only listings containing both amenities remain in `filteredListings`

### Requirement: clearFilters resets all fields

The system MUST reset every filter, including `minBedrooms`, to its default.

#### Scenario: User clears filters

- GIVEN `minBedrooms` is 2 and city is set
- WHEN `clearFilters()` runs
- THEN `filters.minBedrooms` is 0
- AND `filters.city` is empty

### Requirement: Demo fallback

The system MUST use `mockProperties` when the API is unavailable.

#### Scenario: Supabase not configured

- GIVEN Supabase is not configured
- WHEN `searchListings` runs
- THEN it loads `mockProperties`
- AND applies client-side filters

## Verification Criteria

- Tests verify query string generation from filters.
- `clearFilters` test asserts `minBedrooms === 0`.
- Client-side filter tests cover amenities and minBedrooms.
