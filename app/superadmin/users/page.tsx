"use client"

import React, { useEffect, useState, useCallback } from "react"
import {
  Users,
  Search,
  Loader2,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle2,
  Shield,
  Mail,
  Phone,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  superadminApi,
  type PlatformUser,
  type PlatformUserDetail,
} from "@/lib/superadmin-api"
import { useSuperAdminAuth } from "../superadmin-auth-context"

const ROLES = ["all", "admin", "staff", "technician", "customer", "accountant", "support"]

export default function UsersPage() {
  const { user: currentUser } = useSuperAdminAuth()
  const [users, setUsers] = useState<PlatformUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedUser, setSelectedUser] = useState<PlatformUserDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page) }
      if (search) params.search = search
      if (roleFilter !== "all") params.role = roleFilter
      const res = await superadminApi.getUsers(params)
      setUsers(res.results)
      setTotal(res.count)
    } catch (err: any) {
      toast.error(err.message || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 300)
    return () => clearTimeout(t)
  }, [fetchUsers])

  const openDetail = async (userId: number) => {
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const u = await superadminApi.getUser(userId)
      setSelectedUser(u)
    } catch {
      toast.error("Failed to load user details")
    } finally {
      setDetailLoading(false)
    }
  }

  const toggleActive = async (userId: number, current: boolean) => {
    try {
      if (current) {
        await superadminApi.deactivateUser(userId)
        toast.success("User deactivated")
      } else {
        await superadminApi.activateUser(userId)
        toast.success("User activated")
      }
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message || "Action failed")
    }
  }

  const totalPages = Math.ceil(total / 20)

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin: "bg-violet-500/20 text-violet-400 border-violet-500/30",
      staff: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      technician: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      customer: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      accountant: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      support: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    }
    return <Badge className={map[role] || "bg-slate-500/20 text-slate-400"}>{role}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-violet-400" />
          Platform Users
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          All users across every tenant — {total} total
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search by name, email, phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1) }}>
          <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-slate-200">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>{r === "all" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-slate-500 py-20">No users found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-left">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Verified</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{u.full_name || "(No name)"}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3" />{u.email}
                          {u.phone_number && <><Phone className="w-3 h-3 ml-2" />{u.phone_number}</>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {roleBadge(u.role)}
                          {u.is_superuser && <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30"><Shield className="w-3 h-3 mr-1" />Super</Badge>}
                          {currentUser && u.id === currentUser.id && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">You</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.tenant_subdomain ? (
                          <code className="text-xs text-violet-300 bg-violet-500/10 rounded px-1.5 py-0.5">{u.tenant_subdomain}</code>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_verified ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <span className="text-xs text-slate-500">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Inactive</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(u.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem onClick={() => openDetail(u.id)} className="text-slate-200">
                              <Eye className="w-4 h-4 mr-2" />View Details
                            </DropdownMenuItem>
                            {/* Hide deactivate/activate for superadmins and yourself */}
                            {!u.is_superuser && !(currentUser && u.id === currentUser.id) && (
                              <DropdownMenuItem
                                onClick={() => toggleActive(u.id, u.is_active)}
                                className={u.is_active ? "text-red-400" : "text-emerald-400"}
                              >
                                {u.is_active ? <Ban className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                {u.is_active ? "Deactivate" : "Activate"}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="border-slate-700 text-slate-300">Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="border-slate-700 text-slate-300">Next</Button>
          </div>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-violet-400" />
              User Details
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Full profile information
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
          ) : selectedUser ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Name" value={selectedUser.full_name || "—"} />
                <DetailField label="Email" value={selectedUser.email} />
                <DetailField label="Phone" value={selectedUser.phone_number || "—"} />
                <DetailField label="Role" value={selectedUser.role} />
                <DetailField label="Tenant" value={selectedUser.tenant_subdomain || "—"} />
                <DetailField label="Company" value={selectedUser.company_name || "—"} />
                <DetailField label="Gender" value={selectedUser.gender || "—"} />
                <DetailField label="ID Number" value={selectedUser.id_number || "—"} />
                <DetailField label="DOB" value={selectedUser.date_of_birth || "—"} />
                <DetailField label="Joined" value={new Date(selectedUser.date_joined).toLocaleString()} />
                <DetailField label="Last Login" value={selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : "Never"} />
                <DetailField label="Verified" value={selectedUser.is_verified ? "Yes" : "No"} />
              </div>
              {/* Hide deactivate for superadmins and yourself */}
              {!selectedUser.is_superuser && !(currentUser && selectedUser.id === currentUser.id) && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className={selectedUser.is_active ? "border-red-700 text-red-400" : "border-emerald-700 text-emerald-400"}
                    onClick={async () => {
                      await toggleActive(selectedUser.id, selectedUser.is_active)
                      const updated = await superadminApi.getUser(selectedUser.id)
                      setSelectedUser(updated)
                    }}
                  >
                    {selectedUser.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              )}
              {(selectedUser.is_superuser || (currentUser && selectedUser.id === currentUser.id)) && (
                <p className="text-xs text-slate-500 pt-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {selectedUser.is_superuser ? "Superadmin accounts are protected" : "You cannot deactivate yourself"}
                </p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="text-slate-200">{value}</p>
    </div>
  )
}
