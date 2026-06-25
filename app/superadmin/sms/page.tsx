"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquareText, Banknote, SignalHigh, SignalLow, RefreshCw, AlertTriangle } from "lucide-react"
import { superadminApi, SMSOverview, SMSTopupRecord } from "@/lib/superadmin-api"
import { Button } from "@/components/ui/button"

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return <Badge className="bg-green-600">Completed</Badge>
  if (status === "pending") return <Badge variant="outline" className="text-yellow-600 border-yellow-400">Pending</Badge>
  return <Badge variant="destructive">Failed</Badge>
}

export default function SuperAdminSMSPage() {
  const [data, setData] = useState<SMSOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  const providerBalance = data?.provider_balance?.balance ?? 0
  const providerOk = data?.provider_balance?.success

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant SMS Overview</h1>
          <p className="text-muted-foreground mt-1">
            Monitor inbuilt SMS balances across tenants and your Bytewave provider account.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 rounded p-3 text-sm">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inbuilt SMS Units</CardTitle>
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "—" : totalUnits.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">units</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {data?.inbuilt_tenant_count ?? 0} inbuilt tenants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bytewave Provider Balance</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">—</div>
            ) : providerOk ? (
              <>
                <div className={`text-2xl font-bold ${providerBalance < 500 ? "text-destructive" : ""}`}>
                  {providerBalance.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">units</span>
                </div>
                {providerBalance < 500 && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Low — top up at portal.bytewavenetworks.com
                  </p>
                )}
              </>
            ) : (
              <div className="text-sm text-destructive">{data?.provider_balance?.error || "Could not fetch"}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Topup Payments</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "—" : (
                "KES " + (data?.all_topups ?? [])
                  .filter(t => t.status === "completed")
                  .reduce((sum, t) => sum + parseFloat(t.amount_paid), 0)
                  .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time completed topups</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenants">
        <TabsList>
          <TabsTrigger value="tenants">Tenant Balances</TabsTrigger>
          <TabsTrigger value="payments">Topup History</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants">
          <Card>
            <CardHeader>
              <CardTitle>Inbuilt SMS Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : !data?.tenants.length ? (
                <p className="text-muted-foreground text-sm">No tenants are using the inbuilt SMS system.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-right">SMS Units</TableHead>
                      <TableHead className="text-right">Price / Unit</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.tenants.map((t) => {
                      const units = parseFloat(t.sms_units)
                      const isLow = units < 50
                      return (
                        <TableRow key={t.tenant_id}>
                          <TableCell>
                            <div className="font-medium">{t.tenant_name}</div>
                            <div className="text-xs text-muted-foreground">{t.tenant_subdomain}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {units.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-sm">
                            KES {parseFloat(t.sell_price_per_unit).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            {isLow ? (
                              <span className="flex items-center justify-end gap-1 text-destructive text-sm">
                                <SignalLow className="w-4 h-4" /> Low
                              </span>
                            ) : (
                              <span className="flex items-center justify-end gap-1 text-green-600 text-sm">
                                <SignalHigh className="w-4 h-4" /> OK
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>SMS Topup Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : !data?.all_topups.length ? (
                <p className="text-muted-foreground text-sm">No topup history found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.all_topups.map((t: SMSTopupRecord, i) => (
                      <TableRow key={`${t.tenant_subdomain}-${t.id}-${i}`}>
                        <TableCell>
                          <div className="font-medium">{t.tenant_name}</div>
                          <div className="text-xs text-muted-foreground">{t.tenant_subdomain}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {t.units_purchased.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          KES {parseFloat(t.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground capitalize">
                          {t.payment_method.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={t.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString("en-KE", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}