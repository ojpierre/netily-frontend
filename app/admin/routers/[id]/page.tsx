"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Edit,
  Router,
  Wifi,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Signal,
  Cpu,
  HardDrive,
  Thermometer,
  Network,
  RefreshCw,
  Power,
  Terminal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function RouterDetailPage() {
  const params = useParams()
  const router = useRouter()

  const routerData = {
    id: params.id,
    name: "Router-001",
    identity: "Main Office Router",
    ip: "192.168.1.1",
    model: "MikroTik CCR1036-8G-2S+",
    version: "RouterOS v7.12",
    status: "online",
    uptime: "45 days, 12:30:15",
    lastSeen: "2024-01-15 15:45:30",
    cpu: 35,
    memory: 62,
    temperature: 48,
    totalUsers: 156,
    activeUsers: 142,
    bandwidth: {
      download: 450,
      upload: 180,
      maxDownload: 1000,
      maxUpload: 500,
    },
    interfaces: [
      { name: "ether1", status: "running", rxRate: "450 Mbps", txRate: "180 Mbps", type: "WAN" },
      { name: "ether2", status: "running", rxRate: "125 Mbps", txRate: "45 Mbps", type: "LAN" },
      { name: "ether3", status: "running", rxRate: "98 Mbps", txRate: "32 Mbps", type: "LAN" },
      { name: "ether4", status: "disabled", rxRate: "0", txRate: "0", type: "LAN" },
      { name: "sfp1", status: "running", rxRate: "227 Mbps", txRate: "103 Mbps", type: "Uplink" },
    ],
    recentLogs: [
      { time: "15:45:30", level: "info", message: "User john.doe connected via PPPoE" },
      { time: "15:42:15", level: "warning", message: "High CPU usage detected (85%)" },
      { time: "15:40:00", level: "info", message: "Scheduled backup completed" },
      { time: "15:35:22", level: "info", message: "User jane.smith disconnected" },
      { time: "15:30:00", level: "info", message: "System health check passed" },
    ],
  }

  const handleReboot = () => {
    toast.success("Router reboot initiated")
  }

  const handleRefresh = () => {
    toast.success("Refreshing router data...")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{routerData.name}</h1>
            <Badge className={routerData.status === "online" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
              {routerData.status}
            </Badge>
          </div>
          <p className="text-slate-600 mt-1">{routerData.identity} • {routerData.ip}</p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/admin/routers/${params.id}/edit`}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">CPU Usage</p>
                <p className="text-2xl font-bold text-slate-900">{routerData.cpu}%</p>
              </div>
              <Cpu className="w-8 h-8 text-blue-600" />
            </div>
            <Progress value={routerData.cpu} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Memory</p>
                <p className="text-2xl font-bold text-slate-900">{routerData.memory}%</p>
              </div>
              <HardDrive className="w-8 h-8 text-purple-600" />
            </div>
            <Progress value={routerData.memory} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Temperature</p>
                <p className="text-2xl font-bold text-slate-900">{routerData.temperature}°C</p>
              </div>
              <Thermometer className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Users</p>
                <p className="text-2xl font-bold text-slate-900">{routerData.activeUsers}</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Uptime</p>
                <p className="text-lg font-bold text-slate-900">45d 12h</p>
              </div>
              <Clock className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
          <TabsTrigger value="users">Users ({routerData.activeUsers})</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Router className="w-5 h-5" />
                  Device Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Model</span>
                  <span className="font-medium">{routerData.model}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-slate-500">Version</span>
                  <span className="font-medium">{routerData.version}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-slate-500">IP Address</span>
                  <span className="font-medium">{routerData.ip}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-slate-500">Uptime</span>
                  <span className="font-medium">{routerData.uptime}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Seen</span>
                  <span className="font-medium">{routerData.lastSeen}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Bandwidth Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-500">Download</span>
                    <span className="font-medium">{routerData.bandwidth.download} / {routerData.bandwidth.maxDownload} Mbps</span>
                  </div>
                  <Progress value={(routerData.bandwidth.download / routerData.bandwidth.maxDownload) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-500">Upload</span>
                    <span className="font-medium">{routerData.bandwidth.upload} / {routerData.bandwidth.maxUpload} Mbps</span>
                  </div>
                  <Progress value={(routerData.bandwidth.upload / routerData.bandwidth.maxUpload) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button variant="outline">
                  <Terminal className="w-4 h-4 mr-2" />
                  Open Terminal
                </Button>
                <Button variant="outline">
                  <Network className="w-4 h-4 mr-2" />
                  View Firewall
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleReboot}>
                  <Power className="w-4 h-4 mr-2" />
                  Reboot Router
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Interfaces Tab */}
        <TabsContent value="interfaces" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Network Interfaces</CardTitle>
              <CardDescription>All network interfaces on this router</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interface</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>RX Rate</TableHead>
                    <TableHead>TX Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routerData.interfaces.map((iface) => (
                    <TableRow key={iface.name}>
                      <TableCell className="font-medium">{iface.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{iface.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={iface.status === "running" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}>
                          {iface.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{iface.rxRate}</TableCell>
                      <TableCell>{iface.txRate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Users</CardTitle>
              <CardDescription>{routerData.activeUsers} users currently connected</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 text-center py-8">
                User list would be loaded from the router API
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
              <CardDescription>Latest system events from this router</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Time</TableHead>
                    <TableHead className="w-24">Level</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routerData.recentLogs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{log.time}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            log.level === "warning" ? "bg-yellow-100 text-yellow-700" :
                            log.level === "error" ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"
                          }
                        >
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
