import { pool } from "../db/index.js";

export async function mapRoutes(app) {
  // GET /map - Interactive map of all itinerary destinations
  app.get("/", async (req, reply) => {
    const { mood, season, country } = req.query;

    let where = [];
    let params = [];
    let paramIdx = 1;

    if (mood && ["adventure", "relaxation", "culture", "party", "wellness"].includes(mood)) {
      where.push(`mood = $${paramIdx++}`);
      params.push(mood);
    }
    if (season && ["summer", "winter", "spring", "autumn", "all"].includes(season)) {
      where.push(`season = $${paramIdx++}`);
      params.push(season);
    }
    if (country && String(country).length <= 3) {
      where.push(`country_code = $${paramIdx++}`);
      params.push(String(country).toUpperCase().trim());
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT id, title, destination, country_code, duration_days, budget_amount,
              budget_currency, rating, mood, season, cover_gradient, latitude, longitude,
              discount, original_price
       FROM itineraries
       ${whereClause}
       ORDER BY rating DESC NULLS LAST
       LIMIT 200`,
      params
    );

    // Fetch first photo for each itinerary (for popup)
    const itinIds = result.rows.map((r) => r.id);
    let photosMap = {};
    if (itinIds.length > 0) {
      const photosRes = await pool.query(
        `SELECT DISTINCT ON (itinerary_id) itinerary_id, url, caption
         FROM itinerary_photos WHERE itinerary_id = ANY($1)
         ORDER BY itinerary_id, position ASC`,
        [itinIds]
      );
      for (const p of photosRes.rows) {
        photosMap[p.itinerary_id] = p;
      }
    }

    return reply.view("map/index.ejs", {
      user: req.user,
      itineraries: result.rows,
      photosMap,
      filters: {
        mood: mood || "",
        season: season || "",
        country: country || "",
      },
    });
  });
}
