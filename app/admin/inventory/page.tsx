"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Boxes, CheckCircle2, ClipboardList, Clock, Download, Edit, Loader2, MoreVertical,
  PiggyBank, Plus, Receipt, RefreshCw, Search, Trash2, TrendingDown, TrendingUp,
  Undo2, User, UserCheck, Users, Wallet, Wrench, AlertCircle,
} from "lucide-react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { adminApi } from "@/lib/admin-api"
import { usePagePermissions } from "@/hooks/use-page-permissions"
import type {
  EquipmentAssignment, EquipmentCondition, EquipmentItem, EquipmentStatus, EquipmentType,
  Expense, ExpenseSummary, StockAlert,
} from "@/lib/types"

const PAGE_SIZE = 20

const CATEGORIES = [
  { value: "equipment", label: "Equipment", bar: "bg-primary" },
  { value: "operations", label: "Operations", bar: "bg-emerald-500" },
  { value: "maintenance", label: "Maintenance", bar: "bg-amber-500" },
  { value: "transport", label: "Transport", bar: "bg-sky-500" },
  { value: "utilities", label: "Utilities", bar: "bg-violet-500" },
  { value: "salaries", label: "Salaries", bar: "bg-rose-500" },
  { value: "marketing", label: "Marketing", bar: "bg-pink-500" },
  { value: "other", label: "Other", bar: "bg-slate-400" },
]
const catMeta = (v: string) => CATEGORIES.find((c) => c.value === v) || CATEGORIES[CATEGORIES.length - 1]

const formatCurrency = (n: string | number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(Number(n) || 0)
const compact = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n))
const today = () => new Date().toLocaleDateString("en-CA")
const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback)
const csvCell = (v: unknown) => '"' + String(v ?? "").replace(/"/g, '""') + '"'

const statusBadge = (status: EquipmentStatus) => {
  const map: Record<string, { label: string; className?: string; variant?: "default" | "secondary" | "destructive" | "outline" }> = {
    in_stock: { label: "In Stock", className: "bg-success text-white" },
    assigned: { label: "Assigned", className: "bg-primary text-white" },
    in_use: { label: "In Use", className: "bg-purple-500 text-white" },
    maintenance: { label: "Maintenance", className: "bg-warning text-black" },
    faulty: { label: "Faulty", variant: "destructive" },
    retired: { label: "Retired", variant: "outline" },
    lost: { label: "Lost", variant: "destructive" },
    disposed: { label: "Disposed", variant: "outline" },
  }
  const b = map[status] || { label: status, variant: "outline" as const }
  return <Badge variant={b.variant || "secondary"} className={b.className}>{b.label}</Badge>
}

const conditionBadge = (c: EquipmentCondition) => (
  <Badge variant={c === "faulty" ? "destructive" : c === "new" || c === "good" ? "secondary" : "outline"} className="capitalize">{c}</Badge>
)

function Pager({ page, count, onPage }: { page: number; count: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  if (count <= PAGE_SIZE) return null
  return (
    <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
      <span>Page {page} of {pages} · {count} total</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  )
}

const emptyExpense = () => ({ title: "", amount: "", category: "operations", expense_date: today(), vendor: "", payment_status: "paid", notes: "" })
const emptyEquipment = () => ({
  name: "", type: "", quantity: "1", unit_price: "", purchase_date: today(),
  vendor: "", serial_number: "", notes: "", record_expense: true,
})

export default function ExpensesInventoryPage() {
  const perms = usePagePermissions("/admin/inventory")

  const [summary, setSummary] = useState<ExpenseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState("expenses")

  // expenses list
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expCount, setExpCount] = useState(0)
  const [expPage, setExpPage] = useState(1)
  const [expSearch, setExpSearch] = useState("")
  const [expCategory, setExpCategory] = useState("all")
  const [expStatus, setExpStatus] = useState("all")

  // equipment list
  const [equipment, setEquipment] = useState<EquipmentItem[]>([])
  const [eqCount, setEqCount] = useState(0)
  const [eqPage, setEqPage] = useState(1)
  const [eqSearch, setEqSearch] = useState("")
  const [eqType, setEqType] = useState("all")
  const [eqStatus, setEqStatus] = useState("all")

  // aux
  const [types, setTypes] = useState<EquipmentType[]>([])
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([])
  const [alerts, setAlerts] = useState<StockAlert[]>([])

  // dialogs
  const [expenseDialog, setExpenseDialog] = useState<{ open: boolean; id: number | null }>({ open: false, id: null })
  const [expenseForm, setExpenseForm] = useState(emptyExpense())
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)

  const [equipmentOpen, setEquipmentOpen] = useState(false)
  const [equipmentForm, setEquipmentForm] = useState(emptyEquipment())

  const [budgetOpen, setBudgetOpen] = useState(false)
  const [budgetInput, setBudgetInput] = useState("")

  const [selected, setSelected] = useState<EquipmentItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", serial_number: "", condition: "good" as EquipmentCondition, location: "", purchase_price: "", notes: "" })
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignForm, setAssignForm] = useState({ employee_id: "", purpose: "", expected_return_date: "" })
  const [returnOpen, setReturnOpen] = useState(false)
  const [returnForm, setReturnForm] = useState({ condition: "good" as EquipmentCondition, notes: "" })
  const [itemToRemove, setItemToRemove] = useState<{ item: EquipmentItem; mode: "delete" | "dispose" } | null>(null)

  // ── loaders ─────────────────────────────────────────────
  const loadSummary = useCallback(async () => {
    try {
      setSummary(await adminApi.getExpenseSummary(6))
    } catch (e) {
      toast.error(errMsg(e, "Failed to load summary"))
    } finally {
      setLoading(false)
    }
  }, [])

  const expReq = useRef(0)
  const loadExpenses = useCallback(async () => {
    const id = ++expReq.current
    try {
      const params: Record<string, string> = { page: String(expPage) }
      if (expSearch.trim()) params.search = expSearch.trim()
      if (expCategory !== "all") params.category = expCategory
      if (expStatus !== "all") params.payment_status = expStatus
      const res = await adminApi.getExpenses(params)
      if (id !== expReq.current) return
      setExpenses(res.results || [])
      setExpCount(res.count || 0)
    } catch {
      if (id !== expReq.current) return
      if (expPage > 1) setExpPage(1)
      else toast.error("Failed to load expenses")
    }
  }, [expPage, expSearch, expCategory, expStatus])

  const eqReq = useRef(0)
  const loadEquipment = useCallback(async () => {
    const id = ++eqReq.current
    try {
      const params: Record<string, string> = { page: String(eqPage), ordering: "-created_at" }
      if (eqSearch.trim()) params.search = eqSearch.trim()
      if (eqType !== "all") params.equipment_type = eqType
      if (eqStatus !== "all") params.status = eqStatus
      const res = await adminApi.getEquipmentItems(params)
      if (id !== eqReq.current) return
      setEquipment(res.results || [])
      setEqCount(res.count || 0)
    } catch {
      if (id !== eqReq.current) return
      if (eqPage > 1) setEqPage(1)
      else toast.error("Failed to load equipment")
    }
  }, [eqPage, eqSearch, eqType, eqStatus])

  const loadAux = useCallback(async () => {
    const [t, a, s] = await Promise.allSettled([
      adminApi.getEquipmentTypes(),
      adminApi.getAssignments(),
      adminApi.getStockAlerts(),
    ])
    if (t.status === "fulfilled") setTypes(t.value.results || [])
    if (a.status === "fulfilled") setAssignments(a.value.results || [])
    if (s.status === "fulfilled") setAlerts(s.value || [])
  }, [])

  useEffect(() => { void loadSummary(); void loadAux() }, [loadSummary, loadAux])
  useEffect(() => {
    const t = setTimeout(() => { void loadExpenses() }, expSearch ? 300 : 0)
    return () => clearTimeout(t)
  }, [loadExpenses, expSearch])
  useEffect(() => {
    const t = setTimeout(() => { void loadEquipment() }, eqSearch ? 300 : 0)
    return () => clearTimeout(t)
  }, [loadEquipment, eqSearch])

  // One refresh keeps budget, expenses and inventory in sync after any change.
  const refreshAll = useCallback(async () => {
    await Promise.all([loadSummary(), loadExpenses(), loadEquipment(), loadAux()])
  }, [loadSummary, loadExpenses, loadEquipment, loadAux])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshAll()
    setRefreshing(false)
    toast.success("Data refreshed")
  }

  // ── expense actions ─────────────────────────────────────
  const openNewExpense = () => { setExpenseForm(emptyExpense()); setExpenseDialog({ open: true, id: null }) }
  const openEditExpense = (e: Expense) => {
    setExpenseForm({
      title: e.title, amount: String(Number(e.amount)), category: e.category,
      expense_date: e.expense_date, vendor: e.vendor || "", payment_status: e.payment_status, notes: e.notes || "",
    })
    setExpenseDialog({ open: true, id: e.id })
  }

  const saveExpense = async () => {
    const amount = Number(expenseForm.amount)
    if (!expenseForm.title.trim()) return toast.error("Enter a title")
    if (!Number.isFinite(amount) || amount <= 0) return toast.error("Enter a valid amount")
    setSubmitting(true)
    try {
      const payload = {
        title: expenseForm.title.trim(),
        amount: String(amount),
        category: expenseForm.category as Expense["category"],
        expense_date: expenseForm.expense_date,
        vendor: expenseForm.vendor.trim(),
        payment_status: expenseForm.payment_status as Expense["payment_status"],
        notes: expenseForm.notes.trim(),
      }
      if (expenseDialog.id) await adminApi.updateExpense(expenseDialog.id, payload)
      else await adminApi.createExpense(payload)
      toast.success(expenseDialog.id ? "Expense updated" : "Expense recorded")
      setExpenseDialog({ open: false, id: null })
      await refreshAll()
    } catch (e) {
      toast.error(errMsg(e, "Failed to save expense"))
    } finally {
      setSubmitting(false)
    }
  }

  const markPaid = async (e: Expense) => {
    try {
      await adminApi.updateExpense(e.id, { payment_status: "paid" })
      toast.success("Marked as paid")
      await Promise.all([loadSummary(), loadExpenses()])
    } catch (err) {
      toast.error(errMsg(err, "Failed to update"))
    }
  }

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return
    setSubmitting(true)
    try {
      await adminApi.deleteExpense(expenseToDelete.id)
      toast.success("Expense deleted")
      setExpenseToDelete(null)
      await refreshAll()
    } catch (e) {
      toast.error(errMsg(e, "Failed to delete"))
    } finally {
      setSubmitting(false)
    }
  }

  // ── budget ──────────────────────────────────────────────
  const saveBudget = async () => {
    const amount = Number(budgetInput)
    if (!Number.isFinite(amount) || amount < 0) return toast.error("Enter a valid budget")
    setSubmitting(true)
    try {
      await adminApi.setExpenseBudget(amount)
      toast.success("Monthly budget saved")
      setBudgetOpen(false)
      await loadSummary()
    } catch (e) {
      toast.error(errMsg(e, "Failed to save budget"))
    } finally {
      setSubmitting(false)
    }
  }

  // ── equipment actions ───────────────────────────────────
  const eqQty = Math.min(200, Math.max(1, parseInt(equipmentForm.quantity) || 1))
  const eqTotal = eqQty * (Number(equipmentForm.unit_price) || 0)

  const createEquipment = async () => {
    if (!equipmentForm.name.trim() || !equipmentForm.type.trim()) return toast.error("Name and type are required")
    setSubmitting(true)
    try {
      await adminApi.createEquipmentItem({
        equipment_type_text: equipmentForm.type.trim(),
        name: equipmentForm.name.trim(),
        condition: "new",
        quantity: eqQty,
        purchase_price: equipmentForm.unit_price || undefined,
        purchase_date: equipmentForm.purchase_date || undefined,
        vendor: equipmentForm.vendor.trim() || undefined,
        serial_number: eqQty === 1 && equipmentForm.serial_number.trim() ? equipmentForm.serial_number.trim() : undefined,
        notes: equipmentForm.notes.trim() || undefined,
        record_expense: equipmentForm.record_expense,
      } as any)
      toast.success(eqQty > 1 ? `${eqQty} items added` : "Equipment added")
      setEquipmentOpen(false)
      setEquipmentForm(emptyEquipment())
      await refreshAll()
    } catch (e) {
      toast.error(errMsg(e, "Failed to add equipment"))
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (item: EquipmentItem) => {
    setSelected(item)
    setEditForm({
      name: item.name, serial_number: item.serial_number || "", condition: item.condition,
      location: item.location || "", purchase_price: item.purchase_price || "", notes: item.notes || "",
    })
    setEditOpen(true)
  }

  const saveEdit = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await adminApi.updateEquipmentItem(selected.id, {
        name: editForm.name,
        serial_number: editForm.serial_number || undefined,
        condition: editForm.condition,
        location: editForm.location || undefined,
        purchase_price: editForm.purchase_price || undefined,
        notes: editForm.notes || undefined,
      })
      toast.success("Equipment updated")
      setEditOpen(false)
      await refreshAll()
    } catch (e) {
      toast.error(errMsg(e, "Failed to update"))
    } finally {
      setSubmitting(false)
    }
  }

  const assign = async () => {
    if (!selected || !assignForm.employee_id.trim()) return toast.error("Enter the employee ID")
    setSubmitting(true)
    try {
      await adminApi.assignEquipmentToEmployee(selected.id, {
        employee_id: assignForm.employee_id.trim(),
        purpose: assignForm.purpose || undefined,
        expected_return_date: assignForm.expected_return_date || undefined,
      })
      toast.success("Equipment assigned")
      setAssignOpen(false)
      await refreshAll()
    } catch (e) {
      toast.error(errMsg(e, "Failed to assign"))
    } finally {
      setSubmitting(false)
    }
  }

  const returnItem = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await adminApi.returnEquipment(selected.id, { condition: returnForm.condition, notes: returnForm.notes || undefined })
      toast.success("Returned to stock")
      setReturnOpen(false)
      await refreshAll()
    } catch (e) {
      toast.error(errMsg(e, "Failed to return"))
    } finally {
      setSubmitting(false)
    }
  }

  const returnAssignment = async (a: EquipmentAssignment) => {
    setSubmitting(true)
    try {
      await adminApi.markAssignmentReturned(a.id, { condition: "good", notes: "Returned from assignments tab" })
      toast.success("Assignment returned")
      await refreshAll()
    } catch (e) {
      toast.error(errMsg(e, "Failed to return"))
    } finally {
      setSubmitting(false)
    }
  }

  const sendToMaintenance = async (item: EquipmentItem) => {
    try {
      await adminApi.sendToMaintenance(item.id, {})
      toast.success("Sent to maintenance")
      await refreshAll()
    } catch (e) {
      toast.error(errMsg(e, "Failed"))
    }
  }

  const confirmRemove = async () => {
    if (!itemToRemove) return
    setSubmitting(true)
    try {
      if (itemToRemove.mode === "dispose") await adminApi.disposeEquipment(itemToRemove.item.id, {})
      else await adminApi.deleteEquipmentItem(itemToRemove.item.id)
      toast.success(itemToRemove.mode === "dispose" ? "Equipment disposed" : "Equipment deleted")
      setItemToRemove(null)
      await refreshAll()
    } catch (e) {
      toast.error(errMsg(e, "Failed"))
    } finally {
      setSubmitting(false)
    }
  }

  // ── export (rows currently loaded) ──────────────────────
  const handleExport = () => {
    const rows: unknown[][] =
      tab === "equipment"
        ? [["Asset Tag", "Name", "Type", "Serial", "Status", "Condition", "Location", "Price"],
           ...equipment.map((e) => [e.asset_tag, e.name, e.equipment_type_name, e.serial_number || "", e.status, e.condition, e.location || "", e.purchase_price || ""])]
        : [["Reference", "Title", "Date", "Category", "Vendor", "Status", "Amount"],
           ...expenses.map((e) => [e.reference, e.title, e.expense_date, e.category, e.vendor, e.payment_status, e.amount])]
    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `${tab === "equipment" ? "inventory" : "expenses"}-${today()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── derived ─────────────────────────────────────────────
  const spent = summary?.spent ?? 0
  const prevSpent = summary?.prev_spent ?? 0
  const spentChange = prevSpent > 0 ? ((spent - prevSpent) / prevSpent) * 100 : 0
  const budget = summary?.budget ?? 0
  const overBudget = budget > 0 && spent > budget
  const catTotal = (summary?.categories || []).reduce((s, c) => s + c.total, 0)
  const inv = summary?.inventory

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses &amp; Inventory</h1>
          <p className="text-muted-foreground">Track what you spend, what you own, and stay within budget.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export</Button>
          {perms.canAdd && (
            <>
              <Button variant="outline" onClick={() => { setEquipmentForm(emptyEquipment()); setEquipmentOpen(true) }}>
                <Boxes className="mr-2 h-4 w-4" />Add equipment
              </Button>
              <Button onClick={openNewExpense}><Plus className="mr-2 h-4 w-4" />Record expense</Button>
            </>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium opacity-90">
              Spent this month <Wallet className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(spent)}</div>
            <p className="mt-1 flex items-center gap-1 text-xs opacity-90">
              {spentChange <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
              {prevSpent > 0 ? `${Math.abs(spentChange).toFixed(1)}% ${spentChange <= 0 ? "below" : "above"} last month` : "No spend last month"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Budget remaining <PiggyBank className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {budget > 0 ? (
              <>
                <div className={`text-2xl font-bold ${overBudget ? "text-destructive" : ""}`}>
                  {overBudget ? "-" : ""}{formatCurrency(Math.abs(summary?.remaining ?? 0))}
                </div>
                <Progress value={Math.min(100, summary?.budget_used_pct ?? 0)} className={`mt-2 h-2 ${overBudget ? "[&>div]:bg-destructive" : ""}`} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {summary?.budget_used_pct}% of {formatCurrency(budget)} used
                  {perms.canAdd && (
                    <button className="ml-2 text-primary hover:underline" onClick={() => { setBudgetInput(String(budget)); setBudgetOpen(true) }}>Edit</button>
                  )}
                </p>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold text-muted-foreground">No budget set</div>
                {perms.canAdd && (
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => { setBudgetInput(""); setBudgetOpen(true) }}>Set monthly budget</Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Equipment value <Boxes className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.equipment_value ?? 0)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary?.equipment_count ?? 0} items · +{summary?.equipment_added_this_month ?? 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium">
              Pending payments <Clock className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.pending_total ?? 0)}</div>
            <p className="mt-1 text-xs text-muted-foreground">{summary?.pending_count ?? 0} awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + categories */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly expenditure</CardTitle>
            <CardDescription>Actual spend against your monthly budget (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.series || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={compact} width={44} className="text-xs" />
                  <RTooltip
                    cursor={{ fillOpacity: 0.08 }}
                    formatter={(v: number, name: string) => [formatCurrency(v), name === "spent" ? "Spent" : "Budget"]}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="spent" radius={[4, 4, 0, 0]} className="fill-primary" />
                  <Bar dataKey="budget" radius={[4, 4, 0, 0]} className="fill-muted-foreground/25" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Actual spend</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/30" />Budget</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spend by category</CardTitle>
            <CardDescription>This month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {catTotal === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No expenses recorded this month.</p>
            ) : (
              <>
                <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                  {summary!.categories.map((c) => (
                    <div key={c.category} className={catMeta(c.category).bar} style={{ width: `${(c.total / catTotal) * 100}%` }} />
                  ))}
                </div>
                <ul className="space-y-2 text-sm">
                  {summary!.categories.map((c) => (
                    <li key={c.category} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${catMeta(c.category).bar}`} />
                        {catMeta(c.category).label}
                        <span className="text-xs text-muted-foreground">{Math.round((c.total / catTotal) * 100)}%</span>
                      </span>
                      <span className="font-medium tabular-nums">{formatCurrency(c.total)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="border-warning/20 bg-warning/10">
          <CardContent className="flex flex-wrap items-center gap-3 py-3">
            <AlertCircle className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">Low stock:</span>
            {alerts.map((a) => (
              <Badge key={a.id} variant={a.severity === "critical" ? "destructive" : "secondary"}>
                {a.equipment_type_name}: {a.current_count}/{a.min_stock_level}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="expenses" className="gap-2"><Receipt className="h-4 w-4" />Expenses</TabsTrigger>
          <TabsTrigger value="equipment" className="gap-2"><Boxes className="h-4 w-4" />Equipment</TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2"><ClipboardList className="h-4 w-4" />Assignments</TabsTrigger>
        </TabsList>

        {/* Expenses */}
        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Expense ledger</CardTitle>
                  <CardDescription>{expCount} entries</CardDescription>
                </div>
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="w-full pl-9 md:w-[220px]" placeholder="Search expenses..." value={expSearch}
                      onChange={(e) => { setExpSearch(e.target.value); setExpPage(1) }} />
                  </div>
                  <Select value={expCategory} onValueChange={(v) => { setExpCategory(v); setExpPage(1) }}>
                    <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={expStatus} onValueChange={(v) => { setExpStatus(v); setExpPage(1) }}>
                    <SelectTrigger className="w-full md:w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="rounded-xl border border-dashed py-12 text-center">
                  <Receipt className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">No expenses found</p>
                  <p className="text-sm text-muted-foreground">Record your first expense to start tracking against your budget.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>
                          <div className="font-medium">{e.title}</div>
                          {e.vendor && <div className="text-xs text-muted-foreground">{e.vendor}</div>}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{e.reference}</TableCell>
                        <TableCell className="text-sm">{new Date(e.expense_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${catMeta(e.category).bar}`} />{catMeta(e.category).label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={e.payment_status === "paid" ? "secondary" : "outline"} className={e.payment_status === "pending" ? "border-warning text-warning" : ""}>
                            {e.payment_status === "paid" ? "Paid" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">{formatCurrency(e.amount)}</TableCell>
                        <TableCell>
                          {(perms.canEdit || perms.canDelete) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {perms.canEdit && e.payment_status === "pending" && (
                                  <DropdownMenuItem onClick={() => markPaid(e)}><CheckCircle2 className="mr-2 h-4 w-4" />Mark as paid</DropdownMenuItem>
                                )}
                                {perms.canEdit && (
                                  <DropdownMenuItem onClick={() => openEditExpense(e)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                )}
                                {perms.canDelete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive" onClick={() => setExpenseToDelete(e)}>
                                      <Trash2 className="mr-2 h-4 w-4" />Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Pager page={expPage} count={expCount} onPage={setExpPage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment */}
        <TabsContent value="equipment" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Equipment</CardTitle>
                  <CardDescription>
                    {inv ? `${inv.total} items · ${inv.available} available · ${inv.assigned + inv.in_use} deployed · ${inv.maintenance} in maintenance · ${inv.faulty} faulty` : `${eqCount} items`}
                  </CardDescription>
                </div>
                <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="w-full pl-9 md:w-[220px]" placeholder="Search name, serial, tag..." value={eqSearch}
                      onChange={(e) => { setEqSearch(e.target.value); setEqPage(1) }} />
                  </div>
                  <Select value={eqType} onValueChange={(v) => { setEqType(v); setEqPage(1) }}>
                    <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      {types.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={eqStatus} onValueChange={(v) => { setEqStatus(v); setEqPage(1) }}>
                    <SelectTrigger className="w-full md:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="in_stock">In stock</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_use">In use</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="faulty">Faulty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {equipment.length === 0 ? (
                <div className="rounded-xl border border-dashed py-12 text-center">
                  <Boxes className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">No equipment found</p>
                  <p className="text-sm text-muted-foreground">Add equipment you buy and it is recorded in your expenses automatically.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Assigned to</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">
                            {item.asset_tag}{item.serial_number ? ` · ${item.serial_number}` : ""}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{item.equipment_type_name}</Badge></TableCell>
                        <TableCell>{statusBadge(item.status)}</TableCell>
                        <TableCell>{conditionBadge(item.condition)}</TableCell>
                        <TableCell className="text-sm">
                          {item.assigned_to_name ? <span className="flex items-center gap-1"><User className="h-3 w-3" />{item.assigned_to_name}</span>
                            : item.assigned_to_customer_name ? <span className="flex items-center gap-1"><Users className="h-3 w-3" />{item.assigned_to_customer_name}</span>
                            : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{item.purchase_price ? formatCurrency(item.purchase_price) : "-"}</TableCell>
                        <TableCell>
                          {(perms.canEdit || perms.canDelete) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {perms.canEdit && <DropdownMenuItem onClick={() => openEdit(item)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>}
                                {perms.canEdit && item.is_available && (
                                  <DropdownMenuItem onClick={() => { setSelected(item); setAssignForm({ employee_id: "", purpose: "", expected_return_date: "" }); setAssignOpen(true) }}>
                                    <UserCheck className="mr-2 h-4 w-4" />Assign to employee
                                  </DropdownMenuItem>
                                )}
                                {perms.canEdit && item.status === "assigned" && (
                                  <DropdownMenuItem onClick={() => { setSelected(item); setReturnForm({ condition: "good", notes: "" }); setReturnOpen(true) }}>
                                    <Undo2 className="mr-2 h-4 w-4" />Return to stock
                                  </DropdownMenuItem>
                                )}
                                {perms.canEdit && (
                                  <DropdownMenuItem onClick={() => sendToMaintenance(item)}><Wrench className="mr-2 h-4 w-4" />Send to maintenance</DropdownMenuItem>
                                )}
                                {perms.canDelete && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setItemToRemove({ item, mode: "dispose" })}>Mark disposed</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => setItemToRemove({ item, mode: "delete" })}>
                                      <Trash2 className="mr-2 h-4 w-4" />Delete
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Pager page={eqPage} count={eqCount} onPage={setEqPage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments */}
        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>Equipment currently with your team</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="rounded-xl border border-dashed py-12 text-center">
                  <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">No assignments yet</p>
                  <p className="text-sm text-muted-foreground">Use an equipment item&apos;s menu to assign it to an employee.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Due back</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="font-medium">{a.equipment_name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{a.equipment_serial}</div>
                        </TableCell>
                        <TableCell>{a.employee_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{a.purpose || "-"}</TableCell>
                        <TableCell>{new Date(a.assigned_date).toLocaleDateString()}</TableCell>
                        <TableCell>{a.expected_return_date ? new Date(a.expected_return_date).toLocaleDateString() : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={a.status === "overdue" ? "destructive" : a.status === "returned" ? "secondary" : "default"} className="capitalize">{a.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {perms.canEdit && a.status !== "returned" && (
                            <Button size="sm" variant="outline" disabled={submitting} onClick={() => returnAssignment(a)}>
                              <Undo2 className="mr-1 h-3 w-3" />Return
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Record / edit expense */}
      <Dialog open={expenseDialog.open} onOpenChange={(o) => !o && setExpenseDialog({ open: false, id: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{expenseDialog.id ? "Edit expense" : "Record an expense"}</DialogTitle>
            <DialogDescription>Capture an operating cost in your ledger.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="e.g. Fibre repair and splicing" value={expenseForm.title} onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (KES) *</Label>
                <Input type="number" min="0" placeholder="0" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment</Label>
                <Select value={expenseForm.payment_status} onValueChange={(v) => setExpenseForm({ ...expenseForm, payment_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vendor <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="Supplier or payee" value={expenseForm.vendor} onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea rows={2} value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialog({ open: false, id: null })} disabled={submitting}>Cancel</Button>
            <Button onClick={saveExpense} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add equipment */}
      <Dialog open={equipmentOpen} onOpenChange={setEquipmentOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add equipment</DialogTitle>
            <DialogDescription>Add what you bought. It is recorded in your expenses automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input placeholder="e.g. MikroTik CCR2004" value={equipmentForm.name} onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type *</Label>
                <Input list="eq-type-options" placeholder="Router, ONU, cable..." value={equipmentForm.type} onChange={(e) => setEquipmentForm({ ...equipmentForm, type: e.target.value })} />
                <datalist id="eq-type-options">{types.map((t) => <option key={t.id} value={t.name} />)}</datalist>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min="1" max="200" value={equipmentForm.quantity} onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Unit price (KES)</Label>
                <Input type="number" min="0" placeholder="0" value={equipmentForm.unit_price} onChange={(e) => setEquipmentForm({ ...equipmentForm, unit_price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={equipmentForm.purchase_date} onChange={(e) => setEquipmentForm({ ...equipmentForm, purchase_date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="Where you bought it" value={equipmentForm.vendor} onChange={(e) => setEquipmentForm({ ...equipmentForm, vendor: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Serial <span className="text-muted-foreground">(optional)</span></Label>
                <Input disabled={eqQty > 1} placeholder={eqQty > 1 ? "Single items only" : "Optional"} value={equipmentForm.serial_number} onChange={(e) => setEquipmentForm({ ...equipmentForm, serial_number: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea rows={2} value={equipmentForm.notes} onChange={(e) => setEquipmentForm({ ...equipmentForm, notes: e.target.value })} />
            </div>
            <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
              <Checkbox checked={equipmentForm.record_expense} onCheckedChange={(c) => setEquipmentForm({ ...equipmentForm, record_expense: c === true })} className="mt-0.5" />
              <span>
                <span className="font-medium">Record as an expense</span>
                <span className="block text-xs text-muted-foreground">
                  {eqTotal > 0 ? `${formatCurrency(eqTotal)} will count against this month's budget.` : "Enter a price to add this to your expenses."}
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEquipmentOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={createEquipment} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Budget */}
      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Monthly budget</DialogTitle>
            <DialogDescription>Applies from this month onward until you change it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Budget (KES)</Label>
            <Input type="number" min="0" autoFocus value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} placeholder="e.g. 290000" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBudgetOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={saveBudget} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit equipment */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit equipment</DialogTitle>
            <DialogDescription>{selected?.name} ({selected?.asset_tag})</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Serial</Label><Input value={editForm.serial_number} onChange={(e) => setEditForm({ ...editForm, serial_number: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={editForm.condition} onValueChange={(v) => setEditForm({ ...editForm, condition: v as EquipmentCondition })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["new", "good", "fair", "poor", "faulty"].map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Price (KES)</Label><Input type="number" value={editForm.purchase_price} onChange={(e) => setEditForm({ ...editForm, purchase_price: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Location</Label><Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={saveEdit} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign equipment</DialogTitle>
            <DialogDescription>{selected?.name} ({selected?.asset_tag})</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2"><Label>Employee ID *</Label><Input placeholder="e.g. EMP001" value={assignForm.employee_id} onChange={(e) => setAssignForm({ ...assignForm, employee_id: e.target.value })} /></div>
            <div className="space-y-2"><Label>Purpose</Label><Textarea rows={2} value={assignForm.purpose} onChange={(e) => setAssignForm({ ...assignForm, purpose: e.target.value })} /></div>
            <div className="space-y-2"><Label>Expected return</Label><Input type="date" value={assignForm.expected_return_date} onChange={(e) => setAssignForm({ ...assignForm, expected_return_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={assign} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return to stock</DialogTitle>
            <DialogDescription>{selected?.name} ({selected?.asset_tag})</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Condition at return</Label>
              <Select value={returnForm.condition} onValueChange={(v) => setReturnForm({ ...returnForm, condition: v as EquipmentCondition })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["new", "good", "fair", "poor", "faulty"].map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea rows={2} value={returnForm.notes} onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={returnItem} disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete expense */}
      <AlertDialog open={!!expenseToDelete} onOpenChange={(o) => !o && !submitting && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>
              {expenseToDelete && <><span className="font-medium text-foreground">{expenseToDelete.title}</span> ({formatCurrency(expenseToDelete.amount)}) will be removed and your budget figures will update. This cannot be undone.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" disabled={submitting}
              onClick={(e) => { e.preventDefault(); void confirmDeleteExpense() }}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete / dispose equipment */}
      <AlertDialog open={!!itemToRemove} onOpenChange={(o) => !o && !submitting && setItemToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{itemToRemove?.mode === "dispose" ? "Mark as disposed?" : "Delete equipment?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToRemove && <><span className="font-medium text-foreground">{itemToRemove.item.name}</span> ({itemToRemove.item.asset_tag}){" "}
                {itemToRemove.mode === "dispose" ? "will be removed from active inventory but kept for history." : "will be permanently removed. Its expense record is kept. This cannot be undone."}</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction className={itemToRemove?.mode === "delete" ? "bg-destructive hover:bg-destructive/90" : ""} disabled={submitting}
              onClick={(e) => { e.preventDefault(); void confirmRemove() }}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {itemToRemove?.mode === "dispose" ? "Mark disposed" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}