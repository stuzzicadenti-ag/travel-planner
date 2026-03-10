import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyFormbody from "@fastify/formbody";
import fastifyCookie from "@fastify/cookie";
import fastifyView from "@fastify/view";
import fastifyCompress from "@fastify/compress";
import ejs from "ejs";
import path from "node:path";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { db, pool } from "./db/index.js";
import { runWeRoadMigration } from "./db/migrate-weroad.js";
import { authRoutes } from "./routes/auth.js";
import { itineraryRoutes } from "./routes/itineraries.js";
import { tripRoutes } from "./routes/trips.js";
import { adminRoutes } from "./routes/admin.js";
import { communityRoutes } from "./routes/community.js";
import { newsletterRoutes } from "./routes/newsletter.js";
import { profileRoutes } from "./routes/profile.js";
import { mapRoutes } from "./routes/map.js";
import { compareRoutes } from "./routes/compare.js";
import { journalRoutes } from "./routes/journals.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// i18n: load locale files
const SUPPORTED_LANGS = ["en", "it", "de", "fr"];
const locales = {};
for (const lang of SUPPORTED_LANGS) {
  const filePath = path.join(__dirname, "locales", `${lang}.json`);
  locales[lang] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Environment variable validation in production
const IS_PROD = process.env.NODE_ENV === "production";
if (IS_PROD) {
  const required = ["DATABASE_URL", "JWT_SECRET", "COOKIE_SECRET"];
  const missing = required.filter((k) => !process.env[k] || process.env[k] === "change-me");
  if (missing.length > 0) {
    console.error(`FATAL: Missing or insecure environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }
}

const app = Fastify({ logger: true, trustProxy: true, bodyLimit: 1048576 });

// Run WeRoad migration at startup
await runWeRoadMigration();

// Security headers
app.addHook('onSend', async (request, reply) => {
  reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '0');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: https:; font-src 'self'; connect-src 'self'");
  reply.removeHeader('X-Powered-By');
});

// Rate limiting (in-memory, per IP) - shared infrastructure for auth, reviews, and writes
function createRateLimiter(windowMs, maxRequests) {
  const attempts = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of attempts) {
      if (now - entry.windowStart > windowMs) attempts.delete(key);
    }
  }, 60 * 1000);

  return (request, reply) => {
    const ip = request.ip;
    const now = Date.now();
    let entry = attempts.get(ip);
    if (!entry || now - entry.windowStart > windowMs) {
      entry = { count: 0, windowStart: now };
      attempts.set(ip, entry);
    }
    entry.count++;
    if (entry.count > maxRequests) {
      reply.code(429).send('Too many attempts. Please try again later.');
      return false;
    }
    return true;
  };
}

// Auth: 10 attempts per 15 min
app.decorate('checkAuthRateLimit', createRateLimiter(15 * 60 * 1000, 10));
// Reviews: 5 submissions per 15 min
app.decorate('checkReviewRateLimit', createRateLimiter(15 * 60 * 1000, 5));
// Write operations (save trip, etc.): 20 per 15 min
app.decorate('checkWriteRateLimit', createRateLimiter(15 * 60 * 1000, 20));

// Global error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  const statusCode = error.statusCode || 500;
  const message = IS_PROD
    ? 'An unexpected error occurred.'
    : error.message;
  reply.code(statusCode).send({ error: message });
});

// Plugins
await app.register(fastifyCompress, { global: true });
await app.register(fastifyFormbody);
await app.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || "change-me",
});
await app.register(fastifyView, {
  engine: { ejs },
  root: path.join(__dirname, "views"),
  defaultContext: { user: null },
  production: IS_PROD,
});
await app.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
  maxAge: IS_PROD ? 86400000 : 0,
  etag: true,
  lastModified: true,
});

// CSRF Protection (Double Submit Cookie pattern)
// Must be after @fastify/cookie registration so req.cookies is available
app.decorateRequest('csrfToken', '');
app.addHook('onRequest', async (req, reply) => {
  // Set CSRF cookie if not present
  if (!req.cookies?._csrf) {
    const token = randomBytes(32).toString('hex');
    reply.setCookie('_csrf', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: false,
    });
    req.csrfToken = token;
  } else {
    req.csrfToken = req.cookies._csrf;
  }
});

app.addHook('preHandler', async (req, reply) => {
  // Only validate on state-changing methods
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return;
  // Skip API routes and health check
  if (req.url.startsWith('/api/') || req.url === '/health') return;
  const cookieToken = req.cookies?._csrf;
  const bodyToken = req.body?._csrf;
  if (!cookieToken || !bodyToken || cookieToken !== bodyToken) {
    return reply.code(403).send('Forbidden: invalid CSRF token');
  }
});

// i18n: inject translate helper + wrap reply.view on every request
import jwt from "jsonwebtoken";
app.decorateRequest("user", null);
app.addHook("onRequest", async (req, reply) => {
  // i18n setup (must run before any reply.view call)
  const cookieLang = req.cookies?.lang;
  const lang = SUPPORTED_LANGS.includes(cookieLang) ? cookieLang : "en";
  const strings = locales[lang];
  const fallback = locales["en"];
  const t = (key) => strings[key] || fallback[key] || key;
  req.lang = lang;
  req.t = t;
  const csrfToken = req.csrfToken || '';
  const originalView = reply.view.bind(reply);
  reply.view = (template, data = {}) => {
    return originalView(template, { t, lang, csrfToken, ...data });
  };

  // Decode JWT (non-blocking) + banned check
  const token = req.cookies?.token;
  if (!token) return;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "change-me");
    req.user = decoded;

    // Check if user is banned (skip for auth and static routes)
    if (decoded && !req.url.startsWith("/auth") && !req.url.startsWith("/public") && !req.url.startsWith("/faq")) {
      const { rows } = await pool.query("SELECT banned, banned_reason FROM users WHERE id = $1", [decoded.id]);
      if (rows.length > 0 && rows[0].banned) {
        reply.clearCookie("token", { path: "/" });
        return reply.view("auth/banned.ejs", { user: null, reason: rows[0].banned_reason });
      }
    }
  } catch {
    // invalid token, ignore
  }
});

// i18n: language switch route
app.get("/lang/:code", async (req, reply) => {
  const code = req.params.code;
  if (SUPPORTED_LANGS.includes(code)) {
    reply.setCookie("lang", code, { path: "/", maxAge: 365 * 24 * 60 * 60, sameSite: "lax" });
  }
  // Prevent open redirect: only allow relative paths from referer
  let redirect = "/";
  try {
    const raw = req.headers.referer;
    if (raw) {
      const url = new URL(raw);
      redirect = url.pathname + url.search;
    }
  } catch { /* ignore malformed referer, default to "/" */ }
  return reply.redirect(redirect);
});

// Health check
app.get("/health", async () => ({ status: "ok", service: "travelplanner" }));

// Homepage
import { eq, desc, sql } from "drizzle-orm";
import { itineraries } from "./db/schema.js";

app.get("/", async (req, reply) => {
  // Featured itineraries sorted by rating DESC
  const featured = await db.select().from(itineraries).orderBy(desc(itineraries.rating)).limit(6);

  // Last-minute deals: discount > 0, departure in future
  const dealsRes = await pool.query(`
    SELECT * FROM itineraries
    WHERE discount IS NOT NULL AND discount > 0
      AND (departure_date IS NULL OR departure_date > NOW())
    ORDER BY discount DESC, departure_date ASC NULLS LAST
    LIMIT 4
  `);

  // Recent reviews for homepage
  const reviewsRes = await pool.query(`
    SELECT r.rating, r.comment, r.created_at, u.name AS user_name,
           i.title AS itinerary_title, i.id AS itinerary_id
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    JOIN itineraries i ON i.id = r.itinerary_id
    ORDER BY r.created_at DESC
    LIMIT 3
  `);

  return reply.view("index.ejs", {
    user: req.user,
    itineraries: featured,
    deals: dealsRes.rows,
    recentReviews: reviewsRes.rows,
  });
});

// FAQ page
app.get("/faq", async (req, reply) => {
  return reply.view("faq.ejs", { user: req.user });
});

// Routes
await app.register(authRoutes, { prefix: "/auth" });
await app.register(itineraryRoutes, { prefix: "/itineraries" });
await app.register(tripRoutes, { prefix: "/trips" });
await app.register(adminRoutes, { prefix: "/admin" });
await app.register(communityRoutes, { prefix: "/community" });
await app.register(newsletterRoutes, { prefix: "/newsletter" });
await app.register(profileRoutes, { prefix: "/profile" });
await app.register(mapRoutes, { prefix: "/map" });
await app.register(compareRoutes, { prefix: "/compare" });
await app.register(journalRoutes, { prefix: "/journals" });

// Graceful shutdown
const shutdown = async () => {
  await app.close();
  await pool.end();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start
const PORT = parseInt(process.env.PORT || "4002", 10);
try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`TravelPlanner running on http://0.0.0.0:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
