import { useEffect, useRef } from 'react'
import { usePersistedStore } from '@renderer/hooks/usePersistedStore'
import { useToolsStore } from '@renderer/store'
import type {
  GeneralSettings,
  ExtendedEditorSettings,
  AIPreferences,
  WorkspacePreferences,
  KeyboardShortcut,
  AdvancedSettings
} from '@renderer/store/slices/settingsSlice'
import type {
  AIConfig,
  OllamaConfig,
  OpenAIConfig,
  AnthropicConfig,
  CustomPrompt
} from '@renderer/store/slices/aiSlice'

/**
 * Persisted app settings structure
 */
interface PersistedSettings {
  // General settings (includes theme)
  generalSettings: GeneralSettings
  extendedEditorSettings: ExtendedEditorSettings
  aiPreferences: AIPreferences
  workspacePreferences: WorkspacePreferences
  keyboardShortcuts: KeyboardShortcut[]
  advancedSettings: AdvancedSettings

  // AI configurations
  config: AIConfig
  ollamaConfig: OllamaConfig
  openaiConfig: OpenAIConfig
  anthropicConfig: AnthropicConfig
  customPrompts: CustomPrompt[]
}

/**
 * Default persisted settings
 */
const DEFAULT_PERSISTED_SETTINGS: PersistedSettings = {
  generalSettings: {
    authorName: '',
    authorEmail: undefined,
    defaultLanguage: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    confirmOnDelete: true,
    confirmOnClose: false,
    theme: 'dark'
  },
  extendedEditorSettings: {
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
  },
  aiPreferences: {
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
  },
  workspacePreferences: {
    autoBackup: false,
    backupInterval: 30,
    maxBackups: 5,
    backupPath: undefined,
    watchExternalChanges: true,
    reloadOnExternalChange: 'ask',
    indexingEnabled: true,
    maxFileSize: 10
  },
  keyboardShortcuts: [
    { id: 'save', action: 'Save', defaultBinding: 'Ctrl+S', currentBinding: 'Ctrl+S', category: 'editor' },
    { id: 'saveAll', action: 'Save All', defaultBinding: 'Ctrl+Shift+S', currentBinding: 'Ctrl+Shift+S', category: 'editor' },
    { id: 'find', action: 'Find in File', defaultBinding: 'Ctrl+F', currentBinding: 'Ctrl+F', category: 'editor' },
    { id: 'globalFind', action: 'Global Search', defaultBinding: 'Ctrl+Shift+F', currentBinding: 'Ctrl+Shift+F', category: 'navigation' },
    { id: 'toggleSidebar', action: 'Toggle Sidebar', defaultBinding: 'Ctrl+B', currentBinding: 'Ctrl+B', category: 'navigation' },
    { id: 'commandPalette', action: 'Command Palette', defaultBinding: 'Ctrl+Shift+P', currentBinding: 'Ctrl+Shift+P', category: 'general' },
    { id: 'createEntity', action: 'Create Entity', defaultBinding: 'Ctrl+Shift+E', currentBinding: 'Ctrl+Shift+E', category: 'general' },
    { id: 'createNote', action: 'Create Note', defaultBinding: 'Ctrl+Shift+N', currentBinding: 'Ctrl+Shift+N', category: 'general' },
    { id: 'settings', action: 'Open Settings', defaultBinding: 'Ctrl+,', currentBinding: 'Ctrl+,', category: 'general' },
    { id: 'aiChat', action: 'Open AI Chat', defaultBinding: 'Ctrl+Shift+A', currentBinding: 'Ctrl+Shift+A', category: 'ai' },
    { id: 'aiExpand', action: 'AI Expand Selection', defaultBinding: 'Alt+E', currentBinding: 'Alt+E', category: 'ai' },
    { id: 'aiGrammar', action: 'AI Check Grammar', defaultBinding: 'Alt+G', currentBinding: 'Alt+G', category: 'ai' }
  ],
  advancedSettings: {
    enableDevTools: false,
    verboseLogging: false,
    showHiddenFiles: false,
    gpuAcceleration: true,
    maxMemoryUsage: 512,
    cacheSize: 100,
    experimentalFeatures: false
  },
  config: {
    provider: 'ollama',
    model: 'llama3.2'
  },
  ollamaConfig: {
    baseUrl: 'http://localhost:11434',
    model: 'llama3.2'
  },
  openaiConfig: {
    apiKey: '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1'
  },
  anthropicConfig: {
    apiKey: '',
    model: 'claude-sonnet-4-20250514'
  },
  customPrompts: []
}

/**
 * SettingsPersistence Component
 *
 * Handles loading and saving app settings to disk using usePersistedStore hook.
 * This replaces Zustand's persist middleware with file-based persistence.
 *
 * Flow:
 * 1. On mount: Load settings from disk → Update store
 * 2. On store change: Save settings to disk
 */
export const SettingsPersistence: React.FC = () => {
  const [persistedSettings, setPersistedSettings, { loading }] = usePersistedStore<PersistedSettings>(
    'app-settings',
    DEFAULT_PERSISTED_SETTINGS
  )

  // Track if initial load is complete
  const isInitializedRef = useRef(false)

  // Get store state
  const generalSettings = useToolsStore((state) => state.generalSettings)
  const extendedEditorSettings = useToolsStore((state) => state.extendedEditorSettings)
  const aiPreferences = useToolsStore((state) => state.aiPreferences)
  const workspacePreferences = useToolsStore((state) => state.workspacePreferences)
  const keyboardShortcuts = useToolsStore((state) => state.keyboardShortcuts)
  const advancedSettings = useToolsStore((state) => state.advancedSettings)
  const config = useToolsStore((state) => state.config)
  const ollamaConfig = useToolsStore((state) => state.ollamaConfig)
  const openaiConfig = useToolsStore((state) => state.openaiConfig)
  const anthropicConfig = useToolsStore((state) => state.anthropicConfig)
  const customPrompts = useToolsStore((state) => state.customPrompts)

  // Get store actions
  const updateGeneralSettings = useToolsStore((state) => state.updateGeneralSettings)
  const updateExtendedEditorSettings = useToolsStore((state) => state.updateExtendedEditorSettings)
  const updateAIPreferences = useToolsStore((state) => state.updateAIPreferences)
  const updateWorkspacePreferences = useToolsStore((state) => state.updateWorkspacePreferences)
  const updateAdvancedSettings = useToolsStore((state) => state.updateAdvancedSettings)
  const setConfig = useToolsStore((state) => state.setConfig)
  const setOllamaConfig = useToolsStore((state) => state.setOllamaConfig)
  const setOpenAIConfig = useToolsStore((state) => state.setOpenAIConfig)
  const setAnthropicConfig = useToolsStore((state) => state.setAnthropicConfig)
  const setCustomPrompts = useToolsStore((state) => state.setCustomPrompts)

  // Load settings from disk to store on initial mount
  useEffect(() => {
    if (!loading && !isInitializedRef.current) {
      console.log('[SettingsPersistence] Loading settings from disk')

      // Update store with persisted values
      updateGeneralSettings(persistedSettings.generalSettings)
      updateExtendedEditorSettings(persistedSettings.extendedEditorSettings)
      updateAIPreferences(persistedSettings.aiPreferences)
      updateWorkspacePreferences(persistedSettings.workspacePreferences)
      updateAdvancedSettings(persistedSettings.advancedSettings)
      setConfig(persistedSettings.config)
      setOllamaConfig(persistedSettings.ollamaConfig)
      setOpenAIConfig(persistedSettings.openaiConfig)
      setAnthropicConfig(persistedSettings.anthropicConfig)
      setCustomPrompts(persistedSettings.customPrompts)

      // Handle keyboard shortcuts separately (need to update each one)
      const store = useToolsStore.getState()
      persistedSettings.keyboardShortcuts.forEach((shortcut) => {
        store.updateKeyboardShortcut(shortcut.id, shortcut.currentBinding)
      })

      isInitializedRef.current = true
      console.log('[SettingsPersistence] Settings loaded successfully')
    }
  }, [loading, persistedSettings])

  // Save settings to disk when store changes
  useEffect(() => {
    // Don't save during initial load
    if (!isInitializedRef.current) return

    const newSettings: PersistedSettings = {
      generalSettings,
      extendedEditorSettings,
      aiPreferences,
      workspacePreferences,
      keyboardShortcuts,
      advancedSettings,
      config,
      ollamaConfig,
      openaiConfig,
      anthropicConfig,
      customPrompts
    }

    // Check if settings actually changed (simple JSON comparison)
    const currentJson = JSON.stringify(persistedSettings)
    const newJson = JSON.stringify(newSettings)

    if (currentJson !== newJson) {
      console.log('[SettingsPersistence] Saving settings to disk')
      setPersistedSettings(newSettings)
    }
  }, [
    generalSettings,
    extendedEditorSettings,
    aiPreferences,
    workspacePreferences,
    keyboardShortcuts,
    advancedSettings,
    config,
    ollamaConfig,
    openaiConfig,
    anthropicConfig,
    customPrompts
  ])

  // This component doesn't render anything
  return null
}
