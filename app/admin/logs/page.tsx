"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { AuditLog } from "@/lib/types"
import { usePagePermissions } from "@/hooks/use-page-permissions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ActorTab = "staff" | "admin"

type AuditRow = AuditLog & {
  user_email?: string
  user_full_name?: string | null
  user_role?: string | null
  actor_type?: "admin" | "staff" | "system" | "user"
  action_display?: string
  model_name?: string
  object_repr?: string
  timestamp?: string
}

const actionOptions = [
  { value: "all", label: "All actions" },
  { value: "create", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "delete", label: "Deleted" },
  { value: "login", label: "Login" },
  { value: "export", label: "Export" },
  { value: "import", label: "Import" },
]

function formatDate(value?: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function actorName(log: AuditRow) {
  return log.user_full_name || log.user_email || "System"
}

function logTime(log: AuditRow) {
  return log.timestamp || (log as any).created_at || ""
}

function actionTone(action?: string) {
  switch ((action || "").toLowerCase()) {
    case "create":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "update":
      return "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300"
    case "delete":
      return "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300"
    case "login":
      return "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

function describeLog(log: AuditRow) {
  const action = (log.action_display || log.action || "Activity").toLowerCase()
  const target = log.object_repr || log.model_name || log.model || "record"
  return `${actorName(log)} ${action} ${target}`
}

function countBy(rows: AuditRow[], predicate: (row: AuditRow) => boolean) {
  return rows.filter(predicate).length
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}

export default function LogsPage() {
  const perms = usePagePermissions("/admin/logs")
  const [activeTab, setActiveTab] = useState<ActorTab>("staff")
  const [rows, setRows] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [action, setAction] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [sensitiveOnly, setSensitiveOnly] = useState(true)

  const fetchLogs = useCallback(async () => {
    if (!perms.isAdmin) return
    setLoading(true)
    try {
      const params: Record<string, string> = {
        page_size: "200",
        actor_type: activeTab,
      }
      if (search.trim()) params.search = search.trim()
      if (action !== "all") params.action = action
      if (startDate) params.date_from = startDate
      if (endDate) params.date_to = endDate
      if (sensitiveOnly) params.sensitive_only = "true"

      const response = await adminApi.getAuditLogs(params)
      setRows((response.results || []) as AuditRow[])
    } catch (error: any) {
      toast.error("Failed to load audit logs", {
        description: error?.message || "Please refresh and try again.",
      })
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [action, activeTab, endDate, perms.isAdmin, search, sensitiveOnly, startDate])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const stats = useMemo(() => ({
    total: rows.length,
    creates: countBy(rows, (row) => row.action === "create"),
    updates: countBy(rows, (row) => row.action === "update"),
    deletes: countBy(rows, (row) => row.action === "delete"),
    logins: countBy(rows, (row) => row.action === "login"),
  }), [rows])

  const exportRows = () => {
    const headers = ["Time", "Actor", "Role", "Action", "Area", "Target", "IP Address"]
    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => [
        formatDate(logTime(row)),
        actorName(row),
        row.user_role || "",
        row.action || "",
        row.model_name || row.model || "",
        row.object_repr || row.object_id || "",
        row.ip_address || "",
      ].map(escapeCsv).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `netily-${activeTab}-audit-logs.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!perms.isAdmin) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Alert variant="destructive">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Admin access required</AlertTitle>
          <AlertDescription>
            Activity logs are restricted to tenant administrators because they contain staff audit evidence.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin-only audit trail
          </div>
          <h1 className="mt-3 text-3xl font-bold text-foreground">Activity Logs</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Review who created users, changed plans, edited payments, deleted records, logged in, or touched sensitive tenant operations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button variant="outline" onClick={exportRows} disabled={loading || rows.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActorTab)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="staff" className="gap-2">
            <Users className="h-4 w-4" />
            Staff Logs
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <UserCog className="h-4 w-4" />
            Admin Logs
          </TabsTrigger>
        </TabsList>

        {(["staff", "admin"] as ActorTab[]).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryCard title="Total" value={stats.total} icon={FileText} />
              <SummaryCard title="Creates" value={stats.creates} icon={CheckCircle2} tone="emerald" />
              <SummaryCard title="Updates" value={stats.updates} icon={ActivityIcon} tone="blue" />
              <SummaryCard title="Deletes" value={stats.deletes} icon={AlertCircle} tone="red" />
              <SummaryCard title="Logins" value={stats.logins} icon={ShieldCheck} tone="violet" />
            </div>

            <Card>
              <CardContent className="grid gap-4 pt-6 lg:grid-cols-[1fr_160px_160px_160px_auto]">
                <div>
                  <Label className="text-xs text-muted-foreground">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Name, email, customer, IP, payment, plan..."
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Action</Label>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {actionOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <Input className="mt-1" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <Input className="mt-1" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                </div>
                <Button
                  type="button"
                  variant={sensitiveOnly ? "default" : "outline"}
                  className="self-end"
                  onClick={() => setSensitiveOnly((current) => !current)}
                >
                  Sensitive only
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {tab === "staff" ? "Staff Activity Evidence" : "Admin Activity"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <Skeleton key={index} className="h-20 w-full" />
                    ))}
                  </div>
                ) : rows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border py-16 text-center">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-3 font-medium text-foreground">No matching logs found</p>
                    <p className="mt-1 text-sm text-muted-foreground">Try widening the date range or disabling sensitive-only mode.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="px-3 py-3">Time</th>
                          <th className="px-3 py-3">Actor</th>
                          <th className="px-3 py-3">Action</th>
                          <th className="px-3 py-3">Area</th>
                          <th className="px-3 py-3">Details</th>
                          <th className="px-3 py-3">IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rows.map((row) => (
                          <tr key={row.id} className="align-top hover:bg-muted/40">
                            <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{formatDate(logTime(row))}</td>
                            <td className="px-3 py-3">
                              <div className="font-medium text-foreground">{actorName(row)}</div>
                              <div className="text-xs text-muted-foreground">{row.user_role || row.actor_type || "unknown"}</div>
                            </td>
                            <td className="px-3 py-3">
                              <Badge variant="outline" className={actionTone(row.action)}>{row.action_display || row.action}</Badge>
                            </td>
                            <td className="px-3 py-3 font-medium text-foreground">{row.model_name || row.model || "-"}</td>
                            <td className="px-3 py-3">
                              <div className="max-w-xl text-foreground">{describeLog(row)}</div>
                              {row.changes ? (
                                <details className="mt-2">
                                  <summary className="cursor-pointer text-xs font-medium text-primary">View captured fields</summary>
                                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                                    {JSON.stringify(row.changes, null, 2)}
                                  </pre>
                                </details>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-muted-foreground">{row.ip_address || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function ActivityIcon(props: React.ComponentProps<typeof FileText>) {
  return <FileText {...props} />
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  tone = "slate",
}: {
  title: string
  value: number
  icon: React.ElementType
  tone?: "slate" | "emerald" | "blue" | "red" | "violet"
}) {
  const tones = {
    slate: "bg-muted text-muted-foreground",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    red: "bg-red-500/10 text-red-600 dark:text-red-300",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className={`rounded-lg p-2 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
