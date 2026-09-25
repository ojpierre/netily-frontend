import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { migrate } from "drizzle-orm/neon-http/migrator"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

async function main() {
  console.log("Running migrations via HTTP driver...")
  try {
    await migrate(db, { migrationsFolder: "./drizzle" })
    console.log("Migrations applied successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
  }
  process.exit(0)
}

main()
