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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({ logger: true });

// Plugins
await app.register(fastifyFormbody);
await app.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET || "change-me",
});
await app.register(fastifyView, {
  engine: { ejs },
  root: path.join(__dirname, "views"),
  defaultContext: { user: null },
});
await app.register(fastifyStatic, {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
});

// Decode JWT on every request (non-blocking)
import jwt from "jsonwebtoken";
app.decorateRequest("user", null);
app.addHook("onRequest", async (req) => {
  const token = req.cookies?.token;
  if (!token) return;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "change-me");
    req.user = decoded;
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

// Routes
await app.register(authRoutes, { prefix: "/auth" });
await app.register(itineraryRoutes, { prefix: "/itineraries" });
await app.register(tripRoutes, { prefix: "/trips" });

// Start
const PORT = parseInt(process.env.PORT || "4002", 10);
try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`TravelPlanner running on http://0.0.0.0:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
