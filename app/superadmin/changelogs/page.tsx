"use client"

import React, { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, Save, Megaphone } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { superadminApi } from "@/lib/superadmin-api"
import type { PlatformChangelog } from "@/lib/types"

export default function SuperadminChangelogsPage() {
  const [logs, setLogs] = useState<PlatformChangelog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<{
    title: string;
    version: string;
    update_type: 'feature' | 'improvement' | 'bugfix' | 'maintenance';
    content: string;
    is_published: boolean;
  }>({
    title: "",
    version: "",
    update_type: "feature",
    content: "",
    is_published: true
  })

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    setIsLoading(true)
    try {
      const data = await superadminApi.getChangelogs()
      setLogs(data)
    } catch (error) {
      toast.error("Failed to load changelogs")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this update? It will be removed from all ISP dashboards.")) return
    try {
      await superadminApi.deleteChangelog(id)
      toast.success("Changelog deleted")
      loadLogs()
    } catch (error) {
      toast.error("Failed to delete changelog")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await superadminApi.createChangelog(formData)
      toast.success("Release published successfully!")
      setIsModalOpen(false)
      // Reset form
      setFormData({
        title: "",
        version: "",
        update_type: "feature",
        content: "",
        is_published: true
      })
      loadLogs()
    } catch (error) {
      toast.error("Failed to publish release")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'feature': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'improvement': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'bugfix': return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'maintenance': return 'bg-purple-100 text-purple-700 border-purple-200'
      default: return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-slate-500 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="font-medium animate-pulse">Loading changelogs...</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Sleek Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Platform Changelogs</h1>
          <p className="text-slate-500 mt-1 font-medium">Broadcast platform updates, features, and fixes to all ISP dashboards.</p>
        </div>
        
        {/* NEW RELEASE MODAL */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 font-semibold transition-all">
              <Plus className="w-4 h-4 mr-2" /> New Release
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] border-0 shadow-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader className="pb-4 border-b border-slate-100">
                <DialogTitle className="text-xl font-bold">Publish a New Release</DialogTitle>
                <DialogDescription>
                  This will immediately appear in the "What's New" timeline for all active ISPs.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="title" className="font-semibold text-slate-700">Release Title *</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g., Brand new Hotspot Dashboard" 
                      required 
                      className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="version" className="font-semibold text-slate-700">Version</Label>
                    <Input 
                      id="version" 
                      placeholder="v1.2.0" 
                      className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={formData.version}
                      onChange={(e) => setFormData({...formData, version: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="font-semibold text-slate-700">Update Type</Label>
                  <select 
                    id="type"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    value={formData.update_type}
                    onChange={(e) => setFormData({...formData, update_type: e.target.value as 'feature' | 'improvement' | 'bugfix' | 'maintenance'})}
                  >
                    <option value="feature">🌟 New Feature</option>
                    <option value="improvement">🚀 Improvement</option>
                    <option value="bugfix">🐛 Bug Fix</option>
                    <option value="maintenance">🔧 Maintenance</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="font-semibold text-slate-700">Release Notes *</Label>
                  <Textarea 
                    id="content" 
                    placeholder="Describe what's new, what's changed, or what was fixed..." 
                    rows={6}
                    required
                    className="resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
                </div>

                <div className="flex items-center space-x-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <input 
                    type="checkbox" 
                    id="published" 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                  />
                  <Label htmlFor="published" className="font-semibold text-blue-900 cursor-pointer">
                    Publish immediately to all ISPs
                  </Label>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Release
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-600">Date</TableHead>
                <TableHead className="font-bold text-slate-600">Version</TableHead>
                <TableHead className="font-bold text-slate-600">Title</TableHead>
                <TableHead className="font-bold text-slate-600">Type</TableHead>
                <TableHead className="font-bold text-slate-600">Status</TableHead>
                <TableHead className="text-right font-bold text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="transition-colors hover:bg-slate-50/80">
                  <TableCell className="font-semibold text-slate-600">
                    {new Date(log.release_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-400 font-medium">{log.version || '---'}</TableCell>
                  <TableCell className="font-bold text-slate-900 text-base">{log.title}</TableCell>
                  <TableCell>
                    <Badge className={`uppercase text-[10px] font-black tracking-wider shadow-sm ${getTypeColor(log.update_type)}`} variant="outline">
                      {log.update_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.is_published ? (
                      <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 shadow-sm border-0">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-semibold border-0">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors" onClick={() => handleDelete(log.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Megaphone className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="font-medium text-slate-600">No changelogs created yet.</p>
                      <p className="text-sm">Click "New Release" to broadcast your first update to ISPs!</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}