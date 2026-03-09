import { eq, sql, desc } from "drizzle-orm";
import { db, pool } from "../db/index.js";
import { users, savedTrips, reviews, itineraries } from "../db/schema.js";

export async function profileRoutes(app) {
  // Auth guard
  app.addHook("onRequest", async (req, reply) => {
    if (!req.user) return reply.redirect("/auth/login");
  });

  // GET /profile — Dashboard
  app.get("/", async (req, reply) => {
    // Fetch full user record from DB (JWT only has subset)
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!dbUser) {
      reply.clearCookie("token", { path: "/" });
      return reply.redirect("/auth/login");
    }

    // Count saved trips
    const tripsCountRes = await pool.query(
      "SELECT COUNT(*)::int AS count FROM saved_trips WHERE user_id = $1",
      [req.user.id]
    );
    const savedTripsCount = tripsCountRes.rows[0]?.count || 0;

    // Count reviews written
    const reviewsCountRes = await pool.query(
      "SELECT COUNT(*)::int AS count FROM reviews WHERE user_id = $1",
      [req.user.id]
    );
    const reviewsCount = reviewsCountRes.rows[0]?.count || 0;

    // Saved trips with itinerary info
    const savedTripsRows = await db
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
      .orderBy(desc(savedTrips.createdAt));

    // Recent reviews (last 5)
    const recentReviewsRes = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              i.title AS itinerary_title, i.id AS itinerary_id
       FROM reviews r
       JOIN itineraries i ON i.id = r.itinerary_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    // Account age in days
    const createdAt = new Date(dbUser.createdAt);
    const now = new Date();
    const accountAgeDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    return reply.view("profile/dashboard.ejs", {
      user: req.user,
      dbUser,
      savedTripsCount,
      reviewsCount,
      accountAgeDays,
      savedTripsRows,
      recentReviews: recentReviewsRes.rows,
      success: req.query.success || null,
    });
  });

  // POST /profile/update — Update display name
  app.post("/update", async (req, reply) => {
    if (app.checkWriteRateLimit && !app.checkWriteRateLimit(req, reply)) return;

    const { name } = req.body || {};

    if (!name || name.trim().length === 0) {
      return reply.redirect("/profile?success=error");
    }

    if (name.trim().length > 255) {
      return reply.redirect("/profile?success=error");
    }

    await db
      .update(users)
      .set({ name: name.trim() })
      .where(eq(users.id, req.user.id));

    // Re-issue JWT with updated name
    const jwt = await import("jsonwebtoken");
    const JWT_SECRET = process.env.JWT_SECRET || "change-me";
    const token = jwt.default.sign(
      {
        id: req.user.id,
        email: req.user.email,
        name: name.trim(),
        plan: req.user.plan,
        role: req.user.role || "user",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    reply.setCookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return reply.redirect("/profile?success=updated");
  });
}
