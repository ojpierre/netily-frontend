"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Router,
  TrendingUp,
  Calendar,
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
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function RouterSLAPage() {
  const router = useRouter()

  const slaOverview = {
    overallUptime: 99.87,
    avgResponseTime: 12,
    totalIncidents: 3,
    resolvedIncidents: 2,
    mttr: 45, // Mean Time To Repair in minutes
  }

  const routerSLA = [
    { id: 1, name: "Router-001", uptime: 99.95, responseTime: 8, incidents: 0, status: "excellent" },
    { id: 2, name: "Router-002", uptime: 99.82, responseTime: 15, incidents: 1, status: "good" },
    { id: 3, name: "Router-003", uptime: 98.50, responseTime: 45, incidents: 2, status: "warning" },
    { id: 4, name: "Router-004", uptime: 99.91, responseTime: 10, incidents: 0, status: "excellent" },
  ]

  const incidents = [
    { id: 1, router: "Router-003", type: "Outage", duration: "2h 15m", date: "2024-01-14", status: "resolved", impact: "High" },
    { id: 2, router: "Router-002", type: "Degradation", duration: "45m", date: "2024-01-12", status: "resolved", impact: "Medium" },
    { id: 3, router: "Router-003", type: "Connectivity", duration: "Ongoing", date: "2024-01-15", status: "open", impact: "Low" },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "bg-green-100 text-green-700"
      case "good": return "bg-blue-100 text-blue-700"
      case "warning": return "bg-yellow-100 text-yellow-700"
      case "critical": return "bg-red-100 text-red-700"
      default: return "bg-slate-100 text-slate-700"
    }
  }

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99.9) return "text-green-600"
    if (uptime >= 99.5) return "text-blue-600"
    if (uptime >= 99) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">SLA Monitoring</h1>
          <p className="text-slate-600 mt-1">Service Level Agreement performance across all routers</p>
        </div>
      </div>

      {/* SLA Overview */}
      <div className="grid grid-cols-5 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Overall Uptime</p>
                <p className={`text-2xl font-bold ${getUptimeColor(slaOverview.overallUptime)}`}>
                  {slaOverview.overallUptime}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg Response</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{slaOverview.avgResponseTime}ms</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Incidents</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{slaOverview.totalIncidents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{slaOverview.resolvedIncidents}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">MTTR</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{slaOverview.mttr}m</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="routers">
        <TabsList>
          <TabsTrigger value="routers">Router Performance</TabsTrigger>
          <TabsTrigger value="incidents">Incidents ({incidents.length})</TabsTrigger>
        </TabsList>

        {/* Router Performance Tab */}
        <TabsContent value="routers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Router SLA Performance</CardTitle>
              <CardDescription>Uptime and response metrics for each router</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Router</TableHead>
                    <TableHead>Uptime (30d)</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Incidents</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routerSLA.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Router className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${getUptimeColor(item.uptime)}`}>
                            {item.uptime}%
                          </span>
                          <div className="w-24">
                            <Progress value={item.uptime} className="h-1.5" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{item.responseTime}ms</TableCell>
                      <TableCell>
                        <Badge variant={item.incidents > 0 ? "destructive" : "secondary"}>
                          {item.incidents}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/routers/${item.id}`)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Incident History</CardTitle>
              <CardDescription>All router-related incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Router</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-medium">{incident.router}</TableCell>
                      <TableCell>{incident.type}</TableCell>
                      <TableCell>{incident.duration}</TableCell>
                      <TableCell>{incident.date}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            incident.impact === "High" ? "bg-red-100 text-red-700" :
                            incident.impact === "Medium" ? "bg-yellow-100 text-yellow-700" :
                            "bg-blue-100 text-blue-700"
                          }
                        >
                          {incident.impact}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={incident.status === "resolved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                          {incident.status}
                        </Badge>
                      </TableCell>
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
