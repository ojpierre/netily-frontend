"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  Key,
  Plus,
  RefreshCw,
  Activity,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  Users,
  Server,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Wifi,
  WifiOff,
  Shield,
  Settings,
  Clock,
  Download,
  Upload,
  Radio,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
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
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type {
  RADIUSUser,
  RADIUSProfile,
  RADIUSNAS,
  RADIUSAccountingSession,
  RADIUSDashboardStats,
  Customer,
  CustomerRADIUSCredentials,
} from "@/lib/types"

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Helper function to format speed (kbps to Mbps)
function formatSpeed(kbps: number): string {
  if (kbps >= 1000) {
    return `${(kbps / 1000).toFixed(1)} Mbps`
  }
  return `${kbps} Kbps`
}

// Helper function to format duration
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
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

export default function RADIUSPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<RADIUSDashboardStats | null>(null)
  const [users, setUsers] = useState<RADIUSUser[]>([])
  const [profiles, setProfiles] = useState<RADIUSProfile[]>([])
  const [nasList, setNasList] = useState<RADIUSNAS[]>([])
  const [sessions, setSessions] = useState<RADIUSAccountingSession[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [credentials, setCredentials] = useState<CustomerRADIUSCredentials[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("users")

  // Dialogs
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false)
  const [createProfileDialogOpen, setCreateProfileDialogOpen] = useState(false)
  const [createNASDialogOpen, setCreateNASDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [deleteType, setDeleteType] = useState<"user" | "profile" | "nas">("user")
  const [showPassword, setShowPassword] = useState(false)

  // Password generator function
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  // Form state
  const [formLoading, setFormLoading] = useState(false)
  const [userForm, setUserForm] = useState({
    username: "",
    password: "",
    customer_id: "",
    profile_id: "",
    download_speed: "10000",
    upload_speed: "5000",
    simultaneous_use: "1",
  })
  const [profileForm, setProfileForm] = useState({
    name: "",
    description: "",
    download_speed: "10000",
    upload_speed: "5000",
    simultaneous_use: "1",
    is_default: false,
  })
  const [nasForm, setNasForm] = useState({
    nasname: "",
    shortname: "",
    secret: "",
    type: "MikroTik",
    description: "",
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [statsRes, usersRes, profilesRes, nasRes, sessionsRes, customersRes, credentialsRes] = await Promise.all([
        adminApi.getRADIUSDashboard().catch(() => null),
        adminApi.getRADIUSUsers().catch(() => ({ results: [] })),
        adminApi.getRADIUSProfiles().catch(() => ({ results: [] })),
        adminApi.getRADIUSNASList().catch(() => ({ results: [] })),
        adminApi.getRADIUSActiveSessions().catch(() => []),
        adminApi.getCustomers({ page_size: "100" }).catch(() => ({ results: [] })),
        adminApi.getRADIUSCredentials().catch(() => ({ results: [] })),
      ])

      setStats(statsRes)
      setUsers(usersRes.results || [])
      setProfiles(profilesRes.results || [])
      setNasList(nasRes.results || [])
      setSessions(sessionsRes || [])
      setCustomers(customersRes.results || [])
      setCredentials(credentialsRes.results || [])
    } catch (error) {
      console.error("Failed to fetch RADIUS data:", error)
      toast.error("Failed to load RADIUS data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // User actions
  const handleCreateUser = async () => {
    if (!userForm.username || !userForm.password) {
      toast.error("Username and password are required")
      return
    }

    try {
      setFormLoading(true)
      await adminApi.createRADIUSUser({
        username: userForm.username,
        password: userForm.password,
        customer_id: userForm.customer_id ? parseInt(userForm.customer_id) : undefined,
        profile_id: userForm.profile_id ? parseInt(userForm.profile_id) : undefined,
        download_speed: parseInt(userForm.download_speed),
        upload_speed: parseInt(userForm.upload_speed),
        simultaneous_use: parseInt(userForm.simultaneous_use),
      })
      toast.success("RADIUS user created")
      setCreateUserDialogOpen(false)
      resetUserForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to create user")
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleUserStatus = async (user: RADIUSUser) => {
    try {
      if (user.status === "enabled") {
        await adminApi.disableRADIUSUser(user.username)
        toast.success("User disabled")
      } else {
        await adminApi.enableRADIUSUser(user.username)
        toast.success("User enabled")
      }
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to update user status")
    }
  }

  const handleDisconnectUser = async (username: string) => {
    try {
      await adminApi.disconnectRADIUSUser(username)
      toast.success("User disconnected")
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect user")
    }
  }

  // Profile actions
  const handleCreateProfile = async () => {
    if (!profileForm.name) {
      toast.error("Profile name is required")
      return
    }

    try {
      setFormLoading(true)
      await adminApi.createRADIUSProfile({
        name: profileForm.name,
        description: profileForm.description,
        download_speed: parseInt(profileForm.download_speed),
        upload_speed: parseInt(profileForm.upload_speed),
        simultaneous_use: parseInt(profileForm.simultaneous_use),
        is_default: profileForm.is_default,
      })
      toast.success("Profile created")
      setCreateProfileDialogOpen(false)
      resetProfileForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to create profile")
    } finally {
      setFormLoading(false)
    }
  }

  // NAS actions
  const handleCreateNAS = async () => {
    if (!nasForm.nasname || !nasForm.shortname || !nasForm.secret) {
      toast.error("IP address, name, and secret are required")
      return
    }

    try {
      setFormLoading(true)
      await adminApi.createRADIUSNAS({
        nasname: nasForm.nasname,
        shortname: nasForm.shortname,
        secret: nasForm.secret,
        type: nasForm.type,
        description: nasForm.description,
      })
      toast.success("NAS created")
      setCreateNASDialogOpen(false)
      resetNASForm()
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to create NAS")
    } finally {
      setFormLoading(false)
    }
  }

  // Delete actions
  const handleDelete = async () => {
    if (!selectedItem) return

    try {
      setFormLoading(true)
      if (deleteType === "user") {
        await adminApi.deleteRADIUSUser(selectedItem.username)
        toast.success("User deleted")
      } else if (deleteType === "profile") {
        await adminApi.deleteRADIUSProfile(selectedItem.id)
        toast.success("Profile deleted")
      } else {
        await adminApi.deleteRADIUSNAS(selectedItem.id)
        toast.success("NAS deleted")
      }
      setDeleteDialogOpen(false)
      setSelectedItem(null)
      fetchData()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete")
    } finally {
      setFormLoading(false)
    }
  }

  // Form reset helpers
  const resetUserForm = () => {
    setUserForm({
      username: "",
      password: "",
      customer_id: "",
      profile_id: "",
      download_speed: "10000",
      upload_speed: "5000",
      simultaneous_use: "1",
    })
  }

  const resetProfileForm = () => {
    setProfileForm({
      name: "",
      description: "",
      download_speed: "10000",
      upload_speed: "5000",
      simultaneous_use: "1",
      is_default: false,
    })
  }

  const resetNASForm = () => {
    setNasForm({
      nasname: "",
      shortname: "",
      secret: "",
      type: "MikroTik",
      description: "",
    })
  }

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enabled":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Enabled</Badge>
      case "disabled":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Disabled</Badge>
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
          <h1 className="text-2xl font-bold tracking-tight">RADIUS Management</h1>
          <p className="text-muted-foreground">
            Manage RADIUS users, profiles, and network access servers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats?.active_users || 0} active</span>
              {" · "}
              <span className="text-red-600">{stats?.disabled_users || 0} disabled</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_sessions || 0}</div>
            <p className="text-xs text-muted-foreground">Currently authenticated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">NAS Devices</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_nas || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats?.online_nas || 0} online</span>
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
                <span>{formatBytes(stats?.total_data_in || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Upload className="h-3 w-3 text-blue-500" />
                <span>{formatBytes(stats?.total_data_out || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="credentials">
            <Key className="h-4 w-4 mr-2" />
            Credentials ({credentials.length})
          </TabsTrigger>
          <TabsTrigger value="profiles">
            <Shield className="h-4 w-4 mr-2" />
            Profiles ({profiles.length})
          </TabsTrigger>
          <TabsTrigger value="nas">
            <Server className="h-4 w-4 mr-2" />
            NAS ({nasList.length})
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Radio className="h-4 w-4 mr-2" />
            Sessions ({sessions.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
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
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setCreateUserDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New User
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sync</TableHead>
                  <TableHead>Speed (Down/Up)</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium font-mono">{user.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <Building2 className="h-3 w-3" />
                          {user.tenant_schema?.replace('tenant_', '') || 'default'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.customer_name ? (
                          <div>
                            <div className="font-medium">{user.customer_name}</div>
                            <div className="text-xs text-muted-foreground">{user.customer_email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.public_sync_status === 'synced' ? (
                          <Badge className="bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            Synced
                          </Badge>
                        ) : user.public_sync_status === 'pending' ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="h-3 w-3" />
                            OK
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatSpeed(user.download_speed)} / {formatSpeed(user.upload_speed)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.simultaneous_use || 1} max</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                              {user.status === "enabled" ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" /> Disable
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" /> Enable
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDisconnectUser(user.username)}>
                              <WifiOff className="h-4 w-4 mr-2" /> Disconnect
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedItem(user)
                                setDeleteType("user")
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
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

        {/* Profiles Tab */}
        <TabsContent value="profiles" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setCreateProfileDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Profile
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {profiles.map((profile) => (
              <Card key={profile.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{profile.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      {profile.is_default && (
                        <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedItem(profile)
                              setDeleteType("profile")
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardDescription>{profile.description || "No description"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Download</p>
                      <p className="font-medium">{formatSpeed(profile.download_speed)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Upload</p>
                      <p className="font-medium">{formatSpeed(profile.upload_speed)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Max Sessions</p>
                      <p className="font-medium">{profile.simultaneous_use}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Data Limit</p>
                      <p className="font-medium">
                        {profile.data_limit ? formatBytes(profile.data_limit) : "Unlimited"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {profiles.length === 0 && (
              <Card className="col-span-3">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No profiles found. Create one to get started.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* NAS Tab */}
        <TabsContent value="nas" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button onClick={() => setCreateNASDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New NAS
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Router</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nasList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No NAS devices found
                    </TableCell>
                  </TableRow>
                ) : (
                  nasList.map((nas) => (
                    <TableRow key={nas.id}>
                      <TableCell className="font-medium">{nas.shortname}</TableCell>
                      <TableCell className="font-mono">{nas.nasname}</TableCell>
                      <TableCell>{nas.type}</TableCell>
                      <TableCell>{nas.router_name || "—"}</TableCell>
                      <TableCell>
                        {nas.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedItem(nas)
                                setDeleteType("nas")
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
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

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>NAS</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Traffic</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No active sessions
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium font-mono">{session.username}</div>
                          {session.customer_name && (
                            <div className="text-xs text-muted-foreground">{session.customer_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-mono text-sm">{session.nasipaddress}</div>
                          {session.nas_name && (
                            <div className="text-xs text-muted-foreground">{session.nas_name}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{session.framedipaddress || "—"}</TableCell>
                      <TableCell>{formatDateTime(session.acctstarttime)}</TableCell>
                      <TableCell>
                        {session.session_duration ? formatDuration(session.session_duration) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Download className="h-3 w-3 text-green-500" />
                            {formatBytes(session.acctinputoctets)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Upload className="h-3 w-3 text-blue-500" />
                            {formatBytes(session.acctoutputoctets)}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Credentials Tab - Auto-generated customer RADIUS credentials */}
        <TabsContent value="credentials" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Customer RADIUS Credentials</h3>
              <p className="text-sm text-muted-foreground">
                Auto-generated credentials for customers with PPPoE/Hotspot services
              </p>
            </div>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Connection Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Synced</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credentials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No credentials found. Create customers with PPPoE or Hotspot services to auto-generate credentials.
                    </TableCell>
                  </TableRow>
                ) : (
                  credentials.map((cred) => (
                    <TableRow key={cred.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{cred.customer_name}</div>
                          <div className="text-xs text-muted-foreground">{cred.customer_code}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{cred.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cred.connection_type === 'PPPOE' ? 'PPPoE' : cred.connection_type === 'HOTSPOT' ? 'Hotspot' : 'Both'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cred.is_enabled ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {cred.synced_to_radius ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">{cred.last_sync ? formatDateTime(cred.last_sync) : 'Synced'}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs">Not synced</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(cred.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              // Copy password to clipboard
                              navigator.clipboard.writeText(cred.password || '')
                              toast.success('Password copied to clipboard')
                            }}>
                              <Key className="h-4 w-4 mr-2" /> Copy Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={async () => {
                              try {
                                await adminApi.syncRADIUSCredential(cred.id)
                                toast.success('Credential synced to RADIUS')
                                fetchData()
                              } catch (e: any) {
                                toast.error(e.message || 'Failed to sync')
                              }
                            }}>
                              <RefreshCw className="h-4 w-4 mr-2" /> Sync to RADIUS
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className={cred.is_enabled ? "text-red-600" : "text-green-600"}
                              onClick={async () => {
                                try {
                                  if (cred.is_enabled) {
                                    await adminApi.disableRADIUSCredential(cred.id)
                                    toast.success('Credential disabled')
                                  } else {
                                    await adminApi.enableRADIUSCredential(cred.id)
                                    toast.success('Credential enabled')
                                  }
                                  fetchData()
                                } catch (e: any) {
                                  toast.error(e.message || 'Failed to update')
                                }
                              }}
                            >
                              {cred.is_enabled ? (
                                <><UserX className="h-4 w-4 mr-2" /> Disable</>
                              ) : (
                                <><UserCheck className="h-4 w-4 mr-2" /> Enable</>
                              )}
                            </DropdownMenuItem>
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
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create RADIUS User</DialogTitle>
            <DialogDescription>Add a new RADIUS authentication user.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={userForm.username}
                onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                placeholder="e.g., 254712345678"
              />
              {userForm.username && (
                <p className="text-xs text-muted-foreground">
                  Full RADIUS username: <code className="bg-muted px-1 rounded">tenant_{userForm.username}</code>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newPass = generatePassword()
                    setUserForm({ ...userForm, password: newPass })
                    setShowPassword(true)
                    toast.success('Password generated!')
                  }}
                  title="Generate strong password"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">Customer (optional)</Label>
              <Select
                value={userForm.customer_id}
                onValueChange={(v) => setUserForm({ ...userForm, customer_id: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {customers.length === 0 ? (
                    <SelectItem value="no-customers" disabled>No customers available</SelectItem>
                  ) : (
                    customers.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.full_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile">Profile (optional)</Label>
              <Select
                value={userForm.profile_id}
                onValueChange={(v) => setUserForm({ ...userForm, profile_id: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {profiles.length === 0 ? (
                    <SelectItem value="no-profiles" disabled>No profiles available</SelectItem>
                  ) : (
                    profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="download">Download (Kbps)</Label>
                <Input
                  id="download"
                  type="number"
                  value={userForm.download_speed}
                  onChange={(e) => setUserForm({ ...userForm, download_speed: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="upload">Upload (Kbps)</Label>
                <Input
                  id="upload"
                  type="number"
                  value={userForm.upload_speed}
                  onChange={(e) => setUserForm({ ...userForm, upload_speed: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessions">Max Simultaneous Sessions</Label>
              <Input
                id="sessions"
                type="number"
                value={userForm.simultaneous_use}
                onChange={(e) => setUserForm({ ...userForm, simultaneous_use: e.target.value })}
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Profile Dialog */}
      <Dialog open={createProfileDialogOpen} onOpenChange={setCreateProfileDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create RADIUS Profile</DialogTitle>
            <DialogDescription>Create a reusable speed/policy profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profileName">Name *</Label>
              <Input
                id="profileName"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Basic 10Mbps"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profileDesc">Description</Label>
              <Input
                id="profileDesc"
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                placeholder="Basic home internet package"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profDownload">Download (Kbps)</Label>
                <Input
                  id="profDownload"
                  type="number"
                  value={profileForm.download_speed}
                  onChange={(e) => setProfileForm({ ...profileForm, download_speed: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profUpload">Upload (Kbps)</Label>
                <Input
                  id="profUpload"
                  type="number"
                  value={profileForm.upload_speed}
                  onChange={(e) => setProfileForm({ ...profileForm, upload_speed: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profSessions">Max Simultaneous Sessions</Label>
              <Input
                id="profSessions"
                type="number"
                value={profileForm.simultaneous_use}
                onChange={(e) => setProfileForm({ ...profileForm, simultaneous_use: e.target.value })}
                min="1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isDefault"
                checked={profileForm.is_default}
                onCheckedChange={(v) => setProfileForm({ ...profileForm, is_default: v })}
              />
              <Label htmlFor="isDefault">Set as default profile</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateProfileDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProfile} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create NAS Dialog */}
      <Dialog open={createNASDialogOpen} onOpenChange={setCreateNASDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add NAS Device</DialogTitle>
            <DialogDescription>
              Add a network access server (router/NAS) for RADIUS authentication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nasIp">IP Address *</Label>
              <Input
                id="nasIp"
                value={nasForm.nasname}
                onChange={(e) => setNasForm({ ...nasForm, nasname: e.target.value })}
                placeholder="192.168.1.1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nasName">Short Name *</Label>
              <Input
                id="nasName"
                value={nasForm.shortname}
                onChange={(e) => setNasForm({ ...nasForm, shortname: e.target.value })}
                placeholder="main-router"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nasSecret">Shared Secret *</Label>
              <Input
                id="nasSecret"
                type="password"
                value={nasForm.secret}
                onChange={(e) => setNasForm({ ...nasForm, secret: e.target.value })}
                placeholder="RADIUS shared secret"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nasType">Type</Label>
              <Select value={nasForm.type} onValueChange={(v) => setNasForm({ ...nasForm, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MikroTik">MikroTik</SelectItem>
                  <SelectItem value="Cisco">Cisco</SelectItem>
                  <SelectItem value="Ubiquiti">Ubiquiti</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nasDesc">Description</Label>
              <Input
                id="nasDesc"
                value={nasForm.description}
                onChange={(e) => setNasForm({ ...nasForm, description: e.target.value })}
                placeholder="Main office router"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateNASDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNAS} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add NAS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteType}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={formLoading}>
              {formLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
