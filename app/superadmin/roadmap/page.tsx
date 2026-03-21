"use client"

import React, { useState, useEffect } from "react"
import { Send, MessageSquareText, TrendingUp, Loader2 } from "lucide-react"
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
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

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
      setIsSubmittingComment(true)
      await superadminApi.updateFeatureStatus(id, { admin_comment: comment })
      toast.success("Response posted successfully!")
      setComment("")
      setSelectedId(null)
      load()
    } catch (error) {
      toast.error("Failed to post response")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-400"></div>
        <p className="font-medium animate-pulse">Loading community roadmap...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Sleek Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Community Roadmap</h1>
          <p className="text-slate-400 text-sm mt-1">Manage feature requests and shape the platform future.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Table Column (Takes up more space) */}
        <div className={`transition-all duration-300 ${selectedId ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-900 border-b border-slate-800">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-24 text-center font-bold text-slate-400">Votes</TableHead>
                    <TableHead className="font-bold text-slate-400">Request Details</TableHead>
                    <TableHead className="font-bold text-slate-400 hidden md:table-cell">ISP</TableHead>
                    <TableHead className="font-bold text-slate-400">Status</TableHead>
                    <TableHead className="text-right font-bold text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(req => (
                    <TableRow 
                      key={req.id} 
                      className={`transition-colors border-slate-800 hover:bg-slate-800/40 ${selectedId === req.id ? "bg-violet-500/10 hover:bg-violet-500/10" : ""}`}
                    >
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-violet-500/20 text-violet-300 font-black border border-violet-500/30 shadow-sm">
                          <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-violet-300" />
                          {req.upvotes_count}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="font-bold text-slate-100 text-base">{req.title}</div>
                        <div className="text-sm text-slate-400 line-clamp-1 mt-0.5">{req.description}</div>
                        {req.admin_comment && (
                          <div className="mt-2 text-xs font-medium text-violet-200 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5 rounded-md inline-flex items-start">
                            <span className="mr-1.5">💬</span>
                            <span className="line-clamp-1">Team: {req.admin_comment}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-300 hidden md:table-cell">
                        {req.requested_by_name}
                      </TableCell>
                      <TableCell>
                        <select 
                          className="w-full max-w-[140px] px-3 py-1.5 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:border-violet-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all cursor-pointer appearance-none"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
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
                          className={`font-semibold transition-all ${selectedId === req.id ? "bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-500/20 text-white" : "border-slate-700 text-slate-300 hover:text-violet-300 hover:border-violet-400 hover:bg-violet-500/10"}`}
                        >
                          <MessageSquareText className="w-3.5 h-3.5 mr-1.5" /> 
                          {selectedId === req.id ? "Close" : "Reply"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16 text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <MessageSquareText className="w-10 h-10 text-slate-600 mb-3" />
                          <p className="font-medium text-slate-300">No feature requests yet.</p>
                          <p className="text-sm text-slate-500">They will appear here when ISPs submit them.</p>
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
            <Card className="border border-slate-800 bg-slate-900 shadow-xl overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 text-white">
                <h3 className="font-bold flex items-center gap-2">
                  <MessageSquareText className="w-4 h-4 text-violet-200" />
                  Official Team Response
                </h3>
                <p className="text-violet-100 text-xs mt-1 opacity-90">
                  Update #{selectedId}
                </p>
              </div>
              <CardContent className="p-5 bg-slate-900">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="comment" className="text-sm font-bold text-slate-200">
                      Your Message
                    </Label>
                    <textarea 
                      id="comment"
                      value={comment} 
                      onChange={e => setComment(e.target.value)} 
                      placeholder="Write a public response to the ISP community... e.g., 'Great idea! We are adding this to the Q3 roadmap.'"
                      className="w-full min-h-[120px] p-3 border border-slate-700 bg-slate-800 text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none resize-none transition-all"
                    />
                    <p className="text-[11px] text-slate-500 font-medium">
                      This response will be visible to all ISPs on the request detail page.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <Button variant="ghost" className="flex-1 text-slate-400 hover:text-white" onClick={() => setSelectedId(null)}>
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 bg-violet-600 hover:bg-violet-500 shadow-md shadow-violet-500/20 text-white" 
                      onClick={() => addComment(selectedId)} 
                      disabled={!comment.trim() || isSubmittingComment}
                    >
                      {isSubmittingComment ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
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