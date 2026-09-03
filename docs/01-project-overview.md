# Beytak — Project Overview

**Student:** Dawud Asasfeh
**Course:** Orange Coding School — Final Project, Phase 1
**Repository:** https://github.com/dawudasasfeh/OCS_Final_Project

---

## 1. Project Idea

**Beytak** (Arabic: *your home*) is a property rental marketplace for the Jordanian
market. Property owners publish listings for apartments, houses, villas, studios and
rooms; renters browse those listings, filter them by location and specification, and
reserve a property for a defined period.

The distinguishing design decision is a **single unified booking model**. Rather than
maintaining separate subsystems for short-term and long-term rentals, every reservation
is one `Booking` record carrying a start date, an end date, and a duration type. The same
model therefore serves a one-week stay and a one-year lease. Extending a rental is
expressed either as a new adjoining booking or as an updated end date — there is no
recurring-contract or subscription-billing machinery.

## 2. Purpose of the System

The Jordanian rental market is fragmented across classifieds sites, social media groups
and word of mouth. Listings are inconsistent, availability is unverifiable, and there is
no reliable record of who reserved what.

Beytak addresses three specific problems:

| Problem | How Beytak addresses it |
|---|---|
| Listings scattered across channels | One searchable catalogue with a consistent, structured schema for every property |
| No reliable availability | Server-enforced booking-conflict prevention — a property cannot be double-booked for overlapping dates |
| No record of agreements | Every reservation and payment is persisted with an explicit status and an audit timestamp |

The system is a **coordination and record-keeping platform**, not a payment processor.
Money changes hands outside the application; Beytak tracks the state of each transaction.

## 3. Main Features

### Property listings
- Owners publish properties with a structured specification: type, city, neighbourhood,
  area, bedrooms, bathrooms, floor number, master bedrooms, furnishing status, building
  age, and number of apartments in the building.
- Multiple images per property, with one designated as primary.
- Owners may delist a property without deleting it, preserving its booking history.

### Search and discovery
- Filter by city, neighbourhood, property type, bedroom count and rental period.
- Only available properties are returned to renters.

### Unified booking
- A single booking model spans weekly, monthly and yearly rental periods.
- **Booking-conflict prevention**: the system rejects any reservation whose date range
  overlaps an existing active booking for the same property.
- Bookings carry an explicit lifecycle: Pending → Confirmed / Rejected / Cancelled → Completed.
- The agreed total price is **snapshotted** onto the booking at creation, so a later
  change to the property's price does not retroactively alter existing reservations.

### Payment tracking
- A single `Payment` table records both booking payments and owner subscription payments,
  distinguished by a purpose discriminator.
- Payments are **recorded, not processed**. The renter submits a payment record; the owner
  manually confirms receipt. The system tracks status and the confirmation timestamp.
- No payment gateway is integrated. This is a deliberate scope decision, not an omission.

### Owner subscriptions
- Listing properties is gated behind an active subscription flag on the user account.
- An administrator toggles subscription status manually. As with payments, no billing
  provider is integrated.

### Supporting features
- **Wishlist** — renters save properties for later. A database-level unique constraint
  prevents the same property being saved twice by the same user.
- **Testimonials** — site-wide reviews of the platform experience, subject to
  administrator approval before publication. These are not tied to a specific booking
  or property.

### Accounts and access control
- Registration and login issue a signed JSON Web Token.
- Two roles: `Admin` and `User`.
- Endpoints are protected by role-based authorization; the identity of the acting user is
  read from the token, never from the request body.

## 4. Target Users

### Property owners (role: `User`)
Individuals and small landlords in Jordan who own one or a few rental properties. They
need somewhere to publish a listing, receive reservation requests, and confirm that
payment has arrived. They are not property-management professionals and will not tolerate
a complex workflow.

### Renters (role: `User`)
Students, young professionals and families searching for accommodation, whether for a
short stay or a year-long lease. They need to filter by neighbourhood and specification,
see what is genuinely available, and reserve without a phone call.

**A single account can do both.** Ownership is determined by an `OwnerId` foreign key on
the property record, not by a separate role — so any registered user may both list and
book. This mirrors the real market, where the same person is often a landlord in one
transaction and a tenant in another.

### Administrators (role: `Admin`)
Platform operators who activate and deactivate owner subscriptions, approve or reject
testimonials, and oversee the user base. Administrators do not participate in bookings.

## 5. Scope Boundaries

The following are **deliberately out of scope** and are documented as decisions rather
than gaps:

- **No payment gateway.** Payment confirmation is manual. Integrating a real provider
  requires a merchant account and compliance work outside the scope of this project.
- **No security deposit or insurance.** These are settled directly between owner and
  renter outside the platform.
- **No refresh tokens.** Access tokens are short-lived and users re-authenticate on
  expiry. This keeps the auth flow stateless and simple.
- **No messaging system.** Owner and renter contact details are exchanged through the
  platform; conversation happens off-platform.
