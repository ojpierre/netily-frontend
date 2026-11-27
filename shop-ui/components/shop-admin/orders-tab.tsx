"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Check, CircleDot, Mail, MapPin, Phone, Receipt, Search, ShoppingBag, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import type { ShopAdminApi } from "./api"
import { NEXT_STATUS, ORDER_STATUSES, errText, formatDateTime, ksh, statusLabel, type AdminOrder, type ShopStats } from "./types"
import { Btn, ConfirmDialog, EmptyState, Pagination, PageHeader, Pill, Skeleton, card, cx, inputCls, orderTone } from "./ui"

const PAGE_SIZE = 20

export const customerName = (o: AdminOrder) => `${o.first_name} ${o.last_name}`.trim() || "Customer"

export function OrderStatusPills({ o }: { o: AdminOrder }) {
  return (
    <>
      <Pill tone={orderTone(o.status)}>{statusLabel(o.status)}</Pill>
      {o.payment_status === "failed" && <Pill tone="red">Payment failed</Pill>}
      {o.payment_status === "paid" && (o.status === "cancelled" || o.status === "expired") && <Pill tone="green">Paid</Pill>}
    </>
  )
}

const RANK: Record<string, number> = { pending_payment: 0, paid: 1, processing: 2, shipped: 3, delivered: 4 }

function Timeline({ o }: { o: AdminOrder }) {
  const ended = o.status === "cancelled" || o.status === "expired"
  const rank = RANK[o.status] ?? (o.paid_at ? 1 : 0)
  const steps = [
    { label: "Order placed", done: true, time: o.created_at, note: "" },
    {
      label: o.payment_status === "failed" ? "Payment failed" : "Payment received",
      done: o.payment_status === "paid",
      failed: o.payment_status === "failed",
      time: o.paid_at || (o.payment_status === "paid" ? "" : o.last_stk_at),
      note: o.payment_status === "paid" ? (o.mpesa_receipt ? `M-Pesa ${o.mpesa_receipt}` : "") : o.stk_attempts ? `${o.stk_attempts} M-Pesa ${o.stk_attempts === 1 ? "prompt" : "prompts"} sent` : "",
    },
    { label: "Processing", done: rank >= 2 && !ended, time: "", note: "" },
    { label: "Shipped", done: rank >= 3 && !ended, time: "", note: "" },
    { label: "Delivered", done: rank >= 4 && !ended, time: "", note: "" },
  ]
  return (
    <ol className="space-y-0">
      {steps.map((s, i) => (
        <li key={s.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className={cx("grid h-6 w-6 place-items-center rounded-full border text-slate-500", s.done ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300" : "failed" in s && s.failed ? "border-red-500/50 bg-red-500/15 text-red-300" : "border-slate-700 bg-slate-900")}>
              {s.done ? <Check className="h-3.5 w-3.5" /> : "failed" in s && s.failed ? <XCircle className="h-3.5 w-3.5" /> : <CircleDot className="h-3 w-3" />}
            </span>
            {i < steps.length - 1 && <span className={cx("my-0.5 w-px flex-1", s.done ? "bg-emerald-500/30" : "bg-slate-800")} />}
          </div>
          <div className="pb-4">
            <p className={cx("text-sm", s.done ? "text-white" : "text-slate-500")}>{s.label}</p>
            {(s.time || s.note) && <p className="text-xs text-slate-500">{[s.time ? formatDateTime(s.time) : "", s.note].filter(Boolean).join(" · ")}</p>}
          </div>
        </li>
      ))}
      {ended && (
        <li className="flex gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-full border border-red-500/50 bg-red-500/15 text-red-300"><XCircle className="h-3.5 w-3.5" /></span>
          <div><p className="text-sm text-white">{statusLabel(o.status)}</p>{o.updated_at && <p className="text-xs text-slate-500">{formatDateTime(o.updated_at)}</p>}</div>
        </li>
      )}
    </ol>
  )
}

function OrderDrawer({ api, reference, summary, onClose, onChanged }: { api: ShopAdminApi; reference: string; summary: AdminOrder; onClose: () => void; onChanged: (o: AdminOrder) => void }) {
  const [order, setOrder] = useState<AdminOrder>(summary)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [pending, setPending] = useState<string | null>(null)
  const [paidDialog, setPaidDialog] = useState(false)
  const [receipt, setReceipt] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let live = true
    api.getOrder(reference).then((o) => live && (setOrder(o), setLoading(false))).catch((e) => live && (setLoadError(errText(e)), setLoading(false)))
    return () => { live = false }
  }, [api, reference])

  const next = NEXT_STATUS[order.status] || []
  const canMarkPaid = order.payment_status !== "paid" && (order.status === "pending_payment" || order.status === "expired")

  async function applyStatus() {
    if (!pending) return
    setBusy(true)
    try {
      const updated = await api.setOrderStatus(order.reference, pending)
      const merged = { ...order, ...updated }
      setOrder(merged)
      onChanged(merged)
      toast.success(`${order.reference} is now ${statusLabel(pending).toLowerCase()}`)
      setPending(null)
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(false)
    }
  }

  async function markPaid() {
    setBusy(true)
    try {
      const updated = await api.markOrderPaid(order.reference, receipt.trim())
      const merged = { ...order, ...updated }
      setOrder(merged)
      onChanged(merged)
      toast.success(`${order.reference} marked as paid`)
      setPaidDialog(false)
      setReceipt("")
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(false)
    }
  }

  const address = [order.address, order.apartment, order.city, order.state, order.zip_code, order.country].filter(Boolean).join(", ")

  return (
    <>
      <Sheet open onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="right" className="w-full gap-0 overflow-hidden border-slate-800 bg-slate-950 p-0 text-slate-100 sm:max-w-xl [&>button]:text-slate-300">
          <header className="border-b border-slate-800 bg-slate-900/80 px-5 py-4 pr-14">
            <SheetTitle className="font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] text-base font-semibold text-white">{order.reference}</SheetTitle>
            <SheetDescription className="mt-0.5 text-xs text-slate-400">Placed {formatDateTime(order.created_at)}</SheetDescription>
            <div className="mt-2 flex flex-wrap gap-1.5"><OrderStatusPills o={order} /></div>
          </header>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            {loadError && <div role="alert" className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" />Could not load the item list. {loadError}</div>}

            {(next.length > 0 || canMarkPaid) && (
              <div className={cx(card, "p-4")}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next step</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {next.map((s) => (
                    <Btn key={s} variant={s === "cancelled" ? "danger" : "primary"} size="sm" onClick={() => setPending(s)}>
                      {s === "cancelled" ? "Cancel order" : `Move to ${statusLabel(s).toLowerCase()}`}
                    </Btn>
                  ))}
                  {canMarkPaid && <Btn size="sm" onClick={() => setPaidDialog(true)}><Receipt className="h-3.5 w-3.5" /> Verify and mark as paid</Btn>}
                </div>
              </div>
            )}

            <section className={cx(card, "space-y-2.5 p-4 text-sm")}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</h3>
              <p className="font-medium text-white">{customerName(order)}{order.company ? <span className="font-normal text-slate-400"> · {order.company}</span> : null}</p>
              <p className="flex items-center gap-2 text-slate-300"><Mail className="h-3.5 w-3.5 text-slate-500" /><a href={`mailto:${order.email}`} className="hover:text-violet-300">{order.email}</a></p>
              <p className="flex items-center gap-2 text-slate-300"><Phone className="h-3.5 w-3.5 text-slate-500" /><a href={`tel:${order.phone}`} className="hover:text-violet-300">{order.phone}</a></p>
              <p className="flex items-start gap-2 text-slate-300"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />{address}</p>
              {order.notes && <p className="rounded-lg bg-slate-950/60 p-2.5 text-xs text-slate-300"><span className="text-slate-500">Customer note: </span>{order.notes}</p>}
            </section>

            <section className={cx(card, "p-4")}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Items</h3>
              {loading ? (
                <div className="mt-3 space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /></div>
              ) : (
                <ul className="mt-2 divide-y divide-slate-800">
                  {(order.items || []).map((i, idx) => (
                    <li key={i.id ?? idx} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="text-white">{i.name}</p>
                        <p className="text-xs text-slate-500">{ksh(i.unit_price)} × {i.quantity}{i.selected_storage ? ` · ${i.selected_storage}` : ""}{i.selected_color ? ` · ${i.selected_color}` : ""}</p>
                      </div>
                      <span className="shrink-0 text-slate-200">{ksh(i.line_total)}</span>
                    </li>
                  ))}
                  {(order.items || []).length === 0 && <li className="py-3 text-sm text-slate-500">No items found.</li>}
                </ul>
              )}
              <dl className="mt-3 space-y-1.5 border-t border-slate-800 pt-3 text-sm">
                {order.subtotal != null && <div className="flex justify-between text-slate-400"><dt>Subtotal</dt><dd>{ksh(order.subtotal)}</dd></div>}
                {order.shipping_fee != null && <div className="flex justify-between text-slate-400"><dt>Delivery</dt><dd>{Number(order.shipping_fee) ? ksh(order.shipping_fee) : "Free"}</dd></div>}
                <div className="flex justify-between text-base font-semibold text-white"><dt>Total</dt><dd>{ksh(order.total)}</dd></div>
              </dl>
            </section>

            <section className={cx(card, "space-y-2 p-4 text-sm")}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment</h3>
              <div className="flex justify-between"><span className="text-slate-400">Method</span><span className="uppercase text-slate-200">{order.payment_method === "mpesa" ? "M-Pesa" : order.payment_method}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">M-Pesa receipt</span><span className="font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] text-slate-200">{order.mpesa_receipt || "Not yet"}</span></div>
              {order.mpesa_phone && <div className="flex justify-between"><span className="text-slate-400">Paid from</span><span className="text-slate-200">{order.mpesa_phone}</span></div>}
              {order.paid_at && <div className="flex justify-between"><span className="text-slate-400">Paid on</span><span className="text-slate-200">{formatDateTime(order.paid_at)}</span></div>}
              {order.payment_failure_reason && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-200">{order.payment_failure_reason}</p>}
            </section>

            <section className={cx(card, "p-4")}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Timeline</h3>
              <Timeline o={order} />
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!pending}
        destructive={pending === "cancelled"}
        loading={busy}
        title={pending === "cancelled" ? `Cancel ${order.reference}?` : `Move ${order.reference} to ${pending ? statusLabel(pending).toLowerCase() : ""}?`}
        description={pending === "cancelled" ? "Reserved stock goes back on the shelf. This cannot be undone." : "The order status changes straight away. Customers see the new status when they track their order."}
        confirmLabel={pending === "cancelled" ? "Cancel order" : "Update status"}
        cancelLabel="Go back"
        onConfirm={() => void applyStatus()}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={paidDialog}
        loading={busy}
        title="Mark this order as paid?"
        description="Only do this after you have confirmed the payment in your M-Pesa statement. The order moves to Paid and goes into fulfilment."
        confirmLabel="Mark as paid"
        cancelLabel="Go back"
        onConfirm={() => void markPaid()}
        onCancel={() => setPaidDialog(false)}
      >
        <label className="block text-xs font-medium text-slate-300">
          M-Pesa receipt code (optional)
          <input value={receipt} onChange={(e) => setReceipt(e.target.value.toUpperCase())} maxLength={30} placeholder="e.g. SJK4L9X2QP" className={cx(inputCls, "mt-1.5 font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace]")} />
        </label>
      </ConfirmDialog>
    </>
  )
}

export function OrdersTab({ api, stats, refreshKey, onChanged }: { api: ShopAdminApi; stats: ShopStats; refreshKey: number; onChanged: () => void }) {
  const [status, setStatus] = useState("")
  const [payment, setPayment] = useState("")
  const [search, setSearch] = useState("")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [open, setOpen] = useState<AdminOrder | null>(null)
  const seq = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    const id = ++seq.current
    setLoading(true)
    setError("")
    const params: Record<string, string> = { page_size: String(PAGE_SIZE), page: String(page) }
    if (status) params.status = status
    if (payment) params.payment_status = payment
    if (query) params.search = query
    try {
      const res = await api.listOrders(params)
      if (id !== seq.current) return
      setOrders(res.results)
      setCount(res.count)
    } catch (e) {
      if (id !== seq.current) return
      // A page past the end (after filtering) returns 404; fall back to page one.
      if (page > 1) setPage(1)
      else setError(errText(e))
    } finally {
      if (id === seq.current) setLoading(false)
    }
  }, [api, status, payment, query, page])

  useEffect(() => { void load() }, [load, refreshKey])

  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const money = (k: string) => ksh(Number(stats[k] ?? 0))
  const summary = [
    { label: "Collected (30 days)", value: money("revenue_kes_30d"), tone: "text-emerald-300" },
    { label: "Awaiting payment", value: String(stats.pending ?? 0), tone: "text-amber-300" },
    { label: "Failed payments", value: String(stats.failed ?? 0), tone: "text-red-300" },
    { label: "Ready to fulfil", value: String(stats.to_fulfil ?? 0), tone: "text-sky-300" },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Orders" description="Track payments and move orders through fulfilment." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className={cx(card, "p-4")}>
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={cx("mt-1 text-xl font-semibold tabular-nums", s.tone)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className={cx(card, "grid gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_190px_170px] sm:p-4")}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference, name, email, phone or receipt" aria-label="Search orders" className={cx(inputCls, "pl-9")} />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label="Filter by order status" className={inputCls}>
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
        <select value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1) }} aria-label="Filter by payment" className={inputCls}>
          <option value="">All payments</option>
          <option value="pending">Awaiting payment</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className={cx(card, "overflow-hidden")}>
        {error ? (
          <EmptyState icon={<AlertTriangle className="h-5 w-5" />} title="Orders could not load" action={<Btn onClick={() => void load()}>Try again</Btn>}>{error}</EmptyState>
        ) : loading && orders.length === 0 ? (
          <div className="space-y-3 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState icon={<ShoppingBag className="h-5 w-5" />} title={status || payment || query ? "No orders match" : "No orders yet"}>
            {status || payment || query ? "Try a different search or clear the filters." : "Orders will appear here as soon as customers check out."}
          </EmptyState>
        ) : (
          <ul className={cx("divide-y divide-slate-800/80", loading && "opacity-60 transition-opacity")}>
            {orders.map((o) => (
              <li key={o.reference}>
                <button type="button" onClick={() => setOpen(o)} className="grid w-full gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-800/30 focus-visible:bg-slate-800/40 focus-visible:outline-none md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_auto_110px] md:items-center md:gap-4">
                  <div>
                    <p className="font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] text-sm font-semibold text-white">{o.reference}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(o.created_at)}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-200">{customerName(o)}</p>
                    <p className="truncate text-xs text-slate-500">{o.phone}{o.mpesa_receipt ? ` · ${o.mpesa_receipt}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5"><OrderStatusPills o={o} /></div>
                  <p className="text-sm font-semibold tabular-nums text-white md:text-right">{ksh(o.total)}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page} pageCount={pageCount} total={count} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>

      {open && (
        <OrderDrawer
          key={open.reference}
          api={api}
          reference={open.reference}
          summary={open}
          onClose={() => setOpen(null)}
          onChanged={(o) => {
            setOrders((list) => list.map((x) => (x.reference === o.reference ? { ...x, ...o, items: undefined } : x)))
            onChanged()
          }}
        />
      )}
    </div>
  )
}
