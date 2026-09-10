# Beytak — presentation brief

Paste this into ChatGPT and ask for slides plus a spoken transcript.

---

## Title slide

**Beytak · بيتك**
### Find it. Book it. Move in.
*A rental marketplace built for Jordan*

The three beats map onto the demo, so the title doubles as the structure:

- **Find it** → search, filters, availability calendar
- **Book it** → request, owner confirms, contact unlocks
- **Move in** → payment recorded, booking completes

---

## What it is

Beytak (بيتك — "your home") is a property rental marketplace for Jordan.
Renters find homes by city, type and rental period; owners list properties and
confirm bookings directly. No agency, no commission.

**Stack:** ASP.NET Core (.NET 10) Web API · React 19 + Vite · SQL Server ·
EF Core code-first · Clean Architecture (Domain / Application / Infrastructure /
API), repository + unit of work, JWT auth.

## The problem

Renting in Jordan runs through Facebook groups and classified ads. Listings are
unstructured and incomparable, dates are agreed verbally and double-booked,
brokers take a month's rent, and prices shift after agreement.

## What it does

**Renters** — filter by city, type, period, bedrooms, price and furnishing; see
an availability calendar before choosing dates; request a booking; save
properties; record payments.

**Owners** — subscribe at 20 JOD/month, list properties, review and confirm
booking requests, confirm payments received.

**Admins** — moderate listings and testimonials, confirm subscription payments.

## Four things worth demonstrating

**1. Availability that cannot lie.**
`GET /houses/{id}/availability` returns the taken intervals — dates only, never
who booked or what they paid. The calendar and the booking check share one rule,
so the calendar can never offer a date the server would refuse. Turnover days
between tenants are sent separately, so occupancy and cleaning gaps are shaded
differently.

**2. Prices are snapshotted.**
A booking stores its total at creation. An owner changing the price later cannot
alter an agreed booking.

**3. Contact is earned.**
Guests see a masked number (079048XXXX); signed-in users see it in full.
WhatsApp opens with the listing and reference prefilled — the channel Jordanians
actually use.

**4. Real market data.**
20 listings with prices, areas and specs taken from live OpenSooq listings, each
carrying its source URL so any figure can be checked against the original.

## Numbers

38 endpoints across 7 controllers · 20 listings (8 apartments, 4 villas,
4 houses, 4 studios) across 7 cities · 13 users · 20 bookings · 143 photos ·
45 input-validation checks passing.

## Business model

20 JOD per month, charged to owners only. Renters pay nothing and Beytak never
touches the rent — money moves directly between the two parties, and the
platform only records that it did.

## Honest limitations

No pagination (the API returns the full match set); no map; English only, no
Arabic/RTL yet; owners cannot yet edit or delete a listing; photos are licensed
stock rather than the actual properties.

---

## Suggested deck

6–8 slides: title · problem · solution · demo walkthrough · architecture ·
business model canvas · what's next.

The availability engine is the strongest material — it is the piece with real
logic behind it rather than CRUD, and the hook sets it up.

## Alternative hooks

| Hook | Leads with |
|---|---|
| Skip the broker, keep the rent. | the money |
| Rent direct. No broker fees. | the money |
| No brokers. No double bookings. | both problems at once |
| Dates that can't double-book. | the technical piece |

Avoid "Renting in Jordan, reimagined" — already used as a heading on the About
page, so it reads as repetition.
