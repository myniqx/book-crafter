import React, { createContext, useContext, useEffect } from 'react'
import { useToolsStore } from '@renderer/store'
import type { Theme } from '@renderer/store/slices/settingsSlice'

interface ThemeProviderContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useToolsStore((state) => state.generalSettings.theme)
  const updateGeneralSettings = useToolsStore((state) => state.updateGeneralSettings)

  const setTheme = (newTheme: Theme): void => {
    updateGeneralSettings({ theme: newTheme })
  }

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value: ThemeProviderContextType = {
    theme,
    setTheme
  }

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}

export const useTheme = (): ThemeProviderContextType => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}
