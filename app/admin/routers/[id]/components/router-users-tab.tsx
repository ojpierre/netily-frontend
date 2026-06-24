"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  Loader2,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Wifi,
  Phone,
  Eye,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { 
  HotspotUser, 
  ActiveHotspotUser, 
  PPPoEUser, 
  ActivePPPoESession,
  CreateHotspotUserRequest,
  CreatePPPoEUserRequest,
} from "@/lib/types"

interface RouterUsersTabProps {
  routerId: number
  isDemo?: boolean
}

// Demo data
const DEMO_ACTIVE_HOTSPOT: ActiveHotspotUser[] = [
  { user: "guest001", address: "172.16.0.50", "mac-address": "AA:BB:CC:DD:EE:01", "bytes-in": 125000000, "bytes-out": 45000000, uptime: "00:45:30", server: "hotspot1" },
  { user: "guest002", address: "172.16.0.51", "mac-address": "AA:BB:CC:DD:EE:02", "bytes-in": 89000000, "bytes-out": 23000000, uptime: "01:15:22", server: "hotspot1" },
  { user: "guest003", address: "172.16.0.52", "mac-address": "AA:BB:CC:DD:EE:03", "bytes-in": 256000000, "bytes-out": 112000000, uptime: "02:30:15", server: "hotspot1" },
]

const DEMO_HOTSPOT_USERS: HotspotUser[] = [
  { name: "guest001", profile: "default", disabled: "false", server: "hotspot1" },
  { name: "guest002", profile: "premium", disabled: "false", server: "hotspot1" },
  { name: "guest003", profile: "default", disabled: "false", server: "hotspot1" },
  { name: "guest004", profile: "default", disabled: "true", server: "hotspot1" },
]

const DEMO_ACTIVE_PPPOE: ActivePPPoESession[] = [
  { name: "pppoe-user1", service: "pppoe", address: "10.10.10.2", uptime: "12:30:45", "caller-id": "AA:BB:CC:11:22:33" },
  { name: "pppoe-user2", service: "pppoe", address: "10.10.10.3", uptime: "05:15:20", "caller-id": "AA:BB:CC:11:22:34" },
]

const DEMO_PPPOE_USERS: PPPoEUser[] = [
  { name: "pppoe-user1", profile: "default-encryption", disabled: "false", service: "pppoe" },
  { name: "pppoe-user2", profile: "premium-encryption", disabled: "false", service: "pppoe" },
  { name: "pppoe-user3", profile: "default-encryption", disabled: "true", service: "pppoe" },
]

// Format bytes to human readable
function formatBytes(bytes: number | string): string {
  const num = typeof bytes === 'string' ? parseInt(bytes) : bytes
  if (num === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(num) / Math.log(k))
  return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function RouterUsersTab({ routerId, isDemo = false }: RouterUsersTabProps) {
  // Hotspot state
  const [activeHotspotUsers, setActiveHotspotUsers] = useState<ActiveHotspotUser[]>([])
  const [hotspotUsers, setHotspotUsers] = useState<HotspotUser[]>([])
  
  // PPPoE state
  const [activePPPoESessions, setActivePPPoESessions] = useState<ActivePPPoESession[]>([])
  const [pppoeUsers, setPPPoEUsers] = useState<PPPoEUser[]>([])
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Dialog state
  const [isHotspotDialogOpen, setIsHotspotDialogOpen] = useState(false)
  const [isPPPoEDialogOpen, setIsPPPoEDialogOpen] = useState(false)
  
  // Form state
  const [hotspotForm, setHotspotForm] = useState<CreateHotspotUserRequest>({
    username: "",
    password: "",
    profile: "default",
    limit_uptime: "",
    limit_bytes: "",
  })
  
  const [pppoeForm, setPPPoEForm] = useState<CreatePPPoEUserRequest>({
    username: "",
    password: "",
    profile: "default-encryption",
    local_address: "",
    remote_address: "",
  })

  const fetchData = useCallback(async () => {
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800))
        setActiveHotspotUsers(DEMO_ACTIVE_HOTSPOT)
        setHotspotUsers(DEMO_HOTSPOT_USERS)
        setActivePPPoESessions(DEMO_ACTIVE_PPPOE)
        setPPPoEUsers(DEMO_PPPOE_USERS)
      } else {
        const [activeHotspot, allHotspot, activePPPoE, allPPPoE] = await Promise.all([
          adminApi.getActiveHotspotUsers(routerId).catch(() => []),
          adminApi.getHotspotUsers(routerId).catch(() => []),
          adminApi.getActivePPPoESessions(routerId).catch(() => []),
          adminApi.getPPPoEUsers(routerId).catch(() => []),
        ])
        setActiveHotspotUsers(activeHotspot)
        setHotspotUsers(allHotspot)
        setActivePPPoESessions(activePPPoE)
        setPPPoEUsers(allPPPoE)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast.error("Failed to fetch users")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [routerId, isDemo])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every 60 seconds
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  const handleCreateHotspotUser = async () => {
    if (!hotspotForm.username || !hotspotForm.password) {
      toast.error("Username and password are required")
      return
    }
    
    setIsCreating(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1000))
        toast.success("Hotspot user created (Demo)")
      } else {
        await adminApi.createHotspotUser(routerId, hotspotForm)
        toast.success("Hotspot user created successfully")
        fetchData()
      }
      setIsHotspotDialogOpen(false)
      setHotspotForm({ username: "", password: "", profile: "default", limit_uptime: "", limit_bytes: "" })
    } catch (error: any) {
      toast.error(error.message || "Failed to create hotspot user")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreatePPPoEUser = async () => {
    if (!pppoeForm.username || !pppoeForm.password) {
      toast.error("Username and password are required")
      return
    }
    
    setIsCreating(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1000))
        toast.success("PPPoE user created (Demo)")
      } else {
        await adminApi.createPPPoEUser(routerId, pppoeForm)
        toast.success("PPPoE user created successfully")
        fetchData()
      }
      setIsPPPoEDialogOpen(false)
      setPPPoEForm({ username: "", password: "", profile: "default-encryption", local_address: "", remote_address: "" })
    } catch (error: any) {
      toast.error(error.message || "Failed to create PPPoE user")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEnableHotspotUser = async (username: string) => {
    setActionLoading(username)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500))
        toast.success(`User ${username} enabled (Demo)`)
      } else {
        await adminApi.enableHotspotUser(routerId, username)
        toast.success(`User ${username} enabled`)
        fetchData()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to enable user")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisableHotspotUser = async (username: string) => {
    setActionLoading(username)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500))
        toast.success(`User ${username} disabled (Demo)`)
      } else {
        await adminApi.disableHotspotUser(routerId, username)
        toast.success(`User ${username} disabled`)
        fetchData()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to disable user")
    } finally {
      setActionLoading(null)
    }
  }

  // Filter users based on search
  const filteredHotspotUsers = hotspotUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredPPPoEUsers = pppoeUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* User Type Tabs */}
      <Tabs defaultValue="hotspot" className="w-full">
        <TabsList>
          <TabsTrigger value="hotspot" className="gap-2">
            <Wifi className="w-4 h-4" />
            Hotspot ({activeHotspotUsers.length} active)
          </TabsTrigger>
          <TabsTrigger value="pppoe" className="gap-2">
            <Phone className="w-4 h-4" />
            PPPoE ({activePPPoESessions.length} active)
          </TabsTrigger>
        </TabsList>

        {/* Hotspot Tab */}
        <TabsContent value="hotspot" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Active Hotspot Sessions</h3>
            <Button size="sm" onClick={() => setIsHotspotDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Hotspot User
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>Download</TableHead>
                  <TableHead>Upload</TableHead>
                  <TableHead>Uptime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeHotspotUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No active hotspot sessions
                    </TableCell>
                  </TableRow>
                ) : (
                  activeHotspotUsers.map((user, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{user.user}</TableCell>
                      <TableCell className="font-mono text-sm">{user.address}</TableCell>
                      <TableCell className="font-mono text-sm">{user["mac-address"] || "-"}</TableCell>
                      <TableCell>{formatBytes(user["bytes-in"])}</TableCell>
                      <TableCell>{formatBytes(user["bytes-out"] || 0)}</TableCell>
                      <TableCell>{user.uptime}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <h3 className="text-lg font-semibold pt-4">All Hotspot Users</h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Server</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHotspotUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No hotspot users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHotspotUsers.map((user, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.profile}</TableCell>
                      <TableCell>
                        <Badge variant={user.disabled === "true" || user.disabled === true ? "secondary" : "default"}>
                          {user.disabled === "true" || user.disabled === true ? "Disabled" : "Enabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.server || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={actionLoading === user.name}>
                              {actionLoading === user.name ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="w-4 h-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.disabled === "true" || user.disabled === true ? (
                              <DropdownMenuItem onClick={() => handleEnableHotspotUser(user.name)}>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Enable
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleDisableHotspotUser(user.name)}>
                                <UserX className="w-4 h-4 mr-2" />
                                Disable
                              </DropdownMenuItem>
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

        {/* PPPoE Tab */}
        <TabsContent value="pppoe" className="mt-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Active PPPoE Sessions</h3>
            <Button size="sm" onClick={() => setIsPPPoEDialogOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add PPPoE User
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Caller ID</TableHead>
                  <TableHead>Uptime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activePPPoESessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      No active PPPoE sessions
                    </TableCell>
                  </TableRow>
                ) : (
                  activePPPoESessions.map((session, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{session.name}</TableCell>
                      <TableCell>{session.service}</TableCell>
                      <TableCell className="font-mono text-sm">{session.address}</TableCell>
                      <TableCell className="font-mono text-sm">{session["caller-id"] || "-"}</TableCell>
                      <TableCell>{session.uptime}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          <h3 className="text-lg font-semibold pt-4">All PPPoE Users</h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Service</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPPPoEUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      No PPPoE users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPPPoEUsers.map((user, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.profile}</TableCell>
                      <TableCell>
                        <Badge variant={user.disabled === "true" || user.disabled === true ? "secondary" : "default"}>
                          {user.disabled === "true" || user.disabled === true ? "Disabled" : "Enabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.service || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Hotspot User Dialog */}
      <Dialog open={isHotspotDialogOpen} onOpenChange={setIsHotspotDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Hotspot User</DialogTitle>
            <DialogDescription>Add a new hotspot user to this router</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={hotspotForm.username}
                onChange={(e) => setHotspotForm({ ...hotspotForm, username: e.target.value })}
                placeholder="guest123"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={hotspotForm.password}
                onChange={(e) => setHotspotForm({ ...hotspotForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Profile</Label>
              <Input
                value={hotspotForm.profile}
                onChange={(e) => setHotspotForm({ ...hotspotForm, profile: e.target.value })}
                placeholder="default"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Uptime Limit</Label>
                <Input
                  value={hotspotForm.limit_uptime}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, limit_uptime: e.target.value })}
                  placeholder="1d (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label>Bytes Limit</Label>
                <Input
                  value={hotspotForm.limit_bytes}
                  onChange={(e) => setHotspotForm({ ...hotspotForm, limit_bytes: e.target.value })}
                  placeholder="1G (optional)"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHotspotDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateHotspotUser} disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create PPPoE User Dialog */}
      <Dialog open={isPPPoEDialogOpen} onOpenChange={setIsPPPoEDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create PPPoE User</DialogTitle>
            <DialogDescription>Add a new PPPoE secret to this router</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Username *</Label>
              <Input
                value={pppoeForm.username}
                onChange={(e) => setPPPoEForm({ ...pppoeForm, username: e.target.value })}
                placeholder="pppoe-user1"
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={pppoeForm.password}
                onChange={(e) => setPPPoEForm({ ...pppoeForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Profile</Label>
              <Input
                value={pppoeForm.profile}
                onChange={(e) => setPPPoEForm({ ...pppoeForm, profile: e.target.value })}
                placeholder="default-encryption"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Local Address</Label>
                <Input
                  value={pppoeForm.local_address}
                  onChange={(e) => setPPPoEForm({ ...pppoeForm, local_address: e.target.value })}
                  placeholder="(optional)"
                />
              </div>
              <div className="space-y-2">
                <Label>Remote Address</Label>
                <Input
                  value={pppoeForm.remote_address}
                  onChange={(e) => setPPPoEForm({ ...pppoeForm, remote_address: e.target.value })}
                  placeholder="(optional)"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPPPoEDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePPPoEUser} disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
