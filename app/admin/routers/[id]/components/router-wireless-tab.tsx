"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  Loader2,
  Wifi,
  Signal,
  Users,
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
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { WirelessInterface, WirelessRegistration } from "@/lib/types"

interface RouterWirelessTabProps {
  routerId: number
  isDemo?: boolean
}

// Demo data
const DEMO_WIRELESS_INTERFACES: WirelessInterface[] = [
  { ".id": "*1", name: "wlan1", "mac-address": "AA:BB:CC:DD:EE:20", ssid: "ISP-Network", mode: "ap-bridge", band: "2ghz-b/g/n", frequency: "2412", "channel-width": "20/40mhz-Ce", disabled: "false", running: "true", "noise-floor": "-105", "overall-tx-ccq": "85", "registered-clients": 12 },
  { ".id": "*2", name: "wlan2", "mac-address": "AA:BB:CC:DD:EE:21", ssid: "ISP-Network-5G", mode: "ap-bridge", band: "5ghz-a/n/ac", frequency: "5180", "channel-width": "20/40/80mhz-Ceee", disabled: "false", running: "true", "noise-floor": "-108", "overall-tx-ccq": "92", "registered-clients": 8 },
]

const DEMO_REGISTRATIONS: WirelessRegistration[] = [
  { ".id": "*1", interface: "wlan1", "mac-address": "11:22:33:44:55:01", "signal-strength": "-55", "signal-to-noise": "50", "tx-rate": "72.2Mbps", "rx-rate": "72.2Mbps", uptime: "2h30m", bytes: "125000000", packets: "89000" },
  { ".id": "*2", interface: "wlan1", "mac-address": "11:22:33:44:55:02", "signal-strength": "-62", "signal-to-noise": "43", "tx-rate": "65.0Mbps", "rx-rate": "58.5Mbps", uptime: "1h15m", bytes: "89000000", packets: "45000" },
  { ".id": "*3", interface: "wlan1", "mac-address": "11:22:33:44:55:03", "signal-strength": "-70", "signal-to-noise": "35", "tx-rate": "54.0Mbps", "rx-rate": "48.0Mbps", uptime: "0h45m", bytes: "45000000", packets: "23000" },
  { ".id": "*4", interface: "wlan2", "mac-address": "11:22:33:44:55:10", "signal-strength": "-48", "signal-to-noise": "60", "tx-rate": "300Mbps", "rx-rate": "300Mbps", uptime: "3h20m", bytes: "450000000", packets: "180000" },
  { ".id": "*5", interface: "wlan2", "mac-address": "11:22:33:44:55:11", "signal-strength": "-52", "signal-to-noise": "56", "tx-rate": "270Mbps", "rx-rate": "243Mbps", uptime: "2h10m", bytes: "320000000", packets: "145000" },
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

// Get signal strength color
function getSignalColor(signal: string): string {
  const strength = parseInt(signal)
  if (strength >= -50) return "text-success"
  if (strength >= -65) return "text-lime-600"
  if (strength >= -75) return "text-warning"
  return "text-destructive"
}

function getSignalBars(signal: string): number {
  const strength = parseInt(signal)
  if (strength >= -50) return 4
  if (strength >= -60) return 3
  if (strength >= -70) return 2
  return 1
}

export function RouterWirelessTab({ routerId, isDemo = false }: RouterWirelessTabProps) {
  const [interfaces, setInterfaces] = useState<WirelessInterface[]>([])
  const [registrations, setRegistrations] = useState<WirelessRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800))
        setInterfaces(DEMO_WIRELESS_INTERFACES)
        setRegistrations(DEMO_REGISTRATIONS)
      } else {
        const [ifaces, regs] = await Promise.all([
          adminApi.getWirelessInterfaces(routerId).catch(() => []),
          adminApi.getWirelessRegistrations(routerId).catch(() => []),
        ])
        setInterfaces(ifaces)
        setRegistrations(regs)
      }
    } catch (error) {
      console.error("Failed to fetch wireless data:", error)
      toast.error("Failed to fetch wireless data")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [routerId, isDemo])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchData()
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
          <Wifi className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Wireless</h2>
          <Badge variant="outline">{interfaces.length} interfaces</Badge>
          <Badge variant="outline">{registrations.length} clients</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Wireless Interfaces */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Wireless Interfaces</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SSID</TableHead>
              <TableHead>Band</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Channel Width</TableHead>
              <TableHead>CCQ</TableHead>
              <TableHead>Clients</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interfaces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  No wireless interfaces found
                </TableCell>
              </TableRow>
            ) : (
              interfaces.map((iface, idx) => (
                <TableRow key={iface[".id"] || idx}>
                  <TableCell className="font-medium">{iface.name}</TableCell>
                  <TableCell>{iface.ssid || "-"}</TableCell>
                  <TableCell>{iface.band || "-"}</TableCell>
                  <TableCell>{iface.frequency ? `${iface.frequency} MHz` : "-"}</TableCell>
                  <TableCell>{iface["channel-width"] || "-"}</TableCell>
                  <TableCell>{iface["overall-tx-ccq"] ? `${iface["overall-tx-ccq"]}%` : "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <Users className="w-3 h-3 mr-1" />
                      {iface["registered-clients"] || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={iface.running === "true" || iface.running === true ? "default" : "secondary"}>
                      {iface.running === "true" || iface.running === true ? "Running" : "Stopped"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Connected Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected Wireless Clients</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Interface</TableHead>
              <TableHead>MAC Address</TableHead>
              <TableHead>Signal</TableHead>
              <TableHead>SNR</TableHead>
              <TableHead>TX Rate</TableHead>
              <TableHead>RX Rate</TableHead>
              <TableHead>Uptime</TableHead>
              <TableHead>Traffic</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  No connected clients
                </TableCell>
              </TableRow>
            ) : (
              registrations.map((reg, idx) => (
                <TableRow key={reg[".id"] || idx}>
                  <TableCell className="font-medium">{reg.interface}</TableCell>
                  <TableCell className="font-mono text-sm">{reg["mac-address"]}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex items-end gap-0.5 h-4">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className={`w-1 rounded-t ${
                              bar <= getSignalBars(reg["signal-strength"] || "0")
                                ? getSignalColor(reg["signal-strength"] || "0").replace("text-", "bg-")
                                : "bg-slate-200"
                            }`}
                            style={{ height: `${bar * 4}px` }}
                          />
                        ))}
                      </div>
                      <span className={`text-sm ${getSignalColor(reg["signal-strength"] || "0")}`}>
                        {reg["signal-strength"]} dBm
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{reg["signal-to-noise"]} dB</TableCell>
                  <TableCell>{reg["tx-rate"] || "-"}</TableCell>
                  <TableCell>{reg["rx-rate"] || "-"}</TableCell>
                  <TableCell>{reg.uptime || "-"}</TableCell>
                  <TableCell>{formatBytes(reg.bytes || 0)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
