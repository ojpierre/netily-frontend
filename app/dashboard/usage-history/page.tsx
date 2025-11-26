"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/app/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  BarChart3, 
  Calendar, 
  Download, 
  TrendingUp, 
  Clock, 
  Activity,
  Eye,
  Filter,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

// Mock usage data (replace with API call)
interface UsageRecord {
  id: number
  date: string
  duration: number // in minutes
  data_used: number // in MB
  session_start: string
  session_end: string
  status: "active" | "completed"
}

export default function UsageHistoryPage() {
  const { user } = useAuth()
  const [usageData, setUsageData] = useState<UsageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState("7days")
  const [selectedSession, setSelectedSession] = useState<UsageRecord | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadUsageData()
  }, [timeFilter])

  const loadUsageData = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await api.getUsageHistory(timeFilter)
      // setUsageData(response.results)
      
      // Mock data for now
      const mockData: UsageRecord[] = [
        {
          id: 1,
          date: "2024-11-26",
          duration: 480,
          data_used: 2400,
          session_start: "2024-11-26T08:00:00",
          session_end: "2024-11-26T16:00:00",
          status: "completed"
        },
        {
          id: 2,
          date: "2024-11-25",
          duration: 360,
          data_used: 1800,
          session_start: "2024-11-25T09:00:00",
          session_end: "2024-11-25T15:00:00",
          status: "completed"
        },
        {
          id: 3,
          date: "2024-11-24",
          duration: 540,
          data_used: 3200,
          session_start: "2024-11-24T07:30:00",
          session_end: "2024-11-24T16:30:00",
          status: "completed"
        },
        {
          id: 4,
          date: "2024-11-23",
          duration: 420,
          data_used: 2100,
          session_start: "2024-11-23T10:00:00",
          session_end: "2024-11-23T17:00:00",
          status: "completed"
        },
      ]
      
      setUsageData(mockData)
      toast.success("Usage data loaded")
    } catch (error) {
      toast.error("Failed to load usage data")
    } finally {
      setLoading(false)
    }
  }

  const totalDuration = usageData.reduce((sum, record) => sum + record.duration, 0)
  const totalData = usageData.reduce((sum, record) => sum + record.data_used, 0)
  const averageDaily = usageData.length > 0 ? totalData / usageData.length : 0

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatData = (mb: number) => {
    if (mb >= 1000) {
      return `${(mb / 1000).toFixed(2)} GB`
    }
    return `${mb} MB`
  }

  const handleViewDetails = (record: UsageRecord) => {
    setSelectedSession(record)
    setIsDialogOpen(true)
  }

  const handleExport = () => {
    toast.success("Exporting usage data...")
    // TODO: Implement CSV/PDF export
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Usage History</h1>
          <p className="text-slate-600 mt-1">Track your internet usage and activity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadUsageData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Sessions</p>
              <p className="text-2xl font-bold text-slate-900">{usageData.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Duration</p>
              <p className="text-2xl font-bold text-slate-900">{formatDuration(totalDuration)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Data Used</p>
              <p className="text-2xl font-bold text-slate-900">{formatData(totalData)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Avg. Daily</p>
              <p className="text-2xl font-bold text-slate-900">{formatData(averageDaily)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Time Period:</span>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Usage Chart Placeholder */}
      <Card className="p-8">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-slate-600" />
          <h2 className="text-lg font-semibold">Usage Trends</h2>
        </div>
        <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600">Usage chart will appear here</p>
            <p className="text-sm text-slate-400 mt-1">Install recharts library to enable charts</p>
          </div>
        </div>
      </Card>

      {/* Usage Table */}
      <Card>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold">Session History</h2>
          </div>
        </div>

        {usageData.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No usage data available</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Session Start</TableHead>
                <TableHead>Session End</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Data Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageData.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {new Date(record.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(record.session_start).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </TableCell>
                  <TableCell>
                    {new Date(record.session_end).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </TableCell>
                  <TableCell>{formatDuration(record.duration)}</TableCell>
                  <TableCell className="font-semibold">{formatData(record.data_used)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={record.status === "completed" ? "default" : "secondary"}
                      className={record.status === "completed" ? "bg-green-100 text-green-700" : ""}
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewDetails(record)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Session Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
            <DialogDescription>
              Detailed information about this usage session
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Date</span>
                <span className="font-semibold">
                  {new Date(selectedSession.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Session Start</span>
                <span className="font-semibold">
                  {new Date(selectedSession.session_start).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Session End</span>
                <span className="font-semibold">
                  {new Date(selectedSession.session_end).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Total Duration</span>
                <span className="font-semibold text-blue-600">
                  {formatDuration(selectedSession.duration)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Data Used</span>
                <span className="font-semibold text-green-600">
                  {formatData(selectedSession.data_used)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Status</span>
                <Badge 
                  variant={selectedSession.status === "completed" ? "default" : "secondary"}
                  className={selectedSession.status === "completed" ? "bg-green-100 text-green-700" : ""}
                >
                  {selectedSession.status}
                </Badge>
              </div>

              <Button 
                className="w-full mt-4" 
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
