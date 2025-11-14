import React from 'react'
import { Minimize2, Maximize2, X, BookOpen } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useStore } from '@renderer/store'

export const Titlebar: React.FC = () => {
  const workspaceConfig = useStore((state) => state.workspaceConfig)
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
        'flex items-center justify-between px-3',
        'select-none'
      )}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: App icon and project name */}
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-[hsl(var(--primary))]" />
        <span className="text-sm font-medium text-[hsl(var(--foreground))]">{projectName}</span>
      </div>

      {/* Right: Window controls */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
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
