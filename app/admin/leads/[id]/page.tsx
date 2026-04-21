"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  DollarSign,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  History,
  Plus,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [newNote, setNewNote] = useState("")

  const lead = {
    id: params.id,
    fullName: "Alice Johnson",
    email: "alice@example.com",
    phone: "+254712345678",
    address: "456 Oak Street, Westlands, Nairobi",
    company: "Tech Solutions Ltd",
    source: "Website",
    interestedPlan: "Premium 50Mbps",
    estimatedValue: 42000,
    status: "qualified",
    createdAt: "2024-01-10",
    followUpDate: "2024-01-20",
    assignedTo: "Sales Team",
  }

  const activities = [
    { id: 1, type: "call", description: "Initial phone call - customer interested", date: "2024-01-15 14:30", user: "Admin" },
    { id: 2, type: "email", description: "Sent pricing information", date: "2024-01-14 10:00", user: "Admin" },
    { id: 3, type: "note", description: "Customer requested callback after the weekend", date: "2024-01-12 16:45", user: "Admin" },
    { id: 4, type: "created", description: "Lead created from website inquiry", date: "2024-01-10 09:15", user: "System" },
  ]

  const handleStatusChange = (status: string) => {
    toast.success(`Lead status updated to ${status}`)
  }

  const handleConvertToCustomer = () => {
    toast.success("Converting lead to customer...")
    router.push(`/admin/users/create?from=lead&id=${params.id}`)
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      toast.success("Note added successfully")
      setNewNote("")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-700"
      case "contacted": return "bg-yellow-100 text-yellow-700"
      case "qualified": return "bg-green-100 text-green-700"
      case "lost": return "bg-red-100 text-red-700"
      case "converted": return "bg-purple-100 text-purple-700"
      default: return "bg-slate-100 text-slate-700"
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="w-4 h-4" />
      case "email": return <Mail className="w-4 h-4" />
      case "note": return <MessageSquare className="w-4 h-4" />
      case "created": return <Plus className="w-4 h-4" />
      default: return <History className="w-4 h-4" />
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
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{lead.fullName}</h1>
            <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
          </div>
          <p className="text-slate-600 mt-1">{lead.company}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/admin/leads/${params.id}/edit`}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </Button>
        <Button onClick={handleConvertToCustomer}>
          <UserPlus className="w-4 h-4 mr-2" />
          Convert to Customer
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{lead.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{lead.email}</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                      <span>{lead.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-slate-400" />
                      <span>{lead.company}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Lead Value
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Interested Plan</span>
                      <span className="font-medium">{lead.interestedPlan}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Estimated Value</span>
                      <span className="font-medium">KSh {lead.estimatedValue.toLocaleString()}/yr</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Lead Source</span>
                      <span className="font-medium">{lead.source}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>All interactions with this lead</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activities.map((activity, index) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="relative">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                            {getActivityIcon(activity.type)}
                          </div>
                          {index < activities.length - 1 && (
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-full bg-slate-200" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="font-medium text-slate-900 dark:text-white">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                            <span>{activity.date}</span>
                            <span>•</span>
                            <span>{activity.user}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>Add notes about this lead</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                  />
                  <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                  <Separator />
                  <div className="space-y-4">
                    {activities.filter(a => a.type === "note").map((note) => (
                      <div key={note.id} className="p-4 bg-slate-50 rounded-lg">
                        <p className="text-slate-700">{note.description}</p>
                        <p className="text-sm text-slate-500 mt-2">{note.date} • {note.user}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select defaultValue={lead.status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Created</span>
                  <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Follow-up</span>
                  <span>{new Date(lead.followUpDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned To</span>
                  <span>{lead.assignedTo}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="w-4 h-4 mr-2" />
                Log Call
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Follow-up
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
