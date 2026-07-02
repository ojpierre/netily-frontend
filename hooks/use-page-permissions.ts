/**
 * usePagePermissions – per-page CRUD permission hook
 *
 * Usage in any admin page:
 *   const perms = usePagePermissions("/admin/leads")
 *   <Button disabled={!perms.canAdd}>Add Lead</Button>
 *   {perms.canDelete && <button onClick={deleteLead}>Delete</button>}
 *
 * Admins / superusers always receive full access.
 * Non-admin staff are constrained by the tokens stored in role_access_policies.
 */
"use client"

import { useMemo } from "react"
import { canDo, ADMIN_ROLES, type PageAction } from "@/lib/rbac"
import { useAdminAuth } from "@/app/admin/admin-auth-context"

export interface PagePermissions {
  /** Can see this page / its listing at all */
  canView: boolean
  /** Can open detail drawer / modal for individual records */
  canViewDetails: boolean
  /** Can create / add new records */
  canAdd: boolean
  /** Can edit / modify existing records */
  canEdit: boolean
  /** Can delete / remove records */
  canDelete: boolean
  /** True when this user is an admin or superuser (all perms implicitly true) */
  isAdmin: boolean
}

const FULL_ACCESS: PagePermissions = {
  canView: true,
  canViewDetails: true,
  canAdd: true,
  canEdit: true,
  canDelete: true,
  isAdmin: true,
}

const check = (
  user: { role?: string | null; is_superuser?: boolean; access_level?: string | null; department?: string | null } | null,
  pathPrefix: string,
  action: PageAction
): boolean => canDo(user as any, pathPrefix, action)

export function usePagePermissions(pathPrefix: string): PagePermissions {
  const { user } = useAdminAuth()

  return useMemo<PagePermissions>(() => {
    if (!user) return { canView: false, canViewDetails: false, canAdd: false, canEdit: false, canDelete: false, isAdmin: false }

    const role = String(user.role || "").trim().toLowerCase()
    const accessLevel = String(user.access_level || "").trim().toLowerCase()

    // Admins and superusers bypass all permission checks
    if (user.is_superuser || ADMIN_ROLES.includes(role) || ADMIN_ROLES.includes(accessLevel)) {
      return FULL_ACCESS
    }

    return {
      isAdmin: false,
      canView: check(user, pathPrefix, "view"),
      canViewDetails: check(user, pathPrefix, "view_details"),
      canAdd: check(user, pathPrefix, "add"),
      canEdit: check(user, pathPrefix, "edit"),
      canDelete: check(user, pathPrefix, "delete"),
    }
  }, [user, pathPrefix])
}
