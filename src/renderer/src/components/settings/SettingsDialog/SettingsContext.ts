import { createContext, useContext } from 'react'
import type { GeneralSettings, ExtendedEditorSettings, AIPreferences, WorkspacePreferences, HistorySettings, BackupSettings, AdvancedSettings } from '@renderer/store/slices/settingsSlice'
import type { AIConfig, AIProvider } from '@renderer/lib/ai/types'

export interface SettingsDraft {
  generalSettings: GeneralSettings
  extendedEditorSettings: ExtendedEditorSettings
  aiPreferences: AIPreferences
  workspacePreferences: WorkspacePreferences
  historySettings: HistorySettings
  backupSettings: BackupSettings
  advancedSettings: AdvancedSettings
  activeProvider: AIProvider
  providerConfigs: Record<AIProvider, AIConfig>
}

export interface SettingsContextValue {
  draft: SettingsDraft
  updateDraft: (updates: Partial<SettingsDraft>) => void
  isDirty: boolean
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettingsContext(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettingsContext must be used inside SettingsDialog')
  return ctx
}
