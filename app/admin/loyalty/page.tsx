"use client"

import { useState, useEffect, useCallback } from "react"
import { adminApi } from "@/lib/admin-api"
import {
  LoyaltyStats, LoyaltySettings, LoyaltyTier, LoyaltyMember,
  LoyaltyReward, PointsTransaction, PointsRule, TierLevel, RewardCategory
} from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  Trophy, Star, Gift, Users, TrendingUp, Award, Crown, Medal,
  Plus, Search, Loader2, RefreshCw, Zap, Edit, Trash2, Settings,
  MessageSquare, Send, Ticket
} from "lucide-react"

// ─── Helpers ────────────────────────────────────────────────────────────────

const kes = (v: number | string) =>
  `KES ${Number(v).toLocaleString("en-KE", { minimumFractionDigits: 0 })}`

const fmtPts = (v: number) => v.toLocaleString() + " pts"

const tierColors: Record<TierLevel | string, string> = {
  bronze: "bg-amber-600 text-white",
  silver: "bg-slate-400 text-white",
  gold: "bg-yellow-500 text-white",
  platinum: "bg-cyan-600 text-white",
  diamond: "bg-purple-600 text-white",
}

const tierIcons: Record<TierLevel | string, React.ReactNode> = {
  bronze: <Medal className="w-3 h-3" />,
  silver: <Medal className="w-3 h-3" />,
  gold: <Star className="w-3 h-3" />,
  platinum: <Crown className="w-3 h-3" />,
  diamond: <Trophy className="w-3 h-3" />,
}

const categoryLabels: Record<RewardCategory, string> = {
  internet: "Internet / Data",
  credit: "Account Credit",
  voucher: "Hotspot Voucher",
  discount: "Plan Discount",
  hardware: "Hardware",
  other: "Other",
}

// Safe fetch — returns fallback when endpoint doesn't exist yet
async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn() } catch { return fallback }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const { toast } = useToast()

  // Data state
  const [stats, setStats] = useState<LoyaltyStats | null>(null)
  const [settings, setSettings] = useState<LoyaltySettings | null>(null)
  const [tiers, setTiers] = useState<LoyaltyTier[]>([])
  const [members, setMembers] = useState<LoyaltyMember[]>([])
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [transactions, setTransactions] = useState<PointsTransaction[]>([])
  const [rules, setRules] = useState<PointsRule[]>([])
  const [leaderboard, setLeaderboard] = useState<{ most_returning: LoyaltyMember[]; highest_spending: LoyaltyMember[]; top_points: LoyaltyMember[] }>({ most_returning: [], highest_spending: [], top_points: [] })

  // Loading / error
  const [loading, setLoading] = useState(true)
  const [apiReady, setApiReady] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  // Search / filter
  const [memberSearch, setMemberSearch] = useState("")

  // Award Points dialog
  const [awardDialog, setAwardDialog] = useState(false)
  const [awardMemberId, setAwardMemberId] = useState<string>("")
  const [awardPoints, setAwardPointsValue] = useState("")
  const [awardReason, setAwardReason] = useState("")
  const [awardSMS, setAwardSMS] = useState(true)
  const [awardLoading, setAwardLoading] = useState(false)

  // Award Voucher dialog
  const [voucherDialog, setVoucherDialog] = useState(false)
  const [voucherMemberId, setVoucherMemberId] = useState<string>("")
  const [voucherBatchId, setVoucherBatchId] = useState("")
  const [voucherSMS, setVoucherSMS] = useState(true)
  const [voucherLoading, setVoucherLoading] = useState(false)

  // Reward dialog
  const [rewardDialog, setRewardDialog] = useState<"create" | "edit" | null>(null)
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null)
  const [rewardForm, setRewardForm] = useState<Partial<LoyaltyReward>>({})
  const [rewardLoading, setRewardLoading] = useState(false)

  // Settings form
  const [settingsForm, setSettingsForm] = useState<Partial<LoyaltySettings>>({})

  // ─── Load all data (gracefully handles missing endpoints) ─────────────────

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, cfg, t, m, r, tx, rl, lbPoints, lbSpent, lbReturning] = await Promise.all([
        safeFetch(() => adminApi.getLoyaltyStats(), null),
        safeFetch(() => adminApi.getLoyaltySettings(), null),
        safeFetch(() => adminApi.getLoyaltyTiers(), []),
        safeFetch(() => adminApi.getLoyaltyMembers(), { results: [] } as any),
        safeFetch(() => adminApi.getLoyaltyRewards(), []),
        safeFetch(() => adminApi.getLoyaltyTransactions(), { results: [] } as any),
        safeFetch(() => adminApi.getLoyaltyRules(), []),
        safeFetch(() => adminApi.getLoyaltyLeaderboard('lifetime_points', 10), []),
        safeFetch(() => adminApi.getLoyaltyLeaderboard('total_spent', 10), []),
        safeFetch(() => adminApi.getLoyaltyLeaderboard('total_payments', 10), []),
      ])

      // Check if the API is deployed at all
      const hasData = s || cfg || t.length > 0
      setApiReady(hasData)

      setStats(s)
      if (cfg) { setSettings(cfg); setSettingsForm(cfg) }
      setTiers(t)
      setMembers(Array.isArray(m) ? m : (m.results ?? []))
      setRewards(r)
      setTransactions(Array.isArray(tx) ? tx : (tx.results ?? []))
      setRules(rl)
      setLeaderboard({ top_points: lbPoints, highest_spending: lbSpent, most_returning: lbReturning })
    } catch {
      setApiReady(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ─── Award Points ───────────────────────────────────────────────────────────

  const handleAwardPoints = async () => {
    if (!awardMemberId || !awardPoints) return
    setAwardLoading(true)
    try {
      await adminApi.awardPoints(Number(awardMemberId), Number(awardPoints), awardReason || undefined)
      const member = members.find(m => String(m.id) === awardMemberId)
      toast({ title: `+${awardPoints} points awarded to ${member?.name ?? "member"}` })
      setAwardDialog(false)
      setAwardMemberId(""); setAwardPointsValue(""); setAwardReason("")
      loadAll()
    } catch (e: any) {
      toast({ title: e?.message ?? "Failed to award points", variant: "destructive" })
    } finally {
      setAwardLoading(false)
    }
  }

  // ─── Award Voucher ──────────────────────────────────────────────────────────

  const handleAwardVoucher = async () => {
    if (!voucherMemberId) return
    setVoucherLoading(true)
    try {
      const res = await adminApi.awardVoucher(Number(voucherMemberId), voucherBatchId ? Number(voucherBatchId) : undefined, voucherSMS)
      const member = members.find(m => String(m.id) === voucherMemberId)
      toast({ title: `Voucher awarded to ${member?.name ?? "member"}${res?.voucher_code ? ` — Code: ${res.voucher_code}` : ""}` })
      setVoucherDialog(false)
      setVoucherMemberId(""); setVoucherBatchId(""); setVoucherSMS(true)
      loadAll()
    } catch (e: any) {
      toast({ title: e?.message ?? "Failed to award voucher", variant: "destructive" })
    } finally {
      setVoucherLoading(false)
    }
  }

  // ─── Save Settings ──────────────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const updated = await adminApi.updateLoyaltySettings(settingsForm)
      setSettings(updated)
      toast({ title: "Settings saved" })
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" })
    } finally {
      setSavingSettings(false)
    }
  }

  // ─── Reward CRUD ────────────────────────────────────────────────────────────

  const openCreateReward = () => {
    setEditingReward(null)
    setRewardForm({ status: "active", category: "other" })
    setRewardDialog("create")
  }

  const openEditReward = (r: LoyaltyReward) => {
    setEditingReward(r)
    setRewardForm({ ...r })
    setRewardDialog("edit")
  }

  const handleSaveReward = async () => {
    setRewardLoading(true)
    try {
      if (rewardDialog === "edit" && editingReward) {
        await adminApi.updateLoyaltyReward(editingReward.id, rewardForm)
        toast({ title: "Reward updated" })
      } else {
        await adminApi.createLoyaltyReward(rewardForm)
        toast({ title: "Reward created" })
      }
      setRewardDialog(null)
      const updated = await safeFetch(() => adminApi.getLoyaltyRewards(), [])
      setRewards(updated)
    } catch {
      toast({ title: "Failed to save reward", variant: "destructive" })
    } finally {
      setRewardLoading(false)
    }
  }

  const handleDeleteReward = async (id: number) => {
    try {
      await adminApi.deleteLoyaltyReward(id)
      setRewards(prev => prev.filter(r => r.id !== id))
      toast({ title: "Reward deleted" })
    } catch {
      toast({ title: "Failed to delete reward", variant: "destructive" })
    }
  }

  // ─── Filtered members ───────────────────────────────────────────────────────

  const filteredMembers = members.filter(m =>
    !memberSearch ||
    m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.customer_code?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.phone?.includes(memberSearch)
  )

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-72">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Loyalty Program
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage points, rewards, and member tiers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAll}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setAwardDialog(true)}>
            <Zap className="w-4 h-4 mr-2" /> Award Points
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setVoucherDialog(true)}>
            <Ticket className="w-4 h-4 mr-2" /> Award Voucher
          </Button>
        </div>
      </div>

      {/* API not deployed warning */}
      {!apiReady && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 shrink-0">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">Loyalty backend not deployed yet</p>
              <p className="text-sm text-amber-700 mt-1">
                Run the migration <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-xs font-mono">docker compose exec web python manage.py migrate_schemas</code> and then{" "}
                <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-xs font-mono">docker compose exec web python manage.py populate_loyalty_members</code> to seed tiers and enroll existing customers.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Total Members" value={(stats?.total_members ?? 0).toLocaleString()} />
        <StatCard icon={<Star className="w-5 h-5 text-yellow-500" />} label="Points Issued" value={fmtCompact(stats?.total_points_issued ?? 0)} />
        <StatCard icon={<Gift className="w-5 h-5 text-green-600" />} label="Redemptions" value={(stats?.total_redemptions ?? 0).toLocaleString()} />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-600" />} label="Avg Points" value={Math.round(stats?.avg_points_per_member ?? 0).toLocaleString()} />
        <StatCard icon={<Award className="w-5 h-5 text-orange-500" />} label="Active Rewards" value={(stats?.active_rewards ?? 0).toLocaleString()} />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-cyan-600" />} label="Total Spent" value={kes(stats?.total_spent ?? 0)} />
      </div>

      {/* Tier Distribution */}
      {stats?.tier_distribution && stats.tier_distribution.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {stats.tier_distribution.map(td => (
            <Badge key={td.id} className={`${tierColors[td.level] ?? "bg-slate-500 text-white"} gap-1 px-3 py-1.5`}>
              {tierIcons[td.level]} {td.name}: {td.count}
            </Badge>
          ))}
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="members">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
          <TabsTrigger value="members" className="text-xs sm:text-sm"><Users className="w-4 h-4 mr-1 hidden sm:inline" /> Members</TabsTrigger>
          <TabsTrigger value="tiers" className="text-xs sm:text-sm"><Crown className="w-4 h-4 mr-1 hidden sm:inline" /> Tiers</TabsTrigger>
          <TabsTrigger value="rewards" className="text-xs sm:text-sm"><Gift className="w-4 h-4 mr-1 hidden sm:inline" /> Rewards</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs sm:text-sm"><Star className="w-4 h-4 mr-1 hidden sm:inline" /> Transactions</TabsTrigger>
          <TabsTrigger value="leaderboard" className="text-xs sm:text-sm"><Trophy className="w-4 h-4 mr-1 hidden sm:inline" /> Leaderboard</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs sm:text-sm"><Settings className="w-4 h-4 mr-1 hidden sm:inline" /> Settings</TabsTrigger>
        </TabsList>

        {/* ── MEMBERS ── */}
        <TabsContent value="members" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Loyalty Members</CardTitle>
                  <CardDescription>Click on any member row to award points or vouchers</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search name, code, phone…"
                    className="pl-9 h-9"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMembers.length === 0 ? (
                <EmptyState icon={<Users className="w-10 h-10 text-slate-300" />} title="No members yet" message="Members will appear here once the loyalty migration runs and customers are enrolled." />
              ) : (
                <div className="space-y-2">
                  {filteredMembers.map((m, i) => {
                    const rank = i + 1
                    const isTop3 = rank <= 3
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center gap-4 rounded-xl px-4 py-3 border transition-all ${
                          isTop3
                            ? "bg-gradient-to-r from-violet-50 to-white border-violet-200 shadow-sm"
                            : "bg-white border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        {/* Rank circle */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          rank === 1 ? "bg-yellow-400 text-yellow-900" :
                          rank === 2 ? "bg-slate-300 text-slate-800" :
                          rank === 3 ? "bg-orange-300 text-orange-900" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {rank}
                        </div>

                        {/* Member info */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${isTop3 ? "text-slate-900 text-base" : "text-slate-700 text-sm"}`}>
                            {m.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {m.tier_level && (
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tierColors[m.tier_level] ?? "bg-slate-100 text-slate-600"}`}>
                                {tierIcons[m.tier_level]} {m.tier_name}
                              </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground truncate">{m.customer_code} · {m.phone}</span>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="text-right shrink-0 hidden md:block">
                          <p className="text-xs text-muted-foreground">{m.total_payments} payments</p>
                          <p className="text-xs text-muted-foreground">{m.redemptions_count} redeemed</p>
                        </div>

                        {/* Points */}
                        <div className={`text-right shrink-0 ${isTop3 ? "min-w-[100px]" : "min-w-[80px]"}`}>
                          <p className={`font-bold ${isTop3 ? "text-violet-700 text-base" : "text-slate-700 text-sm"}`}>
                            {m.current_points.toLocaleString()} pts
                          </p>
                          <p className="text-[10px] text-muted-foreground">{kes(m.total_spent)} spent</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="sm" variant="outline" className="h-7 px-2 text-xs"
                            onClick={() => { setAwardMemberId(String(m.id)); setAwardDialog(true) }}
                            title="Award Points"
                          >
                            <Zap className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm" variant="outline" className="h-7 px-2 text-xs"
                            onClick={() => { setVoucherMemberId(String(m.id)); setVoucherDialog(true) }}
                            title="Award Voucher"
                          >
                            <Ticket className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TIERS ── */}
        <TabsContent value="tiers" className="mt-4">
          {tiers.length === 0 ? (
            <EmptyState icon={<Crown className="w-10 h-10 text-slate-300" />} title="No tiers configured" message="Deploy the loyalty backend and run populate_loyalty_members to create default tiers (Bronze → Silver → Gold → Platinum → Diamond)." />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {tiers.map(tier => (
                <Card key={tier.id} className="relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${tierColors[tier.level]?.split(" ")[0] ?? "bg-slate-400"}`} />
                  <CardHeader className="pb-2 pt-5">
                    <div className="flex items-center justify-between">
                      <Badge className={`${tierColors[tier.level] ?? "bg-slate-500 text-white"} gap-1 px-3`}>
                        {tierIcons[tier.level]} {tier.name}
                      </Badge>
                      <span className="text-xs font-bold text-slate-500">{tier.members_count} members</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Threshold</span>
                      <span className="font-semibold">{tier.min_points.toLocaleString()} pts</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Multiplier</span>
                      <span className="font-bold text-violet-600">{tier.points_multiplier}×</span>
                    </div>
                    {tier.benefits.length > 0 && (
                      <div className="mt-3 pt-2 border-t">
                        <ul className="space-y-1">
                          {tier.benefits.map((b, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                              <span className="text-green-500 mt-0.5">✓</span> {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── REWARDS ── */}
        <TabsContent value="rewards" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reward Catalog</CardTitle>
                  <CardDescription>Create rewards that members can redeem with their points</CardDescription>
                </div>
                <Button size="sm" onClick={openCreateReward}>
                  <Plus className="w-4 h-4 mr-2" /> Add Reward
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rewards.length === 0 ? (
                <EmptyState icon={<Gift className="w-10 h-10 text-slate-300" />} title="No rewards yet" message="Create your first loyalty reward — e.g. free data top-up, account credit, or hotspot voucher." />
              ) : (
                <div className="space-y-3">
                  {rewards.map(r => (
                    <div key={r.id} className="flex items-center gap-4 rounded-xl px-4 py-3 border bg-white hover:border-slate-200 transition-all">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        r.category === "voucher" ? "bg-blue-100 text-blue-600" :
                        r.category === "credit" ? "bg-green-100 text-green-600" :
                        r.category === "internet" ? "bg-purple-100 text-purple-600" :
                        r.category === "discount" ? "bg-orange-100 text-orange-600" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {r.category === "voucher" ? <Ticket className="w-5 h-5" /> :
                         r.category === "credit" ? <TrendingUp className="w-5 h-5" /> :
                         r.category === "internet" ? <Zap className="w-5 h-5" /> :
                         <Gift className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">{r.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{categoryLabels[r.category]}</Badge>
                          <Badge variant={r.status === "active" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 uppercase">{r.status}</Badge>
                          {r.stock_quantity !== null && <span className="text-[10px] text-muted-foreground">{r.stock_quantity} in stock</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-blue-600 text-base">{r.points_cost.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">points</p>
                      </div>
                      <div className="text-right shrink-0 min-w-[60px] hidden sm:block">
                        <p className="text-sm font-medium">{r.redemption_count}</p>
                        <p className="text-[10px] text-muted-foreground">redeemed</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditReward(r)}>
                          <Edit className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => handleDeleteReward(r.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TRANSACTIONS ── */}
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Points Transactions</CardTitle><CardDescription>Full audit trail of all points movements</CardDescription></CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <EmptyState icon={<Star className="w-10 h-10 text-slate-300" />} title="No transactions yet" message="Points awarded, redeemed, or expired will be logged here." />
              ) : (
                <div className="space-y-2">
                  {transactions.map(tx => (
                    <div key={tx.id} className="flex items-center gap-4 rounded-lg px-3 py-2.5 border border-slate-100 hover:border-slate-200 transition-all">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                        tx.transaction_type === "earned" ? "bg-green-100 text-green-700" :
                        tx.transaction_type === "redeemed" ? "bg-orange-100 text-orange-700" :
                        tx.transaction_type === "bonus" ? "bg-blue-100 text-blue-700" :
                        tx.transaction_type === "expired" ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {tx.transaction_type === "earned" ? "+" :
                         tx.transaction_type === "redeemed" ? "−" :
                         tx.transaction_type === "bonus" ? "★" :
                         tx.transaction_type === "expired" ? "✕" : "~"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{tx.member_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{tx.description || tx.transaction_type}</p>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("en-KE")}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      <div className="text-right shrink-0 min-w-[80px]">
                        <p className={`font-bold ${tx.points >= 0 ? "text-green-600" : "text-red-500"}`}>
                          {tx.points >= 0 ? "+" : ""}{tx.points.toLocaleString()}
                        </p>
                        <Badge variant="secondary" className={`text-[9px] uppercase ${
                          tx.transaction_type === "earned" ? "bg-green-50 text-green-700" :
                          tx.transaction_type === "redeemed" ? "bg-orange-50 text-orange-700" :
                          tx.transaction_type === "bonus" ? "bg-blue-50 text-blue-700" :
                          "bg-slate-50 text-slate-600"
                        }`}>
                          {tx.transaction_type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LEADERBOARD (Reports-style ranked rows) ── */}
        <TabsContent value="leaderboard" className="mt-4 space-y-6">
          <LeaderboardSection
            title="Top Points Earners"
            icon={<Star className="w-4 h-4" />}
            description="Ranked by lifetime points earned"
            color="violet"
            members={leaderboard.top_points}
            valueKey="lifetime_points"
            valueFormat={v => fmtPts(v)}
            onAward={(id) => { setAwardMemberId(String(id)); setAwardDialog(true) }}
            onVoucher={(id) => { setVoucherMemberId(String(id)); setVoucherDialog(true) }}
          />
          <LeaderboardSection
            title="Highest Spenders"
            icon={<TrendingUp className="w-4 h-4" />}
            description="Ranked by total amount spent on services"
            color="green"
            members={leaderboard.highest_spending}
            valueKey="total_spent"
            valueFormat={v => kes(v)}
            onAward={(id) => { setAwardMemberId(String(id)); setAwardDialog(true) }}
            onVoucher={(id) => { setVoucherMemberId(String(id)); setVoucherDialog(true) }}
          />
          <LeaderboardSection
            title="Most Returning Customers"
            icon={<Crown className="w-4 h-4" />}
            description="Ranked by total completed payments"
            color="purple"
            members={leaderboard.most_returning}
            valueKey="total_payments"
            valueFormat={v => v + " payments"}
            onAward={(id) => { setAwardMemberId(String(id)); setAwardDialog(true) }}
            onVoucher={(id) => { setVoucherMemberId(String(id)); setVoucherDialog(true) }}
          />
        </TabsContent>

        {/* ── SETTINGS ── */}
        <TabsContent value="settings" className="mt-4">
          {!settings ? (
            <EmptyState icon={<Settings className="w-10 h-10 text-slate-300" />} title="Settings unavailable" message="Deploy the loyalty backend to configure settings." />
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Points Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <SettingField label="Points per KES" hint={`1 point per KES ${settingsForm.currency_unit ?? settings.currency_unit}`} value={settingsForm.points_per_currency ?? settings.points_per_currency} onChange={v => setSettingsForm(p => ({ ...p, points_per_currency: Number(v) }))} type="number" />
                  <SettingField label="Currency Unit (KES)" hint="e.g. 100 means per KES 100" value={settingsForm.currency_unit ?? settings.currency_unit} onChange={v => setSettingsForm(p => ({ ...p, currency_unit: Number(v) }))} type="number" />
                  <SettingField label="Signup Bonus (pts)" value={settingsForm.signup_bonus ?? settings.signup_bonus} onChange={v => setSettingsForm(p => ({ ...p, signup_bonus: Number(v) }))} type="number" />
                  <SettingField label="Referral Bonus (pts)" value={settingsForm.referral_bonus ?? settings.referral_bonus} onChange={v => setSettingsForm(p => ({ ...p, referral_bonus: Number(v) }))} type="number" />
                  <SettingField label="Monthly Tenure Bonus (pts)" value={settingsForm.tenure_monthly_bonus ?? settings.tenure_monthly_bonus} onChange={v => setSettingsForm(p => ({ ...p, tenure_monthly_bonus: Number(v) }))} type="number" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Expiry & Notifications</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Points Expiry Enabled</Label>
                    <Switch checked={settingsForm.points_expiry_enabled ?? settings.points_expiry_enabled} onCheckedChange={v => setSettingsForm(p => ({ ...p, points_expiry_enabled: v }))} />
                  </div>
                  <SettingField label="Expiry Window (months)" value={settingsForm.points_expiry_months ?? settings.points_expiry_months} onChange={v => setSettingsForm(p => ({ ...p, points_expiry_months: Number(v) }))} type="number" />
                  <SettingField label="Expiry Warning (days before)" value={settingsForm.expiry_warning_days ?? settings.expiry_warning_days} onChange={v => setSettingsForm(p => ({ ...p, expiry_warning_days: Number(v) }))} type="number" />
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">SMS Notifications</p>
                    {([
                      ["notify_points_earned", "Points Earned"],
                      ["notify_redemption", "Redemption"],
                      ["notify_tier_upgrade", "Tier Upgrade"],
                      ["notify_monthly_summary", "Monthly Summary"],
                    ] as const).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Label className="text-sm">{label}</Label>
                        <Switch
                          checked={(settingsForm[key as keyof LoyaltySettings] as boolean) ?? (settings[key as keyof LoyaltySettings] as boolean)}
                          onCheckedChange={v => setSettingsForm(p => ({ ...p, [key]: v }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Program Active</Label>
                      <Switch checked={settingsForm.program_active ?? settings.program_active} onCheckedChange={v => setSettingsForm(p => ({ ...p, program_active: v }))} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-Enroll New Customers</Label>
                      <Switch checked={settingsForm.auto_enroll_new_customers ?? settings.auto_enroll_new_customers} onCheckedChange={v => setSettingsForm(p => ({ ...p, auto_enroll_new_customers: v }))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="md:col-span-2 flex justify-end">
                <Button onClick={handleSaveSettings} disabled={savingSettings} className="w-40">
                  {savingSettings ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Settings"}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── AWARD POINTS DIALOG ── */}
      <Dialog open={awardDialog} onOpenChange={open => { if (!open) { setAwardDialog(false); setAwardMemberId(""); setAwardPointsValue(""); setAwardReason(""); setAwardSMS(true) } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Award Points</DialogTitle>
            <DialogDescription>Manually award loyalty points to a member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-sm mb-1.5 block">Member</Label>
              <Select value={awardMemberId} onValueChange={setAwardMemberId}>
                <SelectTrigger><SelectValue placeholder="Select a member…" /></SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name} ({m.customer_code}) — {m.current_points.toLocaleString()} pts
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Points to Award</Label>
              <Input type="number" min={1} placeholder="e.g. 100" value={awardPoints} onChange={e => setAwardPointsValue(e.target.value)} />
              {awardPoints && Number(awardPoints) > 0 && awardMemberId && (
                <p className="text-xs text-green-600 mt-1">
                  Member will have {(
                    (members.find(m => String(m.id) === awardMemberId)?.current_points ?? 0) + Number(awardPoints)
                  ).toLocaleString()} total points after award
                </p>
              )}
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Reason</Label>
              <Select value={awardReason} onValueChange={setAwardReason}>
                <SelectTrigger><SelectValue placeholder="Select a reason…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual bonus">Manual bonus</SelectItem>
                  <SelectItem value="Anniversary reward">Anniversary reward</SelectItem>
                  <SelectItem value="Referral bonus">Referral bonus</SelectItem>
                  <SelectItem value="Compensation">Service compensation</SelectItem>
                  <SelectItem value="Promotion">Promotion</SelectItem>
                  <SelectItem value="Contest winner">Contest winner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <Label className="text-sm">Send SMS notification</Label>
              </div>
              <Switch checked={awardSMS} onCheckedChange={setAwardSMS} />
            </div>
            <Button className="w-full" disabled={awardLoading || !awardMemberId || !awardPoints} onClick={handleAwardPoints}>
              {awardLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Awarding…</> : <><Zap className="w-4 h-4 mr-2" /> Award {awardPoints ? `${Number(awardPoints).toLocaleString()} Points` : "Points"}</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── AWARD VOUCHER DIALOG ── */}
      <Dialog open={voucherDialog} onOpenChange={open => { if (!open) { setVoucherDialog(false); setVoucherMemberId(""); setVoucherBatchId(""); setVoucherSMS(true) } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Ticket className="w-5 h-5 text-blue-500" /> Award Voucher</DialogTitle>
            <DialogDescription>Award a hotspot voucher to a loyalty member via SMS</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-sm mb-1.5 block">Member</Label>
              <Select value={voucherMemberId} onValueChange={setVoucherMemberId}>
                <SelectTrigger><SelectValue placeholder="Select a member…" /></SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name} ({m.customer_code}) — {m.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Voucher Batch ID (optional)</Label>
              <Input type="number" min={1} placeholder="Leave blank for default batch" value={voucherBatchId} onChange={e => setVoucherBatchId(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Links to a specific voucher batch if configured</p>
            </div>
            <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-500" />
                <Label className="text-sm text-blue-700">Send voucher code via SMS</Label>
              </div>
              <Switch checked={voucherSMS} onCheckedChange={setVoucherSMS} />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled={voucherLoading || !voucherMemberId} onClick={handleAwardVoucher}>
              {voucherLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Awarding…</> : <><Ticket className="w-4 h-4 mr-2" /> Award Voucher</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── REWARD DIALOG (create/edit) ── */}
      <Dialog open={!!rewardDialog} onOpenChange={open => { if (!open) setRewardDialog(null) }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{rewardDialog === "edit" ? "Edit Reward" : "New Reward"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-sm mb-1.5 block">Name</Label>
              <Input value={rewardForm.name ?? ""} onChange={e => setRewardForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Free 1GB Data Top-Up" />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Description</Label>
              <Textarea rows={2} value={rewardForm.description ?? ""} onChange={e => setRewardForm(p => ({ ...p, description: e.target.value }))} placeholder="What the member gets when redeeming" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-1.5 block">Points Cost</Label>
                <Input type="number" min={1} value={rewardForm.points_cost ?? ""} onChange={e => setRewardForm(p => ({ ...p, points_cost: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Category</Label>
                <Select value={rewardForm.category ?? "other"} onValueChange={v => setRewardForm(p => ({ ...p, category: v as RewardCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm mb-1.5 block">Status</Label>
                <Select value={rewardForm.status ?? "active"} onValueChange={v => setRewardForm(p => ({ ...p, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Stock (blank = unlimited)</Label>
                <Input type="number" min={0} value={rewardForm.stock_quantity ?? ""} onChange={e => setRewardForm(p => ({ ...p, stock_quantity: e.target.value ? Number(e.target.value) : null }))} />
              </div>
            </div>
            <Button className="w-full" disabled={rewardLoading || !rewardForm.name || !rewardForm.points_cost} onClick={handleSaveReward}>
              {rewardLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Reward"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function fmtCompact(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M"
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, "") + "K"
  return v.toLocaleString()
}

function EmptyState({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      {icon}
      <p className="font-semibold text-slate-600 mt-3">{title}</p>
      <p className="text-sm text-slate-400 max-w-sm mt-1">{message}</p>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
        <div>
          <p className="text-xs text-slate-500">{label}</p>
          <p className="font-black text-base text-slate-900 leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function LeaderboardSection({
  title, icon, description, color, members, valueKey, valueFormat, onAward, onVoucher
}: {
  title: string
  icon: React.ReactNode
  description: string
  color: "violet" | "green" | "purple"
  members: LoyaltyMember[]
  valueKey: keyof LoyaltyMember
  valueFormat: (v: number) => string
  onAward: (memberId: number) => void
  onVoucher: (memberId: number) => void
}) {
  const colorMap = {
    violet: { header: "text-violet-700", gradient: "from-violet-50 to-white", border: "border-violet-200", value: "text-violet-700" },
    green: { header: "text-green-700", gradient: "from-green-50 to-white", border: "border-green-200", value: "text-green-700" },
    purple: { header: "text-purple-700", gradient: "from-purple-50 to-white", border: "border-purple-200", value: "text-purple-700" },
  }
  const c = colorMap[color]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className={`text-base font-semibold ${c.header} flex items-center gap-2`}>
          {icon} {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <EmptyState icon={<Trophy className="w-8 h-8 text-slate-300" />} title="No data yet" message="Leaderboard will populate once members earn points." />
        ) : (
          <div className="space-y-2">
            {members.slice(0, 10).map((m, i) => {
              const rank = i + 1
              const isTop3 = rank <= 3
              const badgeConfig =
                rank === 1 ? { label: "👑 Most Valuable", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" } :
                rank === 2 ? { label: "🥈 Elite Client", cls: "bg-slate-100 text-slate-700 border-slate-300" } :
                rank === 3 ? { label: "🥉 Top Performer", cls: "bg-orange-100 text-orange-700 border-orange-300" } :
                rank <= 5 ? { label: "⭐ High Value", cls: "bg-blue-50 text-blue-700 border-blue-200" } :
                { label: m.tier_name || "Member", cls: "bg-gray-50 text-gray-600 border-gray-200" }

              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-4 rounded-xl px-4 py-3 border transition-all ${
                    isTop3
                      ? `bg-gradient-to-r ${c.gradient} ${c.border} shadow-sm`
                      : "bg-white border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    rank === 1 ? "bg-yellow-400 text-yellow-900" :
                    rank === 2 ? "bg-slate-300 text-slate-800" :
                    rank === 3 ? "bg-orange-300 text-orange-900" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {rank}
                  </div>

                  {/* Name + badge */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isTop3 ? "text-slate-900 text-base" : "text-slate-700 text-sm"}`}>
                      {m.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${badgeConfig.cls}`}>
                        {badgeConfig.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground truncate">{m.customer_code}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs text-muted-foreground">{m.total_payments} payments</p>
                  </div>

                  {/* Value */}
                  <div className={`text-right shrink-0 ${isTop3 ? "min-w-[110px]" : "min-w-[90px]"}`}>
                    <p className={`font-bold ${isTop3 ? `${c.value} text-base` : "text-slate-700 text-sm"}`}>
                      {valueFormat(Number(m[valueKey]))}
                    </p>
                    <p className="text-[10px] text-muted-foreground">lifetime</p>
                  </div>

                  {/* Quick actions */}
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onAward(m.id)} title="Award Points">
                      <Zap className="w-3.5 h-3.5 text-yellow-600" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onVoucher(m.id)} title="Award Voucher">
                      <Ticket className="w-3.5 h-3.5 text-blue-600" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SettingField({ label, hint, value, onChange, type = "text" }: { label: string; hint?: string; value: number | string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <Label className="text-sm mb-1.5 block">{label}</Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}
