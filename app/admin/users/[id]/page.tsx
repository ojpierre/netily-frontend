"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Edit,
  Trash2,
  MoreVertical,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Wifi,
  Package,
  CreditCard,
  Clock,
  Activity,
  TrendingUp,
  Gift,
  Ban,
  CheckCircle,
  XCircle,
  Download,
  Send,
  RefreshCw,
  History,
  Settings,
  Signal,
  HardDrive,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Mock user data
const mockUser = {
  id: "1",
  username: "john.doe",
  fullName: "John Doe",
  email: "john.doe@example.com",
  phone: "+254712345678",
  address: "123 Main Street, Nairobi",
  type: "pppoe",
  status: "active",
  balance: 2500,
  loyaltyPoints: 450,
  package: {
    name: "Premium 50Mbps",
    speedDown: 50,
    speedUp: 25,
    price: 3500,
  },
  router: "Router-001",
  expiryDate: "2024-02-15",
  createdAt: "2023-06-15",
  lastSeen: "2024-01-15 14:30:00",
  pppoeUsername: "john.doe@netily",
  staticIp: null,
  macAddress: "AA:BB:CC:DD:EE:FF",
  totalPayments: 42000,
  totalSessions: 156,
  avgSessionDuration: "4.5 hours",
  dataUsedThisMonth: 85.5,
  dataLimitThisMonth: 500,
}

const mockSessions = [
  {
    id: "1",
    startTime: "2024-01-15 08:00:00",
    endTime: "2024-01-15 12:30:00",
    duration: "4h 30m",
    dataUsed: "2.5 GB",
    ipAddress: "100.64.1.45",
  },
  {
    id: "2",
    startTime: "2024-01-14 14:00:00",
    endTime: "2024-01-14 22:15:00",
    duration: "8h 15m",
    dataUsed: "5.2 GB",
    ipAddress: "100.64.1.45",
  },
  {
    id: "3",
    startTime: "2024-01-13 09:30:00",
    endTime: "2024-01-13 18:00:00",
    duration: "8h 30m",
    dataUsed: "4.8 GB",
    ipAddress: "100.64.1.45",
  },
]

const mockPayments = [
  {
    id: "1",
    date: "2024-01-10",
    amount: 3500,
    method: "M-Pesa",
    reference: "QRB45TY789",
    status: "completed",
  },
  {
    id: "2",
    date: "2023-12-10",
    amount: 3500,
    method: "M-Pesa",
    reference: "PQR12ST456",
    status: "completed",
  },
  {
    id: "3",
    date: "2023-11-10",
    amount: 3500,
    method: "Card",
    reference: "TXN789012",
    status: "completed",
  },
]

const mockTickets = [
  {
    id: "TKT-001",
    subject: "Slow internet speed",
    status: "resolved",
    createdAt: "2024-01-05",
  },
  {
    id: "TKT-002",
    subject: "Connection dropping",
    status: "open",
    createdAt: "2024-01-12",
  },
]

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false)

  const user = mockUser

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>
      case "expired":
        return <Badge className="bg-red-100 text-red-700">Expired</Badge>
      case "suspended":
        return <Badge className="bg-yellow-100 text-yellow-700">Suspended</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "hotspot":
        return <Badge variant="outline" className="border-blue-200 text-blue-700">Hotspot</Badge>
      case "pppoe":
        return <Badge variant="outline" className="border-purple-200 text-purple-700">PPPoE</Badge>
      case "static":
        return <Badge variant="outline" className="border-orange-200 text-orange-700">Static IP</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
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
            <h1 className="text-3xl font-bold text-slate-900">{user.fullName}</h1>
            {getTypeBadge(user.type)}
            {getStatusBadge(user.status)}
          </div>
          <p className="text-slate-600 mt-1">User ID: {params.id} • Joined {user.createdAt}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsDisconnectDialogOpen(true)}>
            <Ban className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
          <Link href={`/admin/users/${params.id}/edit`}>
            <Button>
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Send className="w-4 h-4 mr-2" />
                Send SMS
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Balance</p>
                <p className="text-xl font-bold">KSh {user.balance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Loyalty Points</p>
                <p className="text-xl font-bold">{user.loyaltyPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Data Used</p>
                <p className="text-xl font-bold">{user.dataUsedThisMonth} GB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Expires</p>
                <p className="text-xl font-bold">{user.expiryDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-xl bg-blue-100 text-blue-700">
                      {user.fullName.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">{user.fullName}</p>
                    <p className="text-slate-500">@{user.username}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{user.address}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Info */}
            <Card>
              <CardHeader>
                <CardTitle>Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Connection Type</p>
                    <p className="font-medium capitalize">{user.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Router</p>
                    <p className="font-medium">{user.router}</p>
                  </div>
                  {user.pppoeUsername && (
                    <div>
                      <p className="text-sm text-slate-500">PPPoE Username</p>
                      <p className="font-medium font-mono">{user.pppoeUsername}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">MAC Address</p>
                    <p className="font-medium font-mono">{user.macAddress}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-slate-500 mb-2">Last Seen</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-medium">Online Now</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Package Info */}
            <Card>
              <CardHeader>
                <CardTitle>Current Package</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{user.package.name}</h3>
                      <p className="text-slate-500">KSh {user.package.price}/month</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Download</p>
                      <p className="font-bold text-lg">{user.package.speedDown} Mbps</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Upload</p>
                      <p className="font-bold text-lg">{user.package.speedUp} Mbps</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-slate-500">Data Usage This Month</span>
                    <span className="font-medium">{user.dataUsedThisMonth} / {user.dataLimitThisMonth} GB</span>
                  </div>
                  <Progress value={(user.dataUsedThisMonth / user.dataLimitThisMonth) * 100} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Total Sessions</p>
                    <p className="font-bold text-lg">{user.totalSessions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Avg Session Duration</p>
                    <p className="font-bold text-lg">{user.avgSessionDuration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Payments</p>
                    <p className="font-bold text-lg">KSh {user.totalPayments.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Member Since</p>
                    <p className="font-bold text-lg">{user.createdAt}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
              <CardDescription>Recent connection sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Data Used</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{session.startTime}</TableCell>
                      <TableCell>{session.endTime}</TableCell>
                      <TableCell>{session.duration}</TableCell>
                      <TableCell>{session.dataUsed}</TableCell>
                      <TableCell className="font-mono">{session.ipAddress}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All transactions for this user</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell className="font-medium">KSh {payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell className="font-mono">{payment.reference}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700">Completed</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>Tickets raised by this user</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono">{ticket.id}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell>
                        <Badge className={ticket.status === "open" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {user.fullName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive">Delete User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Dialog */}
      <Dialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect User</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect {user.fullName} from the network?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDisconnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive">
              <Ban className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
