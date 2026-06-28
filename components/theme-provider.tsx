'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

type ColorTheme = 'blue' | 'green' | 'pink' | 'purple' | 'black-white' | 'pink-purple'

interface NetilyThemeContextValue {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
}

const NetilyThemeContext = React.createContext<NetilyThemeContextValue>({
  colorTheme: 'blue',
  setColorTheme: () => {},
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
]

function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = React.useState<ColorTheme>('blue')
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    // Read from localStorage on mount
    const saved = localStorage.getItem('netily-color-theme') as ColorTheme | null
    if (saved && ['blue', 'green', 'pink', 'purple', 'black-white', 'pink-purple'].includes(saved)) {
      setColorThemeState(saved)
      document.documentElement.setAttribute('data-theme', saved)
    } else {
      document.documentElement.setAttribute('data-theme', 'blue')
    }
  }, [])

  const setColorTheme = React.useCallback((theme: ColorTheme) => {
    setColorThemeState(theme)
    localStorage.setItem('netily-color-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  // Avoid flash of wrong theme
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NetilyThemeContext.Provider value={{ colorTheme, setColorTheme }}>
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
