import React from 'react'
import { Titlebar } from '../Titlebar'
import { Sidebar } from '../Sidebar'
import { StatusBar } from '../StatusBar'
import { DockLayout } from '../DockLayout'

export const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
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
