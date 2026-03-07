import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://travelplanner_app:travelplanner_pass@localhost:5432/stz_travelplanner",
});

const SQL = `
-- Enums
DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('free', 'explorer', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE tier_type AS ENUM ('free', 'explorer', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  plan plan_type NOT NULL DEFAULT 'free',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Itineraries
CREATE TABLE IF NOT EXISTS itineraries (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  duration_days INTEGER NOT NULL,
  budget_amount NUMERIC(10,2) NOT NULL,
  budget_currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  description TEXT,
  tier tier_type NOT NULL DEFAULT 'free',
  rating NUMERIC(2,1) DEFAULT 4.5,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Itinerary days
CREATE TABLE IF NOT EXISTS itinerary_days (
  id SERIAL PRIMARY KEY,
  itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL
);

-- Itinerary items
CREATE TABLE IF NOT EXISTS itinerary_items (
  id SERIAL PRIMARY KEY,
  day_id INTEGER NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  time VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  affiliate_url VARCHAR(500),
  partner_name VARCHAR(100)
);

-- Saved trips
CREATE TABLE IF NOT EXISTS saved_trips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Affiliate clicks
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  item_id INTEGER NOT NULL REFERENCES itinerary_items(id) ON DELETE CASCADE,
  partner VARCHAR(100) NOT NULL,
  clicked_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_itinerary_days_itinerary ON itinerary_days(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day ON itinerary_items(day_id);
CREATE INDEX IF NOT EXISTS idx_saved_trips_user ON saved_trips(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_trips_itinerary ON saved_trips(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_saved_trips_unique ON saved_trips(user_id, itinerary_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user ON affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_item ON affiliate_clicks(item_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_tier ON itineraries(tier);
`;

async function migrate() {
  console.log("Running migrations...");
  const client = await pool.connect();
  try {
    await client.query(SQL);
    console.log("Migrations completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
