"use client"
import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"

interface Msg { id: number; sender_type: string; sender_name: string; body: string; created_at: string }

export default function ChatWidget({ routerId, tenant, theme }: { routerId: string; tenant: string; theme: any }) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [verified, setVerified] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef(0)
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  useEffect(() => {
    lastIdRef.current = messages.length ? messages[messages.length - 1].id : 0
  }, [messages])

  // poll only while widget is open and verified
  useEffect(() => {
    if (!open || !verified || !threadId) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${apiBase}/hotspot/chat/poll/?tenant=${tenant}&thread_id=${threadId}&after_id=${lastIdRef.current}`,
          { cache: "no-store" }
        )
        if (!res.ok) return
        const data = await res.json()
        if (data.messages?.length) {
          setMessages((prev) => [...prev, ...data.messages])
        }
      } catch { /* silent — retry next tick */ }
    }, 4000)
    return () => clearInterval(interval)
  }, [open, verified, threadId, tenant, apiBase])

  const enterChat = async () => {
    if (!phone.trim()) { setError("Enter the phone number you used to chat"); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${apiBase}/hotspot/chat/init/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant, phone_number: phone, router_id: routerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not open chat")
      setMessages(data.thread.messages || [])
      setThreadId(data.thread.id)
      setVerified(true)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const send = async () => {
    if (!draft.trim()) return
    const body = draft.trim()
    setDraft("")
    try {
      const res = await fetch(`${apiBase}/hotspot/chat/send/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant, phone_number: phone, message: body, router_id: routerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send")
      if (data.thread?.id && data.thread.id !== threadId) {
        setThreadId(data.thread.id)   // thread was recreated after admin resolved it
      }
      setMessages((prev) => [...prev, data.message])
    } catch (e: any) { setError(e.message) }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:bg-blue-700"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white">
          <span className="font-semibold">Support Chat</span>
          <button onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
        </div>

        {!verified ? (
          <div className="p-5 space-y-3">
            <p className="text-sm text-gray-600">
              Enter the phone number you want to chat with. Use the same number
              next time to see the reply — it&apos;s how we find your conversation.
            </p>
            <input
              type="tel"
              placeholder="07XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              onClick={enterChat}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start / Resume Chat"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-sm text-gray-400 mt-8">Send a message to get started</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender_type === "agent" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[75%] rounded-xl px-3 py-2 text-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                      m.sender_type === "agent" ? "bg-gray-100 text-gray-800" : "bg-blue-600 text-white"
                    }`}
                  >
                    {m.body}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            {error && <p className="text-red-500 text-xs px-4">{error}</p>}
            <div className="p-3 border-t flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={send} className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}