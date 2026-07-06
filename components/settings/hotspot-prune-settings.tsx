"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { adminApi } from "@/lib/admin-api"
import type { HotspotPruneSettings } from "@/lib/types"

const WINDOW_OPTIONS = [
  { value: 1, label: "1 Day" },
  { value: 7, label: "7 Days" },
  { value: 30, label: "30 Days (default)" },
]

export function HotspotPruneSettingsCard() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [windowDays, setWindowDays] = useState<number>(30)
  const [lastPrunedAt, setLastPrunedAt] = useState<string | null>(null)

  useEffect(() => {
    adminApi.getHotspotPruneSettings()
      .then((s) => {
        setEnabled(s.is_enabled)
        setWindowDays(s.prune_window_days)
        setLastPrunedAt(s.last_pruned_at)
      })
      .catch(() => toast.error("Failed to load hotspot pruning settings"))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await adminApi.updateHotspotPruneSettings({
        is_enabled: enabled,
        prune_window_days: windowDays as 1 | 7 | 30,
      })
      setLastPrunedAt(updated.last_pruned_at)
      toast.success("Hotspot pruning settings saved")
    } catch (e: any) {
      toast.error(e.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Hotspot Client Cleanup</CardTitle>
            <CardDescription>
              Automatically remove hotspot clients who haven't purchased a plan in a while,
              freeing up your client list and RADIUS tables.
            </CardDescription>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Delete hotspot clients inactive for more than:
        </label>
        <Select
          value={String(windowDays)}
          onValueChange={(v) => setWindowDays(Number(v))}
          disabled={!enabled}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WINDOW_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-slate-500">
          Runs automatically once a day. Clients with an active or paid session are never deleted.
        </p>
        {lastPrunedAt && (
          <p className="text-xs text-slate-400">
            Last run: {new Date(lastPrunedAt).toLocaleString()}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  )
}