import { pool } from "../db/index.js";

export async function communityRoutes(app) {
  // GET /community - Community hub
  app.get("/", async (req, reply) => {
    const [recentReviews, topRated] = await Promise.all([
      pool.query(`
        SELECT r.*, u.name AS user_name, i.title AS itinerary_title, i.destination, i.id AS itin_id
        FROM reviews r
        JOIN users u ON u.id = r.user_id
        JOIN itineraries i ON i.id = r.itinerary_id
        ORDER BY r.created_at DESC
        LIMIT 20
      `),
      pool.query(`
        SELECT i.id, i.title, i.destination, i.country_code, i.budget_amount, i.budget_currency,
               i.duration_days, i.cover_gradient, i.discount, i.original_price,
               COALESCE(AVG(r.rating), i.rating::numeric) AS avg_rating,
               COUNT(r.id)::int AS review_count
        FROM itineraries i
        LEFT JOIN reviews r ON r.itinerary_id = i.id
        GROUP BY i.id
        ORDER BY avg_rating DESC, review_count DESC
        LIMIT 6
      `),
    ]);

    return reply.view("community/index.ejs", {
      user: req.user,
      reviews: recentReviews.rows,
      topRated: topRated.rows,
    });
  });

  // GET /community/reviews - All reviews feed
  app.get("/reviews", async (req, reply) => {
    const result = await pool.query(`
      SELECT r.*, u.name AS user_name, i.title AS itinerary_title, i.destination, i.id AS itin_id
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN itineraries i ON i.id = r.itinerary_id
      ORDER BY r.created_at DESC
      LIMIT 50
    `);

    return reply.view("community/index.ejs", {
      user: req.user,
      reviews: result.rows,
      topRated: [],
    });
  });
}
