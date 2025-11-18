import React from 'react'
import { useToolsStore, useCoreStore } from '@renderer/store'
import { Label } from '@renderer/components/ui/label'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Slider } from '@renderer/components/ui/slider'
import { Separator } from '@renderer/components/ui/separator'
import { Button } from '@renderer/components/ui/button'
import { AlertCircle, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@renderer/components/ui/alert'
import { settingsToast } from '@renderer/lib/toast'

export const AdvancedSettingsTab: React.FC = () => {
  const advancedSettings = useToolsStore((state) => state.advancedSettings)
  const updateAdvancedSettings = useToolsStore((state) => state.updateAdvancedSettings)
  const resetAllSettings = useToolsStore((state) => state.resetAllSettings)

  const handleClearCache = (): void => {
    if (confirm('Are you sure you want to clear all cached data? This will reload the app.')) {
      // Clear localStorage cache
      localStorage.clear()
      // Reload app
      window.location.reload()
    }
  }

  const handleResetAll = (): void => {
    if (
      confirm(
        'Are you sure you want to reset ALL settings to their defaults? This cannot be undone.'
      )
    ) {
      resetAllSettings()
      settingsToast.reset()
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Advanced settings can affect application stability and performance. Change these settings
          only if you know what you are doing.
        </AlertDescription>
      </Alert>

      {/* Developer Tools */}
      <div>
        <h3 className="text-sm font-medium mb-4">Developer Tools</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dev-tools"
              checked={advancedSettings.enableDevTools}
              onCheckedChange={(checked) =>
                updateAdvancedSettings({ enableDevTools: checked as boolean })
              }
            />
            <Label htmlFor="dev-tools" className="cursor-pointer">
              Enable developer tools (F12)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="verbose-logging"
              checked={advancedSettings.verboseLogging}
              onCheckedChange={(checked) =>
                updateAdvancedSettings({ verboseLogging: checked as boolean })
              }
            />
            <Label htmlFor="verbose-logging" className="cursor-pointer">
              Enable verbose logging
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            Logs detailed information to the console (may impact performance)
          </p>
        </div>
      </div>

      <Separator />

      {/* File System */}
      <div>
        <h3 className="text-sm font-medium mb-4">File System</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-hidden"
              checked={advancedSettings.showHiddenFiles}
              onCheckedChange={(checked) =>
                updateAdvancedSettings({ showHiddenFiles: checked as boolean })
              }
            />
            <Label htmlFor="show-hidden" className="cursor-pointer">
              Show hidden files and folders
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Performance */}
      <div>
        <h3 className="text-sm font-medium mb-4">Performance</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="gpu-acceleration"
              checked={advancedSettings.gpuAcceleration}
              onCheckedChange={(checked) =>
                updateAdvancedSettings({ gpuAcceleration: checked as boolean })
              }
            />
            <Label htmlFor="gpu-acceleration" className="cursor-pointer">
              Enable GPU acceleration
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            Requires app restart. May cause issues on some systems.
          </p>

          <div className="space-y-2">
            <Label htmlFor="memory-limit">
              Memory Limit:{' '}
              <span className="text-muted-foreground">
                {advancedSettings.maxMemoryUsage}MB
              </span>
            </Label>
            <Slider
              id="memory-limit"
              min={256}
              max={4096}
              step={256}
              value={[advancedSettings.maxMemoryUsage]}
              onValueChange={([value]) => updateAdvancedSettings({ maxMemoryUsage: value })}
            />
            <p className="text-xs text-muted-foreground">
              Maximum memory usage for the application (requires restart)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cache-size">
              Cache Size:{' '}
              <span className="text-muted-foreground">
                {advancedSettings.cacheSize}MB
              </span>
            </Label>
            <Slider
              id="cache-size"
              min={50}
              max={1024}
              step={50}
              value={[advancedSettings.cacheSize]}
              onValueChange={([value]) => updateAdvancedSettings({ cacheSize: value })}
            />
            <p className="text-xs text-muted-foreground">
              Maximum disk space for cached data
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Experimental Features */}
      <div>
        <h3 className="text-sm font-medium mb-4">Experimental Features</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="experimental"
              checked={advancedSettings.experimentalFeatures}
              onCheckedChange={(checked) =>
                updateAdvancedSettings({ experimentalFeatures: checked as boolean })
              }
            />
            <Label htmlFor="experimental" className="cursor-pointer">
              Enable experimental features
            </Label>
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            Enables beta features that may be unstable
          </p>
        </div>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div>
        <h3 className="text-sm font-medium mb-4 text-red-400">Danger Zone</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-red-900/50 bg-red-950/20">
            <div>
              <p className="text-sm font-medium">Clear Cache</p>
              <p className="text-xs text-muted-foreground">
                Remove all cached data and reload the application
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleClearCache}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-red-900/50 bg-red-950/20">
            <div>
              <p className="text-sm font-medium">Reset All Settings</p>
              <p className="text-xs text-muted-foreground">
                Reset all settings to their default values
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleResetAll}>
              Reset All
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
