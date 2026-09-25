import { pgTable, text, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core"

export const roleEnum = pgEnum("role", ["USER", "ADMIN"])

export const users = pgTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  phone: varchar("phone", { length: 255 }),
  birthday: varchar("birthday", { length: 255 }),
  role: roleEnum("role").default("USER").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const addresses = pgTable("addresses", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  label: varchar("label", { length: 255 }).notNull(), // e.g., "Home", "Office"
  isDefault: text("is_default").default("false").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  street: text("street").notNull(),
  city: varchar("city", { length: 255 }).notNull(),
  state: varchar("state", { length: 255 }).notNull(),
  zip: varchar("zip", { length: 255 }).notNull(),
  country: varchar("country", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const orderStatusEnum = pgEnum("order_status", ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"])

export const orders = pgTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  totalUsd: text("total_usd").notNull(),
  paystackReference: varchar("paystack_reference", { length: 255 }),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const orderItems = pgTable("order_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  orderId: varchar("order_id", { length: 255 }).notNull().references(() => orders.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: text("quantity").notNull(), // Drizzle doesn't support integer types out of the box nicely sometimes without exact imports, text is safer for simple stringification or we can import integer
  priceUsd: text("price_usd").notNull(),
})
