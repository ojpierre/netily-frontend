"use client"

import React, { useState, useEffect } from "react"
import {
  BarChart3,
  Search,
  Download,
  Eye,
  Filter,
  Clock,
  HardDrive,
  Wifi,
  Calendar,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type AccountingLog = {
  id: string
  userId: string
  userName: string
  sessionId: string
  startTime: string
  endTime: string
  duration: number // in minutes
  dataUpload: number // in MB
  dataDownload: number // in MB
  ipAddress: string
  nasId: string
  terminationCause: string
  status: "active" | "completed" | "terminated"
}

const generateMockLogs = (): AccountingLog[] => {
  const terminationCauses = [
    "User-Request",
    "Session-Timeout",
    "Idle-Timeout",
    "Admin-Reset",
    "Lost-Carrier",
    "NAS-Reboot",
  ]

  return Array.from({ length: 40 }, (_, i) => {
    const startDate = new Date(2025, 10, 15 - Math.floor(i / 5), Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))
    const duration = Math.floor(Math.random() * 480) + 30 // 30 min to 8 hours
    const endDate = new Date(startDate.getTime() + duration * 60000)
    const isActive = i < 3

    return {
      id: `ACC-${20000 + i}`,
      userId: `USR-${1000 + Math.floor(Math.random() * 100)}`,
      userName: `User ${Math.floor(Math.random() * 100) + 1}`,
      sessionId: `SID${Math.random().toString(36).substr(2, 12).toUpperCase()}`,
      startTime: startDate.toISOString(),
      endTime: isActive ? "" : endDate.toISOString(),
      duration: isActive ? Math.floor((Date.now() - startDate.getTime()) / 60000) : duration,
      dataUpload: Math.floor(Math.random() * 500) + 50,
      dataDownload: Math.floor(Math.random() * 5000) + 500,
      ipAddress: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      nasId: `NAS-00${Math.floor(Math.random() * 5) + 1}`,
      terminationCause: isActive ? "Active" : terminationCauses[Math.floor(Math.random() * terminationCauses.length)],
      status: isActive ? "active" : "completed",
    }
  }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
}

export default function UsagePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<AccountingLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedLog, setSelectedLog] = useState<AccountingLog | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true)
        setError(null)
        await new Promise((resolve) => setTimeout(resolve, 700))
        setLogs(generateMockLogs())
      } catch (err) {
        setError("Failed to load usage logs. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery)
    const matchesStatus = statusFilter === "all" || log.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatBytes = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(2)} GB`
    }
    return `${mb.toFixed(0)} MB`
  }

  const getStatusBadge = (status: AccountingLog["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-700 border-green-200",
      completed: "bg-blue-100 text-blue-700 border-blue-200",
      terminated: "bg-red-100 text-red-700 border-red-200",
    }
    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleViewLog = (log: AccountingLog) => {
    setSelectedLog(log)
    setDialogOpen(true)
  }

  const totalTimeOnline = logs
    .filter((l) => l.status === "completed")
    .reduce((sum, l) => sum + l.duration, 0)

  const totalDataUsed = logs.reduce((sum, l) => sum + l.dataDownload + l.dataUpload, 0)

  const activeSessions = logs.filter((l) => l.status === "active").length

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Usage & Accounting</h1>
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
          <h1 className="text-3xl font-bold text-slate-900">Usage & Accounting</h1>
          <p className="text-slate-500 mt-1">Monitor user sessions and data consumption</p>
        </div>
        <Button>
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">{activeSessions}</div>
                <p className="text-xs text-slate-500 mt-1">Currently online</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{logs.length}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time Online</CardTitle>
            <Clock className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-indigo-600">
                  {Math.floor(totalTimeOnline / 60)}h
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDuration(totalTimeOnline)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Data Used</CardTitle>
            <HardDrive className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-600">
                  {formatBytes(totalDataUsed)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Upload + Download</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by user, session ID, IP address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Accounting Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Accounting Logs ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Showing {paginatedLogs.length} of {filteredLogs.length} sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 font-medium">No accounting logs found</p>
              <p className="text-slate-500 text-sm mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Data Upload</TableHead>
                      <TableHead>Data Download</TableHead>
                      <TableHead>Total Data</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{log.userName}</p>
                            <p className="text-xs text-slate-500">{log.userId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-slate-600">
                            {log.sessionId}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-sm font-medium">
                              {formatDuration(log.duration)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatBytes(log.dataUpload)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatBytes(log.dataDownload)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-bold">
                            {formatBytes(log.dataUpload + log.dataDownload)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">{log.ipAddress}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewLog(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>Complete accounting information for this session</DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  {getStatusBadge(selectedLog.status)}
                  <span className="text-sm text-slate-600">Session {selectedLog.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        User Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-500">Name</p>
                        <p className="font-medium">{selectedLog.userName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">User ID</p>
                        <p className="text-sm">{selectedLog.userId}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Time Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-xs text-slate-500">Duration</p>
                        <p className="font-bold text-lg text-indigo-600">
                          {formatDuration(selectedLog.duration)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Start Time</p>
                        <p className="text-sm">
                          {new Date(selectedLog.startTime).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Data Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <HardDrive className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                        <p className="text-xs text-slate-600">Upload</p>
                        <p className="font-bold text-blue-600">
                          {formatBytes(selectedLog.dataUpload)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <HardDrive className="w-5 h-5 mx-auto mb-2 text-green-600" />
                        <p className="text-xs text-slate-600">Download</p>
                        <p className="font-bold text-green-600">
                          {formatBytes(selectedLog.dataDownload)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <HardDrive className="w-5 h-5 mx-auto mb-2 text-purple-600" />
                        <p className="text-xs text-slate-600">Total</p>
                        <p className="font-bold text-purple-600">
                          {formatBytes(selectedLog.dataUpload + selectedLog.dataDownload)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="technical" className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg space-y-3 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Session ID:</span>
                    <span className="font-medium">{selectedLog.sessionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">IP Address:</span>
                    <span className="font-medium">{selectedLog.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">NAS ID:</span>
                    <span className="font-medium">{selectedLog.nasId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Start Time:</span>
                    <span className="font-medium">
                      {new Date(selectedLog.startTime).toISOString()}
                    </span>
                  </div>
                  {selectedLog.endTime && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">End Time:</span>
                      <span className="font-medium">
                        {new Date(selectedLog.endTime).toISOString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Termination Cause:</span>
                    <Badge variant="outline">{selectedLog.terminationCause}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Session Duration:</span>
                    <span className="font-medium">{selectedLog.duration} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Input Octets:</span>
                    <span className="font-medium">
                      {(selectedLog.dataUpload * 1024 * 1024).toLocaleString()} bytes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Output Octets:</span>
                    <span className="font-medium">
                      {(selectedLog.dataDownload * 1024 * 1024).toLocaleString()} bytes
                    </span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
