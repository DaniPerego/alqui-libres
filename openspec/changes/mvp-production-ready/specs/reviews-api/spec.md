# reviews-api Specification

## Purpose
Move reviews from localStorage to `/api/reviews` while keeping the localStorage fallback.

## Requirements

### Requirement: Fetch property reviews

The system MUST retrieve reviews for a property from `/api/reviews?propertyId={id}`.

#### Scenario: Property has reviews

- GIVEN a property with reviews
- WHEN `getPropertyReviews` runs
- THEN it returns reviews sorted by newest first

#### Scenario: Property has no reviews

- GIVEN a property without reviews
- WHEN `getPropertyReviews` runs
- THEN it returns an empty array

### Requirement: Add review

The system MUST create a review via POST `/api/reviews`.

#### Scenario: Authenticated guest submits review

- GIVEN an authenticated guest with a completed stay submits rating and comment
- WHEN `addReview` runs
- THEN the review is persisted
- AND it appears in the property's review list

#### Scenario: Missing rating or comment

- GIVEN a review is missing rating or comment
- WHEN `addReview` runs
- THEN the API returns a validation error

### Requirement: Owner reply

The system MUST allow an owner to reply to a review.

#### Scenario: Owner replies

- GIVEN an authenticated owner replies to a review for their property
- WHEN the reply is submitted
- THEN the review includes the reply text

### Requirement: Aggregate owner reviews

The system MUST fetch all reviews for the current owner's properties.

#### Scenario: Owner views reviews

- GIVEN an authenticated owner
- WHEN `getOwnerReviews` runs
- THEN it returns reviews for all properties owned by the user

### Requirement: Rating aggregation

The system MUST compute average rating and count for a property.

#### Scenario: Compute rating

- GIVEN a property has reviews
- WHEN `getPropertyRating` runs
- THEN it returns `{ rating, count }` rounded to one decimal

### Requirement: Demo fallback

The system MUST use `mockReviews` and `localStorage` when the API is unavailable.

## Verification Criteria

- Tests mock `/api/reviews` endpoints.
- Review list is sorted newest first.
- Owner reply updates the review.
- Rating aggregation is accurate.
