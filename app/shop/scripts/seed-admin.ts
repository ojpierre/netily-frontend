import { db } from "../lib/db"
import { users } from "../lib/db/schema"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

async function seedAdmin() {
  const email = "admin@andalusia.com"
  const password = "Creative@2028"

  const existingAdmin = await db.select().from(users).where(eq(users.email, email))

  if (existingAdmin.length > 0) {
    console.log("Admin user already exists")
    process.exit(0)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await db.insert(users).values({
    id: crypto.randomUUID(),
    name: "Admin User",
    email,
    password: hashedPassword,
    role: "ADMIN",
  })

  console.log("Admin user created successfully")
  process.exit(0)
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin:", err)
  process.exit(1)
})
