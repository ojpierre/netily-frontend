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
  normalizeAppearanceFont,
  type AppearanceFont,
} from '@/lib/appearance-fonts'
import { safeStorage } from '@/lib/safe-storage'

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
  | 'sage-noir'
  | 'copper-graphite'
  | 'indigo-mist'
  | 'brutalist-sun'
  | 'brutalist-ink'
  | 'cyber-orchid'
  | 'retro-terminal'
  | 'brutalist-lime'
  | 'aurora-noir'
  | 'coral-graphite'
  | 'fibre-pulse'
  | 'airwave'
  | 'packet-flow'

interface NetilyThemeContextValue {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  appearanceFont: AppearanceFont
  setAppearanceFont: (font: AppearanceFont) => void
  /** Motion themes only: freezes the animated background (spinners keep moving). */
  motionPaused: boolean
  setMotionPaused: (paused: boolean) => void
}

const NetilyThemeContext = React.createContext<NetilyThemeContextValue>({
  colorTheme: 'blue',
  setColorTheme: () => {},
  appearanceFont: DEFAULT_APPEARANCE_FONT,
  setAppearanceFont: () => {},
  motionPaused: false,
  setMotionPaused: () => {},
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
  { value: 'sage-noir', label: 'Sage Noir', preview: 'linear-gradient(135deg,#6b8f71,#111814)' },
  { value: 'copper-graphite', label: 'Copper Graphite', preview: 'linear-gradient(135deg,#b45309,#1f2937)' },
  { value: 'indigo-mist', label: 'Indigo Mist', preview: 'linear-gradient(135deg,#4f46e5,#eef2ff)' },
  { value: 'brutalist-sun', label: 'Brutalist Sun', preview: 'linear-gradient(135deg,#facc15,#111827)' },
  { value: 'brutalist-ink', label: 'Brutalist Ink', preview: 'linear-gradient(135deg,#ffffff,#111111)' },
  { value: 'cyber-orchid', label: 'Cyber Orchid', preview: 'linear-gradient(135deg,#22d3ee,#d946ef)' },
  { value: 'retro-terminal', label: 'Retro Terminal', preview: 'linear-gradient(135deg,#052e16,#84cc16)' },
  { value: 'brutalist-lime', label: 'Brutalist Lime', preview: 'linear-gradient(135deg,#d9f99d,#111111 55%,#fb7185)' },
  { value: 'aurora-noir', label: 'Aurora Noir', preview: 'linear-gradient(135deg,#0f172a,#14b8a6,#a78bfa)' },
  { value: 'coral-graphite', label: 'Coral Graphite', preview: 'linear-gradient(135deg,#fb7185,#334155,#fef3c7)' },
  { value: 'fibre-pulse', label: 'Fibre Pulse', preview: 'linear-gradient(135deg,#0b1430,#2563eb,#22d3ee)' },
  { value: 'airwave', label: 'Airwave', preview: 'linear-gradient(135deg,#071c1a,#0d9488,#6ee7b7)' },
  { value: 'packet-flow', label: 'Packet Flow', preview: 'linear-gradient(135deg,#1c1210,#ea580c,#fbbf24)' },
]

/** Themes with an animated background, spinner, skeleton and header line. */
export const MOTION_THEMES: {
  value: ColorTheme
  label: string
  idea: string
  description: string
  spinner: string
}[] = [
  {
    value: 'fibre-pulse',
    label: 'Fibre Pulse',
    idea: 'Light travelling down fibre strands',
    description: 'Pulses of light run along glowing fibre lines behind your work.',
    spinner: 'Light ring',
  },
  {
    value: 'airwave',
    label: 'Airwave',
    idea: 'Radio rings from a hotspot tower',
    description: 'Slow signal rings spread out from two access points.',
    spinner: 'Signal ping',
  },
  {
    value: 'packet-flow',
    label: 'Packet Flow',
    idea: 'Data packets routing across a grid',
    description: 'Packets travel the lanes of a network grid as nodes blink.',
    spinner: 'Signal bars',
  },
]

export function isMotionTheme(theme: string | null | undefined): boolean {
  return MOTION_THEMES.some((item) => item.value === theme)
}

const MOTION_PAUSED_STORAGE_KEY = 'netily-motion-paused'

function applyMotionPaused(paused: boolean) {
  if (paused) document.documentElement.setAttribute('data-motion', 'paused')
  else document.documentElement.removeAttribute('data-motion')
}

const COLOR_THEME_VALUES = COLOR_THEMES.map((theme) => theme.value)

function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = React.useState<ColorTheme>('blue')
  const [appearanceFont, setAppearanceFontState] = React.useState<AppearanceFont>(DEFAULT_APPEARANCE_FONT)
  const [motionPaused, setMotionPausedState] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // Read from localStorage on mount
    const saved = safeStorage.get('netily-color-theme') as ColorTheme | null
    if (saved && COLOR_THEME_VALUES.includes(saved)) {
      setColorThemeState(saved)
      document.documentElement.setAttribute('data-theme', saved)
    } else {
      document.documentElement.setAttribute('data-theme', 'blue')
    }

    const savedPaused = safeStorage.get(MOTION_PAUSED_STORAGE_KEY) === '1'
    setMotionPausedState(savedPaused)
    applyMotionPaused(savedPaused)

    const savedFont = safeStorage.get(APPEARANCE_FONT_STORAGE_KEY)
    setAppearanceFontState(applyAppearanceFont(savedFont))

    let token: string | null = null
    try { token = sessionStorage?.getItem(`adminToken:${window.location.hostname}`) } catch {}
    try { token = token || localStorage?.getItem(`adminToken:${window.location.hostname}`) } catch {}
    try { token = token || sessionStorage?.getItem('adminToken') } catch {}
    try { token = token || localStorage?.getItem('adminToken') } catch {}

    if (token && window.location.pathname.startsWith('/admin')) {
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
          const font = normalizeAppearanceFont(settings?.appearance_font)
          if (font) {
            setAppearanceFontState(applyAppearanceFont(font))
          }
        })
        .catch(() => {})
    }
  }, [])

  const setColorTheme = React.useCallback((theme: ColorTheme) => {
    setColorThemeState(theme)
    safeStorage.set('netily-color-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  const setAppearanceFont = React.useCallback((font: AppearanceFont) => {
    setAppearanceFontState(applyAppearanceFont(font))
  }, [])

  const setMotionPaused = React.useCallback((paused: boolean) => {
    setMotionPausedState(paused)
    if (paused) safeStorage.set(MOTION_PAUSED_STORAGE_KEY, '1')
    else safeStorage.remove(MOTION_PAUSED_STORAGE_KEY)
    applyMotionPaused(paused)
  }, [])

  // Avoid flash of wrong theme
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NetilyThemeContext.Provider value={{ colorTheme, setColorTheme, appearanceFont, setAppearanceFont, motionPaused, setMotionPaused }}>
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