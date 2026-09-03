# Beytak — Functional Requirements

Requirements are identified as **FR-x.y** and grouped by area. Each carries its current
implementation status:

| Symbol | Meaning |
|---|---|
| ✅ | Implemented and verified working |
| 🟡 | Data model and data-access layer complete; service/API layer pending |
| ⬜ | Specified, not yet implemented |

---

## FR-1 — Authentication and Authorization

| ID | Requirement | Status |
|---|---|---|
| FR-1.1 | A visitor shall register with full name, email, password and phone number. | ✅ |
| FR-1.2 | The system shall reject registration when the email is already in use. | ✅ |
| FR-1.3 | Passwords shall be stored only as salted hashes, never in plain text. | ✅ |
| FR-1.4 | A registered user shall log in with email and password and receive a signed JWT. | ✅ |
| FR-1.5 | A failed login shall return HTTP 401 with a message that does not reveal whether the email exists. | ✅ |
| FR-1.6 | Every newly registered account shall be assigned the `User` role automatically. | ✅ |
| FR-1.7 | The token shall carry the user id, display name, role and subscription status as claims. | ✅ |
| FR-1.8 | Protected endpoints shall reject requests without a valid, unexpired, correctly signed token. | ✅ |
| FR-1.9 | The system shall support exactly two roles: `Admin` and `User`. | ✅ |
| FR-1.10 | The `Admin` and `User` roles and a default administrator account shall be seeded on first startup. | ✅ |
| FR-1.11 | The acting user identity shall be read from the token claims, never from the request body. | ⬜ |

## FR-2 — Property Listings (CRUD)

| ID | Requirement | Status |
|---|---|---|
| FR-2.1 | A subscribed user shall create a property listing. | ⬜ |
| FR-2.2 | The system shall reject listing creation by a user without an active subscription. | ⬜ |
| FR-2.3 | A listing shall record title, description, property type, address, city, price and rental period. | 🟡 |
| FR-2.4 | A listing shall optionally record neighbourhood, floor number, master bedrooms, apartments in building and building age. | 🟡 |
| FR-2.5 | A listing shall record bedrooms, bathrooms, area in square metres and furnishing status. | 🟡 |
| FR-2.6 | An owner shall attach multiple images to a listing and designate one as primary. | 🟡 |
| FR-2.7 | An owner shall update only their own listings. | ⬜ |
| FR-2.8 | An owner shall delist a property by marking it unavailable, without deleting its booking history. | 🟡 |
| FR-2.9 | Any visitor shall view a listing with its full details, owner name and images. | ⬜ |
| FR-2.10 | The system shall prevent a user modifying a listing they do not own. | ⬜ |
| FR-2.11 | An owner shall set the number of turnover days their property requires between stays for cleaning and inspection, defaulting to two. | 🟡 |

## FR-3 — Search and Discovery

| ID | Requirement | Status |
|---|---|---|
| FR-3.1 | A visitor shall browse all available listings. | 🟡 |
| FR-3.2 | A visitor shall filter listings by city. | 🟡 |
| FR-3.3 | A visitor shall filter listings by property type. | 🟡 |
| FR-3.4 | A visitor shall filter listings by minimum bedroom count. | 🟡 |
| FR-3.5 | Search results shall exclude listings marked unavailable. | 🟡 |
| FR-3.6 | An owner shall retrieve a list of their own properties. | 🟡 |
| FR-3.7 | Filters shall be combinable and evaluated in a single database query. | 🟡 |

## FR-4 — Bookings

| ID | Requirement | Status |
|---|---|---|
| FR-4.1 | A registered user shall request a booking by supplying a start date, a duration count and a duration type — for example "6 months from 1 March". The end date shall be derived by the system, never entered by the user. | 🟡 |
| FR-4.2 | **The system shall reject any booking whose date range overlaps an existing active booking for the same property.** | 🟡 |
| FR-4.3 | Cancelled and rejected bookings shall not block new bookings for the same dates. | 🟡 |
| FR-4.4 | The end date shall be stored exclusively and presented inclusively: a booking stored as 1 March to 1 September shall be displayed to the user as "1 March to 31 August". | 🟡 |
| FR-4.5 | The system shall reject a booking whose duration count is less than one. | ⬜ |
| FR-4.13 | **The system shall enforce the property's turnover period between stays.** A new booking shall be rejected if it starts within the turnover window following an existing booking, or ends so close to a later booking that the turnover window would be lost. | 🟡 |
| FR-4.14 | The turnover window shall be applied when evaluating availability only. It shall not be written into the stored end date, so that the booking record continues to state the period the renter actually agreed to. | 🟡 |
| FR-4.15 | Days blocked by a turnover window shall be presented to renters as unavailable for turnover, distinctly from days blocked by a booking. | ⬜ |
| FR-4.6 | The total price shall be calculated by the server as the property price multiplied by the duration count, stored on the booking at creation, and shall not change if the property price is later edited. The client shall never supply a price. | 🟡 |
| FR-4.7 | A new booking shall be created with status `Pending`. | ✅ |
| FR-4.8 | A property owner shall confirm or reject a pending booking on their own property. | ⬜ |
| FR-4.9 | A renter shall cancel their own booking. | ⬜ |
| FR-4.10 | A renter shall view all of their bookings, most recent first. | 🟡 |
| FR-4.11 | An owner shall view all bookings placed against their properties, including renter details. | 🟡 |
| FR-4.12 | Booking status shall follow the lifecycle Pending, then Confirmed, Rejected or Cancelled, then Completed. | 🟡 |

## FR-5 — Payments

| ID | Requirement | Status |
|---|---|---|
| FR-5.1 | A renter shall submit a payment record against a confirmed booking. | 🟡 |
| FR-5.2 | A payment shall record amount, purpose, status, an optional reference note and a creation timestamp. | 🟡 |
| FR-5.3 | A property owner shall confirm or reject a **booking** payment made against their own property. | ⬜ |
| FR-5.3a | An administrator shall confirm or reject a **subscription** payment. A subscription payment has no associated property and therefore no owner to confirm it. | ⬜ |
| FR-5.4 | Confirming a payment shall record the confirmation timestamp. | 🟡 |
| FR-5.5 | A single payment table shall serve both booking payments and subscription payments, distinguished by a purpose discriminator. | 🟡 |
| FR-5.6 | A booking may carry multiple payment attempts, so a rejected payment can be superseded by a new one. | 🟡 |
| FR-5.7 | The system shall not integrate an external payment gateway; settlement occurs off-platform. | ✅ by design |

## FR-6 — Owner Subscriptions

| ID | Requirement | Status |
|---|---|---|
| FR-6.1 | Each account shall carry a subscription flag and an optional expiry date. | ✅ |
| FR-6.2 | A newly registered user shall have no active subscription. | ✅ |
| FR-6.3 | An administrator shall activate or deactivate any user subscription. | ⬜ |
| FR-6.4 | The system shall require an active subscription before allowing a user to publish a listing. | ⬜ |
| FR-6.5 | Subscription status shall be verified against the database at the point of enforcement, not read from the token claim. | ⬜ |
| FR-6.6 | A subscription payment shall be recorded with purpose `SubscriptionPayment` and no associated booking. | 🟡 |

## FR-7 — Wishlist

| ID | Requirement | Status |
|---|---|---|
| FR-7.1 | A registered user shall save a property to their wishlist. | 🟡 |
| FR-7.2 | The system shall prevent the same property being saved twice by the same user, enforced by a database unique constraint. | ✅ |
| FR-7.3 | A user shall view and remove items from their own wishlist. | 🟡 |

## FR-8 — Testimonials

| ID | Requirement | Status |
|---|---|---|
| FR-8.1 | A registered user shall submit a site-wide testimonial about the platform. | 🟡 |
| FR-8.2 | Testimonials shall not be tied to a specific booking or property. | ✅ by design |
| FR-8.3 | A testimonial shall remain unpublished until approved by an administrator. | 🟡 |
| FR-8.4 | An administrator shall approve or reject submitted testimonials. | ⬜ |
| FR-8.5 | Only approved testimonials shall be visible publicly. | ⬜ |

## FR-9 — Administration

The administrator has oversight of three areas of the platform: **subscriptions**,
**testimonials** and **listings**.

### FR-9.1 — Subscriptions

| ID | Requirement | Status |
|---|---|---|
| FR-9.1.1 | An administrator shall view all registered users together with their current subscription status and expiry date. | ⬜ |
| FR-9.1.2 | An administrator shall view subscription payments awaiting confirmation. | ⬜ |
| FR-9.1.3 | An administrator shall approve a subscription. Approval shall, in a single transaction, mark the subscription payment confirmed and set the user's subscription flag and expiry date. | ⬜ |
| FR-9.1.4 | An administrator shall reject a subscription payment without altering the user's subscription status. | ⬜ |
| FR-9.1.5 | An administrator shall deactivate an active subscription. | ⬜ |

Approving a subscription touches two entities — `Payments` and `AspNetUsers` — and shall
therefore be committed through a single unit of work, so that a confirmed payment can
never be recorded against a user whose access was not granted.

### FR-9.2 — Testimonials

| ID | Requirement | Status |
|---|---|---|
| FR-9.2.1 | An administrator shall view all submitted testimonials, including those not yet approved. | ⬜ |
| FR-9.2.2 | An administrator shall approve a testimonial, making it publicly visible. | ⬜ |
| FR-9.2.3 | An administrator shall reject or unpublish a previously approved testimonial. | ⬜ |
| FR-9.2.4 | Only approved testimonials shall be returned by public endpoints. | ⬜ |

### FR-9.3 — Listings

| ID | Requirement | Status |
|---|---|---|
| FR-9.3.1 | An administrator shall view all published listings across every owner. | ⬜ |
| FR-9.3.2 | An administrator shall unpublish a listing that breaches platform policy, removing it from public search results. | ⬜ |
| FR-9.3.3 | Unpublishing a listing shall not delete it, and shall not affect bookings already placed against it. | ⬜ |
| FR-9.3.4 | An administrator shall not edit the content of a listing belonging to another user. | ⬜ |

Moderation is **reactive**: a listing is published immediately and may be removed
afterwards. Requiring approval before publication was considered and rejected, because it
places an administrator in the critical path of every new listing.

FR-9.3.2 is currently expressed through the existing `Houses.IsAvailable` flag. The data
model does not yet distinguish an owner delisting their own property from an
administrator removing it — see the known limitations in the database design document.

### FR-9.4 — Access control

| ID | Requirement | Status |
|---|---|---|
| FR-9.4.1 | Administrative endpoints shall be restricted to the `Admin` role and shall return HTTP 403 to all other users. | ⬜ |
| FR-9.4.2 | Administrators shall not participate in bookings; the role exists solely for oversight. | ⬜ |

## FR-10 — Data Integrity

| ID | Requirement | Status |
|---|---|---|
| FR-10.1 | Deleting a user shall be prevented while they hold bookings, payments or wishlist items, so that other users' records are never destroyed as a side effect. | ✅ |
| FR-10.2 | Deleting a property shall cascade to its images and wishlist entries. | ✅ |
| FR-10.3 | All monetary values shall be stored as `decimal(18,2)` and never as floating point. | ✅ |
| FR-10.4 | Stay dates shall be stored without a time component; audit timestamps shall be stored in UTC. | ✅ |
| FR-10.5 | All request payloads shall be validated before reaching business logic, returning HTTP 400 with field-level errors. | ✅ |

---

## Delivery summary

| Area | ✅ | 🟡 | ⬜ |
|---|---|---|---|
| Authentication and Authorization | 10 | 0 | 1 |
| Property Listings | 0 | 6 | 5 |
| Search and Discovery | 0 | 7 | 0 |
| Bookings | 1 | 11 | 3 |
| Payments | 1 | 5 | 2 |
| Owner Subscriptions | 2 | 1 | 3 |
| Wishlist | 1 | 2 | 0 |
| Testimonials | 1 | 2 | 2 |
| Administration | 0 | 0 | 15 |
| Data Integrity | 5 | 0 | 0 |
| **Total** | **21** | **34** | **32** |

**Phase 1 delivers** the complete domain model, SQL Server database with migrations, the
repository and unit-of-work data-access layer, and a fully working JWT authentication
system.

**Phase 2 delivers** the remaining service and controller layers, and the complete
front-end.
