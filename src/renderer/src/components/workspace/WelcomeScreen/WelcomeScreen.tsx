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
    <div className="h-screen w-screen flex bg-[hsl(var(--background))]">
      {/* Left: Start Panel */}
      <div className="w-[40%] border-r border-[hsl(var(--border))] overflow-y-auto">
        <StartPanel />
      </div>

      {/* Right: Recent Projects */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="border-b border-[hsl(var(--border))] p-4">
          <h2 className="text-lg font-semibold text-slate-200">Recent Projects</h2>
          <p className="text-xs text-slate-400 mt-1">
            Click on a project to open it, or create a new one
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <RecentProjectsList />
        </div>
      </div>
    </div>
  )
}
