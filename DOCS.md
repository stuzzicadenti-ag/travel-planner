# TravelPlanner -- Technical Documentation

## Overview

TravelPlanner is a curated travel itinerary platform inspired by WeRoad. It offers day-by-day travel itineraries with affiliate booking links, tier-based access (free/explorer/premium), community reviews, a newsletter, and last-minute deals with discounts. Revenue comes from subscription tiers and affiliate commissions from booking partners (Skyscanner, Booking.com, GetYourGuide, RentalCars).

**Target market:** European travelers looking for curated, ready-made trip itineraries with easy booking.
**Value proposition:** Professionally curated itineraries with day-by-day timelines, one-click affiliate booking, community-driven ratings, and group travel concepts.

## Architecture

```
Client (Browser)
    |
    v
Caddy (reverse proxy, port 80, .local domain)
    |
    v
Fastify (port 4002)
    |
    +---> PostgreSQL (stz_travelplanner) via Drizzle ORM + raw pg Pool
```

### Request flow

1. Client sends HTTP request to Caddy reverse proxy
2. Caddy forwards to Fastify on port 4002
3. Middleware chain: cookie parse -> JWT verify -> banned check -> route handler
4. Route handler uses Drizzle ORM for typed queries or raw pg Pool for complex joins
5. EJS template rendered server-side and returned to client

### Directory structure

```
travel-planner/
  app/
    src/
      server.js              # Fastify app, plugins, homepage, WeRoad migration
      db/
        index.js             # Drizzle instance + pg Pool export
        schema.js            # Drizzle ORM table definitions (9 tables + 2 enums)
        migrate.js           # Schema migration runner
        migrate-weroad.js    # WeRoad-style data migration
        seed.js              # Seed data (itineraries, days, items)
      routes/
        auth.js              # Register, login, logout
        itineraries.js       # Browse, detail, review, save, affiliate click
        trips.js             # Saved trips list, unsave
        admin.js             # Dashboard, users, itineraries, flags, logs
        community.js         # Community hub, reviews feed
        newsletter.js        # Newsletter subscription
      utils/
        moderation.js        # Content scanner (profanity, phone, email, URL)
      views/                 # EJS templates
      public/                # Static assets
    package.json
```

## Tech Stack

| Component        | Technology                                    |
|-----------------|----------------------------------------------|
| Runtime         | Node.js (ESM)                                 |
| Framework       | Fastify 5                                      |
| Template Engine | EJS via @fastify/view                          |
| Database        | PostgreSQL (Drizzle ORM + raw pg Pool)         |
| Auth            | JWT (jsonwebtoken) in httpOnly cookies          |
| Password Hash   | bcryptjs (10 rounds)                            |
| ORM             | Drizzle ORM 0.38                                |
| Static Files    | @fastify/static                                 |

### Dependencies

- `fastify` ^5.2.0
- `@fastify/static` ^8.1.0
- `@fastify/formbody` ^8.0.2
- `@fastify/cookie` ^11.0.2
- `@fastify/view` ^10.0.2
- `ejs` ^3.1.10
- `pg` ^8.13.1
- `drizzle-orm` ^0.38.4
- `bcryptjs` ^2.4.3
- `jsonwebtoken` ^9.0.2

## Database Schema

### Enums

- `plan_type`: free, explorer, premium
- `tier_type`: free, explorer, premium

### Tables

#### users
| Column       | Type          | Constraints                |
|-------------|---------------|----------------------------|
| id          | SERIAL        | PRIMARY KEY                 |
| email       | VARCHAR(255)  | NOT NULL, UNIQUE            |
| passwordHash| VARCHAR(255)  | NOT NULL                    |
| name        | VARCHAR(255)  | NOT NULL                    |
| plan        | plan_type     | DEFAULT 'free', NOT NULL    |
| role        | VARCHAR(20)   | DEFAULT 'user'              |
| banned      | BOOLEAN       | DEFAULT false               |
| bannedReason| TEXT          |                             |
| bannedAt    | TIMESTAMP     |                             |
| createdAt   | TIMESTAMP     | DEFAULT NOW(), NOT NULL     |

#### itineraries
| Column          | Type           | Constraints               |
|----------------|----------------|---------------------------|
| id             | SERIAL         | PRIMARY KEY                |
| title          | VARCHAR(255)   | NOT NULL                   |
| destination    | VARCHAR(255)   | NOT NULL                   |
| countryCode    | VARCHAR(2)     | NOT NULL                   |
| durationDays   | INTEGER        | NOT NULL                   |
| budgetAmount   | NUMERIC(10,2)  | NOT NULL                   |
| budgetCurrency | VARCHAR(3)     | DEFAULT 'EUR', NOT NULL    |
| description    | TEXT           |                            |
| tier           | tier_type      | DEFAULT 'free', NOT NULL   |
| rating         | NUMERIC(2,1)   | DEFAULT 4.5                |
| season         | VARCHAR(20)    |                            |
| mood           | VARCHAR(30)    |                            |
| groupSize      | INTEGER        |                            |
| ageRange       | VARCHAR(20)    |                            |
| coordinatorName| VARCHAR(255)   |                            |
| coordinatorBio | TEXT           |                            |
| originalPrice  | NUMERIC(10,2)  |                            |
| discount       | INTEGER        |                            |
| departureDate  | TIMESTAMP      |                            |
| spotsLeft      | INTEGER        |                            |
| coverGradient  | VARCHAR(100)   |                            |
| createdAt      | TIMESTAMP      | DEFAULT NOW(), NOT NULL    |

#### itinerary_days
| Column       | Type         | Constraints                          |
|-------------|--------------|--------------------------------------|
| id          | SERIAL       | PRIMARY KEY                           |
| itineraryId | INTEGER      | NOT NULL, FK -> itineraries(id) CASCADE|
| dayNumber   | INTEGER      | NOT NULL                              |
| title       | VARCHAR(255) | NOT NULL                              |

#### itinerary_items
| Column       | Type         | Constraints                               |
|-------------|--------------|-------------------------------------------|
| id          | SERIAL       | PRIMARY KEY                                |
| dayId       | INTEGER      | NOT NULL, FK -> itinerary_days(id) CASCADE |
| time        | VARCHAR(10)  | NOT NULL                                   |
| title       | VARCHAR(255) | NOT NULL                                   |
| description | TEXT         |                                            |
| affiliateUrl| VARCHAR(500) |                                            |
| partnerName | VARCHAR(100) |                                            |

#### saved_trips
| Column       | Type      | Constraints                          |
|-------------|-----------|--------------------------------------|
| id          | SERIAL    | PRIMARY KEY                           |
| userId      | INTEGER   | NOT NULL, FK -> users(id) CASCADE     |
| itineraryId | INTEGER   | NOT NULL, FK -> itineraries(id) CASCADE|
| createdAt   | TIMESTAMP | DEFAULT NOW(), NOT NULL               |

#### affiliate_clicks
| Column    | Type         | Constraints                                |
|----------|--------------|-------------------------------------------|
| id       | SERIAL       | PRIMARY KEY                                |
| userId   | INTEGER      | FK -> users(id) SET NULL                   |
| itemId   | INTEGER      | NOT NULL, FK -> itinerary_items(id) CASCADE|
| partner  | VARCHAR(100) | NOT NULL                                   |
| clickedAt| TIMESTAMP    | DEFAULT NOW(), NOT NULL                    |

#### reviews
| Column       | Type      | Constraints                          |
|-------------|-----------|--------------------------------------|
| id          | SERIAL    | PRIMARY KEY                           |
| userId      | INTEGER   | NOT NULL, FK -> users(id) CASCADE     |
| itineraryId | INTEGER   | NOT NULL, FK -> itineraries(id) CASCADE|
| rating      | INTEGER   | NOT NULL (1-5)                        |
| comment     | TEXT      |                                       |
| createdAt   | TIMESTAMP | DEFAULT NOW(), NOT NULL               |

#### newsletter_subscribers
| Column       | Type         | Constraints          |
|-------------|--------------|----------------------|
| id          | SERIAL       | PRIMARY KEY           |
| email       | VARCHAR(255) | NOT NULL, UNIQUE      |
| subscribedAt| TIMESTAMP    | DEFAULT NOW(), NOT NULL|

#### itinerary_photos
| Column       | Type         | Constraints                          |
|-------------|--------------|--------------------------------------|
| id          | SERIAL       | PRIMARY KEY                           |
| itineraryId | INTEGER      | NOT NULL, FK -> itineraries(id) CASCADE|
| url         | VARCHAR(500) | NOT NULL                              |
| caption     | VARCHAR(255) |                                       |
| position    | INTEGER      | DEFAULT 0                             |

#### itinerary_tags
| Column       | Type         | Constraints                          |
|-------------|--------------|--------------------------------------|
| id          | SERIAL       | PRIMARY KEY                           |
| itineraryId | INTEGER      | NOT NULL, FK -> itineraries(id) CASCADE|
| tag         | VARCHAR(50)  | NOT NULL                              |

#### flags (admin migration)
| Column      | Type         | Constraints          |
|------------|--------------|----------------------|
| id         | SERIAL       | PRIMARY KEY           |
| type       | VARCHAR(50)  | NOT NULL              |
| itinerary_id| INTEGER     |                       |
| user_id    | INTEGER      |                       |
| details    | TEXT         |                       |
| status     | VARCHAR(20)  | DEFAULT 'pending'     |
| reviewed_by| INTEGER      |                       |
| reviewed_at| TIMESTAMP    |                       |
| created_at | TIMESTAMP    | DEFAULT NOW()         |

#### admin_log (admin migration)
| Column      | Type         | Constraints          |
|------------|--------------|----------------------|
| id         | SERIAL       | PRIMARY KEY           |
| admin_id   | INTEGER      | NOT NULL              |
| action     | VARCHAR(100) | NOT NULL              |
| target_type| VARCHAR(50)  |                       |
| target_id  | INTEGER      |                       |
| details    | TEXT         |                       |
| created_at | TIMESTAMP    | DEFAULT NOW()         |

### ER Diagram

```
  +----------+       +--------------+       +----------------+
  |  users   |       | itineraries  |<------| itinerary_days |
  +----------+       +--------------+  1:N  +----------------+
  | id (PK)  |       | id (PK)      |       | id (PK)        |
  | email    |       | title        |       | itineraryId    |
  | name     |       | destination  |       | dayNumber      |
  | plan     |       | tier         |       | title          |
  | role     |       | rating       |       +-------+--------+
  +----+-----+       | mood/season  |               |
       |             | discount     |               v
       |             +------+-------+       +-----------------+
       |                    |               | itinerary_items  |
       |              +-----+-----+         +-----------------+
       |              |     |     |         | dayId           |
       |              v     v     v         | time/title      |
       |         +------+ +----+ +------+   | affiliateUrl    |
       |         |photos| |tags| |flags |   | partnerName     |
       |         +------+ +----+ +------+   +--------+--------+
       |                                             |
       +------+------+------+                        v
       |      |      |      |               +-----------------+
       v      v      v      v               | affiliate_clicks|
  +-------+ +------+ +----------+ +------+  +-----------------+
  |reviews| |saved | |newsletter| |admin |  | userId          |
  |       | |trips | |subscribers| | log |  | itemId          |
  +-------+ +------+ +----------+ +------+  | partner         |
  | rating| |userId|                         +-----------------+
  |comment| |itinId|
  +-------+ +------+
```

## API Routes

### Auth (`/auth`)
| Method | Path           | Auth | Description                          |
|--------|---------------|------|--------------------------------------|
| GET    | /auth/register | No   | Registration form                     |
| POST   | /auth/register | No   | Register (rate limited)               |
| GET    | /auth/login    | No   | Login form                            |
| POST   | /auth/login    | No   | Login (rate limited)                  |
| GET    | /auth/logout   | No   | Clear cookie and redirect             |

### Itineraries (`/itineraries`)
| Method | Path                         | Auth | Description                              |
|--------|------------------------------|------|------------------------------------------|
| GET    | /itineraries                 | No   | Browse with filters (country, days, budget, mood, season, tag, sort) |
| GET    | /itineraries/:id             | No   | Detail view (days, items, reviews, photos, tags, related) |
| POST   | /itineraries/:id/review      | Yes  | Submit review (1-5 rating, comment)       |
| POST   | /itineraries/:id/save        | Yes  | Save trip (free users: max 3)             |
| POST   | /itineraries/click/:itemId   | No   | Track affiliate click and redirect        |

### Trips (`/trips`)
| Method | Path               | Auth | Description                    |
|--------|--------------------|------|--------------------------------|
| GET    | /trips             | Yes  | User's saved trips              |
| POST   | /trips/unsave/:id  | Yes  | Remove saved trip               |

### Community (`/community`)
| Method | Path                | Auth | Description                    |
|--------|---------------------|------|--------------------------------|
| GET    | /community          | No   | Community hub (recent reviews, top rated) |
| GET    | /community/reviews  | No   | All reviews feed (50 most recent) |

### Newsletter (`/newsletter`)
| Method | Path                    | Auth | Description                    |
|--------|------------------------|------|--------------------------------|
| POST   | /newsletter/subscribe  | No   | Subscribe to newsletter         |

### Admin (`/admin`)
| Method | Path                            | Auth  | Description                        |
|--------|--------------------------------|-------|------------------------------------|
| GET    | /admin                          | Admin | Dashboard (users, itineraries, trips, clicks, flags) |
| GET    | /admin/users                    | Admin | User list (search, filter by role/ban) |
| POST   | /admin/users/:id/role           | Admin | Change role                         |
| POST   | /admin/users/:id/ban            | Admin | Ban user                            |
| POST   | /admin/users/:id/unban          | Admin | Unban user                          |
| GET    | /admin/itineraries              | Admin | All itineraries with flag count     |
| POST   | /admin/itineraries/:id/remove   | Admin | Delete itinerary                    |
| GET    | /admin/flags                    | Admin | Flag queue                          |
| POST   | /admin/flags/:id/dismiss        | Admin | Dismiss flag                        |
| POST   | /admin/flags/:id/action         | Admin | Remove content + ban user           |
| GET    | /admin/logs                     | Admin | Activity log (200 most recent)      |

### Other
| Method | Path    | Auth | Description                    |
|--------|---------|------|--------------------------------|
| GET    | /       | No   | Homepage (featured, deals, reviews) |
| GET    | /faq    | No   | FAQ page                        |
| GET    | /health | No   | Health check endpoint           |

## Authentication & Authorization

### Auth flow
1. User registers with name, email, password
2. Password hashed with bcryptjs (10 rounds)
3. JWT signed with `JWT_SECRET`, contains: `id`, `email`, `name`, `plan`, `role`
4. JWT stored in httpOnly cookie, 7-day expiry
5. Every request: JWT verified -> DB banned check -> `request.user` populated
6. Banned users redirected to banned page with reason

### Tier-based access control
- `free`: Can view free-tier itineraries, save up to 3 trips
- `explorer`: Access to explorer-tier itineraries, unlimited saves
- `premium`: Access to all itineraries, unlimited saves
- Tier check: `TIER_LEVELS[userPlan] >= TIER_LEVELS[itineraryTier]`

### Role hierarchy
- **owner** > **admin** > **user**
- Only owners can assign owner role
- Admin email `admin@stuzzicadenti.ch` auto-promoted to owner on migration

### Rate limiting
- In-memory per-IP: 10 attempts per 15-minute window on auth endpoints

## Security Measures

### Password hashing
- bcryptjs with 10 salt rounds

### Security headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Content moderation (`utils/moderation.js`)
- Profanity filter (EN, 16 words)
- Phone number detection (>= 7 digits)
- Email address detection
- URL detection
- Applied to user-generated content (reviews, comments)

### SQL injection prevention
- Drizzle ORM parameterized queries for standard operations
- Raw pg Pool queries use `$1`, `$2` placeholders
- Integer IDs parsed with `parseInt()` before use

### Input validation
- Email regex + max 255 chars
- Password: 8-1000 chars
- Name: max 255 chars
- Review comment: max 1,000 chars, trimmed
- Review rating: integer 1-5 validated
- One review per user per itinerary enforced

### Cookie security
- `httpOnly: true`
- `sameSite: lax`
- `secure: false` (behind Caddy/Tailscale)
- 7-day max age

### Error handling
- Global error handler suppresses details in production
- Per-route try/catch with graceful fallbacks

## Admin System

### Dashboard metrics
- Total registered users
- Total itineraries
- Total saved trips
- Total affiliate clicks
- Pending flags count

### User management
- Search by name, email
- Filter by role and ban status
- Role changes (user/admin/owner)
- Ban with reason, unban

### Itinerary management
- All itineraries with flag count
- Remove itinerary (CASCADE deletes days, items, photos, tags, reviews)

### Flag queue
- Pending flags prioritized at top
- Dismiss or action (remove content + ban user)

### Activity logging
- All admin actions logged to `admin_log`
- Includes: role changes, bans, unbans, itinerary removals, flag actions

## Swiss Legal Compliance

### Package Travel Regulations

While TravelPlanner provides curated itineraries, it operates as an **information and affiliate platform**, not a tour operator. It does not sell or organize travel packages directly.

- The platform provides itineraries as informational content
- Actual bookings happen via affiliate partner websites (Skyscanner, Booking.com, GetYourGuide, RentalCars)
- The platform does not assume liability for third-party bookings
- Clear disclosure that itineraries are suggestions, not binding travel packages

If TravelPlanner evolves to sell packages directly, compliance with the Swiss Federal Act on Package Travel (Pauschalreisegesetz, PRG, SR 944.3) will be required.

### Affiliate Disclosure

- Affiliate links clearly marked with partner name on each itinerary item
- Clicks tracked in `affiliate_clicks` table for transparency
- Revenue from affiliate commissions disclosed in terms of service

### Subscription Services (OR)

Swiss Code of Obligations (Obligationenrecht, OR, SR 220):

- **Clear pricing**: Three tiers (Free EUR 0, Explorer EUR 4.99/mo, Premium EUR 9.99/mo) clearly displayed
- **Cancellation**: Users can downgrade or cancel at any time
- **Auto-renewal transparency**: Terms clearly state subscription renewal terms
- **Contract terms**: Art. 1-10 OR governs subscription agreements

### Newsletter Compliance (FMG)

Swiss Federal Act on Telecommunications (Fernmeldegesetz, FMG, SR 784.10) and Swiss Unfair Competition Act (UWG, Art. 3 para. 1 lit. o):

- **Opt-in only**: Newsletter subscription requires explicit user action (form submission)
- **No pre-checked boxes**: User must actively enter email and submit
- **Email validation**: Regex validation before subscription
- **Duplicate handling**: `ON CONFLICT DO NOTHING` for existing emails
- **Unsubscribe**: Must be available in every newsletter (implementation pending)

### Data Protection (DSG/FADP)

Swiss Federal Act on Data Protection (Datenschutzgesetz, DSG, SR 235.1):

- **Data minimization**: Only name and email required for registration
- **Password security**: bcrypt hashed
- **Affiliate tracking**: Click tracking uses optional userId (null for anonymous)
- **Newsletter**: Email stored only, with unique constraint
- **Right to deletion**: Users can request complete data deletion
- **No profiling**: No behavioral tracking beyond affiliate clicks

### Consumer Protection for Reviews

- One review per user per itinerary (prevents manipulation)
- Rating validated as integer 1-5
- Comments trimmed and length-limited (1,000 chars)
- Admin can remove inappropriate reviews via flag system

## Business Model

### Revenue streams
1. **Subscription tiers**:
   - Free: EUR 0/mo (limited access, max 3 saved trips)
   - Explorer: EUR 4.99/mo (explorer-tier itineraries, unlimited saves)
   - Premium: EUR 9.99/mo (all itineraries, unlimited saves)
2. **Affiliate commissions**: Revenue from booking partner clicks (flights, hotels, activities, car rentals)
3. **Future**: Sponsored itineraries, group travel bookings

### Affiliate partners
- **Skyscanner**: Flights
- **Booking.com**: Hotels/accommodation
- **GetYourGuide**: Activities/tours
- **RentalCars**: Car rental

### Last-minute deals
- Itineraries with `discount > 0` and future `departure_date`
- Displayed prominently on homepage
- Shows original price with discount percentage

## Deployment

### Docker container
- Runs via Docker on Mac Mini (Portainer)
- Caddy reverse proxy maps `.local` domain to port 4002
- Tailscale network for team access

### Environment variables
| Variable      | Description                    | Default                                              |
|--------------|--------------------------------|------------------------------------------------------|
| PORT         | Server port                     | 4002                                                  |
| DATABASE_URL | PostgreSQL connection string    | (set in .env)                                         |
| JWT_SECRET   | JWT signing secret              | change-me                                             |
| COOKIE_SECRET| Cookie signing secret           | change-me                                             |
| NODE_ENV     | Environment                     | (not set)                                             |

### Health check
- `GET /health` returns `{ status: 'ok', service: 'travelplanner' }`

### Graceful shutdown
- Handles SIGTERM and SIGINT
- Closes Fastify server, then PostgreSQL pool

## User Flows

### Browse -> Save -> Book via Affiliate

```
  Homepage
  (featured itineraries, last-minute deals, recent reviews)
      |
      v
  Browse itineraries (filters: country, days, budget, mood, season, tag)
      |
      v
  View itinerary detail
      |
      +---> Tier check: FREE / EXPLORER / PREMIUM
      |     (upgrade prompt if insufficient tier)
      |
      +---> Day-by-day timeline with activities
      |     Each activity may have affiliate link
      |
      +---> Click affiliate link
      |     (tracked in affiliate_clicks)
      |     -> Redirected to partner site (Skyscanner, Booking.com, etc.)
      |
      +---> Save trip (max 3 for free users)
      |
      +---> Leave review (1-5 stars + comment)
      |
      v
  My Trips (/trips)
  (saved itineraries, unsave option)
```

### Newsletter Subscription

```
  User enters email on homepage/any page
      |
      v
  POST /newsletter/subscribe
      |
      +---> Email validation (regex)
      |
      +---> INSERT with ON CONFLICT DO NOTHING
      |
      v
  Redirect with ?nl=success
```

## Monitoring & Logging

### Activity logs
- `admin_log` table records all admin actions
- 200 most recent entries displayed in admin panel
- Logged: role changes, bans, unbans, itinerary removals, flag actions

### Affiliate tracking
- `affiliate_clicks` table records every outbound click
- Tracks: userId (nullable), itemId, partner name, timestamp
- Dashboard shows total click count

### Error handling
- Global Fastify error handler (sanitized in production)
- WeRoad migration runs at startup with error handling
- Admin migrations run at startup (idempotent)

### Health check
- `GET /health` endpoint for monitoring
