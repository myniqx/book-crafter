import React from 'react'
import { useToolsStore, useCoreStore } from '@renderer/store'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Slider } from '@renderer/components/ui/slider'
import { Separator } from '@renderer/components/ui/separator'
import { Button } from '@renderer/components/ui/button'
import { FolderOpen } from 'lucide-react'

export const WorkspaceSettingsTab: React.FC = () => {
  const workspacePreferences = useToolsStore((state) => state.workspacePreferences)
  const updateWorkspacePreferences = useToolsStore((state) => state.updateWorkspacePreferences)

  const handleSelectBackupPath = async (): Promise<void> => {
    // This would call an IPC function to open directory picker
    // For now, we'll just use a placeholder
    console.log('Select backup path')
  }

  return (
    <div className="space-y-6">
      {/* Backup Settings */}
      <div>
        <h3 className="text-sm font-medium mb-4">Backup</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-backup"
              checked={workspacePreferences.autoBackup}
              onCheckedChange={(checked) =>
                updateWorkspacePreferences({ autoBackup: checked as boolean })
              }
            />
            <Label htmlFor="auto-backup" className="cursor-pointer">
              Enable automatic backups
            </Label>
          </div>

          {workspacePreferences.autoBackup && (
            <>
              <div className="space-y-2">
                <Label htmlFor="backup-interval">
                  Backup Interval:{' '}
                  <span className="text-muted-foreground">
                    {workspacePreferences.backupInterval} minutes
                  </span>
                </Label>
                <Slider
                  id="backup-interval"
                  min={5}
                  max={120}
                  step={5}
                  value={[workspacePreferences.backupInterval]}
                  onValueChange={([value]) =>
                    updateWorkspacePreferences({ backupInterval: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-backups">
                  Maximum Backups:{' '}
                  <span className="text-muted-foreground">{workspacePreferences.maxBackups}</span>
                </Label>
                <Slider
                  id="max-backups"
                  min={3}
                  max={50}
                  step={1}
                  value={[workspacePreferences.maxBackups]}
                  onValueChange={([value]) => updateWorkspacePreferences({ maxBackups: value })}
                />
                <p className="text-xs text-muted-foreground">
                  Older backups will be automatically deleted
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-path">Backup Path</Label>
                <div className="flex gap-2">
                  <Input
                    id="backup-path"
                    type="text"
                    value={workspacePreferences.backupPath || 'Default (.backups/)'}
                    readOnly
                    placeholder="Default (.backups/)"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectBackupPath}
                    className="shrink-0"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty to use default workspace .backups/ folder
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <Separator />

      {/* File Watcher */}
      <div>
        <h3 className="text-sm font-medium mb-4">File Watching</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="watch-external"
              checked={workspacePreferences.watchExternalChanges}
              onCheckedChange={(checked) =>
                updateWorkspacePreferences({ watchExternalChanges: checked as boolean })
              }
            />
            <Label htmlFor="watch-external" className="cursor-pointer">
              Watch for external file changes
            </Label>
          </div>

          {workspacePreferences.watchExternalChanges && (
            <div className="space-y-2">
              <Label htmlFor="reload-behavior">Reload Behavior</Label>
              <Select
                value={workspacePreferences.reloadOnExternalChange}
                onValueChange={(value: 'auto' | 'ask' | 'never') =>
                  updateWorkspacePreferences({ reloadOnExternalChange: value })
                }
              >
                <SelectTrigger id="reload-behavior">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Reload</SelectItem>
                  <SelectItem value="ask">Ask Before Reload</SelectItem>
                  <SelectItem value="never">Never Reload</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How to handle files changed by external programs
              </p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Performance */}
      <div>
        <h3 className="text-sm font-medium mb-4">Performance</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="indexing-enabled"
              checked={workspacePreferences.indexingEnabled}
              onCheckedChange={(checked) =>
                updateWorkspacePreferences({ indexingEnabled: checked as boolean })
              }
            />
            <Label htmlFor="indexing-enabled" className="cursor-pointer">
              Enable workspace indexing
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Improves search performance but uses more memory
          </p>

          <div className="space-y-2">
            <Label htmlFor="max-file-size">
              Maximum File Size:{' '}
              <span className="text-muted-foreground">
                {workspacePreferences.maxFileSize}MB
              </span>
            </Label>
            <Slider
              id="max-file-size"
              min={1}
              max={100}
              step={1}
              value={[workspacePreferences.maxFileSize]}
              onValueChange={([value]) =>
                updateWorkspacePreferences({ maxFileSize: value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Files larger than this will not be opened in the editor
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
