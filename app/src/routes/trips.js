import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { savedTrips, itineraries } from "../db/schema.js";

export async function tripRoutes(app) {
  // Auth guard
  app.addHook("onRequest", async (req, reply) => {
    if (!req.user) return reply.redirect("/auth/login");
  });

  // GET /trips - User's saved trips
  app.get("/", async (req, reply) => {
    const rows = await db
      .select({
        savedId: savedTrips.id,
        savedAt: savedTrips.createdAt,
        itineraryId: itineraries.id,
        title: itineraries.title,
        destination: itineraries.destination,
        countryCode: itineraries.countryCode,
        durationDays: itineraries.durationDays,
        budgetAmount: itineraries.budgetAmount,
        budgetCurrency: itineraries.budgetCurrency,
        tier: itineraries.tier,
        rating: itineraries.rating,
      })
      .from(savedTrips)
      .innerJoin(itineraries, eq(savedTrips.itineraryId, itineraries.id))
      .where(eq(savedTrips.userId, req.user.id))
      .orderBy(savedTrips.createdAt);

    return reply.view("trips/list.ejs", { user: req.user, trips: rows });
  });

  // POST /trips/unsave/:id - Remove saved trip
  app.post("/unsave/:id", async (req, reply) => {
    const savedId = parseInt(req.params.id, 10);
    if (isNaN(savedId)) return reply.code(404).send("Not found");

    await db
      .delete(savedTrips)
      .where(
        sql`${savedTrips.id} = ${savedId} AND ${savedTrips.userId} = ${req.user.id}`
      );

    return reply.redirect("/trips");
  });
}
