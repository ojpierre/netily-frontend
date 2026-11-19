"use client"

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Clock, Moon, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { spring } from "@/lib/plans-motion"

export const DAY_KEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
export type DayKey = (typeof DAY_KEYS)[number]
export type TimeWindow = { start: string; end: string }
export type TimeWindows = Partial<Record<DayKey, TimeWindow>>

const ABBR: Record<DayKey, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
}
const FULL: Record<DayKey, string> = {
  monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday",
  friday: "Friday", saturday: "Saturday", sunday: "Sunday",
}

const HOUR_PRESETS: { label: string; hint: string; win: TimeWindow | null }[] = [
  { label: "All day", hint: "00:00–24:00", win: null },
  { label: "Morning", hint: "06:00–12:00", win: { start: "06:00", end: "12:00" } },
  { label: "Afternoon", hint: "12:00–18:00", win: { start: "12:00", end: "18:00" } },
  { label: "Evening", hint: "18:00–23:00", win: { start: "18:00", end: "23:00" } },
  { label: "Night", hint: "22:00–06:00", win: { start: "22:00", end: "06:00" } },
  { label: "Happy hour", hint: "18:00–19:00", win: { start: "18:00", end: "19:00" } },
]

const DAY_SHORTCUTS: { label: string; days: DayKey[] }[] = [
  { label: "Every day", days: [...DAY_KEYS] },
  { label: "Weekdays", days: ["monday", "tuesday", "wednesday", "thursday", "friday"] },
  { label: "Weekends", days: ["saturday", "sunday"] },
]

/** Short human label for plan cards. Returns null when plan is available all day, every day. */
export function summarizeSchedule(plan: any): string | null {
  const days = DAY_KEYS.filter((d) => plan?.[`valid_${d}`] !== false)
  const windows: TimeWindows = plan?.valid_time_windows || {}
  const wins = days.map((d) => windows[d]).filter(Boolean) as TimeWindow[]
  if (days.length === 7 && wins.length === 0) return null

  let dayLabel: string
  if (days.length === 7) dayLabel = "Daily"
  else if (days.length === 5 && !days.includes("saturday") && !days.includes("sunday")) dayLabel = "Mon–Fri"
  else if (days.length === 2 && days.includes("saturday") && days.includes("sunday")) dayLabel = "Weekends"
  else dayLabel = days.map((d) => ABBR[d]).join(", ") || "No days"

  if (wins.length === 0) return dayLabel
  const first = wins[0]
  const uniform = wins.length === days.length && wins.every((w) => w.start === first.start && w.end === first.end)
  return uniform ? `${dayLabel} · ${first.start}–${first.end}` : `${dayLabel} · custom hours`
}

interface Props {
  validDays: Record<string, boolean>
  windows: TimeWindows
  onChange: (next: { validDays: Record<string, boolean>; windows: TimeWindows }) => void
}

export function HotspotScheduleEditor({ validDays, windows, onChange }: Props) {
  const isOn = (d: DayKey) => validDays[d] !== false
  const enabled = DAY_KEYS.filter(isOn)

  const keepWindowsFor = (days: DayKey[]) => {
    const next: TimeWindows = {}
    days.forEach((d) => { if (windows[d]) next[d] = windows[d] })
    return next
  }

  const toggleDay = (d: DayKey) => {
    const days = { ...validDays, [d]: !isOn(d) }
    const nextEnabled = DAY_KEYS.filter((k) => days[k] !== false)
    onChange({ validDays: days, windows: keepWindowsFor(nextEnabled) })
  }

  const selectDays = (keys: DayKey[]) => {
    const days = Object.fromEntries(DAY_KEYS.map((d) => [d, keys.includes(d)]))
    onChange({ validDays: days, windows: keepWindowsFor(keys) })
  }

  const applyToAll = (win: TimeWindow | null) => {
    const next: TimeWindows = {}
    if (win) enabled.forEach((d) => { next[d] = { ...win } })
    onChange({ validDays, windows: next })
  }

  const setWindow = (d: DayKey, patch: Partial<TimeWindow>) => {
    const cur = windows[d] ?? { start: "18:00", end: "19:00" }
    onChange({ validDays, windows: { ...windows, [d]: { ...cur, ...patch } } })
  }

  const clearWindow = (d: DayKey) => {
    const next = { ...windows }
    delete next[d]
    onChange({ validDays, windows: next })
  }

  const activePreset = HOUR_PRESETS.find((p) => {
    if (enabled.length === 0) return false
    if (p.win === null) return enabled.every((d) => !windows[d])
    return enabled.every((d) => windows[d]?.start === p.win!.start && windows[d]?.end === p.win!.end)
  })

  return (
    <div className="space-y-4">
      {/* Days */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-sm font-medium">Available days</Label>
          <div className="flex gap-1">
            {DAY_SHORTCUTS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => selectDays(s.days)}
                className="rounded-md px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {DAY_KEYS.map((d) => {
            const active = isOn(d)
            return (
              <motion.button
                key={d}
                type="button"
                whileTap={{ scale: 0.92 }}
                animate={{ scale: active ? 1 : 0.97 }}
                transition={spring}
                onClick={() => toggleDay(d)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-muted bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {ABBR[d]}
              </motion.button>
            )
          })}
        </div>
        {enabled.length === 0 && (
          <p className="text-xs text-destructive">Select at least one day or the plan will never appear.</p>
        )}
      </div>

      {/* Hours */}
      <div className="space-y-2 rounded-xl border border-dashed border-muted p-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <Label className="text-sm font-medium">Time of day</Label>
          <span className="text-xs text-muted-foreground">
            {activePreset?.win === null ? "Available all day" : "Limit to specific hours"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {HOUR_PRESETS.map((p) => {
            const active = activePreset?.label === p.label
            return (
              <motion.button
                key={p.label}
                type="button"
                disabled={enabled.length === 0}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => applyToAll(p.win)}
                className={`rounded-lg border px-2 py-1.5 text-left transition-colors disabled:opacity-50 ${
                  active ? "border-primary bg-primary/10" : "border-muted bg-card hover:bg-muted/60"
                }`}
              >
                <p className="text-xs font-semibold">{p.label}</p>
                <p className="text-[10px] text-muted-foreground">{p.hint}</p>
              </motion.button>
            )
          })}
        </div>

        {/* Per-day fine tuning */}
        <div className="space-y-1.5 pt-1">
          <AnimatePresence initial={false}>
            {enabled.map((d) => {
              const w = windows[d]
              const overnight = !!w && w.start > w.end
              const invalid = !!w && (!w.start || !w.end || w.start === w.end)
              return (
                <motion.div
                  key={d}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={spring}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5">
                    <span className="w-20 text-xs font-medium">{FULL[d]}</span>
                    {!w ? (
                      <>
                        <span className="text-xs text-muted-foreground">All day</span>
                        <button
                          type="button"
                          onClick={() => setWindow(d, {})}
                          className="ml-auto rounded-md px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10"
                        >
                          Set hours
                        </button>
                      </>
                    ) : (
                      <>
                        <Input
                          type="time"
                          value={w.start}
                          onChange={(e) => setWindow(d, { start: e.target.value })}
                          className={`h-8 w-[104px] text-xs ${invalid ? "border-destructive" : ""}`}
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={w.end}
                          onChange={(e) => setWindow(d, { end: e.target.value })}
                          className={`h-8 w-[104px] text-xs ${invalid ? "border-destructive" : ""}`}
                        />
                        {overnight && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Moon className="h-3 w-3" /> ends next day
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => clearWindow(d)}
                          aria-label={`Make ${FULL[d]} all day`}
                          className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        <p className="text-[11px] text-muted-foreground">
          The plan only appears on the WiFi portal (and can only be bought) during these hours.
        </p>
      </div>
    </div>
  )
}