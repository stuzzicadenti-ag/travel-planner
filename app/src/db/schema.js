import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const planEnum = pgEnum("plan_type", ["free", "explorer", "premium"]);
export const tierEnum = pgEnum("tier_type", ["free", "explorer", "premium"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  plan: planEnum("plan").default("free").notNull(),
  role: varchar("role", { length: 20 }).default("user"),
  banned: boolean("banned").default(false),
  bannedReason: text("banned_reason"),
  bannedAt: timestamp("banned_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const itineraries = pgTable("itineraries", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  budgetAmount: numeric("budget_amount", { precision: 10, scale: 2 }).notNull(),
  budgetCurrency: varchar("budget_currency", { length: 3 }).default("EUR").notNull(),
  description: text("description"),
  tier: tierEnum("tier").default("free").notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).default("4.5"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const itineraryDays = pgTable("itinerary_days", {
  id: serial("id").primaryKey(),
  itineraryId: integer("itinerary_id")
    .references(() => itineraries.id, { onDelete: "cascade" })
    .notNull(),
  dayNumber: integer("day_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
});

export const itineraryItems = pgTable("itinerary_items", {
  id: serial("id").primaryKey(),
  dayId: integer("day_id")
    .references(() => itineraryDays.id, { onDelete: "cascade" })
    .notNull(),
  time: varchar("time", { length: 10 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  affiliateUrl: varchar("affiliate_url", { length: 500 }),
  partnerName: varchar("partner_name", { length: 100 }),
});

export const savedTrips = pgTable("saved_trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  itineraryId: integer("itinerary_id")
    .references(() => itineraries.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const affiliateClicks = pgTable("affiliate_clicks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  itemId: integer("item_id")
    .references(() => itineraryItems.id, { onDelete: "cascade" })
    .notNull(),
  partner: varchar("partner", { length: 100 }).notNull(),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
});
