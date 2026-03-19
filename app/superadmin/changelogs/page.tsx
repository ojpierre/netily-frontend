"use client"

import React, { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    update_type: "feature", // Now TS knows this isn't just any string
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
    return <div className="flex p-8 items-center justify-center text-slate-500"><Loader2 className="animate-spin mr-2 w-5 h-5"/> Loading changelogs...</div>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Changelogs</h1>
          <p className="text-slate-600">Broadcast updates to all ISP dashboards</p>
        </div>
        
        {/* NEW RELEASE MODAL */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold"><Plus className="w-4 h-4 mr-2" /> New Release</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Publish a New Release</DialogTitle>
                <DialogDescription>
                  This will appear in the "What's New" timeline for all active ISPs.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="title">Release Title *</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g., Brand new Hotspot Dashboard" 
                      required 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <Input 
                      id="version" 
                      placeholder="v1.2.0" 
                      value={formData.version}
                      onChange={(e) => setFormData({...formData, version: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Update Type</Label>
                  <select 
                    id="type"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  <Label htmlFor="content">Release Notes *</Label>
                  <Textarea 
                    id="content" 
                    placeholder="Describe what's new, what's changed, or what was fixed..." 
                    rows={6}
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border">
                  <input 
                    type="checkbox" 
                    id="published" 
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                  />
                  <Label htmlFor="published" className="font-medium cursor-pointer">
                    Publish immediately
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Release
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium text-slate-600">
                    {new Date(log.release_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-500">{log.version || '---'}</TableCell>
                  <TableCell className="font-bold text-slate-900">{log.title}</TableCell>
                  <TableCell>
                    <Badge className={`uppercase text-[9px] font-black tracking-wider ${getTypeColor(log.update_type)}`} variant="outline">
                      {log.update_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.is_published ? (
                      <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDelete(log.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500 bg-slate-50/50">
                    No changelogs created yet. Click "New Release" to broadcast your first update!
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