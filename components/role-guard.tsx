"use client"

import React from "react"
import { LockKeyhole, ShieldCheck } from "lucide-react"
import { useAdminAuth } from "@/app/admin/admin-auth-context"
import { canAccess, type AccessRule } from "@/lib/rbac"

interface RoleGuardProps extends AccessRule {
  areaLabel?: string
  children: React.ReactNode
}

const list = (items?: string[]) => items?.map((item) => item.replace("_", " ")).join(", ")

export function RoleGuard({ allowedRoles, allowedDepartments, areaLabel = "this page", children }: RoleGuardProps) {
  const { user, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const rule = { allowedRoles, allowedDepartments }
  if (canAccess(user, rule)) return <>{children}</>

  return (
    <div className="mx-auto flex min-h-[55vh] max-w-2xl items-center justify-center">
      <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="bg-linear-to-br from-slate-950 via-slate-900 to-blue-950 px-8 py-7 text-white">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Access Denied</h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
            Your account is signed in, but it does not currently have permission to open {areaLabel}.
          </p>
        </div>
        <div className="space-y-4 p-8">
          <div className="flex gap-3 rounded-2xl bg-primary/10 p-4 text-sm text-primary dark:bg-blue-950/40 dark:text-blue-100">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Who can access this area?</p>
              <p className="mt-1 text-primary/80 dark:text-blue-100/80">
                {allowedRoles?.length ? `Roles: ${list(allowedRoles)}. ` : ""}
                {allowedDepartments?.length ? `Departments: ${list(allowedDepartments)}.` : ""}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            If this looks wrong, ask an administrator to update your staff profile department or access level.
          </p>
        </div>
      </div>
    </div>
  )
}
