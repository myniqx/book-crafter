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
      className="h-8 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: App icon, MenuBar, project name */}
      <div className="flex items-center gap-2 pl-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <MenuBar />
        <div className="h-4 w-px bg-outline-variant" />
        <span className="text-xs font-medium text-on-surface-variant">{projectName}</span>
      </div>

      {/* Right: Settings and window controls */}
      <div
        className="flex items-center gap-1 pr-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <SettingsDialog />
        <button
          onClick={handleMinimize}
          className="h-6 w-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors duration-150"
          title="Minimize"
        >
          <Minimize2 className="h-3 w-3" />
        </button>
        <button
          onClick={handleMaximize}
          className="h-6 w-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors duration-150"
          title="Maximize"
        >
          <Maximize2 className="h-3 w-3" />
        </button>
        <button
          onClick={handleClose}
          className="h-6 w-6 rounded flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors duration-150"
          title="Close"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
