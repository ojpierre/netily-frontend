"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  Loader2,
  Shield,
  Plus,
  Ban,
  Check,
  AlertTriangle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { FirewallRule, CreateFirewallRuleRequest } from "@/lib/types"

interface RouterFirewallTabProps {
  routerId: number
  isDemo?: boolean
}

// Demo data
const DEMO_FIREWALL_RULES: FirewallRule[] = [
  { ".id": "*1", chain: "forward", action: "accept", protocol: "tcp", "dst-port": "80,443", comment: "Allow HTTP/HTTPS", disabled: "false", bytes: "125000000", packets: "89000" },
  { ".id": "*2", chain: "input", action: "accept", protocol: "tcp", "dst-port": "22", "src-address": "192.168.1.0/24", comment: "Allow SSH from LAN", disabled: "false", bytes: "45000", packets: "320" },
  { ".id": "*3", chain: "input", action: "drop", protocol: "tcp", "dst-port": "22", comment: "Block SSH from WAN", disabled: "false", bytes: "12500", packets: "150" },
  { ".id": "*4", chain: "forward", action: "drop", "src-address": "192.168.1.50", comment: "Block user 192.168.1.50", disabled: "true", bytes: "0", packets: "0" },
  { ".id": "*5", chain: "forward", action: "accept", comment: "Accept all other forward", disabled: "false", bytes: "5600000000", packets: "4500000" },
]

export function RouterFirewallTab({ routerId, isDemo = false }: RouterFirewallTabProps) {
  const [rules, setRules] = useState<FirewallRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  const [form, setForm] = useState<CreateFirewallRuleRequest>({
    chain: "forward",
    action: "drop",
    src_address: "",
    dst_address: "",
    protocol: "",
    dst_port: "",
    comment: "",
  })

  const fetchData = useCallback(async () => {
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800))
        setRules(DEMO_FIREWALL_RULES)
      } else {
        const data = await adminApi.getFirewallRules(routerId)
        setRules(data)
      }
    } catch (error) {
      console.error("Failed to fetch firewall rules:", error)
      toast.error("Failed to fetch firewall rules")
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

  const handleCreateRule = async () => {
    if (!form.chain || !form.action) {
      toast.error("Chain and action are required")
      return
    }
    
    setIsCreating(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1000))
        toast.success("Firewall rule created (Demo)")
      } else {
        await adminApi.addFirewallRule(routerId, form)
        toast.success("Firewall rule created successfully")
        fetchData()
      }
      setIsDialogOpen(false)
      setForm({ chain: "forward", action: "drop", src_address: "", dst_address: "", protocol: "", dst_port: "", comment: "" })
    } catch (error: any) {
      toast.error(error.message || "Failed to create firewall rule")
    } finally {
      setIsCreating(false)
    }
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "accept":
        return <Badge className="bg-success/15 text-success"><Check className="w-3 h-3 mr-1" />Accept</Badge>
      case "drop":
        return <Badge className="bg-destructive/15 text-destructive"><Ban className="w-3 h-3 mr-1" />Drop</Badge>
      case "reject":
        return <Badge className="bg-warning/15 text-warning"><AlertTriangle className="w-3 h-3 mr-1" />Reject</Badge>
      default:
        return <Badge variant="secondary">{action}</Badge>
    }
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
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Firewall Filter Rules</h2>
          <Badge variant="outline">{rules.length} rules</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Rules Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chain</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Protocol</TableHead>
              <TableHead>Port</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  No firewall rules found
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule, idx) => (
                <TableRow key={rule[".id"] || idx} className={rule.disabled === "true" || rule.disabled === true ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{rule.chain}</TableCell>
                  <TableCell>{getActionBadge(rule.action)}</TableCell>
                  <TableCell className="font-mono text-sm">{rule["src-address"] || "any"}</TableCell>
                  <TableCell className="font-mono text-sm">{rule["dst-address"] || "any"}</TableCell>
                  <TableCell>{rule.protocol || "any"}</TableCell>
                  <TableCell className="font-mono text-sm">{rule["dst-port"] || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate" title={rule.comment}>{rule.comment || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={rule.disabled === "true" || rule.disabled === true ? "secondary" : "default"}>
                      {rule.disabled === "true" || rule.disabled === true ? "Disabled" : "Enabled"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Rule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Firewall Rule</DialogTitle>
            <DialogDescription>Create a new firewall filter rule</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chain *</Label>
                <Select value={form.chain} onValueChange={(v) => setForm({ ...form, chain: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="input">input</SelectItem>
                    <SelectItem value="forward">forward</SelectItem>
                    <SelectItem value="output">output</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Action *</Label>
                <Select value={form.action} onValueChange={(v) => setForm({ ...form, action: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="accept">accept</SelectItem>
                    <SelectItem value="drop">drop</SelectItem>
                    <SelectItem value="reject">reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source Address</Label>
                <Input
                  value={form.src_address}
                  onChange={(e) => setForm({ ...form, src_address: e.target.value })}
                  placeholder="192.168.88.50 (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label>Destination Address</Label>
                <Input
                  value={form.dst_address}
                  onChange={(e) => setForm({ ...form, dst_address: e.target.value })}
                  placeholder="(optional)"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Protocol</Label>
                <Select value={form.protocol || ""} onValueChange={(v) => setForm({ ...form, protocol: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any</SelectItem>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                    <SelectItem value="icmp">ICMP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination Port</Label>
                <Input
                  value={form.dst_port}
                  onChange={(e) => setForm({ ...form, dst_port: e.target.value })}
                  placeholder="80,443 (optional)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comment</Label>
              <Input
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder="Block this IP (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRule} disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
