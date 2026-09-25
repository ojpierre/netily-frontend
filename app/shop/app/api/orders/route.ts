import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { orders, orderItems } from "@/lib/db/schema"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { items, totalUsd, shippingAddress, paystackReference } = body

    if (!items || !items.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 })
    }

    const orderId = crypto.randomUUID()

    // Insert the order
    await db.insert(orders).values({
      id: orderId,
      userId: session.user.id,
      totalUsd,
      paystackReference,
      shippingAddress,
      status: "PROCESSING" // Payment is successful, so it's processing
    })

    // Insert all order items
    const orderItemsData = items.map((item: any) => ({
      id: crypto.randomUUID(),
      orderId,
      productName: item.name,
      quantity: String(item.quantity),
      priceUsd: String(item.price),
    }))

    await db.insert(orderItems).values(orderItemsData)

    return NextResponse.json({ success: true, orderId })
  } catch (error) {
    console.error("Failed to create order", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
