import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    // Add columns to users table
    await sql`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS "phone" varchar(255),
      ADD COLUMN IF NOT EXISTS "birthday" varchar(255);
    `
    console.log("Updated users table")

    // Create addresses table
    await sql`
      CREATE TABLE IF NOT EXISTS "addresses" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "user_id" varchar(255) NOT NULL,
        "label" varchar(255) NOT NULL,
        "is_default" text DEFAULT 'false' NOT NULL,
        "name" varchar(255) NOT NULL,
        "street" text NOT NULL,
        "city" varchar(255) NOT NULL,
        "state" varchar(255) NOT NULL,
        "zip" varchar(255) NOT NULL,
        "country" varchar(255) NOT NULL,
        "phone" varchar(255),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `
    console.log("Addresses table created or exists")

    // Add foreign key
    await sql`
      DO $$ BEGIN
        ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `
    console.log("Foreign keys configured")

    console.log("Migration successful!")
  } catch (error) {
    console.error("Migration failed:", error)
  }
}

migrate()
