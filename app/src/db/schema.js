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
  // WeRoad-style fields
  season: varchar("season", { length: 20 }),
  mood: varchar("mood", { length: 30 }),
  groupSize: integer("group_size"),
  ageRange: varchar("age_range", { length: 20 }),
  coordinatorName: varchar("coordinator_name", { length: 255 }),
  coordinatorBio: text("coordinator_bio"),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  discount: integer("discount"),
  departureDate: timestamp("departure_date"),
  spotsLeft: integer("spots_left"),
  coverGradient: varchar("cover_gradient", { length: 100 }),
  latitude: numeric("latitude", { precision: 9, scale: 6 }),
  longitude: numeric("longitude", { precision: 9, scale: 6 }),
  difficulty: varchar("difficulty", { length: 20 }),
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

// WeRoad-style new tables
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  itineraryId: integer("itinerary_id")
    .references(() => itineraries.id, { onDelete: "cascade" })
    .notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
});

export const itineraryPhotos = pgTable("itinerary_photos", {
  id: serial("id").primaryKey(),
  itineraryId: integer("itinerary_id")
    .references(() => itineraries.id, { onDelete: "cascade" })
    .notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  caption: varchar("caption", { length: 255 }),
  position: integer("position").default(0),
});

export const itineraryTags = pgTable("itinerary_tags", {
  id: serial("id").primaryKey(),
  itineraryId: integer("itinerary_id")
    .references(() => itineraries.id, { onDelete: "cascade" })
    .notNull(),
  tag: varchar("tag", { length: 50 }).notNull(),
});

// Trip Journals / Trip Reports
export const tripJournals = pgTable("trip_journals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  itineraryId: integer("itinerary_id")
    .references(() => itineraries.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  tips: text("tips"),
  rating: integer("rating").notNull(),
  photoUrl: varchar("photo_url", { length: 500 }),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Journal likes (track who liked what)
export const journalLikes = pgTable("journal_likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  journalId: integer("journal_id")
    .references(() => tripJournals.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Itinerary cost estimates (admin-set base costs)
export const itineraryCosts = pgTable("itinerary_costs", {
  id: serial("id").primaryKey(),
  itineraryId: integer("itinerary_id")
    .references(() => itineraries.id, { onDelete: "cascade" })
    .notNull(),
  flightCost: numeric("flight_cost", { precision: 10, scale: 2 }).default("0"),
  budgetHotelPerNight: numeric("budget_hotel_per_night", { precision: 10, scale: 2 }).default("0"),
  midHotelPerNight: numeric("mid_hotel_per_night", { precision: 10, scale: 2 }).default("0"),
  luxuryHotelPerNight: numeric("luxury_hotel_per_night", { precision: 10, scale: 2 }).default("0"),
  activitiesCost: numeric("activities_cost", { precision: 10, scale: 2 }).default("0"),
  foodPerDay: numeric("food_per_day", { precision: 10, scale: 2 }).default("0"),
  transportPerDay: numeric("transport_per_day", { precision: 10, scale: 2 }).default("0"),
});
