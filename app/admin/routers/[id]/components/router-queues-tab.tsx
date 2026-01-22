"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  Loader2,
  Gauge,
  Plus,
  Play,
  Pause,
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
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { SimpleQueue, CreateQueueRequest } from "@/lib/types"

interface RouterQueuesTabProps {
  routerId: number
  isDemo?: boolean
}

// Demo data
const DEMO_QUEUES: SimpleQueue[] = [
  { ".id": "*1", name: "customer-001", target: "192.168.88.50/32", "max-limit": "10M/10M", disabled: "false", bytes: "125000000", packets: "89000" },
  { ".id": "*2", name: "customer-002", target: "192.168.88.51/32", "max-limit": "20M/20M", "burst-limit": "40M/40M", disabled: "false", bytes: "256000000", packets: "145000" },
  { ".id": "*3", name: "customer-003", target: "192.168.88.52/32", "max-limit": "5M/5M", disabled: "true", bytes: "0", packets: "0" },
  { ".id": "*4", name: "guest-queue", target: "172.16.0.0/24", "max-limit": "50M/50M", disabled: "false", bytes: "890000000", packets: "520000" },
  { ".id": "*5", name: "voip-priority", target: "192.168.88.100/32", "max-limit": "2M/2M", priority: "1", disabled: "false", bytes: "45000000", packets: "120000" },
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

export function RouterQueuesTab({ routerId, isDemo = false }: RouterQueuesTabProps) {
  const [queues, setQueues] = useState<SimpleQueue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const [form, setForm] = useState<CreateQueueRequest>({
    name: "",
    target: "",
    max_limit: "",
    burst_limit: "",
    priority: "",
  })

  const fetchData = useCallback(async () => {
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 800))
        setQueues(DEMO_QUEUES)
      } else {
        const data = await adminApi.getQueues(routerId)
        setQueues(data)
      }
    } catch (error) {
      console.error("Failed to fetch queues:", error)
      toast.error("Failed to fetch queues")
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

  const handleCreateQueue = async () => {
    if (!form.name || !form.target || !form.max_limit) {
      toast.error("Name, target, and max limit are required")
      return
    }
    
    setIsCreating(true)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1000))
        toast.success("Queue created (Demo)")
      } else {
        await adminApi.createQueue(routerId, form)
        toast.success("Queue created successfully")
        fetchData()
      }
      setIsDialogOpen(false)
      setForm({ name: "", target: "", max_limit: "", burst_limit: "", priority: "" })
    } catch (error: any) {
      toast.error(error.message || "Failed to create queue")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEnableQueue = async (queueName: string) => {
    setActionLoading(queueName)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500))
        toast.success(`Queue ${queueName} enabled (Demo)`)
      } else {
        await adminApi.enableQueue(routerId, queueName)
        toast.success(`Queue ${queueName} enabled`)
        fetchData()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to enable queue")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDisableQueue = async (queueName: string) => {
    setActionLoading(queueName)
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 500))
        toast.success(`Queue ${queueName} disabled (Demo)`)
      } else {
        await adminApi.disableQueue(routerId, queueName)
        toast.success(`Queue ${queueName} disabled`)
        fetchData()
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to disable queue")
    } finally {
      setActionLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Simple Queues (Bandwidth Limits)</h2>
          <Badge variant="outline">{queues.length} queues</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Queue
          </Button>
        </div>
      </div>

      {/* Queues Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Max Limit</TableHead>
              <TableHead>Burst Limit</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Traffic</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  No queues found
                </TableCell>
              </TableRow>
            ) : (
              queues.map((queue, idx) => (
                <TableRow key={queue[".id"] || idx} className={queue.disabled === "true" || queue.disabled === true ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{queue.name}</TableCell>
                  <TableCell className="font-mono text-sm">{queue.target}</TableCell>
                  <TableCell className="font-mono text-sm">{queue["max-limit"] || "-"}</TableCell>
                  <TableCell className="font-mono text-sm">{queue["burst-limit"] || "-"}</TableCell>
                  <TableCell>{queue.priority || "8"}</TableCell>
                  <TableCell className="text-sm">{formatBytes(queue.bytes || 0)}</TableCell>
                  <TableCell>
                    <Badge variant={queue.disabled === "true" || queue.disabled === true ? "secondary" : "default"}>
                      {queue.disabled === "true" || queue.disabled === true ? "Disabled" : "Enabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={actionLoading === queue.name}>
                          {actionLoading === queue.name ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="w-4 h-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {queue.disabled === "true" || queue.disabled === true ? (
                          <DropdownMenuItem onClick={() => handleEnableQueue(queue.name)}>
                            <Play className="w-4 h-4 mr-2" />
                            Enable
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleDisableQueue(queue.name)}>
                            <Pause className="w-4 h-4 mr-2" />
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

      {/* Create Queue Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Simple Queue</DialogTitle>
            <DialogDescription>Create a new bandwidth limit queue</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="customer-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Target *</Label>
              <Input
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                placeholder="192.168.88.50 or 192.168.88.0/24"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Limit (upload/download) *</Label>
              <Input
                value={form.max_limit}
                onChange={(e) => setForm({ ...form, max_limit: e.target.value })}
                placeholder="10M/10M"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Burst Limit</Label>
                <Input
                  value={form.burst_limit}
                  onChange={(e) => setForm({ ...form, burst_limit: e.target.value })}
                  placeholder="20M/20M (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority (1-8)</Label>
                <Input
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  placeholder="5 (optional)"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateQueue} disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
