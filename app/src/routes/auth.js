import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const IS_PROD = process.env.NODE_ENV === "production";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOKIE_OPTS = {
  httpOnly: true,
  // secure: false is OK here - app runs behind Caddy reverse proxy which terminates
  // TLS. Caddy forwards requests over HTTP on the internal network (Tailscale).
  // The Strict-Transport-Security header ensures browsers always use HTTPS externally.
  // Set secure: true if the app ever handles TLS directly.
  secure: false,
  sameSite: "lax",
  path: "/",
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

export async function authRoutes(app) {
  // GET /auth/register
  app.get("/register", async (req, reply) => {
    if (req.user) return reply.redirect("/");
    return reply.view("auth/register.ejs", { user: null, error: null });
  });

  // POST /auth/register
  app.post("/register", async (req, reply) => {
    if (app.checkAuthRateLimit && !app.checkAuthRateLimit(req, reply)) return;
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return reply.view("auth/register.ejs", {
        user: null,
        error: "All fields are required.",
      });
    }

    if (!EMAIL_RE.test(email)) {
      return reply.view("auth/register.ejs", {
        user: null,
        error: "Invalid email format.",
      });
    }

    if (password.length < 8 || password.length > 1000) {
      return reply.view("auth/register.ejs", {
        user: null,
        error: "Password must be 8-1000 characters.",
      });
    }

    if (name.length > 255 || email.length > 255) {
      return reply.view("auth/register.ejs", {
        user: null,
        error: "Input too long.",
      });
    }

    // Check if email exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return reply.view("auth/register.ejs", {
        user: null,
        error: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await db
      .insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      })
      .returning();

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, name: newUser.name, plan: newUser.plan, role: newUser.role || "user" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    reply.setCookie("token", token, COOKIE_OPTS);
    return reply.redirect("/");
  });

  // GET /auth/login
  app.get("/login", async (req, reply) => {
    if (req.user) return reply.redirect("/");
    return reply.view("auth/login.ejs", { user: null, error: null });
  });

  // POST /auth/login
  app.post("/login", async (req, reply) => {
    if (app.checkAuthRateLimit && !app.checkAuthRateLimit(req, reply)) return;
    const { email, password } = req.body || {};

    if (!email || !password) {
      return reply.view("auth/login.ejs", {
        user: null,
        error: "Email and password are required.",
      });
    }

    const [found] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!found || !(await bcrypt.compare(password, found.passwordHash))) {
      return reply.view("auth/login.ejs", {
        user: null,
        error: "Invalid email or password.",
      });
    }

    // Check if user is banned
    if (found.banned) {
      return reply.view("auth/banned.ejs", {
        user: null,
        reason: found.bannedReason || null,
      });
    }

    const token = jwt.sign(
      { id: found.id, email: found.email, name: found.name, plan: found.plan, role: found.role || "user" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    reply.setCookie("token", token, COOKIE_OPTS);
    return reply.redirect("/");
  });

  // GET /auth/logout
  app.get("/logout", async (req, reply) => {
    reply.clearCookie("token", { path: "/" });
    return reply.redirect("/");
  });
}
