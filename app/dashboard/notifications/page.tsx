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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Trash2,
  Check,
  Filter,
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

interface Notification {
  id: number
  title: string
  message: string
  type: "info" | "warning" | "success" | "error"
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      // const response = await api.getNotifications()
      // setNotifications(response.results)

      // Mock data
      const mockData: Notification[] = [
        {
          id: 1,
          title: "Payment Received",
          message: "Your payment of KSh 2,000 has been successfully processed.",
          type: "success",
          read: false,
          created_at: "2024-11-26T10:30:00"
        },
        {
          id: 2,
          title: "Service Expiring Soon",
          message: "Your internet service will expire in 3 days. Please renew to avoid interruption.",
          type: "warning",
          read: false,
          created_at: "2024-11-25T14:00:00"
        },
        {
          id: 3,
          title: "New Package Available",
          message: "Check out our new 5G package with speeds up to 1Gbps!",
          type: "info",
          read: true,
          created_at: "2024-11-24T09:15:00"
        },
        {
          id: 4,
          title: "Scheduled Maintenance",
          message: "Network maintenance scheduled for Nov 30, 2024 from 2AM to 4AM.",
          type: "info",
          read: true,
          created_at: "2024-11-23T16:45:00"
        },
      ]

      setNotifications(mockData)
    } catch (error) {
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      // TODO: Call API to mark as read
      // await api.markNotificationRead(id)
      
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ))
      toast.success("Marked as read")
    } catch (error) {
      toast.error("Failed to mark as read")
    }
  }

  const markAllAsRead = async () => {
    try {
      // TODO: Call API to mark all as read
      // await api.markAllNotificationsRead()
      
      setNotifications(notifications.map(n => ({ ...n, read: true })))
      toast.success("All notifications marked as read")
    } catch (error) {
      toast.error("Failed to mark all as read")
    }
  }

  const deleteNotification = async (id: number) => {
    try {
      // TODO: Call API to delete
      // await api.deleteNotification(id)
      
      setNotifications(notifications.filter(n => n.id !== id))
      toast.success("Notification deleted")
      setDeleteId(null)
    } catch (error) {
      toast.error("Failed to delete notification")
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.read
    if (filter === "read") return n.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-success" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-warning" />
      case "error":
        return <AlertTriangle className="w-5 h-5 text-destructive" />
      default:
        return <Info className="w-5 h-5 text-primary" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case "success": return "bg-success/15 border-success/20"
      case "warning": return "bg-warning/15 border-warning/20"
      case "error": return "bg-destructive/15 border-destructive/20"
      default: return "bg-primary/15 border-primary/20"
    }
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-600 mt-1">
            Stay updated with your account activity
            {unreadCount > 0 && (
              <Badge className="ml-3 bg-primary">{unreadCount} unread</Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadNotifications}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <Check className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Show:</span>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              variant={filter === "read" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("read")}
            >
              Read ({notifications.length - unreadCount})
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No notifications to display</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-6 transition-all ${
                !notification.read ? "border-l-4 border-l-blue-600" : ""
              } ${notification.read ? "bg-slate-50" : "bg-white"}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {notification.title}
                        {!notification.read && (
                          <Badge className="ml-2 bg-primary text-xs">New</Badge>
                        )}
                      </h3>
                      <p className="text-slate-600 text-sm">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteId(notification.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The notification will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteNotification(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
