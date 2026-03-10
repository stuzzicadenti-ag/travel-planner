import { pool } from "../db/index.js";

/**
 * Admin routes for TravelPlanner moderation panel.
 * Uses raw pg pool queries. Registered under /admin prefix.
 */
export async function adminRoutes(app) {
  // Auth + role guard for all admin routes
  app.addHook("onRequest", async (req, reply) => {
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "owner")) {
      return reply.code(403).send("Forbidden");
    }
  });

  // Helper: log admin action
  async function logAction(adminId, action, targetType, targetId, details) {
    await pool.query(
      `INSERT INTO admin_log (admin_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)`,
      [adminId, action, targetType, targetId, details || null]
    );
  }

  // GET /admin - Dashboard
  app.get("/", async (req, reply) => {
    const [usersRes, itinRes, tripsRes, clicksRes, flagsRes] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM users"),
      pool.query("SELECT COUNT(*)::int AS count FROM itineraries"),
      pool.query("SELECT COUNT(*)::int AS count FROM saved_trips"),
      pool.query("SELECT COUNT(*)::int AS count FROM affiliate_clicks"),
      pool.query("SELECT COUNT(*)::int AS count FROM flags WHERE status = 'pending'"),
    ]);

    return reply.view("admin/dashboard.ejs", {
      user: req.user,
      stats: {
        users: usersRes.rows[0].count,
        itineraries: itinRes.rows[0].count,
        savedTrips: tripsRes.rows[0].count,
        affiliateClicks: clicksRes.rows[0].count,
        pendingFlags: flagsRes.rows[0].count,
      },
    });
  });

  // GET /admin/users - User list
  app.get("/users", async (req, reply) => {
    const { search, role, banned } = req.query;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (role) {
      conditions.push(`role = $${idx}`);
      params.push(role);
      idx++;
    }
    if (banned === "true") {
      conditions.push("banned = true");
    } else if (banned === "false") {
      conditions.push("(banned = false OR banned IS NULL)");
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT id, email, name, plan, role, banned, banned_reason, banned_at, created_at FROM users ${where} ORDER BY created_at DESC LIMIT 100`,
      params
    );

    return reply.view("admin/users.ejs", {
      user: req.user,
      users: result.rows,
      filters: { search: search || "", role: role || "", banned: banned || "" },
    });
  });

  // POST /admin/users/:id/role - Change role
  app.post("/users/:id/role", async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.code(400).send("Invalid user ID");

    const { role } = req.body || {};
    const validRoles = ["user", "admin", "owner"];
    if (!validRoles.includes(role)) return reply.code(400).send("Invalid role");

    // Only owner can set owner role
    if (role === "owner" && req.user.role !== "owner") {
      return reply.code(403).send("Only owners can assign owner role");
    }

    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
    await logAction(req.user.id, "change_role", "user", id, `Set role to ${role}`);

    return reply.redirect("/admin/users");
  });

  // POST /admin/users/:id/ban - Ban user
  app.post("/users/:id/ban", async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.code(400).send("Invalid user ID");

    const { reason } = req.body || {};

    await pool.query(
      "UPDATE users SET banned = true, banned_reason = $1, banned_at = NOW() WHERE id = $2",
      [reason || "Violation of community guidelines", id]
    );
    await logAction(req.user.id, "ban_user", "user", id, reason || null);

    return reply.redirect("/admin/users");
  });

  // POST /admin/users/:id/unban - Unban user
  app.post("/users/:id/unban", async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.code(400).send("Invalid user ID");

    await pool.query(
      "UPDATE users SET banned = false, banned_reason = NULL, banned_at = NULL WHERE id = $1",
      [id]
    );
    await logAction(req.user.id, "unban_user", "user", id, null);

    return reply.redirect("/admin/users");
  });

  // GET /admin/itineraries - All itineraries with flag count
  app.get("/itineraries", async (req, reply) => {
    const result = await pool.query(`
      SELECT i.id, i.title, i.destination, i.country_code, i.duration_days,
             i.budget_amount, i.budget_currency, i.tier, i.rating, i.created_at,
             COALESCE(f.flag_count, 0)::int AS flag_count
      FROM itineraries i
      LEFT JOIN (
        SELECT itinerary_id, COUNT(*)::int AS flag_count
        FROM flags WHERE status = 'pending'
        GROUP BY itinerary_id
      ) f ON f.itinerary_id = i.id
      ORDER BY flag_count DESC, i.created_at DESC
      LIMIT 100
    `);

    return reply.view("admin/itineraries.ejs", {
      user: req.user,
      itineraries: result.rows,
    });
  });

  // POST /admin/itineraries/:id/remove - Remove itinerary
  app.post("/itineraries/:id/remove", async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.code(400).send("Invalid itinerary ID");

    await pool.query("DELETE FROM itineraries WHERE id = $1", [id]);
    await logAction(req.user.id, "remove_itinerary", "itinerary", id, null);

    return reply.redirect("/admin/itineraries");
  });

  // GET /admin/flags - Flag queue
  app.get("/flags", async (req, reply) => {
    const result = await pool.query(`
      SELECT f.*, u.name AS user_name, u.email AS user_email,
             i.title AS itinerary_title,
             r.name AS reviewer_name
      FROM flags f
      LEFT JOIN users u ON u.id = f.user_id
      LEFT JOIN itineraries i ON i.id = f.itinerary_id
      LEFT JOIN users r ON r.id = f.reviewed_by
      ORDER BY
        CASE WHEN f.status = 'pending' THEN 0 ELSE 1 END,
        f.created_at DESC
      LIMIT 100
    `);

    return reply.view("admin/flags.ejs", {
      user: req.user,
      flags: result.rows,
    });
  });

  // POST /admin/flags/:id/dismiss - Dismiss flag
  app.post("/flags/:id/dismiss", async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.code(400).send("Invalid flag ID");

    await pool.query(
      "UPDATE flags SET status = 'dismissed', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2",
      [req.user.id, id]
    );
    await logAction(req.user.id, "dismiss_flag", "flag", id, null);

    return reply.redirect("/admin/flags");
  });

  // POST /admin/flags/:id/action - Remove content + mark reviewed
  app.post("/flags/:id/action", async (req, reply) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return reply.code(400).send("Invalid flag ID");

    // Get the flag to find the target
    const flagRes = await pool.query("SELECT * FROM flags WHERE id = $1", [id]);
    if (flagRes.rows.length === 0) return reply.code(404).send("Flag not found");

    const flag = flagRes.rows[0];

    // Remove the flagged content if it's an itinerary
    if (flag.itinerary_id) {
      await pool.query("DELETE FROM itineraries WHERE id = $1", [flag.itinerary_id]);
      await logAction(req.user.id, "remove_itinerary", "itinerary", flag.itinerary_id, `Via flag #${id}`);
    }

    // Ban user if flagged
    if (flag.user_id) {
      await pool.query(
        "UPDATE users SET banned = true, banned_reason = $1, banned_at = NOW() WHERE id = $2",
        [`Content policy violation (flag #${id})`, flag.user_id]
      );
      await logAction(req.user.id, "ban_user", "user", flag.user_id, `Via flag #${id}`);
    }

    await pool.query(
      "UPDATE flags SET status = 'actioned', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2",
      [req.user.id, id]
    );
    await logAction(req.user.id, "action_flag", "flag", id, null);

    return reply.redirect("/admin/flags");
  });

  // GET /admin/logs - Activity log
  app.get("/logs", async (req, reply) => {
    const result = await pool.query(`
      SELECT l.*, u.name AS admin_name, u.email AS admin_email
      FROM admin_log l
      LEFT JOIN users u ON u.id = l.admin_id
      ORDER BY l.created_at DESC
      LIMIT 200
    `);

    return reply.view("admin/logs.ejs", {
      user: req.user,
      logs: result.rows,
    });
  });

  // Run migrations on startup
  await runAdminMigrations();
}

/**
 * Run admin-related DB migrations via raw SQL.
 */
async function runAdminMigrations() {
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_reason TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP;

    CREATE TABLE IF NOT EXISTS flags (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      itinerary_id INTEGER,
      user_id INTEGER,
      details TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      reviewed_by INTEGER,
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_log (
      id SERIAL PRIMARY KEY,
      admin_id INTEGER NOT NULL,
      action VARCHAR(100) NOT NULL,
      target_type VARCHAR(50),
      target_id INTEGER,
      details TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Set admin user as owner
  await pool.query(`UPDATE users SET role = 'owner' WHERE email = 'admin@stuzzicadenti.ch'`);
}
