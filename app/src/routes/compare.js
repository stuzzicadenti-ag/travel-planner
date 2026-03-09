import { pool } from "../db/index.js";

export async function compareRoutes(app) {
  // GET /compare?ids=1,2,3 - Side-by-side comparison of 2-3 itineraries
  app.get("/", async (req, reply) => {
    const idsParam = req.query.ids || "";
    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id) && id > 0)
      .slice(0, 3); // max 3

    let itineraries = [];
    let tagsMap = {};
    let ratingsMap = {};
    let activitiesMap = {};

    if (ids.length >= 2) {
      const result = await pool.query(
        `SELECT i.*, ic.flight_cost, ic.budget_hotel_per_night, ic.mid_hotel_per_night,
                ic.luxury_hotel_per_night, ic.activities_cost, ic.food_per_day, ic.transport_per_day
         FROM itineraries i
         LEFT JOIN itinerary_costs ic ON ic.itinerary_id = i.id
         WHERE i.id = ANY($1)`,
        [ids]
      );
      itineraries = result.rows;

      // Fetch tags
      if (ids.length > 0) {
        const tagsRes = await pool.query(
          `SELECT itinerary_id, tag FROM itinerary_tags WHERE itinerary_id = ANY($1)`,
          [ids]
        );
        for (const t of tagsRes.rows) {
          if (!tagsMap[t.itinerary_id]) tagsMap[t.itinerary_id] = [];
          tagsMap[t.itinerary_id].push(t.tag);
        }
      }

      // Fetch average ratings
      if (ids.length > 0) {
        const ratingsRes = await pool.query(
          `SELECT itinerary_id, AVG(rating)::numeric(2,1) AS avg_rating, COUNT(*)::int AS review_count
           FROM reviews WHERE itinerary_id = ANY($1) GROUP BY itinerary_id`,
          [ids]
        );
        for (const r of ratingsRes.rows) {
          ratingsMap[r.itinerary_id] = {
            avgRating: parseFloat(r.avg_rating),
            reviewCount: r.review_count,
          };
        }
      }

      // Fetch activities count per itinerary
      if (ids.length > 0) {
        const activitiesRes = await pool.query(
          `SELECT d.itinerary_id, COUNT(it.id)::int AS activity_count
           FROM itinerary_days d
           JOIN itinerary_items it ON it.day_id = d.id
           WHERE d.itinerary_id = ANY($1)
           GROUP BY d.itinerary_id`,
          [ids]
        );
        for (const a of activitiesRes.rows) {
          activitiesMap[a.itinerary_id] = a.activity_count;
        }
      }
    }

    return reply.view("compare/index.ejs", {
      user: req.user,
      itineraries,
      tagsMap,
      ratingsMap,
      activitiesMap,
      selectedIds: ids,
    });
  });
}
