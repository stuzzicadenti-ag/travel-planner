import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://travelplanner_app:travelplanner_pass@localhost:5432/stz_travelplanner",
});

export const db = drizzle(pool, { schema });
