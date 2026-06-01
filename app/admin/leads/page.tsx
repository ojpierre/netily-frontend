"use client"

import React, { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Loader2, Mail, Phone, Plus, RefreshCw, Search, Trash2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { adminApi } from "@/lib/admin-api"

type LeadStatus = "not_yet" | "converted"

interface Lead {
  id: number
  name: string
  email: string
  phone: string
  company_name: string
  lead_source: string
  message: string
  status: LeadStatus
  is_contacted: boolean
  contacted_at?: string | null
  created_at: string
}

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  company_name: "",
  lead_source: "",
  message: "",
  status: "not_yet" as LeadStatus,
}

export default function LeadsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const loadLeads = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = { page_size: "100" }
      if (query.trim()) params.search = query.trim()
      if (statusFilter !== "all") params.status = statusFilter
      const data = await adminApi.getLeads(params)
      setLeads(data?.results || [])
    } catch (error: any) {
      console.error("Failed to load leads:", error)
      toast.error(error?.message || "Failed to load leads")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadLeads, 250)
    return () => window.clearTimeout(timer)
  }, [query, statusFilter])

  const stats = useMemo(() => {
    const converted = leads.filter((lead) => lead.status === "converted" || lead.is_contacted).length
    return {
      total: leads.length,
      converted,
      notYet: leads.length - converted,
      conversionRate: leads.length ? Math.round((converted / leads.length) * 100) : 0,
    }
  }, [leads])

  const saveLead = async () => {
    if (!form.name.trim()) {
      toast.error("Lead name is required")
      return
    }
    if (!form.phone.trim() && !form.email.trim()) {
      toast.error("Add at least a phone number or email")
      return
    }

    try {
      setSaving(true)
      await adminApi.createLead(form)
      toast.success("Lead added")
      setDialogOpen(false)
      setForm(emptyForm)
      await loadLeads()
    } catch (error: any) {
      toast.error(error?.message || "Failed to add lead")
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (lead: Lead, status: LeadStatus) => {
    try {
      const updated = await adminApi.updateLead(lead.id, { status })
      setLeads((items) => items.map((item) => (item.id === lead.id ? updated : item)))
      toast.success(status === "converted" ? "Lead marked converted" : "Lead marked not yet")
    } catch (error: any) {
      toast.error(error?.message || "Failed to update lead")
    }
  }

  const deleteLead = async (lead: Lead) => {
    if (!window.confirm(`Delete lead "${lead.name}"?`)) return
    try {
      await adminApi.deleteLead(lead.id)
      setLeads((items) => items.filter((item) => item.id !== lead.id))
      toast.success("Lead deleted")
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete lead")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads Management</h1>
          <p className="text-muted-foreground">Capture, follow up, and mark tenant leads as converted.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadLeads} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Leads</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Not Yet</CardDescription>
            <CardTitle className="text-3xl text-amber-600">{stats.notYet}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Converted</CardDescription>
            <CardTitle className="text-3xl text-emerald-600">{stats.converted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
            <CardTitle className="text-3xl">{stats.conversionRate}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Tenant Leads</CardTitle>
              <CardDescription>Manual leads and website enquiries for this tenant.</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-64 pl-9"
                  placeholder="Search name, phone, source..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | LeadStatus)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="not_yet">Not yet</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-14 w-full" />)}
            </div>
          ) : leads.length === 0 ? (
            <div className="rounded-xl border border-dashed py-14 text-center">
              <UserPlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No leads yet</p>
              <p className="text-sm text-muted-foreground">Add your first lead to start tracking follow-ups.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-40 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-muted-foreground">{lead.company_name || "No company"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {lead.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{lead.phone}</div>}
                          {lead.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" />{lead.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>{lead.lead_source || "Manual"}</TableCell>
                      <TableCell>
                        {lead.status === "converted" || lead.is_contacted ? (
                          <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" />Converted</Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700">Not yet</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{lead.message || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus(lead, lead.status === "converted" || lead.is_contacted ? "not_yet" : "converted")}
                          >
                            {lead.status === "converted" || lead.is_contacted ? "Mark Not Yet" : "Convert"}
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteLead(lead)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Lead</DialogTitle>
            <DialogDescription>Enter only what you know now. You can follow up later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Jane Mwangi" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+254..." />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Company / Location</Label>
                <Input value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Source</Label>
                <Input value={form.lead_source} onChange={(event) => setForm({ ...form, lead_source: event.target.value })} placeholder="Referral, Facebook, walk-in..." />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as LeadStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_yet">Not yet</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="What are they interested in?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={saveLead} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
