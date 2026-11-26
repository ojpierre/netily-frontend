"use client"

import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react"
import {
  DEFAULT_PORTAL_THEME,
  PORTAL_THEME_STORAGE_KEY,
  getPortalTheme,
  normalizePortalTheme,
  portalThemeCss,
  type PortalThemeId,
} from "@/lib/customer-portal-themes"
import { safeStorage } from "@/lib/safe-storage"

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

interface PortalThemeContextValue {
  themeId: PortalThemeId
  /** True when the theme only exists in one mode (the theme toggle should be hidden). */
  forcedMode: "light" | "dark" | undefined
  /** Reconcile with the value the server returned. Unknown values fall back to "classic". */
  applyServerTheme: (value: unknown) => void
}

const PortalThemeContext = createContext<PortalThemeContextValue>({
  themeId: DEFAULT_PORTAL_THEME,
  forcedMode: undefined,
  applyServerTheme: () => {},
})

export function usePortalTheme() {
  return useContext(PortalThemeContext)
}

/** Injects the generated theme stylesheet. Rendered once by the provider (and by the admin picker). */
export function PortalThemeStyles() {
  return <style data-portal-theme-styles dangerouslySetInnerHTML={{ __html: portalThemeCss() }} />
}

/**
 * Applies the tenant's customer-portal theme to <html> (so dialogs, popovers and the page
 * background are themed too). The last known theme is cached in localStorage and applied
 * before first paint, then reconciled with the server value.
 */
export function PortalThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<PortalThemeId>(DEFAULT_PORTAL_THEME)

  // Apply the cached theme before paint to avoid a flash of the default look.
  useIsoLayoutEffect(() => {
    const cached = safeStorage.get(PORTAL_THEME_STORAGE_KEY)
    if (cached) setThemeId(normalizePortalTheme(cached))
  }, [])

  const forcedMode = getPortalTheme(themeId).forcedMode

  useIsoLayoutEffect(() => {
    const root = document.documentElement
    root.setAttribute("data-portal-theme", themeId)
    let addedDark = false
    if (forcedMode) {
      root.setAttribute("data-portal-mode", forcedMode)
      if (forcedMode === "dark" && !root.classList.contains("dark")) {
        root.classList.add("dark")
        addedDark = true
      }
    }
    return () => {
      root.removeAttribute("data-portal-theme")
      root.removeAttribute("data-portal-mode")
      if (addedDark) root.classList.remove("dark")
    }
  }, [themeId, forcedMode])

  const applyServerTheme = useCallback((value: unknown) => {
    const next = normalizePortalTheme(value)
    setThemeId(next)
    safeStorage.set(PORTAL_THEME_STORAGE_KEY, next)
  }, [])

  const value = useMemo(() => ({ themeId, forcedMode, applyServerTheme }), [themeId, forcedMode, applyServerTheme])

  return (
    <PortalThemeContext.Provider value={value}>
      <PortalThemeStyles />
      {children}
    </PortalThemeContext.Provider>
  )
}
