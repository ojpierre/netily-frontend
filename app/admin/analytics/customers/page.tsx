"use client"

import React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  TrendingUp,
  TrendingDown,
  MapPin,
  Package,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
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

export default function CustomerAnalyticsPage() {
  const router = useRouter()

  const customerStats = {
    total: 1456,
    active: 1289,
    new: 87,
    churned: 23,
    growthRate: 4.2,
    retentionRate: 96.5,
    avgLifetime: 18,
    ltv: 51300,
  }

  const customersByPlan = [
    { plan: "Premium 100Mbps", count: 250, percentage: 17, growth: 8.5 },
    { plan: "Premium 50Mbps", count: 300, percentage: 21, growth: 12.3 },
    { plan: "Basic 20Mbps", count: 490, percentage: 34, growth: 5.2 },
    { plan: "Basic 10Mbps", count: 400, percentage: 27, growth: -2.1 },
    { plan: "Enterprise", count: 16, percentage: 1, growth: 15.0 },
  ]

  const customersByLocation = [
    { location: "Westlands", count: 345, percentage: 24 },
    { location: "Kilimani", count: 289, percentage: 20 },
    { location: "Karen", count: 198, percentage: 14 },
    { location: "Lavington", count: 176, percentage: 12 },
    { location: "Kileleshwa", count: 158, percentage: 11 },
    { location: "Others", count: 290, percentage: 19 },
  ]

  const cohortData = [
    { cohort: "Jan 2024", acquired: 87, month1: 95, month2: 92, month3: 0 },
    { cohort: "Dec 2023", acquired: 72, month1: 93, month2: 89, month3: 86 },
    { cohort: "Nov 2023", acquired: 65, month1: 94, month2: 90, month3: 87 },
    { cohort: "Oct 2023", acquired: 58, month1: 92, month2: 88, month3: 85 },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Customer Analytics</h1>
          <p className="text-slate-600 mt-1">Customer growth, retention, and segmentation</p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Customers</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{customerStats.total.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+{customerStats.growthRate}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">New This Month</p>
                <p className="text-2xl font-bold text-green-600">+{customerStats.new}</p>
                <p className="text-xs text-slate-500 mt-1">acquisitions</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Churned</p>
                <p className="text-2xl font-bold text-red-600">-{customerStats.churned}</p>
                <p className="text-xs text-slate-500 mt-1">this month</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <UserMinus className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Retention Rate</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{customerStats.retentionRate}%</p>
                <p className="text-xs text-green-600 mt-1">Above target</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Avg Customer Lifetime</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{customerStats.avgLifetime} months</p>
              </div>
              <Clock className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Customer LTV</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">KSh {customerStats.ltv.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="by-plan">
        <TabsList>
          <TabsTrigger value="by-plan">By Plan</TabsTrigger>
          <TabsTrigger value="by-location">By Location</TabsTrigger>
          <TabsTrigger value="cohort">Cohort Analysis</TabsTrigger>
        </TabsList>

        {/* By Plan Tab */}
        <TabsContent value="by-plan" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Customers by Plan</CardTitle>
              <CardDescription>Distribution across service plans</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Distribution</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersByPlan.map((item) => (
                    <TableRow key={item.plan}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{item.plan}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={item.percentage} className="w-20 h-2" />
                          <span className="text-sm text-slate-500">{item.percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.growth >= 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                          )}
                          <span className={item.growth >= 0 ? "text-green-600" : "text-red-600"}>
                            {item.growth >= 0 ? "+" : ""}{item.growth}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Location Tab */}
        <TabsContent value="by-location" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Customers by Location</CardTitle>
              <CardDescription>Geographic distribution of customers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Distribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customersByLocation.map((item) => (
                    <TableRow key={item.location}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{item.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.count}</TableCell>
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

        {/* Cohort Tab */}
        <TabsContent value="cohort" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Retention Analysis</CardTitle>
              <CardDescription>Customer retention by signup month</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort</TableHead>
                    <TableHead>Acquired</TableHead>
                    <TableHead>Month 1</TableHead>
                    <TableHead>Month 2</TableHead>
                    <TableHead>Month 3</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohortData.map((item) => (
                    <TableRow key={item.cohort}>
                      <TableCell className="font-medium">{item.cohort}</TableCell>
                      <TableCell>{item.acquired}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">{item.month1}%</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-700">{item.month2}%</Badge>
                      </TableCell>
                      <TableCell>
                        {item.month3 > 0 ? (
                          <Badge className="bg-purple-100 text-purple-700">{item.month3}%</Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
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
