"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquareText, Banknote, SignalHigh, SignalLow, RefreshCw, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react"
import { superadminApi, SMSOverview, SMSTopupRecord, SMSTenantRow } from "@/lib/superadmin-api"
import { Button } from "@/components/ui/button"

const PAGE_SIZE = 20

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>
  if (status === "pending") return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>
}

function parseProviderBalance(data: SMSOverview): { display: string; isLow: boolean; expiry?: string } | null {
  if (!data.provider_balance?.success) return null
  const raw = data.provider_balance.raw
  if (raw?.remaining_balance) {
    const cleaned = raw.remaining_balance.replace(/[^0-9.]/g, "")
    const num = parseFloat(cleaned)
    return {
      display: `Ksh ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isLow: num < 500,
      expiry: raw.expired_on,
    }
  }
  // fallback to balance field
  const num = data.provider_balance.balance ?? 0
  return { display: `${num.toLocaleString()} units`, isLow: num < 500 }
}

export default function SuperAdminSMSPage() {
  const [data, setData] = useState<SMSOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [tenantPage, setTenantPage] = useState(1)
  const [topupPage, setTopupPage] = useState(1)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await superadminApi.getSMSOverview()
      setData(res)
    } catch (e: any) {
      setError(e.message || "Failed to load SMS overview")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const totalUnits = parseFloat(data?.total_inbuilt_units || "0")
  const providerInfo = data ? parseProviderBalance(data) : null

  // Paginated slices
  const allTenants = data?.tenants ?? []
  const tenantTotalPages = Math.ceil(allTenants.length / PAGE_SIZE)
  const pagedTenants = allTenants.slice((tenantPage - 1) * PAGE_SIZE, tenantPage * PAGE_SIZE)

  const allTopups = data?.all_topups ?? []
  const topupTotalPages = Math.ceil(allTopups.length / PAGE_SIZE)
  const pagedTopups = allTopups.slice((topupPage - 1) * PAGE_SIZE, topupPage * PAGE_SIZE)

  const dateStr = (val: string) => new Date(val).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquareText className="w-6 h-6 text-violet-400" />
            Tenant SMS Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor inbuilt SMS balances across tenants and your Bytewave provider account.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="border-slate-700 text-slate-300">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 rounded p-3 text-sm border border-red-500/20">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <MessageSquareText className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Inbuilt SMS Units</p>
                <p className="text-xl font-bold text-white">
                  {loading ? "—" : totalUnits.toLocaleString()}
                  <span className="text-sm font-normal text-slate-400 ml-1">units</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Across {data?.inbuilt_tenant_count ?? 0} inbuilt tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Banknote className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Bytewave Provider Balance</p>
                {loading ? (
                  <p className="text-xl font-bold text-white">—</p>
                ) : providerInfo ? (
                  <>
                    <p className={`text-xl font-bold ${providerInfo.isLow ? "text-red-400" : "text-white"}`}>
                      {providerInfo.display}
                    </p>
                    {providerInfo.expiry && (
                      <p className="text-xs text-slate-500 mt-0.5">Expired: {providerInfo.expiry}</p>
                    )}
                    {providerInfo.isLow && (
                      <p className="text-xs text-red-400 mt-0.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Low — top up at portal.bytewavenetworks.com
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-red-400">{data?.provider_balance?.error || "Could not fetch"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Banknote className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Topup Payments</p>
                <p className="text-xl font-bold text-white">
                  {loading ? "—" : (
                    "KES " + allTopups
                      .filter(t => t.status === "completed")
                      .reduce((sum, t) => sum + parseFloat(t.amount_paid), 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">All time completed topups</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenants">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="tenants" className="data-[state=active]:bg-slate-700 text-slate-300">Tenant Balances</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-slate-700 text-slate-300">Topup History</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Inbuilt SMS Tenants — {allTenants.length} total</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <p className="text-slate-400 text-sm p-6">Loading...</p>
              ) : !allTenants.length ? (
                <p className="text-slate-500 text-sm p-6">No tenants are using the inbuilt SMS system.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-left">
                          <th className="px-4 py-3">Tenant</th>
                          <th className="px-4 py-3 text-right">SMS Units</th>
                          <th className="px-4 py-3 text-right">Price / Unit</th>
                          <th className="px-4 py-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {pagedTenants.map((t: SMSTenantRow) => {
                          const units = parseFloat(t.sms_units)
                          const isLow = units < 50
                          return (
                            <tr key={t.tenant_id} className="hover:bg-slate-800/50">
                              <td className="px-4 py-3">
                                <div className="text-white font-medium">{t.tenant_name}</div>
                                <div className="text-xs text-slate-500">{t.tenant_subdomain}</div>
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-white">{units.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-slate-400 text-sm">
                                KES {parseFloat(t.sell_price_per_unit).toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isLow ? (
                                  <span className="flex items-center justify-end gap-1 text-red-400 text-sm">
                                    <SignalLow className="w-4 h-4" /> Low
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-end gap-1 text-emerald-400 text-sm">
                                    <SignalHigh className="w-4 h-4" /> OK
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {tenantTotalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                      <p className="text-sm text-slate-400">Page {tenantPage} of {tenantTotalPages}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={tenantPage <= 1} onClick={() => setTenantPage(p => p - 1)} className="border-slate-700 text-slate-300">Prev</Button>
                        <Button variant="outline" size="sm" disabled={tenantPage >= tenantTotalPages} onClick={() => setTenantPage(p => p + 1)} className="border-slate-700 text-slate-300">Next</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">SMS Topup Payment History — {allTopups.length} total</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <p className="text-slate-400 text-sm p-6">Loading...</p>
              ) : !allTopups.length ? (
                <p className="text-slate-500 text-sm p-6">No topup history found.</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-left">
                          <th className="px-4 py-3">Tenant</th>
                          <th className="px-4 py-3 text-right">Units</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3">Method</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {pagedTopups.map((t: SMSTopupRecord, i) => (
                          <tr key={`${t.tenant_subdomain}-${t.id}-${i}`} className="hover:bg-slate-800/50">
                            <td className="px-4 py-3">
                              <div className="text-white font-medium">{t.tenant_name}</div>
                              <div className="text-xs text-slate-500">{t.tenant_subdomain}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-white">{t.units_purchased.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-white">
                              KES {parseFloat(t.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-slate-300 border-slate-700 capitalize">
                                {t.payment_method.replace(/_/g, " ")}
                              </Badge>
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                            <td className="px-4 py-3 text-slate-400">{dateStr(t.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {topupTotalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
                      <p className="text-sm text-slate-400">Page {topupPage} of {topupTotalPages}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={topupPage <= 1} onClick={() => setTopupPage(p => p - 1)} className="border-slate-700 text-slate-300">Prev</Button>
                        <Button variant="outline" size="sm" disabled={topupPage >= topupTotalPages} onClick={() => setTopupPage(p => p + 1)} className="border-slate-700 text-slate-300">Next</Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}