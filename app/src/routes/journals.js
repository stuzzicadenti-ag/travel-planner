import { pool } from "../db/index.js";

export async function journalRoutes(app) {
  // GET /journals - List all trip journals
  app.get("/", async (req, reply) => {
    const result = await pool.query(`
      SELECT j.*, u.name AS user_name, i.title AS itinerary_title,
             i.destination, i.id AS itin_id, i.country_code
      FROM trip_journals j
      JOIN users u ON u.id = j.user_id
      JOIN itineraries i ON i.id = j.itinerary_id
      ORDER BY j.created_at DESC
      LIMIT 50
    `);

    // Check which journals the current user has liked
    let userLikes = new Set();
    if (req.user) {
      const likesRes = await pool.query(
        "SELECT journal_id FROM journal_likes WHERE user_id = $1",
        [req.user.id]
      );
      userLikes = new Set(likesRes.rows.map((r) => r.journal_id));
    }

    return reply.view("journals/index.ejs", {
      user: req.user,
      journals: result.rows,
      userLikes,
    });
  });

  // GET /journals/new - Form to create a new journal entry (auth required)
  app.get("/new", async (req, reply) => {
    if (!req.user) return reply.redirect("/auth/login");

    const itineraries = await pool.query(
      "SELECT id, title, destination FROM itineraries ORDER BY title ASC"
    );

    return reply.view("journals/new.ejs", {
      user: req.user,
      itineraries: itineraries.rows,
      error: req.query.error || null,
    });
  });

  // POST /journals/new - Create a journal entry
  app.post("/new", async (req, reply) => {
    if (!req.user) return reply.redirect("/auth/login");

    // Rate limit write operations
    if (app.checkWriteRateLimit && !app.checkWriteRateLimit(req, reply)) return;

    const { itinerary_id, title, body, tips, rating, photo_url } = req.body || {};

    const itineraryId = parseInt(itinerary_id, 10);
    if (isNaN(itineraryId)) {
      return reply.redirect("/journals/new?error=invalid_itinerary");
    }

    const ratingInt = parseInt(rating, 10);
    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return reply.redirect("/journals/new?error=invalid_rating");
    }

    const cleanTitle = String(title || "").substring(0, 255).trim();
    if (!cleanTitle) {
      return reply.redirect("/journals/new?error=missing_title");
    }

    const cleanBody = String(body || "").substring(0, 5000).trim();
    if (!cleanBody) {
      return reply.redirect("/journals/new?error=missing_body");
    }

    const cleanTips = tips ? String(tips).substring(0, 2000).trim() : null;
    const cleanPhotoUrl = photo_url ? String(photo_url).substring(0, 500).trim() : null;

    // Validate photo URL if provided
    if (cleanPhotoUrl && !cleanPhotoUrl.startsWith("https://")) {
      return reply.redirect("/journals/new?error=invalid_photo_url");
    }

    // Verify itinerary exists
    const itinCheck = await pool.query("SELECT id FROM itineraries WHERE id = $1", [itineraryId]);
    if (itinCheck.rows.length === 0) {
      return reply.redirect("/journals/new?error=invalid_itinerary");
    }

    await pool.query(
      `INSERT INTO trip_journals (user_id, itinerary_id, title, body, tips, rating, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [req.user.id, itineraryId, cleanTitle, cleanBody, cleanTips, ratingInt, cleanPhotoUrl]
    );

    return reply.redirect("/journals");
  });

  // POST /journals/:id/like - Like/unlike a journal
  app.post("/:id/like", async (req, reply) => {
    if (!req.user) return reply.redirect("/auth/login");

    if (app.checkWriteRateLimit && !app.checkWriteRateLimit(req, reply)) return;

    const journalId = parseInt(req.params.id, 10);
    if (isNaN(journalId)) return reply.code(404).send("Not found");

    // Check if already liked
    const existing = await pool.query(
      "SELECT id FROM journal_likes WHERE user_id = $1 AND journal_id = $2",
      [req.user.id, journalId]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await pool.query("DELETE FROM journal_likes WHERE user_id = $1 AND journal_id = $2", [
        req.user.id,
        journalId,
      ]);
      await pool.query("UPDATE trip_journals SET likes = GREATEST(likes - 1, 0) WHERE id = $1", [
        journalId,
      ]);
    } else {
      // Like
      await pool.query("INSERT INTO journal_likes (user_id, journal_id) VALUES ($1, $2)", [
        req.user.id,
        journalId,
      ]);
      await pool.query("UPDATE trip_journals SET likes = likes + 1 WHERE id = $1", [journalId]);
    }

    // Redirect back to journals page
    // Prevent open redirect: only use path from referer
    let redirect = "/journals";
    try {
      const raw = req.headers.referer;
      if (raw) {
        const url = new URL(raw);
        redirect = url.pathname + url.search;
      }
    } catch { /* ignore malformed referer */ }
    return reply.redirect(redirect);
  });

  // GET /journals/itinerary/:id - Journals for a specific itinerary
  app.get("/itinerary/:id", async (req, reply) => {
    const itineraryId = parseInt(req.params.id, 10);
    if (isNaN(itineraryId)) return reply.code(404).send("Not found");

    const result = await pool.query(
      `SELECT j.*, u.name AS user_name, i.title AS itinerary_title,
              i.destination, i.id AS itin_id, i.country_code
       FROM trip_journals j
       JOIN users u ON u.id = j.user_id
       JOIN itineraries i ON i.id = j.itinerary_id
       WHERE j.itinerary_id = $1
       ORDER BY j.created_at DESC
       LIMIT 50`,
      [itineraryId]
    );

    let userLikes = new Set();
    if (req.user) {
      const likesRes = await pool.query(
        "SELECT journal_id FROM journal_likes WHERE user_id = $1",
        [req.user.id]
      );
      userLikes = new Set(likesRes.rows.map((r) => r.journal_id));
    }

    return reply.view("journals/index.ejs", {
      user: req.user,
      journals: result.rows,
      userLikes,
    });
  });
}
