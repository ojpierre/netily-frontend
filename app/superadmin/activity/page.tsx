"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  Activity,
  Loader2,
  LogIn,
  Building2,
  RefreshCw,
  Clock,
  User,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { superadminApi, type ActivityItem } from "@/lib/superadmin-api"

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(50)

  const fetchActivity = useCallback(async () => {
    setLoading(true)
    try {
      const data = await superadminApi.getActivity(limit)
      setItems(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to load activity")
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  const eventIcon = (type: string) => {
    switch (type) {
      case "login":
        return <LogIn className="w-4 h-4 text-blue-400" />
      case "tenant_created":
        return <Building2 className="w-4 h-4 text-emerald-400" />
      default:
        return <Activity className="w-4 h-4 text-slate-400" />
    }
  }

  const eventColor = (type: string) => {
    switch (type) {
      case "login":
        return "bg-blue-500/10 border-blue-500/20"
      case "tenant_created":
        return "bg-emerald-500/10 border-emerald-500/20"
      default:
        return "bg-slate-500/10 border-slate-500/20"
    }
  }

  const relativeTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(ts).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-400" />
            Activity Feed
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Recent platform activity — logins, tenant events, and more
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchActivity}
          disabled={loading}
          className="border-slate-700 text-slate-300"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-slate-500 py-20">No activity recorded yet</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg border flex-shrink-0 mt-0.5 ${eventColor(item.type)}`}>
                    {eventIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      {item.type === "login" && (
                        <>
                          <span className="font-medium">{item.actor}</span>
                          {" "}signed in
                          {item.detail && (
                            <span className="text-slate-400"> — {item.detail}</span>
                          )}
                        </>
                      )}
                      {item.type === "tenant_created" && (
                        <>
                          New tenant{" "}
                          <span className="font-medium text-violet-300">{item.target}</span>
                          {" "}was created
                        </>
                      )}
                      {item.type !== "login" && item.type !== "tenant_created" && (
                        <>
                          <span className="font-medium">{item.actor || "System"}</span>
                          {" — "}{item.detail || item.type}
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <Badge variant="outline" className="text-xs text-slate-500 border-slate-700">
                        {item.type.replace("_", " ")}
                      </Badge>
                      {item.actor && item.type !== "login" && (
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <User className="w-3 h-3" />{item.actor}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timestamp ? relativeTime(item.timestamp!) : "—"}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-0.5">
                      {item.timestamp ? new Date(item.timestamp!).toLocaleString() : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load more */}
      {items.length >= limit && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLimit((l) => l + 50)}
            className="border-slate-700 text-slate-300"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  )
}
