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
  const loadAllImages = useStore((state) => state.loadAllImages)
  const loadAllNotes = useStore((state) => state.loadAllNotes)

  // Load entities, books, images, and notes when workspace is available
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

      // Load images
      loadAllImages(workspacePath).catch((error) => {
        console.error('Failed to load images:', error)
      })

      // Load notes
      loadAllNotes(workspacePath).catch((error) => {
        console.error('Failed to load notes:', error)
      })
    }
  }, [workspacePath, loadAllEntities, loadAllBooks, loadAllImages, loadAllNotes])

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
