'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'
import {
  APPEARANCE_FONT_STORAGE_KEY,
  DEFAULT_APPEARANCE_FONT,
  applyAppearanceFont,
  isAppearanceFont,
  type AppearanceFont,
} from '@/lib/appearance-fonts'

export type ColorTheme =
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'black-white'
  | 'pink-purple'
  | 'amber-slate'
  | 'cyan-graphite'
  | 'crimson-ivory'

interface NetilyThemeContextValue {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  appearanceFont: AppearanceFont
  setAppearanceFont: (font: AppearanceFont) => void
}

const NetilyThemeContext = React.createContext<NetilyThemeContextValue>({
  colorTheme: 'blue',
  setColorTheme: () => {},
  appearanceFont: DEFAULT_APPEARANCE_FONT,
  setAppearanceFont: () => {},
})

export function useColorTheme() {
  return React.useContext(NetilyThemeContext)
}

export const COLOR_THEMES: { value: ColorTheme; label: string; preview: string }[] = [
  { value: 'blue', label: 'Blue', preview: 'oklch(0.45 0.18 260)' },
  { value: 'green', label: 'Green', preview: 'oklch(0.45 0.18 155)' },
  { value: 'pink', label: 'Pink', preview: 'oklch(0.5 0.2 350)' },
  { value: 'purple', label: 'Purple', preview: 'oklch(0.48 0.2 300)' },
  { value: 'black-white', label: 'Black & White', preview: 'oklch(0.15 0 0)' },
  { value: 'pink-purple', label: 'Pink Purple', preview: 'linear-gradient(135deg,#ec4899,#8b5cf6)' },
  { value: 'amber-slate', label: 'Amber Slate', preview: 'linear-gradient(135deg,#f59e0b,#111827)' },
  { value: 'cyan-graphite', label: 'Cyan Graphite', preview: 'linear-gradient(135deg,#06b6d4,#27272a)' },
  { value: 'crimson-ivory', label: 'Crimson Ivory', preview: 'linear-gradient(135deg,#dc2626,#fafaf9)' },
]

const COLOR_THEME_VALUES = COLOR_THEMES.map((theme) => theme.value)

function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = React.useState<ColorTheme>('blue')
  const [appearanceFont, setAppearanceFontState] = React.useState<AppearanceFont>(DEFAULT_APPEARANCE_FONT)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // Read from localStorage on mount
    const saved = localStorage.getItem('netily-color-theme') as ColorTheme | null
    if (saved && COLOR_THEME_VALUES.includes(saved)) {
      setColorThemeState(saved)
      document.documentElement.setAttribute('data-theme', saved)
    } else {
      document.documentElement.setAttribute('data-theme', 'blue')
    }

    const savedFont = localStorage.getItem(APPEARANCE_FONT_STORAGE_KEY)
    setAppearanceFontState(applyAppearanceFont(savedFont))

    const token =
      localStorage.getItem(`adminToken:${window.location.hostname}`) ||
      sessionStorage.getItem(`adminToken:${window.location.hostname}`) ||
      localStorage.getItem('adminToken') ||
      sessionStorage.getItem('adminToken')

    if (token) {
      const knownDomains = ['netily.co.ke']
      const isTenantSubdomain = knownDomains.some(
        (domain) =>
          window.location.hostname.endsWith(`.${domain}`) &&
          window.location.hostname !== `www.${domain}` &&
          window.location.hostname !== `api.${domain}`,
      )
      const apiBase = isTenantSubdomain
        ? `${window.location.protocol}//${window.location.hostname}/api/v1`
        : process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1'
      fetch(`${apiBase}/core/settings/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((settings) => {
          if (settings && isAppearanceFont(settings.appearance_font)) {
            setAppearanceFontState(applyAppearanceFont(settings.appearance_font))
          }
        })
        .catch(() => {})
    }
  }, [])

  const setColorTheme = React.useCallback((theme: ColorTheme) => {
    setColorThemeState(theme)
    localStorage.setItem('netily-color-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  const setAppearanceFont = React.useCallback((font: AppearanceFont) => {
    setAppearanceFontState(applyAppearanceFont(font))
  }, [])

  // Avoid flash of wrong theme
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NetilyThemeContext.Provider value={{ colorTheme, setColorTheme, appearanceFont, setAppearanceFont }}>
      {children}
    </NetilyThemeContext.Provider>
  )
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ColorThemeProvider>
        {children}
      </ColorThemeProvider>
    </NextThemesProvider>
  )
}
