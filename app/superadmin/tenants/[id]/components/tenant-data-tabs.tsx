"use client"

import React, { useEffect, useState } from "react"
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  superadminApi,
  type TenantRouter, type PPPoEUser, type HotspotUser,
  type InventoryItem, type AuditLogEntry, type PaginatedResponse,
} from "@/lib/superadmin-api"

const PAGE_SIZE = 20

function formatBytes(b: number | null | undefined) {
  if (!b) return "0 B"
  const s = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), s.length - 1)
  return `${parseFloat((b / Math.pow(1024, i)).toFixed(1))} ${s[i]}`
}
const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—")

const TONES: Record<string, string> = {
  online: "bg-emerald-100 text-emerald-700", active: "bg-emerald-100 text-emerald-700",
  connected: "bg-emerald-100 text-emerald-700", in_use: "bg-emerald-100 text-emerald-700",
  offline: "bg-red-100 text-red-700", faulty: "bg-red-100 text-red-700", error: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-700", maintenance: "bg-amber-100 text-amber-700",
  in_stock: "bg-blue-100 text-blue-700", assigned: "bg-violet-100 text-violet-700",
}
const Pill = ({ s }: { s?: string }) => (
  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${TONES[(s || "").toLowerCase()] || "bg-stone-200 text-stone-700"}`}>
    {(s || "—").replace("_", " ")}
  </span>
)

type Col<T> = { h: string; cell: (r: T) => React.ReactNode; cls?: string }

function PagedTable<T extends { id: string | number }>({
  title, icon, fetcher, cols, searchPlaceholder, paginated = true, extra, toolbar,
}: {
  title: string
  icon: React.ReactNode
  fetcher: (p: Record<string, string>) => Promise<PaginatedResponse<T>>
  cols: Col<T>[]
  searchPlaceholder?: string
  paginated?: boolean
  extra?: Record<string, string>
  toolbar?: React.ReactNode
}) {
  const [rows, setRows] = useState<T[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const extraKey = JSON.stringify(extra || {})

  useEffect(() => { setPage(1) }, [extraKey, search])

  useEffect(() => {
    let alive = true
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const params: Record<string, string> = { page: String(page), ...(extra || {}) }
        if (search) params.search = search
        const res = await fetcher(params)
        if (!alive) return
        setRows(res.results)
        setCount(res.count)
      } catch {
        if (alive) toast.error(`Failed to load ${title.toLowerCase()}`)
      } finally {
        if (alive) setLoading(false)
      }
    }, search ? 300 : 0)
    return () => { alive = false; clearTimeout(t) }
    // fetcher is stable per mounted tab (tenant id never changes while mounted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, extraKey])

  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <div className="rounded-2xl border border-[#e8e2d9] bg-[#fcfaf7] text-[#23251d]">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <h3 className="flex items-center gap-2 text-base font-semibold">{icon}{title} ({count})</h3>
        <div className="flex items-center gap-2">
          {toolbar}
          {searchPlaceholder && (
            <div className="relative w-60">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8a8577]" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder} className="pl-9" />
            </div>
          )}
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#d9702f]" /></div>
      ) : rows.length === 0 ? (
        <p className="py-14 text-center text-sm text-[#8a8577]">Nothing found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-[#e8e2d9] bg-[#f6f2eb] text-left font-mono text-[10px] uppercase tracking-wider text-[#8a8577]">
                {cols.map((c) => <th key={c.h} className="px-4 py-3 font-medium">{c.h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eee8df]">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-[#f6f2eb]/60">
                  {cols.map((c) => <td key={c.h} className={`px-4 py-3 ${c.cls || ""}`}>{c.cell(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {paginated && pages > 1 && (
        <div className="flex items-center justify-between border-t border-[#e8e2d9] px-4 py-3">
          <p className="text-xs text-[#8a8577]">{count} total · Page {page} of {pages}</p>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const mono = "font-mono text-xs"
const dash = (v: React.ReactNode) => v || "—"

export function RoutersTab({ tenantId, icon }: { tenantId: string; icon: React.ReactNode }) {
  return (
    <PagedTable<TenantRouter>
      title="Routers" icon={icon} paginated={false}
      fetcher={async () => {
        const r = await superadminApi.getTenantRouters(tenantId)
        return { count: r.length, page: 1, page_size: r.length, results: r }
      }}
      cols={[
        { h: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
        { h: "IP", cell: (r) => dash(r.ip_address), cls: mono },
        { h: "Model", cell: (r) => dash(r.model) },
        { h: "Status", cell: (r) => <Pill s={r.status} /> },
        { h: "Users", cell: (r) => `${r.active_users}/${r.total_users}` },
        { h: "PPPoE", cell: (r) => (r.enable_pppoe ? "✓" : "—") },
        { h: "Hotspot", cell: (r) => (r.enable_hotspot ? "✓" : "—") },
        { h: "Version", cell: (r) => dash(r.routeros_version), cls: mono },
        { h: "Last seen", cell: (r) => fmtDate(r.last_seen), cls: "text-xs text-[#8a8577]" },
      ]}
    />
  )
}

export function PPPoETab({ tenantId, icon }: { tenantId: string; icon: React.ReactNode }) {
  return (
    <PagedTable<PPPoEUser>
      title="PPPoE users" icon={icon} searchPlaceholder="Search username, IP…"
      fetcher={(p) => superadminApi.getTenantPPPoEUsers(tenantId, p)}
      cols={[
        { h: "Username", cell: (u) => <span className="font-medium">{u.username}</span> },
        { h: "Status", cell: (u) => <Pill s={u.status} /> },
        { h: "Caller ID", cell: (u) => dash(u.caller_id), cls: mono },
        { h: "Remote IP", cell: (u) => dash(u.remote_address), cls: mono },
        { h: "Profile", cell: (u) => dash(u.profile) },
        { h: "Router", cell: (u) => dash(u.router_name), cls: "text-[#d9702f] text-xs" },
        { h: "Down", cell: (u) => formatBytes(u.bytes_in) },
        { h: "Up", cell: (u) => formatBytes(u.bytes_out) },
        { h: "Last seen", cell: (u) => fmtDate(u.last_seen), cls: "text-xs text-[#8a8577]" },
      ]}
    />
  )
}

export function HotspotTab({ tenantId, icon }: { tenantId: string; icon: React.ReactNode }) {
  return (
    <PagedTable<HotspotUser>
      title="Hotspot users" icon={icon} searchPlaceholder="Search username, MAC…"
      fetcher={(p) => superadminApi.getTenantHotspotUsers(tenantId, p)}
      cols={[
        { h: "Username", cell: (u) => <span className="font-medium">{u.username}</span> },
        { h: "Status", cell: (u) => <Pill s={u.status} /> },
        { h: "MAC", cell: (u) => dash(u.mac_address), cls: mono },
        { h: "IP", cell: (u) => dash(u.ip_address), cls: mono },
        { h: "Profile", cell: (u) => dash(u.profile) },
        { h: "Router", cell: (u) => dash(u.router_name), cls: "text-[#d9702f] text-xs" },
        { h: "Down", cell: (u) => formatBytes(u.bytes_in) },
        { h: "Up", cell: (u) => formatBytes(u.bytes_out) },
        { h: "Last seen", cell: (u) => fmtDate(u.last_seen), cls: "text-xs text-[#8a8577]" },
      ]}
    />
  )
}

export function InventoryTab({ tenantId, icon }: { tenantId: string; icon: React.ReactNode }) {
  return (
    <PagedTable<InventoryItem>
      title="Inventory" icon={icon}
      fetcher={(p) => superadminApi.getTenantInventory(tenantId, p)}
      cols={[
        { h: "Name", cell: (i) => <span className="font-medium">{i.name}</span> },
        { h: "Type", cell: (i) => dash(i.type_name) },
        { h: "Model", cell: (i) => dash(i.model) },
        { h: "Serial", cell: (i) => dash(i.serial_number), cls: mono },
        { h: "Status", cell: (i) => <Pill s={i.status} /> },
        { h: "Location", cell: (i) => dash(i.location) },
        { h: "MAC", cell: (i) => dash(i.mac_address), cls: mono },
        { h: "IP", cell: (i) => dash(i.ip_address), cls: mono },
        { h: "Warranty", cell: (i) => (i.warranty_expiry ? new Date(i.warranty_expiry).toLocaleDateString() : "—"), cls: "text-xs" },
      ]}
    />
  )
}

export function AuditTab({ tenantId, icon }: { tenantId: string; icon: React.ReactNode }) {
  const [action, setAction] = useState("all")
  return (
    <PagedTable<AuditLogEntry>
      title="Audit log" icon={icon} searchPlaceholder="Search…"
      extra={action === "all" ? {} : { action }}
      toolbar={
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            {["all", "create", "update", "delete", "login", "view"].map((a) => (
              <SelectItem key={a} value={a}>{a === "all" ? "All" : a[0].toUpperCase() + a.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
      fetcher={(p) => superadminApi.getTenantAuditLog(tenantId, p)}
      cols={[
        { h: "Time", cell: (e) => fmtDate(e.timestamp), cls: "text-xs text-[#8a8577] whitespace-nowrap" },
        { h: "User", cell: (e) => e.actor_email },
        { h: "Action", cell: (e) => <span className="rounded bg-stone-200 px-2 py-0.5 text-[11px] font-medium">{e.action}</span> },
        { h: "Model", cell: (e) => e.model_name },
        { h: "Object", cell: (e) => dash(e.object_repr), cls: "max-w-[220px] truncate" },
        { h: "IP", cell: (e) => dash(e.ip_address), cls: mono },
      ]}
    />
  )
}