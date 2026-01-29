"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Shield,
  Plus,
  RefreshCw,
  Activity,
  CheckCircle,
  XCircle,
  Download,
  RotateCcw,
  Search,
  Loader2,
  Users,
  Server,
  Upload,
  MoreVertical,
  Play,
  Square,
  Key,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type {
  VPNServer,
  VPNCertificate,
  VPNConnection,
  VPNDashboardStats,
  Customer,
} from "@/lib/types"

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Helper function to format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Helper function to format datetime
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function VPNPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<VPNDashboardStats | null>(null)
  const [server, setServer] = useState<VPNServer | null>(null)
  const [certificates, setCertificates] = useState<VPNCertificate[]>([])
  const [connections, setConnections] = useState<VPNConnection[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("certificates")

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<VPNCertificate | null>(null)
  const [revokeReason, setRevokeReason] = useState("")

  // Form state
  const [formLoading, setFormLoading] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [validityDays, setValidityDays] = useState("365")

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [statsRes, serverRes, certsRes, connectionsRes, customersRes] = await Promise.all([
        adminApi.getVPNDashboard().catch(() => null),
        adminApi.getVPNServer().catch(() => null),
        adminApi.getVPNCertificates().catch(() => ({ results: [] })),
        adminApi.getVPNConnections().catch(() => []),
        adminApi.getCustomers({ page_size: "100" }).catch(() => ({ results: [] })),
      ])

      setStats(statsRes)
      setServer(serverRes)
      setCertificates(certsRes.results || [])
      setConnections(connectionsRes || [])
      setCustomers(customersRes.results || [])
    } catch (error) {
      console.error("Failed to fetch VPN data:", error)
      toast.error("Failed to load VPN data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter certificates
  const filteredCertificates = certificates.filter((cert) => {
    const matchesSearch =
      cert.common_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Server actions
  const handleStartServer = async () => {
    if (!server) {
      toast.error("No VPN server configured")
      return
    }
    try {
      await adminApi.startVPNServer(server.id)
      toast.success("VPN server started")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to start server")
    }
  }

  const handleStopServer = async () => {
    if (!server) {
      toast.error("No VPN server configured")
      return
    }
    try {
      await adminApi.stopVPNServer(server.id)
      toast.success("VPN server stopped")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to stop server")
    }
  }

  // Certificate actions
  const handleCreateCertificate = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer")
      return
    }

    try {
      setFormLoading(true)
      const result = await adminApi.createVPNCertificate({
        customer_id: parseInt(selectedCustomerId),
        validity_days: parseInt(validityDays),
      })
      toast.success("Certificate created successfully")
      setCreateDialogOpen(false)
      setSelectedCustomerId("")
      setValidityDays("365")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to create certificate")
    } finally {
      setFormLoading(false)
    }
  }

  const handleRevokeCertificate = async () => {
    if (!selectedCertificate) return

    try {
      setFormLoading(true)
      await adminApi.revokeVPNCertificate(selectedCertificate.id, revokeReason)
      toast.success("Certificate revoked")
      setRevokeDialogOpen(false)
      setSelectedCertificate(null)
      setRevokeReason("")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke certificate")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDownloadConfig = async (cert: VPNCertificate) => {
    try {
      const blob = await adminApi.downloadVPNConfig(cert.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${cert.common_name}.ovpn`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Config downloaded")
    } catch (error: any) {
      toast.error(error.message || "Failed to download config")
    }
  }

  const handleDisconnectUser = async (commonName: string) => {
    try {
      await adminApi.disconnectVPNUser(commonName)
      toast.success("User disconnected")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect user")
    }
  }

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "revoked":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Revoked</Badge>
      case "expired":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">VPN Management</h1>
          <p className="text-muted-foreground">
            Manage OpenVPN server and client certificates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Certificate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stats?.server_status === "running" ? (
                <>
                  <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-2xl font-bold text-green-600">Running</span>
                </>
              ) : stats?.server_status === "stopped" ? (
                <>
                  <div className="h-3 w-3 bg-gray-400 rounded-full" />
                  <span className="text-2xl font-bold text-gray-600">Stopped</span>
                </>
              ) : (
                <>
                  <div className="h-3 w-3 bg-red-500 rounded-full" />
                  <span className="text-2xl font-bold text-red-600">Error</span>
                </>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              {stats?.server_status !== "running" ? (
                <Button size="sm" variant="outline" onClick={handleStartServer}>
                  <Play className="h-3 w-3 mr-1" /> Start
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleStopServer}>
                  <Square className="h-3 w-3 mr-1" /> Stop
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_connections || 0}</div>
            <p className="text-xs text-muted-foreground">
              Users currently connected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_certificates || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.revoked_certificates || 0} revoked, {stats?.expired_certificates || 0} expired
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Traffic</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <div className="flex items-center gap-2">
                <Download className="h-3 w-3 text-green-500" />
                <span>{formatBytes(stats?.total_bytes_in || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Upload className="h-3 w-3 text-blue-500" />
                <span>{formatBytes(stats?.total_bytes_out || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="certificates">
            <Key className="h-4 w-4 mr-2" />
            Certificates ({certificates.length})
          </TabsTrigger>
          <TabsTrigger value="connections">
            <Wifi className="h-4 w-4 mr-2" />
            Active Connections ({connections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search certificates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Certificates Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Common Name</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No certificates found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCertificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.common_name}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cert.customer_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{cert.customer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(cert.status)}</TableCell>
                      <TableCell>{formatDate(cert.issued_at)}</TableCell>
                      <TableCell>{formatDate(cert.expires_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadConfig(cert)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download Config
                            </DropdownMenuItem>
                            {cert.status === "active" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedCertificate(cert)
                                    setRevokeDialogOpen(true)
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Revoke
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Real IP</TableHead>
                  <TableHead>Virtual IP</TableHead>
                  <TableHead>Connected Since</TableHead>
                  <TableHead>Traffic</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No active connections
                    </TableCell>
                  </TableRow>
                ) : (
                  connections.map((conn) => (
                    <TableRow key={conn.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{conn.common_name}</div>
                          {conn.customer_name && (
                            <div className="text-xs text-muted-foreground">{conn.customer_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{conn.real_address}</TableCell>
                      <TableCell className="font-mono text-sm">{conn.virtual_address}</TableCell>
                      <TableCell>{formatDateTime(conn.connected_since)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3 text-green-500" />
                            {formatBytes(conn.bytes_received)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Upload className="h-3 w-3 text-blue-500" />
                            {formatBytes(conn.bytes_sent)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDisconnectUser(conn.common_name)}
                        >
                          <WifiOff className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Certificate Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create VPN Certificate</DialogTitle>
            <DialogDescription>
              Generate a new VPN certificate for a customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 ? (
                    <SelectItem value="no-customers" disabled>No customers available</SelectItem>
                  ) : (
                    customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.full_name} ({customer.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="validity">Validity (days)</Label>
              <Input
                id="validity"
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                min="1"
                max="3650"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCertificate} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Certificate Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Certificate</DialogTitle>
            <DialogDescription>
              This will permanently revoke the certificate for{" "}
              <strong>{selectedCertificate?.common_name}</strong>. The user will no longer be
              able to connect using this certificate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Revocation Reason (optional)</Label>
              <Textarea
                id="reason"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Enter reason for revocation..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevokeCertificate} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Revoke Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
