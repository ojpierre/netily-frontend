export const safeStorage = {
  get(k: string): string | null {
    try { return window.localStorage?.getItem(k) ?? null } catch { return null }
  },
  set(k: string, v: string) {
    try { window.localStorage?.setItem(k, v) } catch {}
  },
  remove(k: string) {
    try { window.localStorage?.removeItem(k) } catch {}
  },
}