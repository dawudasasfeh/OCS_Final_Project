# Beytak — Property Rental Marketplace

Final project for **Orange Coding School**. A property rental marketplace for the
Jordanian market, built with ASP.NET Core, Entity Framework Core, SQL Server and React.

**Student:** Dawud Asasfeh

---

## Phase 1 deliverables

| # | Deliverable | Document |
|---|---|---|
| 1 | Project Overview | [docs/01-project-overview.md](docs/01-project-overview.md) |
| 2 | Functional Requirements | [docs/02-functional-requirements.md](docs/02-functional-requirements.md) |
| 3 | Non-Functional Requirements | [docs/03-non-functional-requirements.md](docs/03-non-functional-requirements.md) |
| 4 | Database Design, Schema, Keys and ERD | [docs/04-database-design.md](docs/04-database-design.md) |

---

## Technology

| Layer | Technology |
|---|---|
| Backend | ASP.NET Core Web API (.NET 10), controller-based |
| Database | SQL Server Express, Entity Framework Core, **Code First with migrations** |
| Authentication | ASP.NET Identity for user and role management, custom JWT bearer tokens |
| Frontend | React 19 with Vite, React Router, Axios |
| Architecture | Clean Architecture — Domain, Application, Infrastructure, API |

---

## Solution structure

```
OCS_Final_Project/
├── docs/                                  Phase 1 documentation
├── RentalMarketplaceBackend/
│   ├── RentalMarketplace.Domain/          Entities and enums — no EF Core
│   │   ├── Entities/                      7 entities
│   │   └── Enums/                         6 enums
│   ├── RentalMarketplaceBackend.Application/
│   │   ├── DTOs/                          Data transfer objects
│   │   ├── Interfaces/
│   │   │   ├── Repositories/              IGenericRepository, IUnitOfWork, 5 specific
│   │   │   └── Services/                  IAuthService, ITokenService
│   │   ├── Services/                      AuthService
│   │   └── DependencyInjection.cs         AddApplication()
│   ├── RentalMarketplaceBackend.Infrastructure/
│   │   ├── Persistence/                   AppDbContext, DbSeeder
│   │   ├── Repositories/                  Generic + 5 implementations, UnitOfWork
│   │   ├── Migrations/                    3 EF Core migrations
│   │   ├── Services/                      TokenService (JWT signing)
│   │   └── DependencyInjection.cs         AddInfrastructure()
│   └── RentalMarketplaceBackend.API/
│       ├── Controllers/                   AuthController
│       ├── Program.cs                     DI, JWT validation, CORS, seeding
│       └── appsettings.json               Connection string, JWT settings
└── RentalMarketplaceFrontend/             React client
    └── src/
        ├── api/                           Axios instance with JWT interceptor
        ├── context/                       AuthContext
        ├── components/                    ProtectedRoute
        └── pages/                         Home, Login, Register
```

### Dependency direction

```
API ──────────────► Application ◄────── Domain
 │                       ▲
 └──► Infrastructure ────┘
```

Dependencies point inward only. Domain references no other project. The Application layer
contains **no Entity Framework reference of any kind** — it depends on the repository
abstractions, and Infrastructure supplies the implementations.

---

## Running the project

### Prerequisites

- .NET 10 SDK
- SQL Server Express
- Node.js 20+

### Backend

```bash
cd RentalMarketplaceBackend

# Update the connection string in RentalMarketplaceBackend.API/appsettings.json
# to point at your SQL Server instance, then:

dotnet ef database update \
  --project RentalMarketplaceBackend.Infrastructure \
  --startup-project RentalMarketplaceBackend.API

dotnet run --project RentalMarketplaceBackend.API
```

Runs on `https://localhost:7137`. The OpenAPI document is served at
`/openapi/v1.json` in development.

On first launch `DbSeeder` creates the `Admin` and `User` roles and a default
administrator account:

```
admin@beytak.com / Admin123!
```

*(A hardcoded seed account is a deliberate convenience for evaluation. Production would
source these from user-secrets or environment variables.)*

### Frontend

```bash
cd RentalMarketplaceFrontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. The backend CORS policy permits exactly this origin.

---

## Implemented in Phase 1

- **Domain model** — 7 entities, 6 enums, no persistence dependency
- **Database** — 13 tables live in SQL Server, built Code First across 3 migrations,
  with delete-behaviour rules, a unique constraint and query indexes
- **Data access** — generic repository, 5 entity repositories, unit of work for
  transactional consistency
- **Authentication** — registration, login, password hashing, JWT issuance with role
  and subscription claims, token validation middleware, role seeding. Verified working
  end to end from the React client.

## Planned for Phase 2

- Service and controller layers for listings, bookings, payments and administration
- Complete front-end for both the User and Admin roles
- Server-side ownership and subscription enforcement
- Migration of secrets out of `appsettings.json`

A full requirement-by-requirement status breakdown is in
[docs/02-functional-requirements.md](docs/02-functional-requirements.md).

---

## Notable design decisions

| Decision | Reasoning |
|---|---|
| **Unified booking model** | One `Booking` with a start date, end date and duration type serves weekly through yearly rentals. Separate short-term and long-term subsystems would duplicate the conflict-detection logic. |
| **Unified `Payment` table** | Booking and subscription payments share amount, status, payer and confirmation columns. A nullable `BookingId` plus a purpose discriminator avoids duplicating all of them across two tables. |
| **Ownership by foreign key, not by role** | `House.OwnerId` determines ownership, so one account can both list and book — matching the real market, where the same person is often landlord in one transaction and tenant in another. |
| **`Restrict` on user-facing foreign keys** | SQL Server rejects multiple cascade paths, so a cycle had to be broken. Restricting the user side means deleting an account can never destroy another user's booking or payment records. |
| **Repository plus unit of work over EF Core** | Keeps the Application layer free of any EF dependency, and expresses the booking-conflict rule as a named, testable method rather than a raw predicate scattered through a service. |
| **No soft delete** | Domain status fields already carry the meaning — `IsAvailable`, `BookingStatus.Cancelled`, `PaymentStatus.Rejected`. A generic `IsDeleted` flag would add a second, less informative mechanism. |
| **`AddIdentityCore` rather than `AddIdentity`** | `AddIdentity` registers cookie authentication as the default scheme, which competes with JWT and makes `[Authorize]` redirect instead of returning 401. |
| **Price snapshot on bookings** | `Booking.TotalPrice` is fixed at creation, so editing a property's price never rewrites the value of existing reservations. |
| **Booking input is start + count + unit** | "6 months from 1 March" is how people describe a tenancy. The server derives the end date and the total, so a price can never be supplied by the client and a monthly rental can never span three days. |
| **End date stored exclusive, displayed inclusive** | Exclusive storage keeps the overlap comparison simple and falls out of `AddMonths`; the DTO subtracts a day so the user reads "to 31 August" rather than "to 1 September". |
| **Per-property turnover window** | Each property carries `TurnoverDays`, defaulting to 2, applied when checking availability rather than written into the stored end date — so the booking record still states what the renter agreed to, and a studio can require one day where a villa requires three. |
| **Reactive listing moderation** | Listings publish immediately and an administrator can remove one afterwards, rather than gating every new listing behind approval. Pre-approval would put an administrator in the critical path of every owner's first action. |
| **Subscription approval is one transaction** | Confirming the payment and activating the user's subscription are committed together through the unit of work, so a confirmed payment can never exist against a user who was never granted access. |
