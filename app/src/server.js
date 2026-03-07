import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyFormbody from "@fastify/formbody";
import fastifyCookie from "@fastify/cookie";
import fastifyView from "@fastify/view";
import ejs from "ejs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, pool } from "./db/index.js";
import { authRoutes } from "./routes/auth.js";
import { itineraryRoutes } from "./routes/itineraries.js";
import { tripRoutes } from "./routes/trips.js";
import { adminRoutes } from "./routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({ logger: true, trustProxy: true, bodyLimit: 1048576 });

// Security headers
app.addHook('onSend', async (request, reply) => {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('X-XSS-Protection', '0');
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
});

// Rate limiting for auth routes (in-memory, per IP)
const authAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of authAttempts) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW) authAttempts.delete(key);
  }
}, 60 * 1000);

app.decorate('checkAuthRateLimit', (request, reply) => {
  const ip = request.ip;
  const now = Date.now();
  let entry = authAttempts.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    entry = { count: 0, windowStart: now };
    authAttempts.set(ip, entry);
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    reply.code(429).send('Too many attempts. Please try again later.');
    return false;
  }
  return true;
});

// Global error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  const statusCode = error.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred.'
    : error.message;
  reply.code(statusCode).send({ error: message });
});

// Plugins
await app.register(fastifyFormbody);
await app.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || "change-me",
});
await app.register(fastifyView, {
  engine: { ejs },
  root: path.join(__dirname, "views"),
  defaultContext: { user: null },
  production: process.env.NODE_ENV === "production",
});
await app.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
  maxAge: process.env.NODE_ENV === "production" ? 86400000 : 0,
});

// Decode JWT on every request (non-blocking) + banned check
import jwt from "jsonwebtoken";
app.decorateRequest("user", null);
app.addHook("onRequest", async (req, reply) => {
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

// Health check
app.get("/health", async () => ({ status: "ok", service: "travelplanner" }));

// Homepage
import { eq } from "drizzle-orm";
import { itineraries } from "./db/schema.js";

app.get("/", async (req, reply) => {
  const rows = await db.select().from(itineraries).orderBy(itineraries.rating).limit(6);
  return reply.view("index.ejs", { user: req.user, itineraries: rows });
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
