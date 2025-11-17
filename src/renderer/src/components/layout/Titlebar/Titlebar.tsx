import React from 'react'
import { Minimize2, Maximize2, X, BookOpen } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useCoreStore } from '@renderer/store'
import { SettingsDialog } from '@renderer/components/settings/SettingsDialog'
import { MenuBar } from './MenuBar'

export const Titlebar: React.FC = () => {
  const workspaceConfig = useCoreStore((state) => state.workspaceConfig)
  const projectName = workspaceConfig?.projectName || 'Book Crafter'

  const handleMinimize = (): void => {
    // TODO: Implement window minimize via IPC
    console.log('Minimize window')
  }

  const handleMaximize = (): void => {
    // TODO: Implement window maximize via IPC
    console.log('Maximize window')
  }

  const handleClose = (): void => {
    // TODO: Implement window close via IPC
    console.log('Close window')
  }

  return (
    <div
      className={cn(
        'h-8 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))]',
        'flex items-center justify-between',
        'select-none'
      )}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: App icon, MenuBar, and project name */}
      <div className="flex items-center gap-2 pl-3">
        <BookOpen className="h-4 w-4 text-[hsl(var(--primary))]" />
        <MenuBar />
        <div className="h-4 w-px bg-[hsl(var(--border))]" /> {/* Separator */}
        <span className="text-sm font-medium text-[hsl(var(--foreground))]">{projectName}</span>
      </div>

      {/* Right: Settings and window controls */}
      <div
        className="flex items-center gap-1 pr-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <SettingsDialog />
        <button
          onClick={handleMinimize}
          className={cn(
            'h-6 w-6 rounded flex items-center justify-center',
            'hover:bg-[hsl(var(--accent))] transition-colors'
          )}
          title="Minimize"
        >
          <Minimize2 className="h-3 w-3" />
        </button>
        <button
          onClick={handleMaximize}
          className={cn(
            'h-6 w-6 rounded flex items-center justify-center',
            'hover:bg-[hsl(var(--accent))] transition-colors'
          )}
          title="Maximize"
        >
          <Maximize2 className="h-3 w-3" />
        </button>
        <button
          onClick={handleClose}
          className={cn(
            'h-6 w-6 rounded flex items-center justify-center',
            'hover:bg-destructive hover:text-destructive-foreground transition-colors'
          )}
          title="Close"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
