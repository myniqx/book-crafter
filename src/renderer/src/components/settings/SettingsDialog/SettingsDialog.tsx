import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@renderer/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Button } from '@renderer/components/ui/button'
import { Settings } from 'lucide-react'
import { GeneralSettingsTab } from './GeneralSettingsTab'
import { EditorSettingsTab } from './EditorSettingsTab'
import { AISettingsTab } from './AISettingsTab'
import { WorkspaceSettingsTab } from './WorkspaceSettingsTab'
import { KeyboardShortcutsTab } from './KeyboardShortcutsTab'
import { AdvancedSettingsTab } from './AdvancedSettingsTab'
import { SettingsContext, type SettingsDraft } from './SettingsContext'
import { useShortcut } from '@renderer/hooks/useKeyboard'
import { useStore } from '@renderer/store'

function buildSnapshot(store: ReturnType<typeof useStore.getState>): SettingsDraft {
  return {
    generalSettings: { ...store.generalSettings },
    extendedEditorSettings: { ...store.extendedEditorSettings },
    aiPreferences: { ...store.aiPreferences },
    workspacePreferences: { ...store.workspacePreferences },
    historySettings: { ...store.historySettings },
    backupSettings: { ...store.backupSettings },
    advancedSettings: { ...store.advancedSettings },
    activeProvider: store.activeProvider,
    providerConfigs: Object.fromEntries(
      Object.entries(store.providerConfigs).map(([k, v]) => [k, { ...v }])
    ) as SettingsDraft['providerConfigs']
  }
}

export const SettingsDialog: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general')
  const open = useStore((state) => state.settingsDialogOpen)
  const setOpen = useStore((state) => state.setSettingsDialogOpen)

  const storeState = useStore()

  const [draft, setDraft] = useState<SettingsDraft>(() => buildSnapshot(storeState))
  const [isDirty, setIsDirty] = useState(false)

  // Re-snapshot when dialog opens
  const handleOpenChange = (next: boolean): void => {
    if (next) {
      setDraft(buildSnapshot(useStore.getState()))
      setIsDirty(false)
    }
    setOpen(next)
  }

  const updateDraft = useCallback((updates: Partial<SettingsDraft>): void => {
    setDraft((prev) => ({ ...prev, ...updates }))
    setIsDirty(true)
  }, [])

  const handleSave = (): void => {
    const s = useStore.getState()
    s.updateGeneralSettings(draft.generalSettings)
    s.updateExtendedEditorSettings(draft.extendedEditorSettings)
    s.updateAIPreferences(draft.aiPreferences)
    s.updateWorkspacePreferences(draft.workspacePreferences)
    s.updateHistorySettings(draft.historySettings)
    s.updateBackupSettings(draft.backupSettings)
    s.updateAdvancedSettings(draft.advancedSettings)
    s.setActiveProvider(draft.activeProvider)
    Object.entries(draft.providerConfigs).forEach(([provider, config]) => {
      s.setProviderConfig(provider as SettingsDraft['activeProvider'], config)
    })
    setIsDirty(false)
  }

  const handleCancel = (): void => {
    setDraft(buildSnapshot(useStore.getState()))
    setIsDirty(false)
  }

  useShortcut('settings', () => setOpen(true), { allowInInput: true })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Settings (Ctrl+,)">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <SettingsContext.Provider value={{ draft, updateDraft, isDirty }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              {['general', 'editor', 'ai', 'workspace', 'keyboard', 'advanced'].map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="capitalize data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="general" className="mt-0"><GeneralSettingsTab /></TabsContent>
              <TabsContent value="editor" className="mt-0"><EditorSettingsTab /></TabsContent>
              <TabsContent value="ai" className="mt-0"><AISettingsTab /></TabsContent>
              <TabsContent value="workspace" className="mt-0"><WorkspaceSettingsTab /></TabsContent>
              <TabsContent value="keyboard" className="mt-0"><KeyboardShortcutsTab /></TabsContent>
              <TabsContent value="advanced" className="mt-0"><AdvancedSettingsTab /></TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={!isDirty}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty}>
              Save
            </Button>
          </DialogFooter>
        </SettingsContext.Provider>
      </DialogContent>
    </Dialog>
  )
}
