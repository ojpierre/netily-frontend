import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Cpu, HardDrive, Users, Activity, MapPin, Shield, FileText } from "lucide-react"

const routers = {
  "1": {
    name: "Westlands POP",
    ip: "10.10.0.1",
    location: "Westlands",
    model: "CCR1036",
    status: "online",
    uptime: "45d 12h",
    cpu: 32,
    memory: 46,
    users: 124,
    notes: "Primary aggregation router serving the Westlands cluster.",
    sessions: [
      { name: "Alice Wanjiru", ip: "172.16.0.12", plan: "Home 10Mbps", uptime: "3h 14m" },
      { name: "James Mwangi", ip: "172.16.0.25", plan: "Family 25Mbps", uptime: "5h 02m" },
      { name: "Grace Akinyi", ip: "172.16.0.61", plan: "Business 50Mbps", uptime: "1h 40m" },
    ],
    interfaces: [
      { name: "ether1-uplink", status: "up", traffic: "420 Mbps" },
      { name: "sfp-subscriber-core", status: "up", traffic: "610 Mbps" },
      { name: "bridge-lan", status: "up", traffic: "188 Mbps" },
    ],
    alerts: [
      "Nightly backup completed successfully.",
      "No SLA breach detected in the last 30 days.",
      "Configuration sync completed 14 minutes ago.",
    ],
  },
  "2": {
    name: "Kilimani Core",
    ip: "10.10.1.1",
    location: "Kilimani",
    model: "CCR2004",
    status: "online",
    uptime: "28d 09h",
    cpu: 41,
    memory: 51,
    users: 98,
    notes: "Handles premium home and SME traffic for the Kilimani zone.",
    sessions: [
      { name: "Mercy Atieno", ip: "172.16.1.18", plan: "Home 10Mbps", uptime: "0h 48m" },
      { name: "Kevin Njoroge", ip: "172.16.1.41", plan: "Business 50Mbps", uptime: "7h 33m" },
    ],
    interfaces: [
      { name: "ether1-uplink", status: "up", traffic: "390 Mbps" },
      { name: "bridge-access", status: "up", traffic: "244 Mbps" },
      { name: "ether6-backup", status: "standby", traffic: "0 Mbps" },
    ],
    alerts: [
      "Backhaul failover tested this week.",
      "Capacity at 62% during peak hours.",
    ],
  },
  "3": {
    name: "Industrial Node",
    ip: "10.10.2.1",
    location: "Industrial Area",
    model: "RB4011",
    status: "warning",
    uptime: "13d 18h",
    cpu: 79,
    memory: 67,
    users: 76,
    notes: "High evening load caused by business park burst usage.",
    sessions: [
      { name: "Orbit Logistics", ip: "172.16.2.10", plan: "Business 50Mbps", uptime: "8h 12m" },
      { name: "Factory Link", ip: "172.16.2.22", plan: "Business 50Mbps", uptime: "2h 03m" },
    ],
    interfaces: [
      { name: "ether1-uplink", status: "up", traffic: "510 Mbps" },
      { name: "bridge-subscriber", status: "up", traffic: "302 Mbps" },
      { name: "ether8-maint", status: "degraded", traffic: "14 Mbps" },
    ],
    alerts: [
      "CPU exceeded 75% twice today.",
      "Maintenance window suggested for queue cleanup.",
    ],
  },
  "4": {
    name: "South B Relay",
    ip: "10.10.3.1",
    location: "South B",
    model: "hEX S",
    status: "offline",
    uptime: "0d 00h",
    cpu: 0,
    memory: 0,
    users: 0,
    notes: "Awaiting power restoration after a local outage.",
    sessions: [],
    interfaces: [
      { name: "ether1-uplink", status: "down", traffic: "0 Mbps" },
      { name: "bridge-lan", status: "down", traffic: "0 Mbps" },
    ],
    alerts: [
      "Router has been offline for 3 hours.",
      "Field team assigned to inspect site power.",
    ],
  },
} as const

export default async function DemoAdminRouterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const router = routers[id as keyof typeof routers]

  if (!router) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 px-0 text-muted-foreground hover:bg-transparent">
            <Link href="/demo/admin/routers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to routers
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{router.name}</h2>
            <Badge>{router.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{router.model} · {router.ip} · {router.location}</p>
        </div>
        <Badge variant="outline" className="w-fit border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
          Demo Router Detail
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Connected users</CardTitle><Users className="h-4 w-4 text-slate-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{router.users}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">CPU</CardTitle><Cpu className="h-4 w-4 text-slate-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{router.cpu}%</div><Progress value={router.cpu} className="mt-3 h-2" /></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Memory</CardTitle><HardDrive className="h-4 w-4 text-slate-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{router.memory}%</div><Progress value={router.memory} className="mt-3 h-2" /></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Uptime</CardTitle><Activity className="h-4 w-4 text-slate-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{router.uptime}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[520px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Router overview</CardTitle>
              <CardDescription>Read-only demo content arranged like the real detail experience.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="mt-1 flex items-center gap-2 font-medium"><MapPin className="h-4 w-4 text-slate-500" />{router.location}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="mt-1 font-medium">{router.status}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm text-muted-foreground">{router.notes}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-600" />SLA posture</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Target uptime: 99.9%</p>
              <p>Monitoring state: synchronized</p>
              <p>Last config backup: 14 minutes ago</p>
              <p>Authentication: demo-trusted</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Connected sessions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {router.sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active sessions in this demo snapshot.</p>
              ) : (
                router.sessions.map((session) => (
                  <div key={`${session.name}-${session.ip}`} className="flex flex-col gap-2 rounded-lg border p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{session.name}</p>
                      <p className="text-xs text-muted-foreground">{session.plan} · {session.ip}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{session.uptime}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interfaces">
          <Card>
            <CardHeader>
              <CardTitle>Interfaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {router.interfaces.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.traffic}</p>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate-500" />Operational notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {router.alerts.map((alert) => (
                <div key={alert} className="rounded-lg border p-3 text-sm text-muted-foreground">
                  {alert}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
