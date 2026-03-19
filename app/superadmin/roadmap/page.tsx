"use client"

import React, { useState, useEffect } from "react"
import { CheckCircle2, XCircle, Clock, Send, MessageSquareText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { superadminApi } from "@/lib/superadmin-api"
import type { FeatureRequest } from "@/lib/types"

export default function SuperadminRoadmapPage() {
  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [comment, setComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { 
    load() 
  }, [])

  const load = async () => {
    setIsLoading(true)
    try {
      // Use the superadminApi wrapper instead of direct axios
      const data = await superadminApi.getFeatureRequests()
      setRequests(data)
    } catch (error) {
      toast.error("Failed to load roadmap data")
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      await superadminApi.updateFeatureStatus(id, { status })
      toast.success(`Moved to ${status.replace('_', ' ')}`)
      load()
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  const addComment = async (id: number) => {
    if (!comment.trim()) {
      toast.error("Please enter a response")
      return
    }
    
    try {
      await superadminApi.updateFeatureStatus(id, { admin_comment: comment })
      toast.success("Response posted successfully!")
      setComment("")
      setSelectedId(null)
      load()
    } catch (error) {
      toast.error("Failed to post response")
    }
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" /> Pending</span>
      case 'planned': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">📋 Planned</span>
      case 'in_progress': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">⚙️ In Progress</span>
      case 'completed': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</span>
      case 'rejected': return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>
      default: return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>
    }
  }

  if (isLoading) {
    return (
      <div className="flex p-8 items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Loading roadmap data...
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Roadmap</h1>
          <p className="text-slate-600">Manage feature requests and priorities from ISPs</p>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 text-center">Votes</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>ISP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map(req => (
                <TableRow key={req.id} className={selectedId === req.id ? "bg-blue-50/50" : ""}>
                  <TableCell className="text-center font-black text-lg text-blue-600">
                    {req.upvotes_count}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900">{req.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-1 max-w-md">{req.description}</div>
                    {req.admin_comment && (
                      <div className="mt-1 text-xs text-blue-600 bg-blue-50 p-1 rounded inline-block">
                        💬 Team: {req.admin_comment}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-700">
                    {req.requested_by_name}
                  </TableCell>
                  <TableCell>
                    <select 
                      className="p-1.5 border rounded-md text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={req.status} 
                      onChange={(e) => updateStatus(req.id, e.target.value)}
                    >
                      <option value="pending">🟡 Pending Review</option>
                      <option value="planned">📋 Planned</option>
                      <option value="in_progress">⚙️ In Progress</option>
                      <option value="completed">✅ Completed</option>
                      <option value="rejected">❌ Rejected</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedId(selectedId === req.id ? null : req.id)}
                      className={selectedId === req.id ? "border-blue-500 bg-blue-50" : ""}
                    >
                      <MessageSquareText className="w-3.5 h-3.5 mr-1.5" /> 
                      {selectedId === req.id ? "Cancel" : "Respond"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500 bg-slate-50/50">
                    No feature requests yet. They'll appear here when ISPs submit them.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Response Panel */}
      {selectedId && (
        <Card className="border-2 border-blue-200 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-blue-700 flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" />
              Respond to Feature Request #{selectedId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-sm font-medium text-slate-700">
                  Official Team Response
                </Label>
                <Input 
                  id="comment"
                  value={comment} 
                  onChange={e => setComment(e.target.value)} 
                  placeholder="Write a public response to the ISP community..."
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  This response will be visible to all ISPs on the request detail page.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedId(null)}>
                  Cancel
                </Button>
                <Button onClick={() => addComment(selectedId)} disabled={!comment.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  Post Response
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}