import { StateCreator } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

/**
 * General settings
 */
export interface GeneralSettings {
  authorName: string
  authorEmail?: string
  defaultLanguage: 'en' | 'tr'
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h'
  confirmOnDelete: boolean
  confirmOnClose: boolean
  theme: Theme
}

/**
 * Extended Editor settings (combines with existing workspaceConfig.editorSettings)
 */
export interface ExtendedEditorSettings {
  // Existing (from workspaceConfig)
  fontSize: number
  lineHeight: number
  wordWrap: boolean
  minimap: boolean
  lineNumbers: boolean
  tabSize: number
  autoSave: boolean
  autoSaveDelay: number

  // New additions
  fontFamily: string
  cursorStyle: 'line' | 'block' | 'underline'
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid'
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'all'
  bracketPairColorization: boolean
  autoClosingBrackets: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never'
  formatOnSave: boolean
  formatOnPaste: boolean
  trimAutoWhitespace: boolean
}

/**
 * AI preferences
 */
export interface AIPreferences {
  autoSuggest: boolean
  suggestionsDelay: number
  maxSuggestionsHistory: number
  showContextInPrompt: boolean
  enabledActions: string[]
}

/**
 * Workspace preferences
 */
export interface WorkspacePreferences {
  autoBackup: boolean
  backupInterval: number
  maxBackups: number
  backupPath?: string
  watchExternalChanges: boolean
  reloadOnExternalChange: 'auto' | 'ask' | 'never'
  indexingEnabled: boolean
  maxFileSize: number
}

/**
 * Keyboard shortcut
 */
export interface KeyboardShortcut {
  id: string
  action: string
  defaultBinding: string
  currentBinding: string
  category: 'editor' | 'navigation' | 'ai' | 'general'
}

/**
 * Advanced settings
 */
export interface AdvancedSettings {
  enableDevTools: boolean
  verboseLogging: boolean
  showHiddenFiles: boolean
  gpuAcceleration: boolean
  maxMemoryUsage: number
  cacheSize: number
  experimentalFeatures: boolean
}

/**
 * Default settings
 */
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  authorName: '',
  authorEmail: undefined,
  defaultLanguage: 'en',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  confirmOnDelete: true,
  confirmOnClose: false,
  theme: 'dark'
}

export const DEFAULT_EXTENDED_EDITOR_SETTINGS: ExtendedEditorSettings = {
  fontSize: 14,
  lineHeight: 1.6,
  wordWrap: true,
  minimap: false,
  lineNumbers: true,
  tabSize: 2,
  autoSave: true,
  autoSaveDelay: 1000,
  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
  cursorStyle: 'line',
  cursorBlinking: 'blink',
  renderWhitespace: 'none',
  bracketPairColorization: true,
  autoClosingBrackets: 'languageDefined',
  formatOnSave: false,
  formatOnPaste: false,
  trimAutoWhitespace: true
}

export const DEFAULT_AI_PREFERENCES: AIPreferences = {
  autoSuggest: false,
  suggestionsDelay: 500,
  maxSuggestionsHistory: 50,
  showContextInPrompt: true,
  enabledActions: [
    'expandScene',
    'checkGrammar',
    'makeDramatic',
    'summarize',
    'suggestImprovements'
  ]
}

export const DEFAULT_WORKSPACE_PREFERENCES: WorkspacePreferences = {
  autoBackup: false,
  backupInterval: 30,
  maxBackups: 5,
  backupPath: undefined,
  watchExternalChanges: true,
  reloadOnExternalChange: 'ask',
  indexingEnabled: true,
  maxFileSize: 10
}

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Editor
  { id: 'save', action: 'Save', defaultBinding: 'Ctrl+S', currentBinding: 'Ctrl+S', category: 'editor' },
  { id: 'saveAll', action: 'Save All', defaultBinding: 'Ctrl+Shift+S', currentBinding: 'Ctrl+Shift+S', category: 'editor' },
  { id: 'find', action: 'Find in File', defaultBinding: 'Ctrl+F', currentBinding: 'Ctrl+F', category: 'editor' },

  // Navigation
  { id: 'globalFind', action: 'Global Search', defaultBinding: 'Ctrl+Shift+F', currentBinding: 'Ctrl+Shift+F', category: 'navigation' },
  { id: 'toggleSidebar', action: 'Toggle Sidebar', defaultBinding: 'Ctrl+B', currentBinding: 'Ctrl+B', category: 'navigation' },

  // General
  { id: 'commandPalette', action: 'Command Palette', defaultBinding: 'Ctrl+Shift+P', currentBinding: 'Ctrl+Shift+P', category: 'general' },
  { id: 'createEntity', action: 'Create Entity', defaultBinding: 'Ctrl+Shift+E', currentBinding: 'Ctrl+Shift+E', category: 'general' },
  { id: 'createNote', action: 'Create Note', defaultBinding: 'Ctrl+Shift+N', currentBinding: 'Ctrl+Shift+N', category: 'general' },
  { id: 'settings', action: 'Open Settings', defaultBinding: 'Ctrl+,', currentBinding: 'Ctrl+,', category: 'general' },

  // AI
  { id: 'aiChat', action: 'Open AI Chat', defaultBinding: 'Ctrl+Shift+A', currentBinding: 'Ctrl+Shift+A', category: 'ai' },
  { id: 'aiExpand', action: 'AI Expand Selection', defaultBinding: 'Alt+E', currentBinding: 'Alt+E', category: 'ai' },
  { id: 'aiGrammar', action: 'AI Check Grammar', defaultBinding: 'Alt+G', currentBinding: 'Alt+G', category: 'ai' }
]

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  enableDevTools: false,
  verboseLogging: false,
  showHiddenFiles: false,
  gpuAcceleration: true,
  maxMemoryUsage: 512,
  cacheSize: 100,
  experimentalFeatures: false
}

/**
 * Settings slice state
 */
export interface SettingsSlice {
  // Settings
  generalSettings: GeneralSettings
  extendedEditorSettings: ExtendedEditorSettings
  aiPreferences: AIPreferences
  workspacePreferences: WorkspacePreferences
  keyboardShortcuts: KeyboardShortcut[]
  advancedSettings: AdvancedSettings

  // Actions
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void
  updateExtendedEditorSettings: (settings: Partial<ExtendedEditorSettings>) => void
  updateAIPreferences: (preferences: Partial<AIPreferences>) => void
  updateWorkspacePreferences: (preferences: Partial<WorkspacePreferences>) => void
  updateKeyboardShortcut: (id: string, binding: string) => void
  resetKeyboardShortcut: (id: string) => void
  resetAllKeyboardShortcuts: () => void
  updateAdvancedSettings: (settings: Partial<AdvancedSettings>) => void

  // Import/Export
  exportSettings: () => string
  importSettings: (json: string) => boolean
  resetAllSettings: () => void
}

/**
 * Create settings slice
 */
export const createSettingsSlice: StateCreator<
  SettingsSlice,
  [['zustand/immer', never]],
  [],
  SettingsSlice
> = (set, get) => ({
  // Initial state
  generalSettings: DEFAULT_GENERAL_SETTINGS,
  extendedEditorSettings: DEFAULT_EXTENDED_EDITOR_SETTINGS,
  aiPreferences: DEFAULT_AI_PREFERENCES,
  workspacePreferences: DEFAULT_WORKSPACE_PREFERENCES,
  keyboardShortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
  advancedSettings: DEFAULT_ADVANCED_SETTINGS,

  // Update general settings
  updateGeneralSettings: (settings) => {
    set((state) => {
      state.generalSettings = { ...state.generalSettings, ...settings }
    })
  },

  // Update extended editor settings
  updateExtendedEditorSettings: (settings) => {
    set((state) => {
      state.extendedEditorSettings = { ...state.extendedEditorSettings, ...settings }
    })
  },

  // Update AI preferences
  updateAIPreferences: (preferences) => {
    set((state) => {
      state.aiPreferences = { ...state.aiPreferences, ...preferences }
    })
  },

  // Update workspace preferences
  updateWorkspacePreferences: (preferences) => {
    set((state) => {
      state.workspacePreferences = { ...state.workspacePreferences, ...preferences }
    })
  },

  // Update keyboard shortcut
  updateKeyboardShortcut: (id, binding) => {
    set((state) => {
      const shortcut = state.keyboardShortcuts.find((s) => s.id === id)
      if (shortcut) {
        shortcut.currentBinding = binding
      }
    })
  },

  // Reset keyboard shortcut to default
  resetKeyboardShortcut: (id) => {
    set((state) => {
      const shortcut = state.keyboardShortcuts.find((s) => s.id === id)
      if (shortcut) {
        shortcut.currentBinding = shortcut.defaultBinding
      }
    })
  },

  // Reset all keyboard shortcuts
  resetAllKeyboardShortcuts: () => {
    set((state) => {
      state.keyboardShortcuts.forEach((shortcut) => {
        shortcut.currentBinding = shortcut.defaultBinding
      })
    })
  },

  // Update advanced settings
  updateAdvancedSettings: (settings) => {
    set((state) => {
      state.advancedSettings = { ...state.advancedSettings, ...settings }
    })
  },

  // Export settings as JSON
  exportSettings: () => {
    const state = get()
    const settings = {
      generalSettings: state.generalSettings,
      extendedEditorSettings: state.extendedEditorSettings,
      aiPreferences: state.aiPreferences,
      workspacePreferences: state.workspacePreferences,
      keyboardShortcuts: state.keyboardShortcuts,
      advancedSettings: state.advancedSettings,
      exportedAt: new Date().toISOString()
    }
    return JSON.stringify(settings, null, 2)
  },

  // Import settings from JSON
  importSettings: (json) => {
    try {
      const settings = JSON.parse(json)

      set((state) => {
        if (settings.generalSettings) {
          state.generalSettings = { ...DEFAULT_GENERAL_SETTINGS, ...settings.generalSettings }
        }
        if (settings.extendedEditorSettings) {
          state.extendedEditorSettings = { ...DEFAULT_EXTENDED_EDITOR_SETTINGS, ...settings.extendedEditorSettings }
        }
        if (settings.aiPreferences) {
          state.aiPreferences = { ...DEFAULT_AI_PREFERENCES, ...settings.aiPreferences }
        }
        if (settings.workspacePreferences) {
          state.workspacePreferences = { ...DEFAULT_WORKSPACE_PREFERENCES, ...settings.workspacePreferences }
        }
        if (settings.keyboardShortcuts) {
          state.keyboardShortcuts = settings.keyboardShortcuts
        }
        if (settings.advancedSettings) {
          state.advancedSettings = { ...DEFAULT_ADVANCED_SETTINGS, ...settings.advancedSettings }
        }
      })

      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  },

  // Reset all settings to defaults
  resetAllSettings: () => {
    set((state) => {
      state.generalSettings = DEFAULT_GENERAL_SETTINGS
      state.extendedEditorSettings = DEFAULT_EXTENDED_EDITOR_SETTINGS
      state.aiPreferences = DEFAULT_AI_PREFERENCES
      state.workspacePreferences = DEFAULT_WORKSPACE_PREFERENCES
      state.keyboardShortcuts = DEFAULT_KEYBOARD_SHORTCUTS
      state.advancedSettings = DEFAULT_ADVANCED_SETTINGS
    })
  }
})
