"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  Loader2,
  Network,
  Play,
  Pause,
  MoreHorizontal,
  Activity,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  Link,
  Unlink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { RouterInterface, InterfaceTraffic } from "@/lib/types"

interface RouterInterfacesTabProps {
  routerId: number
  isDemo?: boolean
}

// Demo data
const DEMO_INTERFACES: RouterInterface[] = [
  { ".id": "*1", name: "ether1", type: "ether", "mac-address": "AA:BB:CC:DD:EE:01", mtu: "1500", running: "true", disabled: "false", comment: "WAN", "default-name": "ether1" },
  { ".id": "*2", name: "ether2", type: "ether", "mac-address": "AA:BB:CC:DD:EE:02", mtu: "1500", running: "true", disabled: "false", comment: "LAN", "default-name": "ether2" },
  { ".id": "*3", name: "ether3", type: "ether", "mac-address": "AA:BB:CC:DD:EE:03", mtu: "1500", running: "false", disabled: "false", "default-name": "ether3" },
  { ".id": "*4", name: "ether4", type: "ether", "mac-address": "AA:BB:CC:DD:EE:04", mtu: "1500", running: "false", disabled: "true", "default-name": "ether4" },
  { ".id": "*5", name: "bridge1", type: "bridge", "mac-address": "AA:BB:CC:DD:EE:10", mtu: "1500", running: "true", disabled: "false", comment: "Main Bridge" },
  { ".id": "*6", name: "wlan1", type: "wlan", "mac-address": "AA:BB:CC:DD:EE:20", mtu: "1500", running: "true", disabled: "false", comment: "Wireless" },
]

const DEMO_TRAFFIC: InterfaceTraffic = {
  name: "ether1",
  "rx-byte": "12500000000",
  "tx-byte": "8500000000",
  "rx-packet": "89000000",
  "tx-packet": "65000000",
  "rx-drop": "150",
  "tx-drop": "50",
  "rx-error": "0",
  "tx-error": "0",
}

// Format bytes to human readable
function formatBytes(bytes: number | string): string {
  const num = typeof bytes === 'string' ? parseInt(bytes) : bytes
  if (num === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(num) / Math.log(k))
  return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function RouterInterfacesTab({ routerId, isDemo = false }: RouterInterfacesTabProps) {
  const [interfaces, setInterfaces] = useState<RouterInterface[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Traffic dialog
  const [selectedInterface, setSelectedInterface] = useState<string | null>(null)
  const [trafficData, setTrafficData] = useState<InterfaceTraffic | null>(null)
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(false)

  // Disable confirmation dialog
  const [disableConfirmInterface, setDisableConfirmInterface] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800))
        setInterfaces(DEMO_INTERFACES)
      } else {
        const data = await adminApi.getRouterInterfaces(routerId)
        setInterfaces(data)
      }
    } catch (error) {
      console.error("Failed to fetch interfaces:", error)
      toast.error("Failed to fetch interfaces")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [routerId, isDemo])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
  }

  const handleViewTraffic = async (interfaceName: string) => {
    setSelectedInterface(interfaceName)
    setIsLoadingTraffic(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500))
        setTrafficData({ ...DEMO_TRAFFIC, name: interfaceName })
      } else {
        const data = await adminApi.getInterfaceTraffic(routerId, interfaceName)
        setTrafficData(data)
      }
    } catch (error) {
      toast.error("Failed to fetch traffic data")
    } finally {
      setIsLoadingTraffic(false)
    }
  }

  const handleEnableInterface = async (interfaceName: string) => {
    setActionLoading(interfaceName)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500))
        toast.success(`Interface ${interfaceName} enabled (Demo)`)
      } else {
        await adminApi.enableInterface(routerId, interfaceName)
        toast.success(`Interface ${interfaceName} enabled`)
        fetchData()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to enable interface")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisableInterface = async (interfaceName: string) => {
    setDisableConfirmInterface(null)
    setActionLoading(interfaceName)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500))
        toast.success(`Interface ${interfaceName} disabled (Demo)`)
      } else {
        await adminApi.disableInterface(routerId, interfaceName)
        toast.success(`Interface ${interfaceName} disabled`)
        fetchData()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to disable interface")
    } finally {
      setActionLoading(null)
    }
  }

  const requestDisableInterface = (interfaceName: string) => {
    setDisableConfirmInterface(interfaceName)
  }

  // Bridge port management
  const [bridgeConfirmInterface, setBridgeConfirmInterface] = useState<{ name: string; action: 'add' | 'remove' } | null>(null)

  const handleAddToBridge = async (interfaceName: string) => {
    setBridgeConfirmInterface(null)
    setActionLoading(interfaceName)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500))
        toast.success(`${interfaceName} added to hotspot bridge (Demo)`)
      } else {
        await adminApi.addPortToBridge(routerId, interfaceName)
        toast.success(`${interfaceName} added to hotspot bridge`)
        fetchData()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add port to bridge")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemoveFromBridge = async (interfaceName: string) => {
    setBridgeConfirmInterface(null)
    setActionLoading(interfaceName)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500))
        toast.success(`${interfaceName} removed from bridge (Demo)`)
      } else {
        await adminApi.removePortFromBridge(routerId, interfaceName)
        toast.success(`${interfaceName} removed from hotspot bridge`)
        fetchData()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove port from bridge")
    } finally {
      setActionLoading(null)
    }
  }

  const isEthernetOrWireless = (type: string) => {
    return ['ether', 'wlan', 'wireless'].includes(type?.toLowerCase())
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      ether: "bg-primary/15 text-primary",
      bridge: "bg-purple-100 text-purple-700",
      wlan: "bg-success/15 text-success",
      vlan: "bg-warning/15 text-warning",
      pppoe: "bg-cyan-100 text-cyan-700",
    }
    return <Badge className={colors[type] || "bg-slate-100 text-slate-700"}>{type}</Badge>
  }

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
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Network Interfaces</h2>
          <Badge variant="outline">{interfaces.length} interfaces</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Interfaces Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>MAC Address</TableHead>
              <TableHead>MTU</TableHead>
              <TableHead>Running</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interfaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  No interfaces found
                </TableCell>
              </TableRow>
            ) : (
              interfaces.map((iface, idx) => (
                <TableRow key={iface[".id"] || idx} className={iface.disabled === "true" || iface.disabled === true ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{iface.name}</TableCell>
                  <TableCell>{getTypeBadge(iface.type)}</TableCell>
                  <TableCell className="font-mono text-sm">{iface["mac-address"] || "-"}</TableCell>
                  <TableCell>{iface.mtu || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={iface.running === "true" || iface.running === true ? "default" : "secondary"}>
                      {iface.running === "true" || iface.running === true ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={iface.disabled === "true" || iface.disabled === true ? "secondary" : "default"}>
                      {iface.disabled === "true" || iface.disabled === true ? "Disabled" : "Enabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">{iface.comment || "-"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={actionLoading === iface.name}>
                          {actionLoading === iface.name ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="w-4 h-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewTraffic(iface.name)}>
                          <Activity className="w-4 h-4 mr-2" />
                          View Traffic
                        </DropdownMenuItem>
                        {iface.disabled === "true" || iface.disabled === true ? (
                          <DropdownMenuItem onClick={() => handleEnableInterface(iface.name)}>
                            <Play className="w-4 h-4 mr-2" />
                            Enable
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => requestDisableInterface(iface.name)}
                            className="text-destructive"
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            Disable
                          </DropdownMenuItem>
                        )}
                        {/* Bridge port management — only for ethernet/wireless interfaces */}
                        {isEthernetOrWireless(iface.type) && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setBridgeConfirmInterface({ name: iface.name, action: 'add' })}
                            >
                              <Link className="w-4 h-4 mr-2" />
                              Add to Hotspot Bridge
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setBridgeConfirmInterface({ name: iface.name, action: 'remove' })}
                              className="text-warning"
                            >
                              <Unlink className="w-4 h-4 mr-2" />
                              Remove from Bridge
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

      {/* Traffic Dialog */}
      <Dialog open={!!selectedInterface} onOpenChange={() => setSelectedInterface(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interface Traffic: {selectedInterface}</DialogTitle>
            <DialogDescription>Real-time traffic statistics</DialogDescription>
          </DialogHeader>
          {isLoadingTraffic ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : trafficData ? (
            <div className="grid grid-cols-2 gap-4 py-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-success mb-2">
                    <ArrowDown className="w-4 h-4" />
                    <span className="font-medium">Download (RX)</span>
                  </div>
                  <p className="text-2xl font-bold">{formatBytes(trafficData["rx-byte"])}</p>
                  <p className="text-sm text-slate-500">{parseInt(String(trafficData["rx-packet"])).toLocaleString()} packets</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <ArrowUp className="w-4 h-4" />
                    <span className="font-medium">Upload (TX)</span>
                  </div>
                  <p className="text-2xl font-bold">{formatBytes(trafficData["tx-byte"])}</p>
                  <p className="text-sm text-slate-500">{parseInt(String(trafficData["tx-packet"])).toLocaleString()} packets</p>
                </CardContent>
              </Card>
              <div className="col-span-2 grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-slate-500">RX Drops</p>
                  <p className="font-medium">{trafficData["rx-drop"] || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">TX Drops</p>
                  <p className="font-medium">{trafficData["tx-drop"] || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">RX Errors</p>
                  <p className="font-medium">{trafficData["rx-error"] || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">TX Errors</p>
                  <p className="font-medium">{trafficData["tx-error"] || 0}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">No traffic data available</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Interface Confirmation Dialog */}
      <AlertDialog open={!!disableConfirmInterface} onOpenChange={() => setDisableConfirmInterface(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Disable Interface
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable <span className="font-semibold">{disableConfirmInterface}</span>? 
              This may interrupt network connectivity for devices using this interface.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => disableConfirmInterface && handleDisableInterface(disableConfirmInterface)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Disable Interface
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bridge Port Confirmation Dialog */}
      <AlertDialog open={!!bridgeConfirmInterface} onOpenChange={() => setBridgeConfirmInterface(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {bridgeConfirmInterface?.action === 'add' ? (
                <Link className="w-5 h-5 text-primary" />
              ) : (
                <Unlink className="w-5 h-5 text-warning" />
              )}
              {bridgeConfirmInterface?.action === 'add' ? 'Add to Hotspot Bridge' : 'Remove from Bridge'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bridgeConfirmInterface?.action === 'add' ? (
                <>
                  Add <span className="font-semibold">{bridgeConfirmInterface?.name}</span> to the
                  hotspot bridge? Devices connected to this port will be routed through the hotspot captive portal.
                </>
              ) : (
                <>
                  Remove <span className="font-semibold">{bridgeConfirmInterface?.name}</span> from the
                  hotspot bridge? Devices on this port will lose hotspot connectivity.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!bridgeConfirmInterface) return
                if (bridgeConfirmInterface.action === 'add') {
                  handleAddToBridge(bridgeConfirmInterface.name)
                } else {
                  handleRemoveFromBridge(bridgeConfirmInterface.name)
                }
              }}
              className={bridgeConfirmInterface?.action === 'add' ? "bg-primary hover:bg-primary" : "bg-orange-600 hover:bg-orange-700"}
            >
              {bridgeConfirmInterface?.action === 'add' ? 'Add to Bridge' : 'Remove from Bridge'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
