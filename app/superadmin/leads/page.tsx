"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  UserPlus,
  Search,
  Loader2,
  Mail,
  Phone,
  Building2,
  MessageSquare,
  Calendar,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { superadminApi, type LeadItem, type LeadStats } from "@/lib/superadmin-api"

const PAGE_SIZE = 20

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(PAGE_SIZE),
      }
      if (search) params.search = search
      const res = await superadminApi.getLeads(params)
      setLeads(res.results)
      setTotal(res.count)
    } catch (err: any) {
      toast.error(err.message || "Failed to load leads")
    } finally {
      setLoading(false)
    }
  }, [page, search])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const s = await superadminApi.getLeadStats()
      setStats(s)
    } catch {
      // stats are non-critical
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const t = setTimeout(() => fetchLeads(), 300)
    return () => clearTimeout(t)
  }, [fetchLeads])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // CSV export
  const exportCsv = () => {
    if (leads.length === 0) return
    const headers = ["Name", "Email", "Phone", "Company", "Source", "Message", "Date"]
    const rows = leads.map((l) => [
      l.name,
      l.email,
      l.phone || "",
      l.company_name || "",
      l.lead_source || "",
      (l.message || "").replace(/\n/g, " "),
      new Date(l.created_at).toLocaleDateString(),
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `netily-leads-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-400" />
            Leads
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Potential ISPs who submitted the homepage contact form
          </p>
        </div>
        <Button
          onClick={exportCsv}
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-300 hover:text-white"
          disabled={leads.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="All Time"
          value={stats?.total ?? 0}
          icon={Users}
          color="text-blue-400"
          bg="bg-blue-500/10"
          loading={statsLoading}
        />
        <StatCard
          label="This Month"
          value={stats?.this_month ?? 0}
          icon={Calendar}
          color="text-violet-400"
          bg="bg-violet-500/10"
          loading={statsLoading}
        />
        <StatCard
          label="Last 30 Days"
          value={stats?.last_30_days ?? 0}
          icon={TrendingUp}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          loading={statsLoading}
        />
        <StatCard
          label="Last 7 Days"
          value={stats?.last_7_days ?? 0}
          icon={UserPlus}
          color="text-amber-400"
          bg="bg-amber-500/10"
          loading={statsLoading}
        />
      </div>

      {/* Trend mini chart */}
      {stats && stats.trend.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Monthly Lead Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-24">
              {stats.trend.map((t, i) => {
                const max = Math.max(...stats.trend.map((x) => x.count), 1)
                const h = (t.count / max) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-slate-400">{t.count}</span>
                    <div
                      className="w-full rounded-t bg-blue-500/40 border border-blue-500/60"
                      style={{ height: `${Math.max(h, 4)}%` }}
                    />
                    <span className="text-[10px] text-slate-500">{t.month}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {stats && stats.source_breakdown.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-300">Lead Source Breakdown</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Top channels sending qualified homepage enquiries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {stats.source_breakdown.map((item) => (
                <div
                  key={item.lead_source}
                  className="rounded-2xl border border-slate-800 bg-slate-800/60 px-4 py-3"
                >
                  <p className="text-xs font-medium text-slate-400">{item.lead_source}</p>
                  <p className="mt-2 text-2xl font-bold text-white">{item.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-white text-lg">Lead List</CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              {total} total lead{total !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by name, email, company…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            </div>
          ) : leads.length === 0 ? (
            <p className="text-center text-slate-500 py-20">No leads found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3 hidden xl:table-cell">Source</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Message</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {leads.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{l.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-300">
                            <Mail className="w-3 h-3 text-slate-500" />
                            {l.email}
                          </div>
                          {l.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {l.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {l.company_name ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-300">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            {l.company_name}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        {l.lead_source ? (
                          <span className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-300">
                            {l.lead_source}
                          </span>
                        ) : (
                          <span className="text-slate-600">â€”</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {l.message ? (
                          <p className="text-xs text-slate-400 max-w-[200px] truncate">{l.message}</p>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(l.created_at).toLocaleDateString("en-KE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-white"
                          onClick={() => {
                            setSelectedLead(l)
                            setDetailOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border-slate-700 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="border-slate-700 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              Lead Details
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Full submission from the homepage contact form
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Name" value={selectedLead.name} />
                <DetailField label="Email" value={selectedLead.email} />
                <DetailField label="Phone" value={selectedLead.phone || "—"} />
                <DetailField label="Company" value={selectedLead.company_name || "—"} />
                <DetailField label="Source" value={selectedLead.lead_source || "â€”"} />
                <DetailField
                  label="Submitted"
                  value={new Date(selectedLead.created_at).toLocaleString("en-KE")}
                />
              </div>
              {selectedLead.message && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Message</p>
                  <div className="bg-slate-800 rounded-lg p-3 text-slate-200 text-sm whitespace-pre-wrap">
                    {selectedLead.message}
                  </div>
                </div>
              )}
              {/* Quick action buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <a
                  href={`mailto:${selectedLead.email}?subject=Following up on your Netily enquiry&body=Hi ${selectedLead.name},%0A%0AThank you for reaching out to Netily!`}
                  className="flex-1"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Lead
                  </Button>
                </a>
                {selectedLead.phone && (
                  <a href={`tel:${selectedLead.phone}`} className="flex-1">
                    <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  loading,
}: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  bg: string
  loading: boolean
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">{label}</span>
          <div className={`p-1.5 rounded-md ${bg}`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        </div>
        {loading ? (
          <div className="h-7 w-16 bg-slate-800 animate-pulse rounded" />
        ) : (
          <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
        )}
      </CardContent>
    </Card>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-100 font-medium break-all">{value}</p>
    </div>
  )
}
