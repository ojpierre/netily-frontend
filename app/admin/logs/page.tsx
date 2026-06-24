"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  FileText,
  Search,
  Download,
  Filter,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  Activity,
  RefreshCw,
} from "lucide-react"
import { adminApi } from "@/lib/admin-api"
import type { AuditLog } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"

type LogEntry = {
  id: string
  timestamp: string
  level: "info" | "warning" | "error" | "success"
  category: string
  message: string
  source: string
}

/** Map an AuditLog action to a display level */
const getLogLevel = (action: string): LogEntry["level"] => {
  const lower = action.toLowerCase()
  if (lower.includes("delete") || lower.includes("fail") || lower.includes("error")) return "error"
  if (lower.includes("warn") || lower.includes("suspend") || lower.includes("disable")) return "warning"
  if (lower.includes("create") || lower.includes("success") || lower.includes("complete") || lower.includes("activate")) return "success"
  return "info"
}

/** Convert backend AuditLog to display LogEntry */
const mapAuditLogToEntry = (log: any): LogEntry => {
  // 1. Build a human-readable message using the rich backend data
  let displayMessage = "";
  const actor = log.user_full_name || log.user_email || "System";
  const action = log.action_display || log.action;
  const target = log.object_repr || log.model_name || `Item #${log.object_id}`;

  if (log.action === "login") {
    displayMessage = `${actor} logged in successfully.`;
  } else if (log.action === "logout") {
    displayMessage = `${actor} logged out.`;
  } else if (log.action === "create") {
    displayMessage = `${actor} created new ${log.model_name}: ${target}`;
  } else if (log.action === "update") {
    displayMessage = `${actor} updated ${log.model_name}: ${target}`;
  } else if (log.action === "delete") {
    displayMessage = `${actor} deleted ${log.model_name}: ${target}`;
  } else if (log.action === "password_change") {
    displayMessage = `${actor} changed their password.`;
  } else {
    displayMessage = `${actor} performed ${action} on ${target}`;
  }

  return {
    id: `LOG-${String(log.id).substring(0, 8)}`, // Shorten ID for cleaner UI
    timestamp: log.timestamp, // FIX: Backend uses 'timestamp', not 'created_at'
    level: getLogLevel(log.action),
    category: log.model_name || "System", // FIX: Backend uses 'model_name'
    message: displayMessage,
    source: log.ip_address || "system",
  }
}

export default function LogsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Dynamically extract unique categories from the fetched logs
  const logCategories = useMemo(() => {
    const categories = new Set(logs.map(log => log.category))
    return Array.from(categories).filter(Boolean).sort()
  }, [logs])

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.getAuditLogs({ page_size: "200" })
      const entries = (response.results || []).map(mapAuditLogToEntry)
      setLogs(entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
    } catch (err) {
      setError("Failed to load system logs. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Auto-refresh logs from API
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchLogs()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, fetchLogs])

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = levelFilter === "all" || log.level === levelFilter
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter
    return matchesSearch && matchesLevel && matchesCategory
  })

  const getLevelIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "info":
        return <Info className="w-4 h-4 text-primary" />
      case "warning":
        return <AlertCircle className="w-4 h-4 text-warning" />
      case "error":
        return <XCircle className="w-4 h-4 text-destructive" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-success" />
    }
  }

  const getLevelBadge = (level: LogEntry["level"]) => {
    const variants = {
      info: "bg-primary/15 text-primary border-primary/20",
      warning: "bg-warning/15 text-warning border-warning/20",
      error: "bg-destructive/15 text-destructive border-destructive/20",
      success: "bg-success/15 text-success border-success/20",
    }
    return (
      <Badge variant="outline" className={variants[level]}>
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    )
  }

  const logCounts = {
    total: logs.length,
    info: logs.filter((l) => l.level === "info").length,
    warning: logs.filter((l) => l.level === "warning").length,
    error: logs.filter((l) => l.level === "error").length,
    success: logs.filter((l) => l.level === "success").length,
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">System Logs</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Logs</h1>
          <p className="text-slate-500 mt-1">Real-time system events and activity logs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`} />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{logCounts.total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
            <Info className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-primary">{logCounts.info}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-warning">{logCounts.warning}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-destructive">{logCounts.error}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-success">{logCounts.success}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search logs by message, category, source..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {logCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Event Logs ({filteredLogs.length})</CardTitle>
              <CardDescription>
                {autoRefresh ? "Automatically refreshing every 30 seconds" : "Updates paused"}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchLogs()}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 font-medium">No logs found</p>
              <p className="text-slate-500 text-sm mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4" ref={scrollRef}>
              <div className="space-y-3">
                {filteredLogs.map((log, index) => (
                  <div
                    key={`${log.id}-${index}`}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                      index === 0 && autoRefresh ? "animate-in slide-in-from-top-2" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">{getLevelIcon(log.level)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getLevelBadge(log.level)}
                          <Badge variant="outline" className="text-xs">
                            {log.category}
                          </Badge>
                          <span className="text-xs text-slate-500">{log.source}</span>
                        </div>
                        <p className="text-sm text-slate-900 dark:text-white font-medium mb-1">{log.message}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          <span className="font-mono">{log.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}