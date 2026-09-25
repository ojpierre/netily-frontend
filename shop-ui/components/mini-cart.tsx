"use client"

import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/shop-ui/components/ui/button"
import Link from "next/link"
import { useCart } from "@/shop-ui/lib/cart-context"

interface MiniCartProps {
  isOpen: boolean
  onClose: () => void
}

export function MiniCart({ isOpen, onClose }: MiniCartProps) {
  const { items, increment, decrement, removeItem, total, itemCount } = useCart()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/40 z-50"
          />

          {/* Cart panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 flex flex-col text-foreground shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="font-serif text-xl">Shopping Bag</h2>
                {itemCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {itemCount} {itemCount === 1 ? "hardware item" : "hardware items"}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 hover:opacity-60 transition-opacity"
                aria-label="Close cart"
              >
                <X className="h-5 w-5 stroke-[1.5]" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 bg-muted flex items-center justify-center mb-4 border border-border">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <p className="font-serif text-lg mb-2">Your bag is empty</p>
                  <p className="text-sm text-muted-foreground mb-6">Add some hardware devices to get started.</p>
                  <button
                    onClick={onClose}
                    className="text-sm tracking-[0.15em] uppercase border-b border-foreground pb-1 hover:border-transparent transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <motion.div
                      key={`${item.id}-${item.selectedStorage}-${item.selectedColor}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="flex gap-4 border-b border-border/40 pb-4"
                    >
                      <div className="w-20 h-24 bg-muted flex-shrink-0 relative overflow-hidden border border-border">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          sizes="80px"
                          loading="lazy"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h3 className="font-serif text-sm leading-tight">{item.name}</h3>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {item.selectedStorage && (
                          <p className="text-xs text-muted-foreground">{item.selectedStorage}</p>
                        )}
                        {item.selectedColor && (
                          <p className="text-xs text-muted-foreground">{item.selectedColor}</p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-border">
                            <button
                              onClick={() => decrement(item.id)}
                              className="p-1.5 hover:bg-muted transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs w-6 text-center font-mono">{item.quantity}</span>
                            <button
                              onClick={() => increment(item.id)}
                              className="p-1.5 hover:bg-muted transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="text-sm font-medium">
                            ${(item.price * item.quantity).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border p-6 space-y-4">
                <div className="flex justify-between text-base font-medium">
                  <span>Subtotal</span>
                  <span className="font-serif text-lg">${total.toLocaleString()} USD</span>
                </div>
                <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout</p>
                <Link href="/shop/checkout" onClick={onClose}>
                  <Button className="w-full py-6 text-sm tracking-[0.2em] uppercase rounded-none">
                    Proceed to Checkout
                  </Button>
                </Link>
                <button
                  onClick={onClose}
                  className="w-full text-center text-sm tracking-wide underline underline-offset-4 hover:no-underline transition-all text-muted-foreground hover:text-foreground"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
