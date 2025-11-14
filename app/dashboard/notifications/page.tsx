"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Mail, MessageSquare, Smartphone, Check } from "lucide-react"
import { useState } from "react"

export default function NotificationsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)

  const notifications = [
    {
      id: 1,
      type: "payment",
      title: "Payment Successful",
      message: "Your payment of KSh 1,500 for Mtaani-8 has been processed successfully.",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      type: "plan",
      title: "Plan Activated",
      message: "Your Mtaani-8 plan is now active. Enjoy unlimited internet!",
      time: "2 hours ago",
      read: false,
    },
    {
      id: 3,
      type: "reminder",
      title: "Plan Expiring Soon",
      message: "Your current plan will expire in 5 days. Recharge now to stay connected.",
      time: "1 day ago",
      read: true,
    },
    {
      id: 4,
      type: "promotion",
      title: "Special Offer!",
      message: "Upgrade to Mtaani-20 and get 10% off your first month. Offer valid until Nov 20.",
      time: "2 days ago",
      read: true,
    },
    {
      id: 5,
      type: "system",
      title: "Scheduled Maintenance",
      message: "We'll be performing maintenance on Nov 15 from 2-4 AM. Brief interruptions expected.",
      time: "3 days ago",
      read: true,
    },
  ]

  const [notificationList, setNotificationList] = useState(notifications)

  const markAsRead = (id: number) => {
    setNotificationList(notificationList.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotificationList(notificationList.map(n => ({ ...n, read: true })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "payment": return "💳"
      case "plan": return "📡"
      case "reminder": return "⏰"
      case "promotion": return "🎁"
      case "system": return "⚙️"
      default: return "🔔"
    }
  }

  const unreadCount = notificationList.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-600 mt-1">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" className="bg-transparent">
            <Check className="w-4 h-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notification Preferences */}
      <Card className="p-6 bg-white">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Notification Preferences</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">Email</p>
                <p className="text-xs text-slate-500">Get updates via email</p>
              </div>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`w-12 h-6 rounded-full transition-colors ${
                emailNotifications ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  emailNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-slate-900">SMS</p>
                <p className="text-xs text-slate-500">Text message alerts</p>
              </div>
            </div>
            <button
              onClick={() => setSmsNotifications(!smsNotifications)}
              className={`w-12 h-6 rounded-full transition-colors ${
                smsNotifications ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  smsNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-purple-600" />
              <div>
                <p className="font-semibold text-slate-900">Push</p>
                <p className="text-xs text-slate-500">Browser notifications</p>
              </div>
            </div>
            <button
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`w-12 h-6 rounded-full transition-colors ${
                pushNotifications ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  pushNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {notificationList.map((notification) => (
          <Card
            key={notification.id}
            className={`p-6 cursor-pointer transition-all hover:shadow-md ${
              !notification.read ? "bg-blue-50 border-l-4 border-l-blue-600" : "bg-white"
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">{getIcon(notification.type)}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-slate-900">{notification.title}</h3>
                  {!notification.read && (
                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </div>
                <p className="text-slate-600 mb-2">{notification.message}</p>
                <p className="text-xs text-slate-400">{notification.time}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
