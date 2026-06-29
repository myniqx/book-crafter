import React from 'react'
import { StartPanel } from './StartPanel'
import { RecentProjectsList } from './RecentProjectsList'

/**
 * WelcomeScreen - VSCode style start page
 *
 * Layout:
 * [Start Panel (40%)] | [Recent Projects (60%)]
 *
 * Features:
 * - Recent projects list with validation
 * - Create new project with folder selection
 * - Open existing workspace
 * - Help links
 */
export const WelcomeScreen: React.FC = () => {
  return (
    <div className="h-screen w-screen flex bg-surface">
      {/* Left: Start Panel */}
      <div className="w-[40%] border-r border-outline-variant overflow-y-auto">
        <StartPanel />
      </div>

      {/* Right: Recent Projects */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="border-b border-outline-variant p-4">
          <h2 className="text-sm font-semibold text-on-surface">Recent Projects</h2>
          <p className="text-xs text-on-surface-variant mt-1">Click on a project to open it, or create a new one</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <RecentProjectsList />
        </div>
      </div>
    </div>
  )
}
