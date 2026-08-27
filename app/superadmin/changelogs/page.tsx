"use client"

import React, { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, Save, Megaphone, BellRing, Mail, MessageSquareText, LayoutDashboard } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { superadminApi, type ChangelogCreatePayload } from "@/lib/superadmin-api"
import type { PlatformChangelog } from "@/lib/types"

export default function SuperadminChangelogsPage() {
  const [logs, setLogs] = useState<PlatformChangelog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ChangelogCreatePayload>({
    title: "",
    version: "",
    update_type: "feature",
    content: "",
    is_published: true,
    notify_email: true,
    notify_sms: false,
    notify_in_app: true,
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
      const created = await superadminApi.createChangelog(formData)
      const channels = created.notification_request?.channels ?? []
      if (created.notification_request?.queued && channels.length > 0) {
        toast.success(`Release published. Notifications queued via ${channels.join(", ")}.`)
      } else {
        toast.success("Release published successfully!")
      }
      setIsModalOpen(false)
      // Reset form
      setFormData({
        title: "",
        version: "",
        update_type: "feature",
        content: "",
        is_published: true,
        notify_email: true,
        notify_sms: false,
        notify_in_app: true,
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
      case 'feature': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      case 'improvement': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'bugfix': return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      case 'maintenance': return 'bg-violet-500/20 text-violet-300 border-violet-500/30'
      default: return 'bg-slate-700/40 text-slate-300 border-slate-600/50'
    }
  }

  const getChannelBadge = (channel: string) => {
    switch(channel) {
      case "email":
        return <Badge key={channel} variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-200"><Mail className="mr-1 h-3 w-3" />Email</Badge>
      case "sms":
        return <Badge key={channel} variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200"><MessageSquareText className="mr-1 h-3 w-3" />SMS</Badge>
      case "in_app":
        return <Badge key={channel} variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200"><LayoutDashboard className="mr-1 h-3 w-3" />Dashboard</Badge>
      default:
        return <Badge key={channel} variant="outline">{channel}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-400"></div>
        <p className="font-medium animate-pulse">Loading changelogs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Sleek Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Platform Changelogs</h1>
          <p className="text-slate-400 text-sm mt-1">Broadcast platform updates, features, and fixes to all ISP dashboards.</p>
        </div>
        
        {/* NEW RELEASE MODAL */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all">
              <Plus className="w-4 h-4 mr-2" /> New Release
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader className="pb-4 border-b border-slate-800">
                <DialogTitle className="text-xl font-bold text-white">Publish a New Release</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Publish once, then choose whether tenants should receive the update in their dashboard, email inbox, or SMS feed.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="title" className="font-semibold text-slate-200">Release Title *</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g., Brand new Hotspot Dashboard" 
                      required 
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="version" className="font-semibold text-slate-200">Version</Label>
                    <Input 
                      id="version" 
                      placeholder="v1.2.0" 
                      className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      value={formData.version}
                      onChange={(e) => setFormData({...formData, version: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="font-semibold text-slate-200">Update Type</Label>
                  <select 
                    id="type"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
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
                  <Label htmlFor="content" className="font-semibold text-slate-200">Release Notes *</Label>
                  <Textarea 
                    id="content" 
                    placeholder="Describe what's new, what's changed, or what was fixed..." 
                    rows={6}
                    required
                    className="resize-none bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                  />
                </div>

                <div className="flex items-center space-x-3 bg-violet-500/10 p-4 rounded-xl border border-violet-500/20">
                  <input 
                    type="checkbox" 
                    id="published" 
                    className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-violet-500 cursor-pointer bg-slate-800"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                  />
                  <Label htmlFor="published" className="font-semibold text-violet-200 cursor-pointer">
                    Publish immediately to all ISPs
                  </Label>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-white">Tenant notifications</p>
                    <p className="text-xs text-slate-400">Choose where this release should be delivered after publishing.</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                      <Checkbox
                        checked={!!formData.notify_in_app}
                        onCheckedChange={(checked) => setFormData({ ...formData, notify_in_app: Boolean(checked) })}
                        className="mt-0.5 data-[state=checked]:border-emerald-500 data-[state=checked]:bg-emerald-500"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-100">Dashboard</span>
                        <span className="block text-xs text-slate-400">In-app alert inside tenant admin panels.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                      <Checkbox
                        checked={!!formData.notify_email}
                        onCheckedChange={(checked) => setFormData({ ...formData, notify_email: Boolean(checked) })}
                        className="mt-0.5 data-[state=checked]:border-sky-500 data-[state=checked]:bg-sky-500"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-100">Email</span>
                        <span className="block text-xs text-slate-400">Best for full release notes and rollout details.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                      <Checkbox
                        checked={!!formData.notify_sms}
                        onCheckedChange={(checked) => setFormData({ ...formData, notify_sms: Boolean(checked) })}
                        className="mt-0.5 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-100">SMS</span>
                        <span className="block text-xs text-slate-400">Use only for short, urgent product updates.</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-slate-800">
                <Button type="button" variant="ghost" className="text-slate-300 hover:text-white" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-500 text-white">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Release
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/90">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-300">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Releases</p>
              <p className="text-2xl font-black text-white">{logs.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/90">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Notifications Sent</p>
              <p className="text-2xl font-black text-white">{logs.reduce((sum, log) => sum + (log.notification_summary?.notifications_sent ?? 0), 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/90">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-2xl bg-sky-500/15 p-3 text-sky-300">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tenants Reached</p>
              <p className="text-2xl font-black text-white">{logs.reduce((sum, log) => sum + (log.notification_summary?.tenants_processed ?? 0), 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900 border-b border-slate-800">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-400">Date</TableHead>
                <TableHead className="font-bold text-slate-400">Version</TableHead>
                <TableHead className="font-bold text-slate-400">Title</TableHead>
                <TableHead className="font-bold text-slate-400">Type</TableHead>
                <TableHead className="font-bold text-slate-400">Status</TableHead>
                <TableHead className="font-bold text-slate-400">Delivery</TableHead>
                <TableHead className="text-right font-bold text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} className="transition-colors border-slate-800 hover:bg-slate-800/40">
                  <TableCell className="font-semibold text-slate-300">
                    {new Date(log.release_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-slate-500 font-medium">{log.version || '---'}</TableCell>
                  <TableCell className="font-bold text-slate-100 text-base">{log.title}</TableCell>
                  <TableCell>
                    <Badge className={`uppercase text-[10px] font-black tracking-wider shadow-sm ${getTypeColor(log.update_type)}`} variant="outline">
                      {log.update_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.is_published ? (
                      <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-700/40 text-slate-300 font-semibold border border-slate-600/50">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {(log.notification_channels?.length ? log.notification_channels : ["in_app"]).map(getChannelBadge)}
                      </div>
                      {log.notification_summary?.notifications_sent ? (
                        <p className="text-xs text-slate-400">
                          {log.notification_summary.notifications_sent} sent to {log.notification_summary.tenants_processed ?? 0} tenants
                        </p>
                      ) : log.notification_request?.queued ? (
                        <p className="text-xs text-sky-300">Queued for delivery</p>
                      ) : (
                        <p className="text-xs text-slate-500">No send summary yet</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors" onClick={() => handleDelete(log.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Megaphone className="w-10 h-10 text-slate-600 mb-3" />
                      <p className="font-medium text-slate-300">No changelogs created yet.</p>
                      <p className="text-sm text-slate-500">Click "New Release" to broadcast your first update to ISPs.</p>
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
