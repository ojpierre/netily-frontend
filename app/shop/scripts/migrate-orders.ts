import { neon } from "@neondatabase/serverless"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    // Create enum
    await sql`
      DO $$ BEGIN
        CREATE TYPE "order_status" AS ENUM('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `
    console.log("Enum created or exists")

    // Create orders table
    await sql`
      CREATE TABLE IF NOT EXISTS "orders" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "user_id" varchar(255) NOT NULL,
        "total_usd" text NOT NULL,
        "paystack_reference" varchar(255),
        "status" "order_status" DEFAULT 'PENDING' NOT NULL,
        "shipping_address" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `
    console.log("Orders table created or exists")

    // Create order_items table
    await sql`
      CREATE TABLE IF NOT EXISTS "order_items" (
        "id" varchar(255) PRIMARY KEY NOT NULL,
        "order_id" varchar(255) NOT NULL,
        "product_name" varchar(255) NOT NULL,
        "quantity" text NOT NULL,
        "price_usd" text NOT NULL
      );
    `
    console.log("Order_items table created or exists")

    // Add foreign keys if they don't exist
    await sql`
      DO $$ BEGIN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `
    await sql`
      DO $$ BEGIN
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
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
