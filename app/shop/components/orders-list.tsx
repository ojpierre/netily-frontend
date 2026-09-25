"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Package, Truck, CheckCircle2, Clock, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "DELIVERED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] tracking-widest uppercase border border-border bg-foreground text-background">
          <CheckCircle2 className="h-3 w-3" />
          Delivered
        </span>
      )
    case "DISPATCHED":
    case "SHIPPED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] tracking-widest uppercase border border-border bg-muted">
          <Truck className="h-3 w-3" />
          In Transit
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] tracking-widest uppercase border border-border bg-muted/60 text-muted-foreground">
          <Clock className="h-3 w-3" />
          Processing
        </span>
      )
  }
}

export function OrdersList({ orders }: { orders: any[] }) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(orders[0]?.id || null)

  function handleDownloadInvoice(orderNumber: string) {
    toast.success(`Generated Official Proforma Invoice for ${orderNumber}! Starting download...`)
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 bg-card border border-border p-8">
        <Package className="h-10 w-10 mx-auto text-muted-foreground mb-4 stroke-[1.5]" />
        <h3 className="font-serif text-xl mb-2">No Equipment Orders Yet</h3>
        <p className="text-xs text-muted-foreground mb-6 uppercase tracking-wider">
          Explore our ISP hardware catalog to purchase routers, switches, and cabling.
        </p>
        <Link href="/shop">
          <button className="bg-foreground text-background hover:bg-foreground/90 text-xs tracking-[0.2em] uppercase px-8 py-4">
            Browse Catalog
          </button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const isExpanded = expandedOrder === order.id
        return (
          <div key={order.id} className="border border-border bg-card">
            {/* Header row */}
            <div
              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                    Order Ref
                  </span>
                  <span className="font-serif text-lg">{order.orderNumber}</span>
                </div>
                <div className="hidden sm:block h-6 w-px bg-border" />
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                    Date
                  </span>
                  <span className="text-xs font-mono">{order.createdAt}</span>
                </div>
                <div className="hidden sm:block h-6 w-px bg-border" />
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                    Amount
                  </span>
                  <span className="text-xs font-semibold">${Number(order.total).toLocaleString()} USD</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <StatusBadge status={order.status} />
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>

            {/* Expandable Body */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden border-t border-border bg-muted/10 p-5 space-y-4"
                >
                  {/* Tracking info */}
                  {order.trackingNumber && (
                    <div className="flex flex-wrap items-center justify-between p-3 border border-border bg-card text-xs">
                      <div>
                        <span className="text-muted-foreground uppercase tracking-wider block text-[10px]">
                          Carrier Waybill / Tracking
                        </span>
                        <span className="font-mono font-medium">{order.trackingNumber}</span>
                      </div>
                      <button
                        onClick={() => handleDownloadInvoice(order.orderNumber)}
                        className="flex items-center gap-1.5 text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground underline underline-offset-2"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        Download Proforma PDF
                      </button>
                    </div>
                  )}

                  {/* Line items */}
                  <div className="space-y-3">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-border/40 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-muted relative border border-border flex-shrink-0">
                            {item.image && (
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="font-serif text-sm">{item.name}</p>
                            <p className="text-muted-foreground text-[11px] uppercase tracking-wider">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-medium">
                          ${(Number(item.price) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Shipping address footer */}
                  <div className="pt-2 text-xs text-muted-foreground border-t border-border flex justify-between items-center">
                    <span>Dispatch Destination: {order.shippingAddress}</span>
                    <span className="uppercase text-[10px] tracking-widest">{order.paymentMethod}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
