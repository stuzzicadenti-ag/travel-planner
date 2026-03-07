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

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Fastify 5
- **Template Engine**: EJS
- **Database**: PostgreSQL (Drizzle ORM + raw pg Pool)
- **Auth**: JWT cookies + bcryptjs (10 rounds)
- **ORM**: Drizzle ORM 0.38

## License

Proprietary -- Stuzzicadenti AG
