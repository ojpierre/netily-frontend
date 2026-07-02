"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import {
  Plus, Edit, Trash2, MoreVertical, Search, RefreshCw, Eye,
  Play, Pause, Copy, Calendar, TrendingUp, BarChart3, Upload,
  ExternalLink, CheckCircle, AlertCircle, Settings, MousePointer,
  HardDrive, Gift, Clock, Wifi, X, Loader2, ToggleLeft, ToggleRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePagePermissions } from "@/hooks/use-page-permissions"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"

// ── Types ────────────────────────────────────────────────────────────────────

interface HotspotAd {
  id: number
  name: string
  media_url: string
  media_type: 'VIDEO' | 'IMAGE'
  file_size_mb: number
  target_url: string
  reward_enabled: boolean
  reward_minutes: number
  is_active: boolean
  priority: number
  impressions: number
  completions: number
  ctr: number
  created_at: string
}

interface StorageInfo {
  used_mb: number
  total_mb: number
  available_mb: number
  percentage: number
}

// ── API helpers ───────────────────────────────────────────────────────────────

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')
}

function getApiBase(): string {
  if (typeof window === 'undefined') return 'http://127.0.0.1:8000/api/v1'
  const h = window.location.hostname
  if (h.endsWith('.localhost') || h === 'localhost') return `http://${h}:8000/api/v1`
  return `${window.location.origin}/api/v1`
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken()
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || err.detail || `Error ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Storage Bar ───────────────────────────────────────────────────────────────

function StorageBar({ storage, loading }: { storage: StorageInfo | null; loading: boolean }) {
  if (loading || !storage) return (
    <div className="h-2 w-full bg-gray-100 rounded-full animate-pulse" />
  )
  const { used_mb, total_mb, percentage } = storage
  const color = percentage > 85 ? 'bg-destructive' : percentage > 65 ? 'bg-warning' : 'bg-emerald-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />Ad Storage</span>
        <span className={percentage > 85 ? 'text-destructive font-semibold' : ''}>
          {used_mb.toFixed(1)} / {total_mb} MB
        </span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>
      {percentage > 85 && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Almost full — delete inactive ads to free space
        </p>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdsPage() {
  const perms = usePagePermissions("/admin/ads")
  const [ads, setAds] = useState<HotspotAd[]>([])
  const [storage, setStorage] = useState<StorageInfo | null>(null)
  const [storageLoading, setStorageLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editAd, setEditAd] = useState<HotspotAd | null>(null)
  const [previewAd, setPreviewAd] = useState<HotspotAd | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [form, setForm] = useState({
    name: '',
    media_url: '',
    media_type: 'VIDEO' as 'VIDEO' | 'IMAGE',
    target_url: '',
    reward_enabled: true,
    reward_minutes: 30,
    is_active: true,
    priority: 1,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Load ads + storage
  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [adsData, storageData] = await Promise.all([
        apiRequest<HotspotAd[]>('/hotspot/admin/ads/'),
        apiRequest<StorageInfo>('/hotspot/admin/ads/storage/'),
      ])
      setAds(adsData)
      setStorage(storageData)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
      setStorageLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filteredAds = useMemo(() =>
    ads.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())),
  [ads, searchQuery])

  const openCreate = () => {
    setEditAd(null)
    setForm({ name: '', media_url: '', media_type: 'VIDEO', target_url: '', reward_enabled: true, reward_minutes: 30, is_active: true, priority: 1 })
    setSelectedFile(null)
    setSaveError(null)
    setIsCreateOpen(true)
  }

  const openEdit = (ad: HotspotAd) => {
    setEditAd(ad)
    setForm({
      name: ad.name,
      media_url: ad.media_url || '',
      media_type: ad.media_type,
      target_url: ad.target_url || '',
      reward_enabled: ad.reward_enabled,
      reward_minutes: ad.reward_minutes,
      is_active: ad.is_active,
      priority: ad.priority,
    })
    setSelectedFile(null)
    setSaveError(null)
    setIsCreateOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setSaveError('Ad name is required'); return }
    if (!selectedFile && !form.media_url && !editAd?.media_url) {
      setSaveError('Upload a file or provide a media URL'); return
    }
    setSaving(true)
    setSaveError(null)

    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('media_type', form.media_type)
      fd.append('target_url', form.target_url)
      fd.append('reward_enabled', String(form.reward_enabled))
      fd.append('reward_minutes', String(form.reward_minutes))
      fd.append('is_active', String(form.is_active))
      fd.append('priority', String(form.priority))
      if (selectedFile) fd.append('media_file', selectedFile)
      else if (form.media_url) fd.append('media_url', form.media_url)

      if (editAd) {
        const updated = await apiRequest<HotspotAd>(`/hotspot/admin/ads/${editAd.id}/`, {
          method: 'PATCH',
          body: selectedFile || (!form.media_url && editAd.media_url) ? fd : JSON.stringify({
            name: form.name,
            target_url: form.target_url,
            reward_enabled: form.reward_enabled,
            reward_minutes: form.reward_minutes,
            is_active: form.is_active,
            priority: form.priority,
          }),
        })
        setAds(prev => prev.map(a => a.id === updated.id ? updated : a))
      } else {
        const created = await apiRequest<HotspotAd>('/hotspot/admin/ads/', { method: 'POST', body: fd })
        setAds(prev => [created, ...prev])
      }

      // Refresh storage info
      const storageData = await apiRequest<StorageInfo>('/hotspot/admin/ads/storage/')
      setStorage(storageData)
      setIsCreateOpen(false)
    } catch (e: any) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (ad: HotspotAd) => {
    try {
      const updated = await apiRequest<{ id: number; is_active: boolean }>(
        `/hotspot/admin/ads/${ad.id}/toggle-active/`, { method: 'POST' }
      )
      setAds(prev => prev.map(a => a.id === updated.id ? { ...a, is_active: updated.is_active } : a))
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleDelete = async (ad: HotspotAd) => {
    if (!confirm(`Delete "${ad.name}"? This cannot be undone.`)) return
    try {
      await apiRequest(`/hotspot/admin/ads/${ad.id}/`, { method: 'DELETE' })
      setAds(prev => prev.filter(a => a.id !== ad.id))
      const storageData = await apiRequest<StorageInfo>('/hotspot/admin/ads/storage/')
      setStorage(storageData)
    } catch (e: any) {
      alert(e.message)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fileMb = file.size / (1024 * 1024)
    if (storage && fileMb > storage.available_mb + (editAd?.file_size_mb || 0)) {
      setSaveError(`File too large. Only ${storage.available_mb.toFixed(1)}MB available.`)
      return
    }
    setSelectedFile(file)
    setSaveError(null)
  }

  // Stats
  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0)
  const totalCompletions = ads.reduce((s, a) => s + a.completions, 0)
  const activeCount = ads.filter(a => a.is_active).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Captive Portal Ads</h1>
          <p className="text-slate-500 mt-1">Run ads on your hotspot login page — reward viewers with free internet</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {perms.canAdd && <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New Ad</Button>}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats + Storage */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-sm text-slate-500">Impressions</p><p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p></div>
          <Eye className="w-8 h-8 text-primary/80 opacity-60" />
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-sm text-slate-500">Completions</p><p className="text-2xl font-bold">{totalCompletions.toLocaleString()}</p></div>
          <CheckCircle className="w-8 h-8 text-success opacity-60" />
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-sm text-slate-500">Active Ads</p><p className="text-2xl font-bold text-success">{activeCount}</p></div>
          <TrendingUp className="w-8 h-8 text-emerald-400 opacity-60" />
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-2">
          <StorageBar storage={storage} loading={storageLoading} />
        </CardContent></Card>
      </div>

      {/* Ad List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search ads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : filteredAds.length === 0 ? (
            <div className="text-center py-12">
              <Play className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-muted-foreground mt-2 mb-4 max-w-sm">Create your first advertisement to show on the hotspot captive portal.</p>
              {perms.canAdd && <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Create First Ad</Button>}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAds.map(ad => (
                <div key={ad.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${ad.is_active ? 'border-success/20 bg-success/10/40' : 'border-slate-200 bg-white opacity-70'}`}>
                  {/* Thumbnail */}
                  <div className="w-16 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {ad.media_url ? (
                      ad.media_type === 'IMAGE'
                        ? <img src={ad.media_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        : <Play className="w-6 h-6 text-slate-400" />
                    ) : <Play className="w-6 h-6 text-slate-300" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 truncate">{ad.name}</span>
                      <Badge variant="outline" className={ad.media_type === 'VIDEO' ? 'border-primary/20 text-primary' : 'border-purple-200 text-purple-700'}>
                        {ad.media_type}
                      </Badge>
                      {ad.reward_enabled && ad.reward_minutes > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <Gift className="w-3 h-3" />{ad.reward_minutes}m free
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{ad.impressions.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" />{ad.completions.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><MousePointer className="w-3.5 h-3.5" />{ad.ctr}% CTR</span>
                      {ad.file_size_mb > 0 && (
                        <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" />{ad.file_size_mb.toFixed(1)}MB</span>
                      )}
                    </div>
                  </div>

                  {/* Toggle */}
                  <Switch
                    checked={ad.is_active}
                    onCheckedChange={() => handleToggleActive(ad)}
                    className="data-[state=checked]:bg-success"
                  />

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {perms.canViewDetails && <DropdownMenuItem onClick={() => setPreviewAd(ad)}><Eye className="w-4 h-4 mr-2" />Preview</DropdownMenuItem>}
                      {perms.canEdit && <DropdownMenuItem onClick={() => openEdit(ad)}><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>}
                      {perms.canDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(ad)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={v => { if (!saving) setIsCreateOpen(v) }}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editAd ? 'Edit Ad' : 'Create New Ad'}</SheetTitle>
            <SheetDescription>
              {storage && (
                <span className="text-xs">{storage.available_mb.toFixed(1)}MB storage available</span>
              )}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-180px)] mt-4">
            <div className="space-y-5 pr-4">

              {saveError && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {saveError}
                </div>
              )}

              {/* Storage bar in sheet */}
              <StorageBar storage={storage} loading={storageLoading} />

              <div className="space-y-2">
                <Label>Ad Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Local Promo January" />
              </div>

              <div className="space-y-2">
                <Label>Media Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['VIDEO', 'IMAGE'] as const).map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, media_type: t }))}
                      className={`py-2 rounded-lg border text-sm font-medium transition-colors ${form.media_type === t ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >{t === 'VIDEO' ? '🎬 Video' : '🖼️ Image'}</button>
                  ))}
                </div>
              </div>

              {/* File upload */}
              <div className="space-y-2">
                <Label>Upload File</Label>
                <div
                  className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/10 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div>
                      <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload {form.media_type === 'VIDEO' ? 'MP4/WebM' : 'JPG/PNG'}</p>
                      {storage && <p className="text-xs text-gray-400 mt-1">{storage.available_mb.toFixed(1)}MB remaining</p>}
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={form.media_type === 'VIDEO' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="text-center text-sm text-gray-400">— or paste a URL —</div>

              <div className="space-y-2">
                <Label>External Media URL</Label>
                <Input value={form.media_url} onChange={e => setForm(f => ({ ...f, media_url: e.target.value }))} placeholder="https://..." />
              </div>

              <div className="space-y-2">
                <Label>Click-Through URL (optional)</Label>
                <Input value={form.target_url} onChange={e => setForm(f => ({ ...f, target_url: e.target.value }))} placeholder="https://advertiser.com" />
              </div>

              {/* Reward settings */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-900 text-sm">Free Internet Reward</p>
                      <p className="text-xs text-emerald-600">Give viewers free WiFi after watching</p>
                    </div>
                  </div>
                  <Switch
                    checked={form.reward_enabled}
                    onCheckedChange={v => setForm(f => ({ ...f, reward_enabled: v }))}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                {form.reward_enabled && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-emerald-800">Reward Duration</Label>
                      <span className="text-lg font-bold text-emerald-700 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {form.reward_minutes === 0 ? 'None' : `${form.reward_minutes} min`}
                      </span>
                    </div>
                    <Slider
                      min={0} max={60} step={5}
                      value={[form.reward_minutes]}
                      onValueChange={([v]) => setForm(f => ({ ...f, reward_minutes: v }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-emerald-600">
                      <span>No reward</span>
                      <span>30 min</span>
                      <span>1 hour</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-gray-500">Show this ad on the captive portal</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              </div>

              <div className="space-y-2">
                <Label>Priority (1 = highest)</Label>
                <Input type="number" min={1} max={10} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 1 }))} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)} disabled={saving}>Cancel</Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Plus className="w-4 h-4 mr-2" />{editAd ? 'Save Changes' : 'Create Ad'}</>}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Preview Dialog */}
      <Dialog open={!!previewAd} onOpenChange={v => { if (!v) setPreviewAd(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Ad Preview — {previewAd?.name}</DialogTitle></DialogHeader>
          {previewAd && (
            <div className="space-y-4">
              {previewAd.media_type === 'VIDEO' ? (
                <video src={previewAd.media_url} controls className="w-full rounded-lg max-h-60 bg-black" />
              ) : (
                <img src={previewAd.media_url} alt={previewAd.name} className="w-full rounded-lg object-cover max-h-60" />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Reward</p>
                  <p className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                    <Gift className="w-4 h-4" />
                    {previewAd.reward_enabled && previewAd.reward_minutes > 0
                      ? `${previewAd.reward_minutes} min free`
                      : 'No reward'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Completion Rate</p>
                  <p className="font-semibold mt-0.5">{previewAd.ctr}%</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewAd(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}