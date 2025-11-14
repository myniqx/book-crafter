import React, { useRef, useEffect } from 'react'
import { DockLayout as RcDockLayout } from 'rc-dock'
import 'rc-dock/dist/rc-dock.css'
import type { LayoutData, TabData } from 'rc-dock'
import { cn } from '@renderer/lib/utils'
import type { DockLayoutProps } from './types'
import { createDefaultLayout, getRegisteredPanels } from './panels'

export const DockLayout: React.FC<DockLayoutProps> = ({ children }) => {
  const dockRef = useRef<RcDockLayout>(null)

  // Initialize with default layout
  const defaultLayout = createDefaultLayout()

  useEffect(() => {
    // Setup panel groups
    if (dockRef.current) {
      const dock = dockRef.current

      // Register all panels
      const panels = getRegisteredPanels()
      panels.forEach((panelConfig) => {
        dock.updateTab(panelConfig.id, panelConfig as TabData, false)
      })
    }
  }, [])

  // Load layout from localStorage
  const loadLayout = (): LayoutData | undefined => {
    try {
      const saved = localStorage.getItem('book-crafter-layout')
      if (saved) {
        return JSON.parse(saved) as LayoutData
      }
    } catch (error) {
      console.error('Failed to load layout:', error)
    }
    return undefined
  }

  // Save layout to localStorage
  const saveLayout = (layout: LayoutData): void => {
    try {
      localStorage.setItem('book-crafter-layout', JSON.stringify(layout))
    } catch (error) {
      console.error('Failed to save layout:', error)
    }
  }

  const handleLayoutChange = (newLayout: LayoutData): void => {
    saveLayout(newLayout)
  }

  return (
    <div className={cn('h-full w-full', 'dock-layout-container')}>
      <RcDockLayout
        ref={dockRef}
        defaultLayout={loadLayout() || defaultLayout}
        onLayoutChange={handleLayoutChange}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0
        }}
      />
      {children}
    </div>
  )
}
