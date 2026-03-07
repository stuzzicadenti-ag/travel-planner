import { pool } from "../db/index.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function newsletterRoutes(app) {
  // POST /newsletter/subscribe
  app.post("/subscribe", async (req, reply) => {
    const { email } = req.body || {};
    const referer = req.headers.referer || "/";

    if (!email || !EMAIL_RE.test(email) || email.length > 255) {
      return reply.redirect(referer + (referer.includes("?") ? "&" : "?") + "nl=invalid");
    }

    const cleanEmail = email.toLowerCase().trim();

    try {
      await pool.query(
        "INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING",
        [cleanEmail]
      );
    } catch {
      // duplicate or DB error, silently continue
    }

    return reply.redirect(referer + (referer.includes("?") ? "&" : "?") + "nl=success");
  });
}
