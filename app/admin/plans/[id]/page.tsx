"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Edit,
  Package,
  Users,
  DollarSign,
  Clock,
  Wifi,
  ArrowUpDown,
  TrendingUp,
  Calendar,
  Globe,
  Zap,
  Settings,
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
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()

  // Mock data
  const plan = {
    id: params.id,
    name: "Premium 50Mbps",
    description: "High-speed internet plan for power users with unlimited data",
    price: 3500,
    type: "pppoe",
    speed: {
      download: 50,
      upload: 25,
    },
    dataLimit: null, // null = unlimited
    validity: 30,
    status: "active",
    createdAt: "2023-06-15",
    fupPolicy: "After 500GB, speed reduced to 10Mbps",
    features: [
      "50Mbps Download Speed",
      "25Mbps Upload Speed",
      "Unlimited Data",
      "24/7 Support",
      "Free Installation",
    ],
    activeSubscribers: 156,
    totalRevenue: 546000,
    churnRate: 2.5,
  }

  const subscribers = [
    { id: 1, name: "John Doe", username: "john.doe", joinedAt: "2024-01-10", status: "active", usageGB: 125 },
    { id: 2, name: "Jane Smith", username: "jane.smith", joinedAt: "2024-01-08", status: "active", usageGB: 89 },
    { id: 3, name: "Mike Wilson", username: "mike.w", joinedAt: "2024-01-05", status: "expired", usageGB: 256 },
    { id: 4, name: "Sarah Johnson", username: "sarah.j", joinedAt: "2024-01-02", status: "active", usageGB: 178 },
    { id: 5, name: "Tom Brown", username: "tom.b", joinedAt: "2023-12-28", status: "active", usageGB: 312 },
  ]

  const revenueHistory = [
    { month: "Jan 2024", subscribers: 156, revenue: 546000 },
    { month: "Dec 2023", subscribers: 148, revenue: 518000 },
    { month: "Nov 2023", subscribers: 142, revenue: 497000 },
    { month: "Oct 2023", subscribers: 135, revenue: 472500 },
    { month: "Sep 2023", subscribers: 128, revenue: 448000 },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{plan.name}</h1>
            <Badge className={plan.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}>
              {plan.status}
            </Badge>
            <Badge variant="outline" className="uppercase">{plan.type}</Badge>
          </div>
          <p className="text-slate-600 mt-1">{plan.description}</p>
        </div>
        <Button asChild>
          <Link href={`/admin/plans/${params.id}/edit`}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Plan
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Price</p>
                <p className="text-2xl font-bold text-slate-900">KSh {plan.price.toLocaleString()}</p>
                <p className="text-xs text-slate-500">per {plan.validity} days</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Subscribers</p>
                <p className="text-2xl font-bold text-slate-900">{plan.activeSubscribers}</p>
                <p className="text-xs text-green-600">+12 this month</p>
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
                <p className="text-sm text-slate-500">Monthly Revenue</p>
                <p className="text-2xl font-bold text-slate-900">KSh {plan.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">+5.4% from last month</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Churn Rate</p>
                <p className="text-2xl font-bold text-slate-900">{plan.churnRate}%</p>
                <p className="text-xs text-green-600">Below average</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <ArrowUpDown className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Plan Details</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers ({plan.activeSubscribers})</TabsTrigger>
          <TabsTrigger value="revenue">Revenue History</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Speed Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Download Speed</span>
                  <span className="font-medium">{plan.speed.download} Mbps</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Upload Speed</span>
                  <span className="font-medium">{plan.speed.upload} Mbps</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Data Limit</span>
                  <span className="font-medium">{plan.dataLimit || "Unlimited"}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Validity Period</span>
                  <span className="font-medium">{plan.validity} days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  FUP Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">{plan.fupPolicy}</p>
                <Separator className="my-4" />
                <h4 className="font-medium mb-3">Plan Features</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <Zap className="w-4 h-4 text-blue-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Plan Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-slate-500">Plan ID</p>
                    <p className="font-medium">{plan.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Connection Type</p>
                    <p className="font-medium uppercase">{plan.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Created Date</p>
                    <p className="font-medium">{new Date(plan.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Status</p>
                    <Badge className={plan.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100"}>
                      {plan.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscribers Tab */}
        <TabsContent value="subscribers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscribers</CardTitle>
              <CardDescription>Users currently subscribed to this plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Usage (GB)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.name}</TableCell>
                      <TableCell>{sub.username}</TableCell>
                      <TableCell>{new Date(sub.joinedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{sub.usageGB} GB</TableCell>
                      <TableCell>
                        <Badge className={sub.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/users/${sub.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue History</CardTitle>
              <CardDescription>Monthly revenue and subscriber trends</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Subscribers</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueHistory.map((item, index) => {
                    const prevRevenue = revenueHistory[index + 1]?.revenue || item.revenue
                    const growth = ((item.revenue - prevRevenue) / prevRevenue * 100).toFixed(1)
                    return (
                      <TableRow key={item.month}>
                        <TableCell className="font-medium">{item.month}</TableCell>
                        <TableCell>{item.subscribers}</TableCell>
                        <TableCell>KSh {item.revenue.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={parseFloat(growth) >= 0 ? "text-green-600" : "text-red-600"}>
                            {parseFloat(growth) >= 0 ? "+" : ""}{growth}%
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
