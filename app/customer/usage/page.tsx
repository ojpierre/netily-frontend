"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  Download,
  Upload,
  Activity,
  Wifi,
  Calendar,
  TrendingUp,
} from "lucide-react"
import { customerApi } from "@/lib/customer-api"

interface UsageData {
  data_used: string
  data_limit: string | null
  percentage: number
  download_total?: string
  upload_total?: string
  sessions?: Array<{
    id: number
    start_time: string
    stop_time?: string
    download: string
    upload: string
    duration?: string
    nas_ip?: string
  }>
}

export default function CustomerUsagePage() {
  const router = useRouter()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("customerToken")
    if (!token) {
      router.push("/customer/login")
      return
    }

    const fetchUsage = async () => {
      try {
        setIsLoading(true)
        const data = await customerApi.getUsage()
        setUsage(data)
      } catch (err: any) {
        if (err.message?.includes("401")) {
          router.push("/customer/login")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsage()
  }, [router])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Usage</h1>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32" />
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-3 w-48" />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Usage</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor your internet usage and session history
        </p>
      </div>

      {/* Usage Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary/15 dark:bg-blue-950 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary dark:text-primary/80" />
            </div>
            <p className="text-sm text-muted-foreground">Data Used</p>
          </div>
          <p className="text-2xl font-bold">{usage?.data_used || "0 MB"}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-success/15 dark:bg-green-950 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-success dark:text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Downloaded</p>
          </div>
          <p className="text-2xl font-bold">{usage?.download_total || usage?.data_used || "0 MB"}</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-950 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm text-muted-foreground">Uploaded</p>
          </div>
          <p className="text-2xl font-bold">{usage?.upload_total || "0 MB"}</p>
        </Card>
      </div>

      {/* Data Cap Progress */}
      {usage?.data_limit && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Data Cap</h3>
            <Badge variant="outline">
              {usage.data_used} / {usage.data_limit}
            </Badge>
          </div>
          <Progress value={usage.percentage} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{usage.percentage.toFixed(1)}% used</span>
            <span>{(100 - usage.percentage).toFixed(1)}% remaining</span>
          </div>
          {usage.percentage >= 80 && (
            <div className="mt-3 p-3 bg-warning/10 dark:bg-orange-950 rounded-lg">
              <p className="text-sm text-warning dark:text-warning">
                {usage.percentage >= 100
                  ? "You have exceeded your data cap. Your speed may be throttled."
                  : "You are approaching your data limit. Consider upgrading your plan."}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Session History */}
      {usage?.sessions && usage.sessions.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Recent Sessions</h3>
          <div className="space-y-2">
            {usage.sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/15 dark:bg-blue-950 rounded-full flex items-center justify-center">
                    <Wifi className="w-4 h-4 text-primary dark:text-primary/80" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(session.start_time).toLocaleDateString("en-KE", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                      {session.stop_time && (
                        <> — {new Date(session.stop_time).toLocaleTimeString("en-KE", {
                          hour: "2-digit", minute: "2-digit",
                        })}</>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.duration && `Duration: ${session.duration}`}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-success dark:text-success">↓ {session.download}</p>
                  <p className="text-purple-600 dark:text-purple-400">↑ {session.upload}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
