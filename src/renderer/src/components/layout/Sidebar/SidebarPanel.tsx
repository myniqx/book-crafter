import { cn } from '@renderer/lib/utils'
import { useSidebarStore } from '@renderer/store'
import React from 'react'
import { ResizeHandle } from './ResizeHandle'

interface SidebarPanelProps {
  title: string
  children: React.ReactNode
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({ children }) => {
  const panelVisible = useSidebarStore((state) => state.panelVisible)
  const sidebarWidth = useSidebarStore((state) => state.sidebarWidth)

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
      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Resize Handle */}
      <ResizeHandle />
    </div>
  )
}
