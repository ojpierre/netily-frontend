// Remembers where a signed-out tenant was going (for example a renew link from an
// SMS or email) so the admin login can send them back there instead of /admin.

const KEY = "netily:admin:post-login-path"

function isSafeAdminPath(path: string | null | undefined): path is string {
  if (!path || !path.startsWith("/admin") || path.startsWith("//")) return false
  const pathname = path.split(/[?#]/)[0]
  return pathname !== "/admin/login" && !pathname.startsWith("/admin/login/")
}

export function rememberPostLoginPath(path: string) {
  if (!isSafeAdminPath(path) || path === "/admin" || path === "/admin/") return
  try { sessionStorage.setItem(KEY, path) } catch {}
}

/**
 * Where to go after login: the remembered admin path, else ?from=, else /admin.
 * Read-only on purpose: login can redirect from two places at once, and both must
 * agree. The admin layout clears it once a signed-in page has loaded.
 */
export function consumePostLoginPath(fallback = "/admin") {
  let path: string | null = null
  try { path = sessionStorage.getItem(KEY) } catch {}
  if (!isSafeAdminPath(path) && typeof window !== "undefined") {
    const from = new URLSearchParams(window.location.search).get("from")
    if (isSafeAdminPath(from)) path = from
  }
  return isSafeAdminPath(path) ? path : fallback
}

export function clearPostLoginPath() {
  try { sessionStorage.removeItem(KEY) } catch {}
}
