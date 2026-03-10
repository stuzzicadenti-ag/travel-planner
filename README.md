# TravelPlanner

Curated travel itinerary platform with day-by-day timelines, affiliate booking links, tier-based access, community reviews, and last-minute deals. Revenue from subscription tiers and affiliate commissions from booking partners (Skyscanner, Booking.com, GetYourGuide, RentalCars).

## Quick Start

```bash
cd app
npm install
# Set environment variables (see below)
npm run migrate
npm run seed
npm start
```

### Environment Variables

| Variable      | Description                 | Default |
|--------------|-----------------------------|---------|
| PORT         | Server port                  | 4002    |
| DATABASE_URL | PostgreSQL connection string | (set in .env) |
| JWT_SECRET   | JWT signing secret           | change-me |
| COOKIE_SECRET| Cookie signing secret        | change-me |

## Documentation

See [DOCS.md](DOCS.md) for full technical documentation, architecture, database schema, API routes, legal compliance, and deployment details.

## Features

- **Day-by-day itineraries**: Curated travel plans with timelines and activities
- **Tier-based access**: Free (day 1 only), Explorer (EUR 4.90/mo), Premium (EUR 12.90/mo)
- **Affiliate booking links**: Skyscanner, Booking.com, GetYourGuide, RentalCars
- **Click tracking**: Affiliate revenue attribution per partner
- **Community reviews**: 1-5 star ratings with comments
- **Saved trips**: Favorites list (max 3 for free users, unlimited for paid)
- **Last-minute deals**: Discounted trips with countdown timers
- **Newsletter subscription**: Email capture for marketing
- **Mood/season/country filtering**: Browse by travel style
- **Admin panel**: Itinerary CRUD, user management, flags, audit logs
- **i18n**: English, Italian, German, French with language dropdown
- **Responsive nav**: Profile dropdown, language dropdown, logged-in vs logged-out states

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Fastify 5
- **Template Engine**: EJS
- **Database**: PostgreSQL (Drizzle ORM + raw pg Pool)
- **Auth**: JWT cookies + bcryptjs (10 rounds)
- **ORM**: Drizzle ORM 0.38
- **i18n**: Flat JSON locale files (en, it, de, fr)
- **Theme**: Light blue (#3a9bd5 primary, #f5a623 accent)

## Security & Performance

- **CSRF protection**: Double Submit Cookie pattern on all state-changing forms
- **Compression**: @fastify/compress with gzip and Brotli support
- **OG meta tags**: Open Graph tags for rich social media previews
- **XSS fix**: Escaped unescaped user content in footer partial
- **Env validation**: Startup validation of required environment variables
- **Open redirect fix**: Redirect URLs validated against allow-list
- **Static file caching**: ETag and Last-Modified headers on static assets
- **Map pin coordinates**: Seed data includes lat/lng for interactive map markers
- **Validation tests**: 72 tests covering input validation, auth flows, and edge cases

## License

Proprietary -- Stuzzicadenti AG
