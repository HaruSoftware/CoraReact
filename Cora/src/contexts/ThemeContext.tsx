import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type ThemePreference } from './ThemeContextValue'

const STORAGE_KEY = 'cora-theme'
type ResolvedTheme = 'light' | 'dark'

function getInitialPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
  } catch {
    return 'system'
  }
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(getInitialPreference)
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)
  const resolvedTheme = preference === 'system' ? systemTheme : preference

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const atualizarTemaDoSistema = () => setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', atualizarTemaDoSistema)
    return () => mediaQuery.removeEventListener('change', atualizarTemaDoSistema)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
    try {
      localStorage.setItem(STORAGE_KEY, preference)
    } catch {
      // O tema continua funcional quando o armazenamento local esta indisponivel.
    }
  }, [preference, resolvedTheme])

  return (
    <ThemeContext.Provider value={{ preference, resolvedTheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}