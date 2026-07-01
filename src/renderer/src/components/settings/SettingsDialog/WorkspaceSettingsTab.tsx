import React, { useState } from 'react'
import { logger } from '@renderer/lib/logger'
import { useSettingsContext } from './SettingsContext'
import { FormField } from '@renderer/components/ui/field'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Label } from '@renderer/components/ui/label'
import { Separator } from '@renderer/components/ui/separator'
import { Button } from '@renderer/components/ui/button'
import { Slider } from '@renderer/components/ui/slider'
import { FolderOpen } from 'lucide-react'
import { useStore } from '@renderer/store'
import ipcClient from '@renderer/lib/ipc'
import { createWorkspaceBackup } from '@renderer/lib/backup'

export const WorkspaceSettingsTab: React.FC = () => {
  const { draft, updateDraft } = useSettingsContext()
  const { workspacePreferences, historySettings, backupSettings } = draft
  const workspacePath = useStore((state) => state.workspacePath)
  const [backingUp, setBackingUp] = useState(false)
  const [lastBackupPath, setLastBackupPath] = useState<string | null>(null)

  const updateWorkspace = (updates: Partial<typeof workspacePreferences>): void =>
    updateDraft({ workspacePreferences: { ...workspacePreferences, ...updates } })

  const updateHistory = (updates: Partial<typeof historySettings>): void =>
    updateDraft({ historySettings: { ...historySettings, ...updates } })

  const updateBackup = (updates: Partial<typeof backupSettings>): void =>
    updateDraft({ backupSettings: { ...backupSettings, ...updates } })

  const handleSelectBackupPath = async (): Promise<void> => {
    const result = await ipcClient.dialog.openDirectory({ title: 'Select Backup Folder' })
    if (!result.canceled && result.filePath) {
      updateBackup({ backupPath: result.filePath })
    }
  }

  const handleCreateBackupNow = async (): Promise<void> => {
    if (!workspacePath) {
      logger.warn('Cannot create backup: no workspace is open', 'WorkspaceSettingsTab')
      return
    }
    setBackingUp(true)
    setLastBackupPath(null)
    try {
      const dest = await createWorkspaceBackup(workspacePath, {
        maxBackups: backupSettings.maxBackups,
        backupPath: backupSettings.backupPath
      })
      setLastBackupPath(dest)
    } catch (error) {
      logger.error('Manual backup failed', 'WorkspaceSettingsTab', error)
    } finally {
      setBackingUp(false)
    }
  }

  return (
    <div className="space-y-6">

      <div className="space-y-4">
        <h3 className="text-sm font-medium">History</h3>
        <p className="text-xs text-muted-foreground">
          Saves snapshots of chapter and entity content on each save, enabling time-travel to past versions.
        </p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="history-enabled"
            checked={historySettings.enabled}
            onCheckedChange={(checked) => updateHistory({ enabled: checked as boolean })}
          />
          <Label htmlFor="history-enabled" className="cursor-pointer">Enable content history</Label>
        </div>
        {historySettings.enabled && (
          <>
            <FormField
              htmlFor="max-history"
              label={<>Max Snapshots per File: <span className="font-normal text-muted-foreground">{historySettings.maxHistoryPerFile}</span></>}
              hint="Oldest snapshots are deleted when the limit is reached"
            >
              <div className="py-1">
                <Slider
                  id="max-history"
                  min={3}
                  max={50}
                  step={1}
                  value={[historySettings.maxHistoryPerFile]}
                  onValueChange={([v]) => updateHistory({ maxHistoryPerFile: v })}
                />
              </div>
            </FormField>
            <FormField
              htmlFor="diff-threshold"
              label={<>Min Change to Snapshot: <span className="font-normal text-muted-foreground">{historySettings.diffThreshold} chars</span></>}
              hint="Saves with fewer changes than this threshold are skipped"
            >
              <div className="py-1">
                <Slider
                  id="diff-threshold"
                  min={10}
                  max={500}
                  step={10}
                  value={[historySettings.diffThreshold]}
                  onValueChange={([v]) => updateHistory({ diffThreshold: v })}
                />
              </div>
            </FormField>
          </>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Backup</h3>
        <p className="text-xs text-muted-foreground">
          Creates a ZIP archive of the workspace before deleting books, chapters, or entities.
        </p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="backup-on-delete"
            checked={backupSettings.backupOnDelete}
            onCheckedChange={(checked) => updateBackup({ backupOnDelete: checked as boolean })}
          />
          <Label htmlFor="backup-on-delete" className="cursor-pointer">Auto-backup before deletion</Label>
        </div>
        <FormField
          htmlFor="max-backups"
          label={<>Maximum Backups: <span className="font-normal text-muted-foreground">{backupSettings.maxBackups}</span></>}
          hint="Older backups are automatically deleted when the limit is reached"
        >
          <div className="py-1">
            <Slider
              id="max-backups"
              min={1}
              max={20}
              step={1}
              value={[backupSettings.maxBackups]}
              onValueChange={([v]) => updateBackup({ maxBackups: v })}
            />
          </div>
        </FormField>
        <FormField
          htmlFor="backup-path"
          label="Backup Path"
          hint="Leave empty to use the default workspace .backups/ folder"
        >
          <div className="flex gap-2">
            <Input
              id="backup-path"
              value={backupSettings.backupPath || ''}
              readOnly
              placeholder="Default (.backups/)"
            />
            <Button variant="outline" size="sm" onClick={handleSelectBackupPath} className="shrink-0">
              <FolderOpen className="h-4 w-4" />
            </Button>
          </div>
        </FormField>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleCreateBackupNow} disabled={backingUp} className="shrink-0">
            {backingUp ? 'Creating Backup…' : 'Create Backup Now'}
          </Button>
          {lastBackupPath && (
            <span className="text-xs text-muted-foreground truncate min-w-0" title={lastBackupPath}>
              Backed up: {lastBackupPath}
            </span>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">File Watching</h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="watch-external"
            checked={workspacePreferences.watchExternalChanges}
            onCheckedChange={(checked) => updateWorkspace({ watchExternalChanges: checked as boolean })}
          />
          <Label htmlFor="watch-external" className="cursor-pointer">Watch for external file changes</Label>
        </div>
        {workspacePreferences.watchExternalChanges && (
          <FormField htmlFor="reload-behavior" label="Reload Behavior" hint="How to handle files changed by external programs">
            <Select
              value={workspacePreferences.reloadOnExternalChange}
              onValueChange={(value: 'auto' | 'ask' | 'never') => updateWorkspace({ reloadOnExternalChange: value })}
            >
              <SelectTrigger id="reload-behavior"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto Reload</SelectItem>
                <SelectItem value="ask">Ask Before Reload</SelectItem>
                <SelectItem value="never">Never Reload</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        )}
      </div>

    </div>
  )
}
