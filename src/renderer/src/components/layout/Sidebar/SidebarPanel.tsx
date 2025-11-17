import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useSidebarStore } from '@renderer/store'
import { ResizeHandle } from './ResizeHandle'

interface SidebarPanelProps {
  title: string
  children: React.ReactNode
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({ title, children }) => {
  const panelVisible = useSidebarStore((state) => state.panelVisible)
  const sidebarWidth = useSidebarStore((state) => state.sidebarWidth)
  const closePanel = useSidebarStore((state) => state.closePanel)

  if (!panelVisible) {
    return null
  }

  return (
    <div
      data-sidebar-panel
      className={cn(
        'h-full bg-slate-850 border-r border-slate-700',
        'flex flex-col relative',
        'transition-all duration-200 ease-out'
      )}
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Panel Header */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-slate-700 flex-shrink-0">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">{title}</h2>
        <button
          onClick={closePanel}
          className={cn(
            'h-6 w-6 flex items-center justify-center rounded',
            'hover:bg-slate-700 transition-colors',
            'text-slate-400 hover:text-slate-200'
          )}
          title="Close panel"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Resize Handle */}
      <ResizeHandle />
    </div>
  )
}
