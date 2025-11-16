"use client"

import React, { useState, useEffect } from "react"
import {
  Wifi,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Check,
  X,
  Loader2,
  Server,
  Activity,
  AlertCircle,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Router = {
  id: string
  name: string
  ipAddress: string
  nasType: string
  secret: string
  status: "online" | "offline" | "error"
  connectedUsers: number
  uptime: string
  location: string
}

const generateMockRouters = (): Router[] => {
  return [
    {
      id: "NAS-001",
      name: "Main Gateway Router",
      ipAddress: "192.168.1.1",
      nasType: "MikroTik",
      secret: "shared-secret-123",
      status: "online",
      connectedUsers: 243,
      uptime: "15d 6h",
      location: "Nairobi HQ",
    },
    {
      id: "NAS-002",
      name: "Westlands Branch Router",
      ipAddress: "192.168.2.1",
      nasType: "Cisco",
      secret: "shared-secret-456",
      status: "online",
      connectedUsers: 89,
      uptime: "8d 12h",
      location: "Westlands",
    },
    {
      id: "NAS-003",
      name: "Eastlands Distribution",
      ipAddress: "192.168.3.1",
      nasType: "MikroTik",
      secret: "shared-secret-789",
      status: "offline",
      connectedUsers: 0,
      uptime: "0d 0h",
      location: "Eastlands",
    },
    {
      id: "NAS-004",
      name: "CBD Core Router",
      ipAddress: "192.168.4.1",
      nasType: "Ubiquiti",
      secret: "shared-secret-abc",
      status: "online",
      connectedUsers: 156,
      uptime: "22d 4h",
      location: "CBD",
    },
    {
      id: "NAS-005",
      name: "Satellite Link Router",
      ipAddress: "192.168.5.1",
      nasType: "MikroTik",
      secret: "shared-secret-def",
      status: "error",
      connectedUsers: 12,
      uptime: "2d 8h",
      location: "Remote Site",
    },
  ]
}

export default function RoutersPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routers, setRouters] = useState<Router[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRouter, setEditingRouter] = useState<Router | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    ipAddress: "",
    nasType: "MikroTik",
    secret: "",
    location: "",
  })

  useEffect(() => {
    const loadRouters = async () => {
      try {
        setLoading(true)
        setError(null)
        await new Promise((resolve) => setTimeout(resolve, 600))
        setRouters(generateMockRouters())
      } catch (err) {
        setError("Failed to load routers. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadRouters()
  }, [])

  const getStatusBadge = (status: Router["status"]) => {
    const variants = {
      online: { color: "bg-green-100 text-green-700 border-green-200", icon: Check },
      offline: { color: "bg-slate-100 text-slate-700 border-slate-200", icon: X },
      error: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle },
    }
    const variant = variants[status]
    const Icon = variant.icon

    return (
      <Badge variant="outline" className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleAddRouter = () => {
    setEditingRouter(null)
    setFormData({
      name: "",
      ipAddress: "",
      nasType: "MikroTik",
      secret: "",
      location: "",
    })
    setDialogOpen(true)
  }

  const handleEditRouter = (router: Router) => {
    setEditingRouter(router)
    setFormData({
      name: router.name,
      ipAddress: router.ipAddress,
      nasType: router.nasType,
      secret: router.secret,
      location: router.location,
    })
    setDialogOpen(true)
  }

  const handleSaveRouter = () => {
    // Simulate save
    console.log("Saving router:", formData)
    setDialogOpen(false)
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Routers & NAS Devices</h1>
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Routers & NAS Devices</h1>
          <p className="text-slate-500 mt-1">Manage network access servers and routers</p>
        </div>
        <Button onClick={handleAddRouter}>
          <Plus className="w-4 h-4 mr-2" />
          Add Router
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Routers</CardTitle>
            <Server className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{routers.length}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {routers.filter((r) => r.status === "online").length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <X className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-slate-600">
                {routers.filter((r) => r.status === "offline").length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Wifi className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {routers.reduce((sum, r) => sum + r.connectedUsers, 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Routers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : routers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <Server className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 font-medium">No routers configured</p>
              <p className="text-slate-500 text-sm mt-1">
                Add your first router to get started
              </p>
              <Button className="mt-4" onClick={handleAddRouter}>
                <Plus className="w-4 h-4 mr-2" />
                Add Router
              </Button>
            </CardContent>
          </Card>
        ) : (
          routers.map((router) => (
            <Card key={router.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{router.name}</CardTitle>
                    <CardDescription className="mt-1">{router.id}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditRouter(router)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Status</span>
                    {getStatusBadge(router.status)}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">IP Address</span>
                    <span className="text-sm font-mono font-medium">{router.ipAddress}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">NAS Type</span>
                    <span className="text-sm font-medium">{router.nasType}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Location</span>
                    <span className="text-sm font-medium">{router.location}</span>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-slate-600">Connected Users</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {router.connectedUsers}
                      </span>
                    </div>
                    {router.status === "online" && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-slate-600">Uptime</span>
                        <span className="text-sm font-medium text-green-600">
                          {router.uptime}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Router Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRouter ? "Edit Router" : "Add New Router"}</DialogTitle>
            <DialogDescription>
              {editingRouter
                ? "Update router configuration details"
                : "Configure a new network access server"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Router Name</Label>
              <Input
                id="name"
                placeholder="e.g., Main Gateway Router"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipAddress">IP Address</Label>
              <Input
                id="ipAddress"
                placeholder="e.g., 192.168.1.1"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nasType">NAS Type</Label>
              <Select
                value={formData.nasType}
                onValueChange={(value) => setFormData({ ...formData, nasType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MikroTik">MikroTik</SelectItem>
                  <SelectItem value="Cisco">Cisco</SelectItem>
                  <SelectItem value="Ubiquiti">Ubiquiti</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Shared Secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Enter shared secret"
                value={formData.secret}
                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Nairobi HQ"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRouter}>
              {editingRouter ? "Update Router" : "Add Router"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
