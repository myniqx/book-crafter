import React from 'react'
import { useToolsStore } from '@renderer/store'
import { useSettingsContext } from './SettingsContext'
import { FormField } from '@renderer/components/ui/field'
import { Label } from '@renderer/components/ui/label'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Slider } from '@renderer/components/ui/slider'
import { Separator } from '@renderer/components/ui/separator'
import { Button } from '@renderer/components/ui/button'
import { AlertCircle, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@renderer/components/ui/alert'
import { settingsToast } from '@renderer/lib/toast'

export const AdvancedSettingsTab: React.FC = () => {
  const { draft, updateDraft } = useSettingsContext()
  const { advancedSettings } = draft
  const update = (updates: Partial<typeof advancedSettings>): void =>
    updateDraft({ advancedSettings: { ...advancedSettings, ...updates } })

  const resetAllSettings = useToolsStore((state) => state.resetAllSettings)

  const handleClearCache = (): void => {
    if (confirm('Are you sure you want to clear all cached data? This will reload the app.')) {
      localStorage.clear()
      window.location.reload()
    }
  }

  const handleResetAll = (): void => {
    if (confirm('Are you sure you want to reset ALL settings to their defaults? This cannot be undone.')) {
      resetAllSettings()
      settingsToast.reset()
    }
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Advanced settings can affect application stability and performance. Change these settings only if you know what you are doing.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Developer Tools</h3>
        <div className="flex items-center gap-2">
          <Checkbox id="dev-tools" checked={advancedSettings.enableDevTools} onCheckedChange={(checked) => update({ enableDevTools: checked as boolean })} />
          <Label htmlFor="dev-tools" className="cursor-pointer">Enable developer tools (F12)</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="verbose-logging" checked={advancedSettings.verboseLogging} onCheckedChange={(checked) => update({ verboseLogging: checked as boolean })} />
          <Label htmlFor="verbose-logging" className="cursor-pointer">Enable verbose logging</Label>
        </div>
        <p className="text-xs text-muted-foreground ml-6">Logs detailed information to the console (may impact performance)</p>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">File System</h3>
        <div className="flex items-center gap-2">
          <Checkbox id="show-hidden" checked={advancedSettings.showHiddenFiles} onCheckedChange={(checked) => update({ showHiddenFiles: checked as boolean })} />
          <Label htmlFor="show-hidden" className="cursor-pointer">Show hidden files and folders</Label>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Performance</h3>
        <div className="flex items-center gap-2">
          <Checkbox id="gpu-acceleration" checked={advancedSettings.gpuAcceleration} onCheckedChange={(checked) => update({ gpuAcceleration: checked as boolean })} />
          <Label htmlFor="gpu-acceleration" className="cursor-pointer">Enable GPU acceleration</Label>
        </div>
        <p className="text-xs text-muted-foreground ml-6">Requires app restart. May cause issues on some systems.</p>
        <FormField htmlFor="memory-limit" label={<>Memory Limit: <span className="font-normal text-muted-foreground">{advancedSettings.maxMemoryUsage}MB</span></>} hint="Maximum memory usage for the application (requires restart)">
          <div className="py-1">
            <Slider id="memory-limit" min={256} max={4096} step={256} value={[advancedSettings.maxMemoryUsage]} onValueChange={([v]) => update({ maxMemoryUsage: v })} />
          </div>
        </FormField>
        <FormField htmlFor="cache-size" label={<>Cache Size: <span className="font-normal text-muted-foreground">{advancedSettings.cacheSize}MB</span></>} hint="Maximum disk space for cached data">
          <div className="py-1">
            <Slider id="cache-size" min={50} max={1024} step={50} value={[advancedSettings.cacheSize]} onValueChange={([v]) => update({ cacheSize: v })} />
          </div>
        </FormField>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Experimental Features</h3>
        <div className="flex items-center gap-2">
          <Checkbox id="experimental" checked={advancedSettings.experimentalFeatures} onCheckedChange={(checked) => update({ experimentalFeatures: checked as boolean })} />
          <Label htmlFor="experimental" className="cursor-pointer">Enable experimental features</Label>
        </div>
        <p className="text-xs text-muted-foreground ml-6">Enables beta features that may be unstable</p>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
        <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/50 bg-destructive/5">
          <div>
            <p className="text-sm font-medium">Clear Cache</p>
            <p className="text-xs text-muted-foreground">Remove all cached data and reload the application</p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleClearCache}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/50 bg-destructive/5">
          <div>
            <p className="text-sm font-medium">Reset All Settings</p>
            <p className="text-xs text-muted-foreground">Reset all settings to their default values</p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleResetAll}>Reset All</Button>
        </div>
      </div>
    </div>
  )
}
