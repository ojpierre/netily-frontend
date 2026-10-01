"use client"

import { useState } from "react"
import Link from "next/link"
import { Headphones, MessageCircle, Send, X } from "lucide-react"
import { toast } from "sonner"

const quickReplies = [
  "I need help choosing a router",
  "Track my order",
  "Request a bulk quote",
  "Warranty support",
]

export function ShopSupportChat() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")

  function handleSend() {
    if (!message.trim()) {
      toast.error("Type a short message first")
      return
    }
    toast.success("Support message captured")
    setMessage("")
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[min(calc(100vw-2.5rem),380px)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-[#0b42d8] p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/12">
                <Headphones className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-base">Internetily Shop Support</p>
                <p className="text-[11px] uppercase tracking-wider text-white/70">Orders, quotes, warranty, and product help</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close shop support">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-2xl border border-border bg-muted/30 p-3">
              <p className="text-sm leading-6 text-foreground">
                Hi, tell us what you need and the shop team will help with the right hardware, quote, delivery update, or warranty step.
              </p>
            </div>

            <div className="grid gap-2">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => setMessage(reply)}
                  className="rounded-xl border border-border px-3 py-2 text-left text-xs uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {reply}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-background p-2">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                placeholder="Write a short message..."
                className="w-full resize-none bg-transparent p-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between border-t border-border pt-2">
                <Link href="/shop/account/support" className="px-2 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
                  Open support center
                </Link>
                <button onClick={handleSend} className="flex min-h-9 items-center gap-2 rounded-full bg-foreground px-4 text-xs uppercase text-background hover:bg-foreground/90">
                  Send
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-14 items-center gap-3 rounded-full bg-[#0b42d8] px-5 text-sm font-semibold text-white shadow-xl transition hover:bg-[#0736b8]"
        aria-label="Open shop support"
      >
        <MessageCircle className="h-5 w-5" />
        Shop Support
      </button>
    </div>
  )
}
