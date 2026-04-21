"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  MessageSquare,
  User,
  Clock,
  Send,
  Paperclip,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Tag,
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
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()

  const ticket = {
    id: params.id,
    subject: "Internet connection keeps dropping",
    category: "connectivity",
    priority: "high",
    status: "in-progress",
    createdAt: "2024-01-15 09:30",
    updatedAt: "2024-01-15 14:45",
    user: {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+254712345678",
      plan: "Premium 50Mbps",
    },
    messages: [
      {
        id: 1,
        sender: "user",
        name: "John Doe",
        message: "My internet connection has been dropping every few hours. It started yesterday evening and has been happening consistently since then. I've already tried restarting the router but the issue persists.",
        timestamp: "2024-01-15 09:30",
        attachments: [],
      },
      {
        id: 2,
        sender: "support",
        name: "Support Team",
        message: "Hi John, thank you for reaching out. I understand how frustrating connection drops can be. Let me check your connection logs. Could you please provide the MAC address of your router?",
        timestamp: "2024-01-15 10:15",
        attachments: [],
      },
      {
        id: 3,
        sender: "user",
        name: "John Doe",
        message: "Sure, the MAC address is AA:BB:CC:DD:EE:FF. I also noticed that the power light on the router blinks when the connection drops.",
        timestamp: "2024-01-15 11:00",
        attachments: ["router-photo.jpg"],
      },
      {
        id: 4,
        sender: "support",
        name: "Support Team",
        message: "Thank you for the information. I've checked your connection logs and noticed some packet loss issues on the line. I've escalated this to our technical team who will perform a line test. We'll update you within 24 hours.",
        timestamp: "2024-01-15 14:45",
        attachments: [],
      },
    ],
  }

  const handleStatusChange = (status: string) => {
    toast.success(`Ticket status changed to ${status}`)
  }

  const handlePriorityChange = (priority: string) => {
    toast.success(`Ticket priority changed to ${priority}`)
  }

  const handleSendReply = () => {
    toast.success("Reply sent successfully")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-700"
      case "in-progress": return "bg-yellow-100 text-yellow-700"
      case "resolved": return "bg-green-100 text-green-700"
      case "closed": return "bg-slate-100 text-slate-700"
      default: return "bg-slate-100 text-slate-700"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "bg-slate-100 text-slate-700"
      case "medium": return "bg-blue-100 text-blue-700"
      case "high": return "bg-orange-100 text-orange-700"
      case "urgent": return "bg-red-100 text-red-700"
      default: return "bg-slate-100 text-slate-700"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">#{ticket.id}</h1>
            <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
            <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
          </div>
          <p className="text-lg text-slate-700 mt-1">{ticket.subject}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleStatusChange("resolved")}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Resolved
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("closed")}>
              <XCircle className="w-4 h-4 mr-2" />
              Close Ticket
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {ticket.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.sender === "support" ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className={message.sender === "support" ? "bg-blue-100 text-blue-700" : "bg-slate-100"}>
                      {message.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 max-w-[80%] ${message.sender === "support" ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {message.sender === "support" && <Badge variant="outline" className="text-xs">Support</Badge>}
                      <span className="font-medium text-sm">{message.name}</span>
                      <span className="text-xs text-slate-500">{message.timestamp}</span>
                    </div>
                    <div
                      className={`rounded-lg p-4 ${
                        message.sender === "support"
                          ? "bg-blue-50 text-slate-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                      {message.attachments.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-slate-400" />
                          {message.attachments.map((attachment, i) => (
                            <span key={i} className="text-xs text-blue-600 hover:underline cursor-pointer">
                              {attachment}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              {/* Reply Box */}
              <div className="space-y-4">
                <Textarea
                  placeholder="Type your reply..."
                  rows={4}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach File
                  </Button>
                  <Button onClick={handleSendReply}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback>{ticket.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <Link href={`/admin/users/${ticket.user.id}`} className="font-medium hover:text-blue-600">
                    {ticket.user.name}
                  </Link>
                  <p className="text-sm text-slate-500">{ticket.user.email}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone</span>
                  <span>{ticket.user.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan</span>
                  <span>{ticket.user.plan}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/users/${ticket.user.id}`}>View Profile</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Select defaultValue={ticket.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Priority</label>
                <Select defaultValue={ticket.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Category</label>
                <Select defaultValue={ticket.category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="connectivity">Connectivity</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="speed">Speed Issues</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Created</span>
                  <span>{ticket.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Updated</span>
                  <span>{ticket.updatedAt}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
