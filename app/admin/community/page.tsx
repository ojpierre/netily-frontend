"use client"

import React, { useState, useEffect } from "react"
import { ThumbsUp, MessageSquare, Plus, Filter, Loader2, Lightbulb } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { adminApi } from "@/lib/admin-api"
import type { FeatureRequest } from "@/lib/types"

export default function CommunityBoardPage() {
  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newRequest, setNewRequest] = useState<{
    title: string;
    description: string;
    category: 'network' | 'billing' | 'hotspot' | 'ui_ux' | 'automation' | 'other';
  }>({ 
    title: "", 
    description: "", 
    category: "other" 
  })

  useEffect(() => { loadRequests() }, [])

  const loadRequests = async () => {
    try {
      const data = await adminApi.getFeatureRequests()
      setRequests(data)
    } catch (e) { 
      toast.error("Failed to load requests") 
    } finally { 
      setIsLoading(false) 
    }
  }

  const handleUpvote = async (id: number) => {
    try {
      const result = await adminApi.toggleUpvote(id)
      setRequests(prev => prev.map(r => r.id === id ? { 
        ...r, 
        upvotes_count: result.count, 
        has_upvoted: result.action === 'added' 
      } : r))
      toast.success(result.action === 'added' ? "Upvoted!" : "Vote removed")
    } catch (e) { 
      toast.error("Upvote failed") 
    }
  }

  const handleSubmit = async () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      toast.error("Please fill in all fields")
      return
    }
    
    try {
      await adminApi.submitFeatureRequest(newRequest)
      setIsModalOpen(false)
      setNewRequest({ title: "", description: "", category: "other" })
      loadRequests()
      toast.success("Request submitted to the community!")
    } catch (e) {
      toast.error("Failed to submit request")
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = { 
      pending: "bg-amber-100 text-amber-700",
      planned: "bg-blue-100 text-blue-700", 
      in_progress: "bg-amber-100 text-amber-700 animate-pulse", 
      completed: "bg-emerald-100 text-emerald-700",
      rejected: "bg-slate-100 text-slate-500" 
    }
    return <Badge className={`capitalize border-none ${colors[status] || "bg-slate-100"}`}>{status.replace('_', ' ')}</Badge>
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      network: "bg-purple-100 text-purple-700",
      billing: "bg-green-100 text-green-700",
      hotspot: "bg-orange-100 text-orange-700",
      ui_ux: "bg-pink-100 text-pink-700",
      automation: "bg-indigo-100 text-indigo-700",
      other: "bg-slate-100 text-slate-700"
    }
    return <Badge variant="outline" className={`text-[10px] uppercase font-bold ${colors[category] || "text-slate-400"}`}>{category.replace('_', ' ')}</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex p-8 items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2 w-5 h-5" /> Loading community requests...
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Community Roadmap</h1>
          <p className="text-slate-500">Suggest new features and upvote ideas from other ISPs.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold shadow-lg shadow-blue-500/20"><Plus className="w-4 h-4 mr-2"/> Suggest Feature</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>New Feature Suggestion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title"
                  placeholder="Short, descriptive title" 
                  value={newRequest.title} 
                  onChange={e => setNewRequest({...newRequest, title: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select 
                  id="category"
                  className="w-full p-2 border rounded-md text-sm bg-background" 
                  value={newRequest.category} 
                  onChange={e => setNewRequest({...newRequest, category: e.target.value as 'network' | 'billing' | 'hotspot' | 'ui_ux' | 'automation' | 'other'})}
                >
                  <option value="network">Network & Mikrotik</option>
                  <option value="billing">Billing & Payments</option>
                  <option value="hotspot">Hotspot & Vouchers</option>
                  <option value="ui_ux">Dashboard & UI</option>
                  <option value="automation">Automation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  placeholder="Explain the problem and how this feature helps..." 
                  rows={4} 
                  value={newRequest.description} 
                  onChange={e => setNewRequest({...newRequest, description: e.target.value})} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Submit to Community</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {requests.length === 0 ? (
          <Card className="border-dashed border-2 bg-slate-50/50">
            <CardContent className="py-12 text-center">
              <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No feature requests yet</h3>
              <p className="text-slate-500 mb-6">Be the first to suggest an idea for the community!</p>
              <Button onClick={() => setIsModalOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Submit Your Idea
              </Button>
            </CardContent>
          </Card>
        ) : (
          requests.map(req => (
            <Card key={req.id} className="group hover:border-blue-200 transition-all border-slate-200 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="p-6 flex-grow space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryBadge(req.category)}
                    {getStatusBadge(req.status)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{req.title}</h3>
                    <p className="text-slate-600 text-sm mt-1 line-clamp-2">{req.description}</p>
                  </div>
                  {req.admin_comment && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex gap-3">
                      <Lightbulb className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Netily Team Response</p>
                        <p className="text-sm text-slate-700 mt-1 italic">"{req.admin_comment}"</p>
                      </div>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> 
                    Requested by {req.requested_by_name} • {new Date(req.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="md:w-32 bg-slate-50/50 md:border-l flex flex-col items-center justify-center p-6 gap-2">
                  <span className="text-2xl font-black text-slate-900">{req.upvotes_count}</span>
                  <Button 
                    variant={req.has_upvoted ? "default" : "outline"} 
                    size="sm" 
                    className={`w-full font-bold ${req.has_upvoted ? "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" : ""}`}
                    onClick={() => handleUpvote(req.id)}
                  >
                    <ThumbsUp className={`w-3 h-3 mr-2 ${req.has_upvoted ? "fill-white" : ""}`} />
                    {req.has_upvoted ? "Upvoted" : "Upvote"}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}