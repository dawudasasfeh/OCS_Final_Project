# Beytak — Non-Functional Requirements

Requirements are identified as **NFR-x.y**. Where a requirement is already satisfied by
a concrete decision in the codebase, that decision is named.

---

## NFR-1 — Performance

| ID | Requirement | How it is addressed | Status |
|---|---|---|---|
| NFR-1.1 | Search queries shall be resolved by the database in a single round trip, never by loading rows and filtering in memory. | `HouseRepository.SearchAsync` composes an `IQueryable` and executes once at `ToListAsync()`, so all filters become one SQL `WHERE`. | ✅ |
| NFR-1.2 | The booking-overlap check shall be supported by a database index. | Composite index `IX_Bookings_HouseId_StartDate_EndDate`, with the equality column first and range columns after. | ✅ |
| NFR-1.3 | Listing search by city shall be supported by an index. | Index `IX_Houses_City`. | ✅ |
| NFR-1.4 | Read-only queries shall not incur change-tracking overhead. | `AsNoTracking()` on all list-returning repository methods. | ✅ |
| NFR-1.5 | Every foreign key shall be indexed to keep joins efficient. | Created automatically by EF Core for all nine foreign keys. | ✅ |
| NFR-1.6 | A page of search results shall render in under two seconds on a local network. | To be measured in Phase 2. | ⬜ |
| NFR-1.7 | Result sets shall be paginated once listing volume exceeds one screen. | Deferred; demo dataset is small. | ⬜ |

## NFR-2 — Security

| ID | Requirement | How it is addressed | Status |
|---|---|---|---|
| NFR-2.1 | Passwords shall never be stored or transmitted in reversible form. | ASP.NET Identity `UserManager` hashing; the application never handles a raw password beyond the login call. | ✅ |
| NFR-2.2 | Authentication shall be stateless, with no server-side session. | JWT bearer tokens; no cookie or session store. | ✅ |
| NFR-2.3 | Tokens shall be signed and their signature verified on every request. | HMAC-SHA256 with a 256-bit key; `ValidateIssuerSigningKey` enabled. | ✅ |
| NFR-2.4 | Tokens shall expire and be rejected after expiry. | `ValidateLifetime` enabled; configurable expiry, currently 120 minutes. | ✅ |
| NFR-2.5 | Token issuer and audience shall be validated to prevent tokens from other systems being accepted. | `ValidateIssuer` and `ValidateAudience` enabled. | ✅ |
| NFR-2.6 | Authentication failures shall not reveal whether an email address is registered. | Unknown email and wrong password return an identical message. | ✅ |
| NFR-2.7 | No sensitive field shall ever be serialised to a client. | Controllers return DTOs exclusively; entities never cross the API boundary, so `PasswordHash` and `SecurityStamp` cannot leak. | ✅ |
| NFR-2.8 | Authorization shall be enforced server-side; client-side role checks are presentation only. | `[Authorize(Roles = ...)]` on protected endpoints; the React route guard is cosmetic. | ⬜ |
| NFR-2.9 | Resource ownership shall be verified server-side before any mutation. | Owner id read from the token claim and compared to the record. | ⬜ |
| NFR-2.10 | Cross-origin access shall be restricted to the known front-end origin. | Named CORS policy limited to `http://localhost:5173`; to be narrowed to the deployed origin. | ✅ |
| NFR-2.11 | All traffic shall be served over HTTPS. | `UseHttpsRedirection` enabled. | ✅ |
| NFR-2.12 | Input shall be validated at the boundary before reaching business logic. | Data annotations on all input DTOs plus `[ApiController]` automatic model validation. | ✅ |
| NFR-2.13 | Secrets shall not be committed to source control. | **Known gap.** The JWT signing key and connection string are currently in `appsettings.json`. Migrating to user-secrets is a Phase 2 task. | ⬜ |

## NFR-3 — Usability

| ID | Requirement | How it is addressed | Status |
|---|---|---|---|
| NFR-3.1 | Validation errors shall identify the specific field at fault. | `[ApiController]` returns HTTP 400 with a field-keyed error dictionary. | ✅ |
| NFR-3.2 | Error messages shall be human-readable, not raw exception text. | Identity's own descriptions are surfaced, for example "Passwords must have at least one digit". | ✅ |
| NFR-3.3 | A user shall remain signed in across a page refresh. | Token persisted in `localStorage` and decoded during React state initialisation, before first render. | ✅ |
| NFR-3.4 | Enumerated values shall be presented as readable text, not numeric codes. | Enums serialised as their names in outbound DTOs. | 🟡 |
| NFR-3.5 | Optional listing fields shall not obstruct the primary creation flow. | Five of the six detail fields are nullable with no required validation. | ✅ |
| NFR-3.6 | Colour shall not be the only means of conveying booking or payment status. | Status text accompanies every status colour. | ⬜ |
| NFR-3.7 | The interface shall support the Jordanian market's conventions for locations and property attributes. | Neighbourhood, floor number, furnishing status and building age mirror local listing sites. | ✅ |

## NFR-4 — Scalability

| ID | Requirement | How it is addressed | Status |
|---|---|---|---|
| NFR-4.1 | Business logic shall be independent of the persistence technology so storage can be replaced without rewriting it. | Repository and unit-of-work abstractions; the Application layer has zero Entity Framework references. | ✅ |
| NFR-4.2 | The API shall be horizontally scalable with no server-side session affinity. | Stateless JWT authentication; any instance can serve any request. | ✅ |
| NFR-4.3 | Database access objects shall be scoped per request to prevent cross-request state leakage. | All repositories and the unit of work are registered `Scoped`, matching the `DbContext` lifetime. | ✅ |
| NFR-4.4 | Schema changes shall be versioned and repeatable across environments. | EF Core Code First migrations, currently three, applied via `dotnet ef database update`. | ✅ |
| NFR-4.5 | Adding a new entity shall not require modifying existing data-access code. | Generic repository parameterised over the entity type. | ✅ |
| NFR-4.6 | Text columns shall be bounded to keep rows compact and indexable. | Explicit `MaxLength` on every string column; no `nvarchar(max)` in the schema. | ✅ |

## NFR-5 — Responsiveness

| ID | Requirement | How it is addressed | Status |
|---|---|---|---|
| NFR-5.1 | The interface shall be usable on mobile, tablet and desktop viewports. | Responsive CSS with fluid layouts. | ⬜ |
| NFR-5.2 | Listing grids shall reflow by viewport width without horizontal scrolling. | CSS Grid with `auto-fit` and `minmax`. | ⬜ |
| NFR-5.3 | Interactive controls shall meet minimum touch-target sizing on mobile. | Minimum 44 by 44 pixels for buttons and links. | ⬜ |
| NFR-5.4 | The design shall be authored mobile-first, since most Jordanian property search happens on phones. | Base styles target mobile; media queries add desktop layout. | ⬜ |

## NFR-6 — Reliability

| ID | Requirement | How it is addressed | Status |
|---|---|---|---|
| NFR-6.1 | Multi-entity operations shall commit atomically or not at all. | All repositories share one `DbContext`; a single `SaveChangesAsync` on the unit of work wraps the operation in one transaction. | ✅ |
| NFR-6.2 | Deleting a user shall never destroy records belonging to other users. | `DeleteBehavior.Restrict` on the bookings, payments and wishlist foreign keys to `AspNetUsers`. | ✅ |
| NFR-6.3 | Historical financial figures shall be immutable with respect to later catalogue edits. | `Booking.TotalPrice` is snapshotted at creation and never recalculated. | ✅ |
| NFR-6.4 | Duplicate wishlist entries shall be impossible, enforced by the database rather than by application code alone. | Unique composite index on `WishlistItems (UserId, HouseId)`. | ✅ |
| NFR-6.5 | Monetary values shall not be subject to floating-point rounding error. | `decimal(18,2)` on `Houses.Price`, `Bookings.TotalPrice` and `Payments.Amount`. | ✅ |
| NFR-6.6 | The database schema shall reflect the code model exactly, with no manual drift. | Code First only; schema changes are made in entity classes and applied by migration. | ✅ |
| NFR-6.7 | Startup seeding shall be idempotent and safe to run on every launch. | `DbSeeder` checks for existence before creating roles or the administrator account. | ✅ |
| NFR-6.8 | Concurrent booking requests shall not be able to produce a double booking. | **Known limitation.** The overlap check and the insert are not currently atomic; under concurrency two simultaneous requests could both pass. Mitigation would be a serializable transaction. Accepted for this scope and documented rather than hidden. | ⬜ |

## NFR-7 — Maintainability

| ID | Requirement | How it is addressed | Status |
|---|---|---|---|
| NFR-7.1 | Dependencies shall point inward, so inner layers never reference outer ones. | Clean Architecture with four projects; Domain has no project references, Application references Domain only. | ✅ |
| NFR-7.2 | The Domain layer shall contain no persistence-technology dependency. | Domain references only `Microsoft.Extensions.Identity.Stores`, an abstractions package. No Entity Framework. | ✅ |
| NFR-7.3 | Business rules shall be expressed as named, testable operations rather than inline queries. | For example `HasOverlapAsync` rather than a raw predicate embedded in a service. | ✅ |
| NFR-7.4 | Each layer shall register its own services, so the composition root stays minimal. | `AddApplication()` and `AddInfrastructure()` extension methods; `Program.cs` calls each once. | ✅ |
| NFR-7.5 | Configuration shall live with the application host, not with the data-access code. | Connection string and JWT settings in the API project's `appsettings.json`, delivered to Infrastructure by dependency injection. | ✅ |
| NFR-7.6 | Version history shall record intent, not just file changes. | Incremental commits with descriptive subjects and bodies explaining the decision behind each change. | ✅ |
