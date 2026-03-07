import { pool } from "./index.js";

/**
 * WeRoad-style migration: adds new columns to itineraries and creates
 * reviews, newsletter_subscribers, itinerary_photos, itinerary_tags tables.
 * All statements use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS for idempotency.
 */
export async function runWeRoadMigration() {
  const SQL = `
    -- New columns on itineraries
    ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS season VARCHAR(20);
    ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS mood VARCHAR(30);
    ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS group_size INTEGER;
    ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS age_range VARCHAR(20);
    ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS coordinator_name VARCHAR(255);
    ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS coordinator_bio TEXT;
    ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2);
    ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS discount INTEGER;
    ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS departure_date TIMESTAMP;
    ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS spots_left INTEGER;
    ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS cover_gradient VARCHAR(100);

    -- Reviews
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Newsletter subscribers
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      subscribed_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    -- Itinerary photos
    CREATE TABLE IF NOT EXISTS itinerary_photos (
      id SERIAL PRIMARY KEY,
      itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
      url VARCHAR(500) NOT NULL,
      caption VARCHAR(255),
      position INTEGER DEFAULT 0
    );

    -- Itinerary tags
    CREATE TABLE IF NOT EXISTS itinerary_tags (
      id SERIAL PRIMARY KEY,
      itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
      tag VARCHAR(50) NOT NULL
    );

    -- Indices
    CREATE INDEX IF NOT EXISTS idx_reviews_itinerary ON reviews(itinerary_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_itinerary ON reviews(user_id, itinerary_id);
    CREATE INDEX IF NOT EXISTS idx_itinerary_photos_itinerary ON itinerary_photos(itinerary_id);
    CREATE INDEX IF NOT EXISTS idx_itinerary_tags_itinerary ON itinerary_tags(itinerary_id);
    CREATE INDEX IF NOT EXISTS idx_itinerary_tags_tag ON itinerary_tags(tag);
    CREATE INDEX IF NOT EXISTS idx_itineraries_season ON itineraries(season);
    CREATE INDEX IF NOT EXISTS idx_itineraries_mood ON itineraries(mood);
    CREATE INDEX IF NOT EXISTS idx_itineraries_discount ON itineraries(discount);
    CREATE INDEX IF NOT EXISTS idx_itineraries_departure ON itineraries(departure_date);
    CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
  `;

  try {
    await pool.query(SQL);
    console.log("WeRoad migration completed successfully.");
  } catch (err) {
    console.error("WeRoad migration failed:", err.message);
    // Don't exit, allow server to continue - tables might already exist
  }
}
