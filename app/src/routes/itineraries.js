import { eq, sql, and, gte, lte, desc, asc } from "drizzle-orm";
import { db, pool } from "../db/index.js";
import {
  itineraries,
  itineraryDays,
  itineraryItems,
  savedTrips,
  affiliateClicks,
  reviews,
  itineraryPhotos,
  itineraryTags,
} from "../db/schema.js";

const TIER_LEVELS = { free: 0, explorer: 1, premium: 2 };
const VALID_MOODS = ["adventure", "relaxation", "culture", "party", "wellness"];
const VALID_SEASONS = ["summer", "winter", "spring", "autumn", "all"];
const VALID_SORTS = ["rating", "price", "price_desc", "departure", "discount"];

export async function itineraryRoutes(app) {
  // GET /itineraries - List itineraries with optional filters
  app.get("/", async (req, reply) => {
    const { country, min_days, max_days, min_budget, max_budget, search, mood, season, tag, sort } = req.query;

    const conditions = [];

    if (country && String(country).length <= 3) {
      conditions.push(eq(itineraries.countryCode, String(country).toUpperCase().trim()));
    }
    if (min_days) {
      const minD = parseInt(min_days, 10);
      if (!isNaN(minD)) conditions.push(gte(itineraries.durationDays, minD));
    }
    if (max_days) {
      const maxD = parseInt(max_days, 10);
      if (!isNaN(maxD)) conditions.push(lte(itineraries.durationDays, maxD));
    }
    if (min_budget) {
      const minB = parseFloat(min_budget);
      if (!isNaN(minB)) conditions.push(gte(itineraries.budgetAmount, String(minB)));
    }
    if (max_budget) {
      const maxB = parseFloat(max_budget);
      if (!isNaN(maxB)) conditions.push(lte(itineraries.budgetAmount, String(maxB)));
    }
    if (search) {
      // Truncate search input to prevent abuse with very long strings
      const cleanSearch = String(search).substring(0, 200).trim();
      if (cleanSearch) {
        conditions.push(
          sql`(${itineraries.title} ILIKE ${'%' + cleanSearch + '%'} OR ${itineraries.destination} ILIKE ${'%' + cleanSearch + '%'})`
        );
      }
    }
    if (mood && VALID_MOODS.includes(mood)) {
      conditions.push(eq(itineraries.mood, mood));
    }
    if (season && VALID_SEASONS.includes(season)) {
      conditions.push(eq(itineraries.season, season));
    }

    let query = db.select().from(itineraries);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Sort
    if (sort === "rating") {
      query = query.orderBy(desc(itineraries.rating));
    } else if (sort === "price") {
      query = query.orderBy(asc(itineraries.budgetAmount));
    } else if (sort === "price_desc") {
      query = query.orderBy(desc(itineraries.budgetAmount));
    } else if (sort === "departure") {
      query = query.orderBy(asc(itineraries.departureDate));
    } else if (sort === "discount") {
      query = query.orderBy(desc(itineraries.discount));
    } else {
      query = query.orderBy(itineraries.createdAt);
    }

    let rows = await query.limit(50);

    // If tag filter, we need to filter by tag join
    if (tag && String(tag).trim() && String(tag).length <= 50) {
      const tagFilter = String(tag).trim();
      const taggedIds = await pool.query(
        "SELECT DISTINCT itinerary_id FROM itinerary_tags WHERE tag ILIKE $1",
        [tagFilter]
      );
      const ids = new Set(taggedIds.rows.map(r => r.itinerary_id));
      rows = rows.filter(r => ids.has(r.id));
    }

    // Fetch tags for displayed itineraries
    const itinIds = rows.map(r => r.id);
    let tagsMap = {};
    if (itinIds.length > 0) {
      const tagsRes = await pool.query(
        `SELECT itinerary_id, tag FROM itinerary_tags WHERE itinerary_id = ANY($1)`,
        [itinIds]
      );
      for (const t of tagsRes.rows) {
        if (!tagsMap[t.itinerary_id]) tagsMap[t.itinerary_id] = [];
        tagsMap[t.itinerary_id].push(t.tag);
      }
    }

    // Fetch avg ratings from reviews
    let ratingsMap = {};
    if (itinIds.length > 0) {
      const ratingsRes = await pool.query(
        `SELECT itinerary_id, AVG(rating)::numeric(2,1) AS avg_rating, COUNT(*)::int AS review_count
         FROM reviews WHERE itinerary_id = ANY($1) GROUP BY itinerary_id`,
        [itinIds]
      );
      for (const r of ratingsRes.rows) {
        ratingsMap[r.itinerary_id] = { avgRating: parseFloat(r.avg_rating), reviewCount: r.review_count };
      }
    }

    return reply.view("itineraries/list.ejs", {
      user: req.user,
      itineraries: rows,
      tagsMap,
      ratingsMap,
      filters: {
        country: country || '', min_days: min_days || '', max_days: max_days || '',
        min_budget: min_budget || '', max_budget: max_budget || '', search: search || '',
        mood: mood || '', season: season || '', tag: tag || '', sort: sort || '',
      },
    });
  });

  // GET /itineraries/:id - View itinerary detail
  app.get("/:id", async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.code(404).send("Not found");

    const [itin] = await db
      .select()
      .from(itineraries)
      .where(eq(itineraries.id, id))
      .limit(1);

    if (!itin) return reply.code(404).send("Itinerary not found");

    // Check tier access
    const userPlan = req.user?.plan || "free";
    const hasAccess = TIER_LEVELS[userPlan] >= TIER_LEVELS[itin.tier];

    // Get days with items (single query instead of N+1)
    const days = await db
      .select()
      .from(itineraryDays)
      .where(eq(itineraryDays.itineraryId, id))
      .orderBy(itineraryDays.dayNumber);

    const dayIds = days.map((d) => d.id);
    let allItems = [];
    if (dayIds.length > 0) {
      allItems = await db
        .select()
        .from(itineraryItems)
        .where(sql`${itineraryItems.dayId} IN (${sql.join(dayIds.map(id => sql`${id}`), sql`, `)})`)
        .orderBy(itineraryItems.time);
    }

    const itemsByDay = {};
    for (const item of allItems) {
      if (!itemsByDay[item.dayId]) itemsByDay[item.dayId] = [];
      itemsByDay[item.dayId].push(item);
    }

    const daysWithItems = days.map((day) => ({
      ...day,
      items: itemsByDay[day.id] || [],
    }));

    // Check if user has saved this trip
    let isSaved = false;
    if (req.user) {
      const [saved] = await db
        .select()
        .from(savedTrips)
        .where(
          sql`${savedTrips.userId} = ${req.user.id} AND ${savedTrips.itineraryId} = ${id}`
        )
        .limit(1);
      isSaved = !!saved;
    }

    // Fetch reviews
    const reviewsRes = await pool.query(
      `SELECT r.*, u.name AS user_name
       FROM reviews r JOIN users u ON u.id = r.user_id
       WHERE r.itinerary_id = $1 ORDER BY r.created_at DESC`,
      [id]
    );
    const itinReviews = reviewsRes.rows;

    // Average rating
    const avgRes = await pool.query(
      `SELECT AVG(rating)::numeric(2,1) AS avg_rating, COUNT(*)::int AS review_count FROM reviews WHERE itinerary_id = $1`,
      [id]
    );
    const avgRating = avgRes.rows[0]?.avg_rating ? parseFloat(avgRes.rows[0].avg_rating) : null;
    const reviewCount = avgRes.rows[0]?.review_count || 0;

    // Fetch photos
    const photosRes = await pool.query(
      `SELECT * FROM itinerary_photos WHERE itinerary_id = $1 ORDER BY position ASC`,
      [id]
    );

    // Fetch tags
    const tagsRes = await pool.query(
      `SELECT tag FROM itinerary_tags WHERE itinerary_id = $1`,
      [id]
    );

    // Related itineraries (same destination or mood, excluding current)
    const relatedRes = await pool.query(
      `SELECT id, title, destination, country_code, budget_amount, budget_currency,
              duration_days, rating, cover_gradient, discount, original_price, mood, season
       FROM itineraries
       WHERE id != $1 AND (destination = $2 OR mood = $3)
       ORDER BY rating DESC NULLS LAST
       LIMIT 3`,
      [id, itin.destination, itin.mood]
    );

    // Check if user already reviewed
    let userReviewed = false;
    if (req.user) {
      const revCheck = await pool.query(
        "SELECT id FROM reviews WHERE user_id = $1 AND itinerary_id = $2 LIMIT 1",
        [req.user.id, id]
      );
      userReviewed = revCheck.rows.length > 0;
    }

    return reply.view("itineraries/detail.ejs", {
      user: req.user,
      itinerary: itin,
      days: daysWithItems,
      hasAccess,
      isSaved,
      error: req.query.error || null,
      reviews: itinReviews,
      avgRating,
      reviewCount,
      photos: photosRes.rows,
      tags: tagsRes.rows.map(t => t.tag),
      related: relatedRes.rows,
      userReviewed,
      reviewError: req.query.reviewError || null,
    });
  });

  // POST /itineraries/:id/review - Submit a review
  app.post("/:id/review", async (req, reply) => {
    const itineraryId = parseInt(req.params.id, 10);
    if (isNaN(itineraryId)) return reply.code(404).send("Not found");

    if (!req.user) return reply.redirect("/auth/login");

    // Rate limit review submissions (5 per 15 min per IP)
    if (app.checkReviewRateLimit && !app.checkReviewRateLimit(req, reply)) return;

    const { rating, comment } = req.body || {};
    const ratingInt = parseInt(rating, 10);

    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return reply.redirect(`/itineraries/${itineraryId}?reviewError=invalid_rating`);
    }

    const cleanComment = comment ? String(comment).substring(0, 1000).trim() : null;

    // Check one per user per itinerary
    const existing = await pool.query(
      "SELECT id FROM reviews WHERE user_id = $1 AND itinerary_id = $2 LIMIT 1",
      [req.user.id, itineraryId]
    );
    if (existing.rows.length > 0) {
      return reply.redirect(`/itineraries/${itineraryId}?reviewError=already_reviewed`);
    }

    // Verify itinerary exists
    const itinCheck = await pool.query("SELECT id FROM itineraries WHERE id = $1", [itineraryId]);
    if (itinCheck.rows.length === 0) return reply.code(404).send("Not found");

    await pool.query(
      "INSERT INTO reviews (user_id, itinerary_id, rating, comment) VALUES ($1, $2, $3, $4)",
      [req.user.id, itineraryId, ratingInt, cleanComment]
    );

    return reply.redirect(`/itineraries/${itineraryId}`);
  });

  // POST /itineraries/:id/save - Save trip
  app.post("/:id/save", async (req, reply) => {
    if (!req.user) return reply.redirect("/auth/login");

    // Rate limit write operations (20 per 15 min per IP)
    if (app.checkWriteRateLimit && !app.checkWriteRateLimit(req, reply)) return;

    const itineraryId = parseInt(req.params.id, 10);
    if (isNaN(itineraryId)) return reply.code(404).send("Not found");

    // Free users max 3 saved trips
    if (req.user.plan === "free") {
      const saved = await db
        .select({ id: savedTrips.id })
        .from(savedTrips)
        .where(eq(savedTrips.userId, req.user.id))
        .limit(4);
      if (saved.length >= 3) {
        return reply.redirect(`/itineraries/${itineraryId}?error=limit`);
      }
    }

    // Check not already saved
    const [existing] = await db
      .select()
      .from(savedTrips)
      .where(
        sql`${savedTrips.userId} = ${req.user.id} AND ${savedTrips.itineraryId} = ${itineraryId}`
      )
      .limit(1);

    if (!existing) {
      await db.insert(savedTrips).values({
        userId: req.user.id,
        itineraryId,
      });
    }

    return reply.redirect(`/itineraries/${itineraryId}`);
  });

  // POST /itineraries/click/:itemId - Track affiliate click
  app.post("/click/:itemId", async (req, reply) => {
    const itemId = parseInt(req.params.itemId, 10);
    if (isNaN(itemId)) return reply.code(404).send("Not found");

    const [item] = await db
      .select()
      .from(itineraryItems)
      .where(eq(itineraryItems.id, itemId))
      .limit(1);

    if (!item || !item.affiliateUrl) return reply.code(404).send("Not found");

    // Log click
    await db.insert(affiliateClicks).values({
      userId: req.user?.id || null,
      itemId,
      partner: item.partnerName || "unknown",
    });

    return reply.redirect(item.affiliateUrl);
  });
}
