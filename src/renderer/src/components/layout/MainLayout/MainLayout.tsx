import React, { useEffect } from 'react'
import { Titlebar } from '../Titlebar'
import { Sidebar } from '../Sidebar'
import { StatusBar } from '../StatusBar'
import { DockLayout } from '../DockLayout'
import { useStore } from '@renderer/store'

export const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const workspacePath = useStore((state) => state.workspacePath)
  const loadAllEntities = useStore((state) => state.loadAllEntities)
  const loadAllBooks = useStore((state) => state.loadAllBooks)

  // Load entities and books when workspace is available
  useEffect(() => {
    if (workspacePath) {
      // Load entities
      loadAllEntities(workspacePath).catch((error) => {
        console.error('Failed to load entities:', error)
      })

      // Load books
      loadAllBooks(workspacePath).catch((error) => {
        console.error('Failed to load books:', error)
      })
    }
  }, [workspacePath, loadAllEntities, loadAllBooks])

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
