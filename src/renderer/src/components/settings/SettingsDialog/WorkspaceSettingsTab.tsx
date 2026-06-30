import React from 'react'
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
import { Slider } from '@renderer/components/ui/slider'
import { Separator } from '@renderer/components/ui/separator'
import { Button } from '@renderer/components/ui/button'
import { FolderOpen } from 'lucide-react'

export const WorkspaceSettingsTab: React.FC = () => {
  const { draft, updateDraft } = useSettingsContext()
  const { workspacePreferences } = draft
  const update = (updates: Partial<typeof workspacePreferences>): void =>
    updateDraft({ workspacePreferences: { ...workspacePreferences, ...updates } })

  const handleSelectBackupPath = async (): Promise<void> => {
    console.log('Select backup path')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Backup</h3>
        <div className="flex items-center gap-2">
          <Checkbox id="auto-backup" checked={workspacePreferences.autoBackup} onCheckedChange={(checked) => update({ autoBackup: checked as boolean })} />
          <Label htmlFor="auto-backup" className="cursor-pointer">Enable automatic backups</Label>
        </div>
        {workspacePreferences.autoBackup && (
          <>
            <FormField htmlFor="backup-interval" label={<>Backup Interval: <span className="font-normal text-muted-foreground">{workspacePreferences.backupInterval} minutes</span></>}>
              <div className="py-1">
                <Slider id="backup-interval" min={5} max={120} step={5} value={[workspacePreferences.backupInterval]} onValueChange={([v]) => update({ backupInterval: v })} />
              </div>
            </FormField>
            <FormField htmlFor="max-backups" label={<>Maximum Backups: <span className="font-normal text-muted-foreground">{workspacePreferences.maxBackups}</span></>} hint="Older backups will be automatically deleted">
              <div className="py-1">
                <Slider id="max-backups" min={3} max={50} step={1} value={[workspacePreferences.maxBackups]} onValueChange={([v]) => update({ maxBackups: v })} />
              </div>
            </FormField>
            <FormField htmlFor="backup-path" label="Backup Path" hint="Leave empty to use default workspace .backups/ folder">
              <div className="flex gap-2">
                <Input id="backup-path" value={workspacePreferences.backupPath || 'Default (.backups/)'} readOnly placeholder="Default (.backups/)" />
                <Button variant="outline" size="sm" onClick={handleSelectBackupPath} className="shrink-0">
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </FormField>
          </>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">File Watching</h3>
        <div className="flex items-center gap-2">
          <Checkbox id="watch-external" checked={workspacePreferences.watchExternalChanges} onCheckedChange={(checked) => update({ watchExternalChanges: checked as boolean })} />
          <Label htmlFor="watch-external" className="cursor-pointer">Watch for external file changes</Label>
        </div>
        {workspacePreferences.watchExternalChanges && (
          <FormField htmlFor="reload-behavior" label="Reload Behavior" hint="How to handle files changed by external programs">
            <Select value={workspacePreferences.reloadOnExternalChange} onValueChange={(value: 'auto' | 'ask' | 'never') => update({ reloadOnExternalChange: value })}>
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

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Performance</h3>
        <div className="flex items-center gap-2">
          <Checkbox id="indexing-enabled" checked={workspacePreferences.indexingEnabled} onCheckedChange={(checked) => update({ indexingEnabled: checked as boolean })} />
          <Label htmlFor="indexing-enabled" className="cursor-pointer">Enable workspace indexing</Label>
        </div>
        <p className="text-xs text-muted-foreground">Improves search performance but uses more memory</p>
        <FormField htmlFor="max-file-size" label={<>Maximum File Size: <span className="font-normal text-muted-foreground">{workspacePreferences.maxFileSize}MB</span></>} hint="Files larger than this will not be opened in the editor">
          <div className="py-1">
            <Slider id="max-file-size" min={1} max={100} step={1} value={[workspacePreferences.maxFileSize]} onValueChange={([v]) => update({ maxFileSize: v })} />
          </div>
        </FormField>
      </div>
    </div>
  )
}
