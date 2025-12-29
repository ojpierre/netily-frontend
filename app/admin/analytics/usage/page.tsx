"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Activity,
  Download,
  Upload,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

export default function UsageAnalyticsPage() {
  const router = useRouter()

  const usageStats = {
    totalDownload: 45.8,
    totalUpload: 12.3,
    peakHour: "20:00",
    avgSessionDuration: 4.5,
    heavyUsers: 156,
    avgDailyUsage: 8.5,
  }

  const hourlyUsage = [
    { hour: "00:00", download: 120, upload: 45, users: 245 },
    { hour: "06:00", download: 180, upload: 65, users: 380 },
    { hour: "12:00", download: 350, upload: 120, users: 650 },
    { hour: "18:00", download: 520, upload: 180, users: 890 },
    { hour: "20:00", download: 680, upload: 230, users: 1120 },
    { hour: "22:00", download: 450, upload: 150, users: 780 },
  ]

  const usageByPlan = [
    { plan: "Premium 100Mbps", avgDownload: 15.2, avgUpload: 4.5, percentage: 35 },
    { plan: "Premium 50Mbps", avgDownload: 10.8, avgUpload: 3.2, percentage: 28 },
    { plan: "Basic 20Mbps", avgDownload: 6.5, avgUpload: 1.8, percentage: 22 },
    { plan: "Basic 10Mbps", avgDownload: 3.2, avgUpload: 0.9, percentage: 12 },
    { plan: "Enterprise", avgDownload: 25.0, avgUpload: 8.5, percentage: 3 },
  ]

  const topUsers = [
    { name: "John Doe", plan: "Premium 100Mbps", download: 850, upload: 230, sessions: 156 },
    { name: "Jane Smith", plan: "Premium 100Mbps", download: 720, upload: 180, sessions: 142 },
    { name: "Mike Wilson", plan: "Premium 50Mbps", download: 580, upload: 145, sessions: 128 },
    { name: "Sarah Johnson", plan: "Premium 50Mbps", download: 520, upload: 130, sessions: 115 },
    { name: "Tom Brown", plan: "Basic 20Mbps", download: 380, upload: 95, sessions: 98 },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">Usage Analytics</h1>
          <p className="text-slate-600 mt-1">Network usage patterns and bandwidth consumption</p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Download</p>
                <p className="text-2xl font-bold text-slate-900">{usageStats.totalDownload} TB</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+8.5%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Upload</p>
                <p className="text-2xl font-bold text-slate-900">{usageStats.totalUpload} TB</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+5.2%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Peak Hour</p>
                <p className="text-2xl font-bold text-slate-900">{usageStats.peakHour}</p>
                <p className="text-xs text-slate-500 mt-1">Highest traffic</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Heavy Users</p>
                <p className="text-2xl font-bold text-slate-900">{usageStats.heavyUsers}</p>
                <p className="text-xs text-slate-500 mt-1">&gt;100GB/month</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="hourly">
        <TabsList>
          <TabsTrigger value="hourly">Hourly Pattern</TabsTrigger>
          <TabsTrigger value="by-plan">By Plan</TabsTrigger>
          <TabsTrigger value="top-users">Top Users</TabsTrigger>
        </TabsList>

        {/* Hourly Tab */}
        <TabsContent value="hourly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Usage Pattern</CardTitle>
              <CardDescription>Network usage throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hour</TableHead>
                    <TableHead>Download (Mbps)</TableHead>
                    <TableHead>Upload (Mbps)</TableHead>
                    <TableHead>Active Users</TableHead>
                    <TableHead>Load</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hourlyUsage.map((item) => (
                    <TableRow key={item.hour}>
                      <TableCell className="font-medium">{item.hour}</TableCell>
                      <TableCell>{item.download}</TableCell>
                      <TableCell>{item.upload}</TableCell>
                      <TableCell>{item.users}</TableCell>
                      <TableCell>
                        <Progress value={(item.download / 700) * 100} className="w-20 h-2" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Plan Tab */}
        <TabsContent value="by-plan" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Usage by Plan</CardTitle>
              <CardDescription>Average bandwidth consumption per plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Avg Download (GB/day)</TableHead>
                    <TableHead>Avg Upload (GB/day)</TableHead>
                    <TableHead>% of Total Traffic</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageByPlan.map((item) => (
                    <TableRow key={item.plan}>
                      <TableCell className="font-medium">{item.plan}</TableCell>
                      <TableCell>{item.avgDownload}</TableCell>
                      <TableCell>{item.avgUpload}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={item.percentage} className="w-20 h-2" />
                          <span className="text-sm text-slate-500">{item.percentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Users Tab */}
        <TabsContent value="top-users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Bandwidth Users</CardTitle>
              <CardDescription>Users with highest data consumption this month</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Download (GB)</TableHead>
                    <TableHead>Upload (GB)</TableHead>
                    <TableHead>Sessions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUsers.map((user, index) => (
                    <TableRow key={user.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.plan}</TableCell>
                      <TableCell>{user.download}</TableCell>
                      <TableCell>{user.upload}</TableCell>
                      <TableCell>{user.sessions}</TableCell>
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
