import { eq, sql, and, gte, lte } from "drizzle-orm";
import { db, pool } from "../db/index.js";
import {
  itineraries,
  itineraryDays,
  itineraryItems,
  savedTrips,
  affiliateClicks,
} from "../db/schema.js";

const TIER_LEVELS = { free: 0, explorer: 1, premium: 2 };

export async function itineraryRoutes(app) {
  // GET /itineraries - List itineraries with optional filters
  app.get("/", async (req, reply) => {
    const { country, min_days, max_days, min_budget, max_budget, search } = req.query;

    const conditions = [];

    if (country) {
      conditions.push(eq(itineraries.countryCode, country.toUpperCase().trim()));
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
      conditions.push(
        sql`(${itineraries.title} ILIKE ${'%' + search + '%'} OR ${itineraries.destination} ILIKE ${'%' + search + '%'})`
      );
    }

    let query = db.select().from(itineraries);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    const rows = await query.orderBy(itineraries.createdAt).limit(50);

    return reply.view("itineraries/list.ejs", {
      user: req.user,
      itineraries: rows,
      filters: { country: country || '', min_days: min_days || '', max_days: max_days || '', min_budget: min_budget || '', max_budget: max_budget || '', search: search || '' },
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

    return reply.view("itineraries/detail.ejs", {
      user: req.user,
      itinerary: itin,
      days: daysWithItems,
      hasAccess,
      isSaved,
      error: req.query.error || null,
    });
  });

  // POST /itineraries/:id/save - Save trip
  app.post("/:id/save", async (req, reply) => {
    if (!req.user) return reply.redirect("/auth/login");

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
