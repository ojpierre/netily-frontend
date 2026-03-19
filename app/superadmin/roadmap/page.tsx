"use client"

import React, { useState, useEffect } from "react"
import { CheckCircle2, XCircle, Clock, Send, MessageSquareText, TrendingUp } from "lucide-react"
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

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-slate-500 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="font-medium animate-pulse">Loading community roadmap...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Sleek Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Community Roadmap</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage feature requests and shape the platform's future.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Table Column (Takes up more space) */}
        <div className={`transition-all duration-300 ${selectedId ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-100">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-24 text-center font-bold text-slate-600">Votes</TableHead>
                    <TableHead className="font-bold text-slate-600">Request Details</TableHead>
                    <TableHead className="font-bold text-slate-600 hidden md:table-cell">ISP</TableHead>
                    <TableHead className="font-bold text-slate-600">Status</TableHead>
                    <TableHead className="text-right font-bold text-slate-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(req => (
                    <TableRow 
                      key={req.id} 
                      className={`transition-colors hover:bg-slate-50/80 ${selectedId === req.id ? "bg-blue-50/50 hover:bg-blue-50/50" : ""}`}
                    >
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-black border border-blue-100 shadow-sm">
                          <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                          {req.upvotes_count}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="font-bold text-slate-900 text-base">{req.title}</div>
                        <div className="text-sm text-slate-500 line-clamp-1 mt-0.5">{req.description}</div>
                        {req.admin_comment && (
                          <div className="mt-2 text-xs font-medium text-blue-700 bg-blue-100/50 border border-blue-100 px-2.5 py-1.5 rounded-md inline-flex items-start">
                            <span className="mr-1.5">💬</span>
                            <span className="line-clamp-1">Team: {req.admin_comment}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-700 hidden md:table-cell">
                        {req.requested_by_name}
                      </TableCell>
                      <TableCell>
                        <select 
                          className="w-full max-w-[140px] px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer shadow-sm appearance-none"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
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
                          variant={selectedId === req.id ? "default" : "outline"} 
                          size="sm" 
                          onClick={() => setSelectedId(selectedId === req.id ? null : req.id)}
                          className={`font-semibold transition-all ${selectedId === req.id ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" : "hover:text-blue-600 hover:border-blue-200"}`}
                        >
                          <MessageSquareText className="w-3.5 h-3.5 mr-1.5" /> 
                          {selectedId === req.id ? "Close" : "Reply"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16 text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <MessageSquareText className="w-10 h-10 text-slate-300 mb-3" />
                          <p className="font-medium text-slate-600">No feature requests yet.</p>
                          <p className="text-sm">They will appear here when ISPs submit them.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sliding Response Panel (Only visible when a row is clicked) */}
        {selectedId && (
          <div className="lg:col-span-1 animate-in slide-in-from-right-8 duration-300">
            <Card className="border-0 shadow-xl ring-1 ring-slate-200 overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                <h3 className="font-bold flex items-center gap-2">
                  <MessageSquareText className="w-4 h-4 text-blue-200" />
                  Official Team Response
                </h3>
                <p className="text-blue-100 text-xs mt-1 opacity-90">
                  Update #{selectedId}
                </p>
              </div>
              <CardContent className="p-5 bg-white">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="comment" className="text-sm font-bold text-slate-700">
                      Your Message
                    </Label>
                    <textarea 
                      id="comment"
                      value={comment} 
                      onChange={e => setComment(e.target.value)} 
                      placeholder="Write a public response to the ISP community... e.g., 'Great idea! We are adding this to the Q3 roadmap.'"
                      className="w-full min-h-[120px] p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all"
                    />
                    <p className="text-[11px] text-slate-500 font-medium">
                      This response will be visible to all ISPs on the request detail page.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button variant="ghost" className="flex-1 text-slate-500" onClick={() => setSelectedId(null)}>
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" 
                      onClick={() => addComment(selectedId)} 
                      disabled={!comment.trim()}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Publish
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}