"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users, addresses } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import crypto from "crypto"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const firstName = formData.get("firstName") as string || ""
  const lastName = formData.get("lastName") as string || ""
  const name = `${firstName} ${lastName}`.trim()
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const birthday = formData.get("birthday") as string

  await db
    .update(users)
    .set({
      name,
      email,
      phone,
      birthday,
      updatedAt: new Date()
    })
    .where(eq(users.id, session.user.id))

  revalidatePath("/account/profile")
  return { success: true }
}

export async function addAddress(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const label = formData.get("label") as string
  const name = formData.get("name") as string
  const street = formData.get("street") as string
  const city = formData.get("city") as string
  const state = formData.get("state") as string
  const zip = formData.get("zip") as string
  const country = formData.get("country") as string
  const phone = formData.get("phone") as string
  const isDefault = formData.get("isDefault") === "true"

  if (isDefault) {
    // Unset current default
    await db
      .update(addresses)
      .set({ isDefault: "false" })
      .where(eq(addresses.userId, session.user.id))
  }

  await db.insert(addresses).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    label,
    name,
    street,
    city,
    state,
    zip,
    country,
    phone,
    isDefault: isDefault ? "true" : "false"
  })

  revalidatePath("/account/addresses")
  return { success: true }
}

export async function deleteAddress(addressId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await db
    .delete(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, session.user.id)))

  revalidatePath("/account/addresses")
  return { success: true }
}
