import React, { useEffect } from 'react'
import { Titlebar } from '../Titlebar'
import { Sidebar } from '../Sidebar'
import { StatusBar } from '../StatusBar'
import { DockLayout } from '../DockLayout'
import { useStore } from '@renderer/store'

export const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const workspacePath = useStore((state) => state.workspacePath)
  const loadAllEntities = useStore((state) => state.loadAllEntities)

  // Load entities when workspace is available
  useEffect(() => {
    if (workspacePath) {
      loadAllEntities(workspacePath).catch((error) => {
        console.error('Failed to load entities:', error)
      })
    }
  }, [workspacePath, loadAllEntities])

  return (
    <div className="h-screen w-screen flex flex-col bg-[hsl(var(--background))]">
      {/* Titlebar */}
      <Titlebar />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Dock layout area */}
        <div className="flex-1 relative">
          <DockLayout>{children}</DockLayout>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  )
}
