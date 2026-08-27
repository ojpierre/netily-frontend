"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Search, Server, Wifi, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react"

const demoRouters = [
  { id: 1, name: "Westlands POP", ip: "10.10.0.1", location: "Westlands", status: "online", model: "CCR1036", users: 124, uptime: 99.98, cpu: 32 },
  { id: 2, name: "Kilimani Core", ip: "10.10.1.1", location: "Kilimani", status: "online", model: "CCR2004", users: 98, uptime: 99.92, cpu: 41 },
  { id: 3, name: "Industrial Node", ip: "10.10.2.1", location: "Industrial Area", status: "warning", model: "RB4011", users: 76, uptime: 98.73, cpu: 79 },
  { id: 4, name: "South B Relay", ip: "10.10.3.1", location: "South B", status: "offline", model: "hEX S", users: 0, uptime: 94.12, cpu: 0 },
]

const statusStyles: Record<string, string> = {
  online: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  warning: "bg-warning/15 text-warning dark:bg-amber-950/30 dark:text-amber-300",
  offline: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
}

export default function DemoAdminRoutersPage() {
  const [search, setSearch] = useState("")
  const filtered = demoRouters.filter((router) => {
    const q = search.toLowerCase()
    return router.name.toLowerCase().includes(q) || router.location.toLowerCase().includes(q) || router.ip.includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Routers</h2>
          <p className="mt-1 text-sm text-muted-foreground">A demo fleet view shaped like the live network operations page.</p>
        </div>
        <Button variant="outline" disabled>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Demo Snapshot
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total routers</CardTitle><Server className="h-4 w-4 text-slate-500" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">16</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Online</CardTitle><Wifi className="h-4 w-4 text-emerald-600" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">14</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Warnings</CardTitle><AlertTriangle className="h-4 w-4 text-warning" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">1</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Connected users</CardTitle><Server className="h-4 w-4 text-primary" /></CardHeader>
          <CardContent><div className="text-2xl font-bold">461</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle>Router Fleet</CardTitle>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search routers" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filtered.map((router) => (
            <div key={router.id} className="rounded-xl border p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{router.name}</h3>
                    <Badge className={statusStyles[router.status]}>{router.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{router.model} · {router.location} · {router.ip}</p>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/demo/admin/routers/${router.id}`}>
                    View Router
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Active users</p>
                  <p className="text-lg font-semibold">{router.users}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                  <p className="text-lg font-semibold">{router.uptime}%</p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>CPU load</span>
                    <span>{router.cpu}%</span>
                  </div>
                  <Progress value={router.cpu} className="h-2" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
