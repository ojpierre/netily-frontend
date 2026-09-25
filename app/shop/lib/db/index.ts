import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// Provide a dummy connection string for the Vercel build phase if the env var is missing
const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/postgres"
const sql = neon(connectionString)
export const db = drizzle(sql, { schema })
