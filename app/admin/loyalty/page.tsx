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
  Plus, Search, Loader2, RefreshCw, Zap, Edit, Trash2, Settings
} from "lucide-react"

// ─── Helpers ────────────────────────────────────────────────────────────────

const kes = (v: number | string) =>
  `KES ${Number(v).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`

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

  // Loading states
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)

  // Search / filter
  const [memberSearch, setMemberSearch] = useState("")

  // Award Points dialog
  const [awardDialog, setAwardDialog] = useState(false)
  const [awardMemberId, setAwardMemberId] = useState<string>("")
  const [awardPoints, setAwardPointsValue] = useState("")
  const [awardReason, setAwardReason] = useState("")
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

  // ─── Load all data ──────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, cfg, t, m, r, tx, rl, lbPoints, lbSpent, lbReturning] = await Promise.all([
        adminApi.getLoyaltyStats(),
        adminApi.getLoyaltySettings(),
        adminApi.getLoyaltyTiers(),
        adminApi.getLoyaltyMembers(),
        adminApi.getLoyaltyRewards(),
        adminApi.getLoyaltyTransactions(),
        adminApi.getLoyaltyRules(),
        adminApi.getLoyaltyLeaderboard('lifetime_points', 10),
        adminApi.getLoyaltyLeaderboard('total_spent', 10),
        adminApi.getLoyaltyLeaderboard('total_payments', 10),
      ])
      setStats(s)
      setSettings(cfg)
      setSettingsForm(cfg)
      setTiers(t)
      setMembers(Array.isArray(m) ? m : (m.results ?? []))
      setRewards(r)
      setTransactions(tx.results ?? [])
      setRules(rl)
      setLeaderboard({ top_points: lbPoints, highest_spending: lbSpent, most_returning: lbReturning })
    } catch {
      toast({ title: "Failed to load loyalty data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadAll() }, [loadAll])

  // ─── Award Points ───────────────────────────────────────────────────────────

  const handleAwardPoints = async () => {
    if (!awardMemberId || !awardPoints) return
    setAwardLoading(true)
    try {
      await adminApi.awardPoints(Number(awardMemberId), Number(awardPoints), awardReason || undefined)
      toast({ title: "Points awarded successfully" })
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
      await adminApi.awardVoucher(Number(voucherMemberId), voucherBatchId ? Number(voucherBatchId) : undefined, voucherSMS)
      toast({ title: "Voucher awarded successfully" })
      setVoucherDialog(false)
      setVoucherMemberId(""); setVoucherBatchId(""); setVoucherSMS(true)
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
      const updated = await adminApi.getLoyaltyRewards()
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
          <p className="text-slate-500 text-sm mt-1">Manage members, tiers, rewards, and points</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAll}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setAwardDialog(true)}>
            <Zap className="w-4 h-4 mr-2" /> Award Points
          </Button>
          <Button size="sm" variant="outline" onClick={() => setVoucherDialog(true)}>
            <Gift className="w-4 h-4 mr-2" /> Award Voucher
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Total Members" value={stats.total_members.toLocaleString()} />
          <StatCard icon={<Star className="w-5 h-5 text-yellow-500" />} label="Points Issued" value={stats.total_points_issued.toLocaleString()} />
          <StatCard icon={<Gift className="w-5 h-5 text-green-600" />} label="Redemptions" value={stats.total_redemptions.toLocaleString()} />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-purple-600" />} label="Avg Points" value={Math.round(stats.avg_points_per_member).toLocaleString()} />
          <StatCard icon={<Award className="w-5 h-5 text-orange-500" />} label="Active Rewards" value={stats.active_rewards.toLocaleString()} />
          <StatCard icon={<TrendingUp className="w-5 h-5 text-cyan-600" />} label="Total Spent" value={kes(stats.total_spent)} />
        </div>
      )}

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
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="members"><Users className="w-4 h-4 mr-1" /> Members</TabsTrigger>
          <TabsTrigger value="tiers"><Crown className="w-4 h-4 mr-1" /> Tiers</TabsTrigger>
          <TabsTrigger value="rewards"><Gift className="w-4 h-4 mr-1" /> Rewards</TabsTrigger>
          <TabsTrigger value="transactions"><Star className="w-4 h-4 mr-1" /> Transactions</TabsTrigger>
          <TabsTrigger value="leaderboard"><Trophy className="w-4 h-4 mr-1" /> Leaderboard</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1" /> Settings</TabsTrigger>
        </TabsList>

        {/* ── MEMBERS ── */}
        <TabsContent value="members" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Members</CardTitle>
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
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Current Pts</TableHead>
                    <TableHead className="text-right">Lifetime Pts</TableHead>
                    <TableHead className="text-right">Total Spent</TableHead>
                    <TableHead className="text-right">Payments</TableHead>
                    <TableHead className="text-right">Redemptions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                        No members found
                      </TableCell>
                    </TableRow>
                  ) : filteredMembers.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">{m.name}</div>
                        <div className="text-xs text-slate-400">{m.customer_code} · {m.phone}</div>
                      </TableCell>
                      <TableCell>
                        {m.tier_level ? (
                          <Badge className={`${tierColors[m.tier_level] ?? "bg-slate-500 text-white"} text-[10px] gap-1`}>
                            {tierIcons[m.tier_level]} {m.tier_name}
                          </Badge>
                        ) : <span className="text-slate-400 text-sm">—</span>}
                      </TableCell>
                      <TableCell className="text-right font-semibold">{m.current_points.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-slate-500">{m.lifetime_points.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-slate-500">{kes(m.total_spent)}</TableCell>
                      <TableCell className="text-right">{m.total_payments}</TableCell>
                      <TableCell className="text-right">{m.redemptions_count}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm" variant="outline" className="h-7 text-xs mr-1"
                          onClick={() => { setAwardMemberId(String(m.id)); setAwardDialog(true) }}
                        >
                          <Zap className="w-3 h-3 mr-1" /> Award
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TIERS ── */}
        <TabsContent value="tiers" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiers.map(tier => (
              <Card key={tier.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`${tierColors[tier.level] ?? "bg-slate-500 text-white"} gap-1 px-3`}>
                        {tierIcons[tier.level]} {tier.name}
                      </Badge>
                    </div>
                    <span className="text-xs text-slate-400">{tier.members_count} members</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Min Points</span>
                    <span className="font-semibold">{tier.min_points.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Max Points</span>
                    <span className="font-semibold">{tier.max_points?.toLocaleString() ?? "Unlimited"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Multiplier</span>
                    <span className="font-semibold">{tier.points_multiplier}×</span>
                  </div>
                  {tier.benefits.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Benefits</p>
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
            {tiers.length === 0 && (
              <div className="col-span-3 py-16 text-center text-slate-400">
                No tiers configured. Run <code className="text-xs bg-slate-100 px-1 rounded">populate_loyalty_members</code> to create defaults.
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── REWARDS ── */}
        <TabsContent value="rewards" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Reward Catalog</CardTitle>
                <Button size="sm" onClick={openCreateReward}>
                  <Plus className="w-4 h-4 mr-2" /> New Reward
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reward</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Points Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Redeemed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-400">No rewards yet</TableCell>
                    </TableRow>
                  ) : rewards.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.name}</div>
                        {r.description && <div className="text-xs text-slate-400 truncate max-w-[200px]">{r.description}</div>}
                      </TableCell>
                      <TableCell><span className="text-sm text-slate-600">{categoryLabels[r.category] ?? r.category}</span></TableCell>
                      <TableCell className="text-right font-bold text-blue-600">{r.points_cost.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={r.status === "active" ? "default" : "secondary"} className="text-[10px] uppercase">
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{r.stock_quantity ?? "∞"}</TableCell>
                      <TableCell className="text-right">{r.redemption_count}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 mr-1" onClick={() => openEditReward(r)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-600" onClick={() => handleDeleteReward(r.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TRANSACTIONS ── */}
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Points Transactions</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400">No transactions yet</TableCell>
                    </TableRow>
                  ) : transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(tx.created_at).toLocaleString("en-KE")}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{tx.member_name}</TableCell>
                      <TableCell>
                        <Badge
                          className={`text-[10px] uppercase ${
                            tx.transaction_type === "earned" ? "bg-green-100 text-green-700" :
                            tx.transaction_type === "redeemed" ? "bg-orange-100 text-orange-700" :
                            tx.transaction_type === "bonus" ? "bg-blue-100 text-blue-700" :
                            tx.transaction_type === "expired" ? "bg-red-100 text-red-700" :
                            "bg-slate-100 text-slate-700"
                          }`}
                          variant="secondary"
                        >
                          {tx.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-bold ${tx.points >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {tx.points >= 0 ? "+" : ""}{tx.points}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 max-w-[250px] truncate">{tx.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── LEADERBOARD ── */}
        <TabsContent value="leaderboard" className="mt-4">
          <div className="grid md:grid-cols-3 gap-6">
            <LeaderboardCard title="Top Points" icon={<Star className="w-4 h-4 text-yellow-500" />} members={leaderboard.top_points} valueKey="lifetime_points" valueFormat={v => v.toLocaleString() + " pts"} />
            <LeaderboardCard title="Highest Spending" icon={<TrendingUp className="w-4 h-4 text-green-600" />} members={leaderboard.highest_spending} valueKey="total_spent" valueFormat={v => kes(v)} />
            <LeaderboardCard title="Most Returning" icon={<Crown className="w-4 h-4 text-purple-600" />} members={leaderboard.most_returning} valueKey="total_payments" valueFormat={v => v + " payments"} />
          </div>
        </TabsContent>

        {/* ── SETTINGS ── */}
        <TabsContent value="settings" className="mt-4">
          {settings && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>Points Configuration</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <SettingField
                    label="Points per KES" hint={`1 point per KES ${settingsForm.currency_unit ?? settings.currency_unit}`}
                    value={settingsForm.points_per_currency ?? settings.points_per_currency}
                    onChange={v => setSettingsForm(p => ({ ...p, points_per_currency: Number(v) }))}
                    type="number"
                  />
                  <SettingField
                    label="Currency Unit (KES)" hint="e.g. 100 means per KES 100"
                    value={settingsForm.currency_unit ?? settings.currency_unit}
                    onChange={v => setSettingsForm(p => ({ ...p, currency_unit: Number(v) }))}
                    type="number"
                  />
                  <SettingField
                    label="Signup Bonus (pts)"
                    value={settingsForm.signup_bonus ?? settings.signup_bonus}
                    onChange={v => setSettingsForm(p => ({ ...p, signup_bonus: Number(v) }))}
                    type="number"
                  />
                  <SettingField
                    label="Referral Bonus (pts)"
                    value={settingsForm.referral_bonus ?? settings.referral_bonus}
                    onChange={v => setSettingsForm(p => ({ ...p, referral_bonus: Number(v) }))}
                    type="number"
                  />
                  <SettingField
                    label="Monthly Tenure Bonus (pts)"
                    value={settingsForm.tenure_monthly_bonus ?? settings.tenure_monthly_bonus}
                    onChange={v => setSettingsForm(p => ({ ...p, tenure_monthly_bonus: Number(v) }))}
                    type="number"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Expiry & Notifications</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Points Expiry Enabled</Label>
                    <Switch
                      checked={settingsForm.points_expiry_enabled ?? settings.points_expiry_enabled}
                      onCheckedChange={v => setSettingsForm(p => ({ ...p, points_expiry_enabled: v }))}
                    />
                  </div>
                  <SettingField
                    label="Expiry Window (months)"
                    value={settingsForm.points_expiry_months ?? settings.points_expiry_months}
                    onChange={v => setSettingsForm(p => ({ ...p, points_expiry_months: Number(v) }))}
                    type="number"
                  />
                  <SettingField
                    label="Expiry Warning (days before)"
                    value={settingsForm.expiry_warning_days ?? settings.expiry_warning_days}
                    onChange={v => setSettingsForm(p => ({ ...p, expiry_warning_days: Number(v) }))}
                    type="number"
                  />
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
                      <Switch
                        checked={settingsForm.program_active ?? settings.program_active}
                        onCheckedChange={v => setSettingsForm(p => ({ ...p, program_active: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-Enroll New Customers</Label>
                      <Switch
                        checked={settingsForm.auto_enroll_new_customers ?? settings.auto_enroll_new_customers}
                        onCheckedChange={v => setSettingsForm(p => ({ ...p, auto_enroll_new_customers: v }))}
                      />
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
      <Dialog open={awardDialog} onOpenChange={open => { if (!open) { setAwardDialog(false); setAwardMemberId(""); setAwardPointsValue(""); setAwardReason("") } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Award Points</DialogTitle>
            <DialogDescription>Manually award loyalty points to a member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-sm mb-1.5 block">Member</Label>
              <Select value={awardMemberId} onValueChange={setAwardMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member…" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name} ({m.customer_code}) — {m.current_points} pts
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Points to Award</Label>
              <Input
                type="number" min={1} placeholder="e.g. 100"
                value={awardPoints} onChange={e => setAwardPointsValue(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Reason (optional)</Label>
              <Textarea
                placeholder="e.g. Anniversary bonus"
                value={awardReason} onChange={e => setAwardReason(e.target.value)}
                rows={2}
              />
            </div>
            <Button
              className="w-full" disabled={awardLoading || !awardMemberId || !awardPoints}
              onClick={handleAwardPoints}
            >
              {awardLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Awarding…</> : <><Zap className="w-4 h-4 mr-2" /> Award Points</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── AWARD VOUCHER DIALOG ── */}
      <Dialog open={voucherDialog} onOpenChange={open => { if (!open) { setVoucherDialog(false); setVoucherMemberId(""); setVoucherBatchId(""); setVoucherSMS(true) } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Award Voucher</DialogTitle>
            <DialogDescription>Award a hotspot voucher to a loyalty member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-sm mb-1.5 block">Member</Label>
              <Select value={voucherMemberId} onValueChange={setVoucherMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a member…" />
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name} ({m.customer_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Voucher Batch ID (optional)</Label>
              <Input
                type="number" min={1} placeholder="Leave blank for default"
                value={voucherBatchId} onChange={e => setVoucherBatchId(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Send SMS notification</Label>
              <Switch checked={voucherSMS} onCheckedChange={setVoucherSMS} />
            </div>
            <Button
              className="w-full" disabled={voucherLoading || !voucherMemberId}
              onClick={handleAwardVoucher}
            >
              {voucherLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Awarding…</> : <><Gift className="w-4 h-4 mr-2" /> Award Voucher</>}
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
              <Input value={rewardForm.name ?? ""} onChange={e => setRewardForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Description</Label>
              <Textarea rows={2} value={rewardForm.description ?? ""} onChange={e => setRewardForm(p => ({ ...p, description: e.target.value }))} />
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

function LeaderboardCard({
  title, icon, members, valueKey, valueFormat
}: {
  title: string
  icon: React.ReactNode
  members: LoyaltyMember[]
  valueKey: keyof LoyaltyMember
  valueFormat: (v: number) => string
}) {
  const medals = ["🥇", "🥈", "🥉"]
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.length === 0 ? (
          <p className="text-slate-400 text-sm py-4 text-center">No data</p>
        ) : members.slice(0, 10).map((m, i) => (
          <div key={m.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{medals[i] ?? <span className="w-5 text-center text-xs text-slate-400">{i + 1}</span>}</span>
              <div>
                <p className="text-sm font-medium leading-tight">{m.name}</p>
                <p className="text-xs text-slate-400">{m.customer_code}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-blue-600">
              {valueFormat(Number(m[valueKey]))}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function SettingField({
  label, hint, value, onChange, type = "text"
}: {
  label: string; hint?: string; value: number | string; onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <Label className="text-sm mb-1.5 block">{label}</Label>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}
