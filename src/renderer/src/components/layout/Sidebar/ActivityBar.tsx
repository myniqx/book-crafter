import React from 'react'
import {
  FileText,
  Users,
  Image as ImageIcon,
  StickyNote,
  Search,
  MessageSquare,
  Clock,
  Eye
} from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useSidebarStore, useCoreStore, type PanelId } from '@renderer/store'

interface ActivityItem {
  id: PanelId
  icon: React.ComponentType<{ className?: string }>
  label: string
  requiresWorkspace: boolean
}

const activityItems: ActivityItem[] = [
  { id: 'file-explorer', icon: FileText, label: 'Files', requiresWorkspace: true },
  { id: 'entity-browser', icon: Users, label: 'Entities', requiresWorkspace: true },
  { id: 'image-gallery', icon: ImageIcon, label: 'Images', requiresWorkspace: true },
  { id: 'notes', icon: StickyNote, label: 'Notes', requiresWorkspace: true },
  { id: 'search', icon: Search, label: 'Search', requiresWorkspace: true },
  { id: 'ai-chat', icon: MessageSquare, label: 'AI Chat', requiresWorkspace: false },
  { id: 'timeline', icon: Clock, label: 'Timeline', requiresWorkspace: true },
  { id: 'markdown-preview', icon: Eye, label: 'Preview', requiresWorkspace: false }
]

export const ActivityBar: React.FC = () => {
  const activePanel = useSidebarStore((state) => state.activePanel)
  const panelVisible = useSidebarStore((state) => state.panelVisible)
  const togglePanel = useSidebarStore((state) => state.togglePanel)
  const workspaceConfig = useCoreStore((state) => state.workspaceConfig)

  const hasWorkspace = workspaceConfig !== null

  const handleItemClick = (panelId: PanelId, requiresWorkspace: boolean): void => {
    // If panel requires workspace and no workspace is open, do nothing
    if (requiresWorkspace && !hasWorkspace) {
      return
    }
    togglePanel(panelId)
  }

  return (
    <div className="h-full w-12 bg-slate-900 border-r border-slate-700 flex flex-col">
      {/* Activity items */}
      <div className="flex-1 flex flex-col gap-1 py-2">
        {activityItems.map((item) => {
          const Icon = item.icon
          const isActive = activePanel === item.id && panelVisible
          const isDisabled = item.requiresWorkspace && !hasWorkspace

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id, item.requiresWorkspace)}
              disabled={isDisabled}
              className={cn(
                'h-12 w-full flex items-center justify-center relative',
                'hover:bg-slate-800 transition-colors',
                'text-slate-400 hover:text-slate-200',
                isActive && 'bg-slate-800 text-blue-500',
                isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent hover:text-slate-400'
              )}
              title={isDisabled ? `${item.label} (requires workspace)` : item.label}
              aria-label={item.label}
              aria-pressed={isActive}
              aria-disabled={isDisabled}
            >
              <Icon className="h-5 w-5" />
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500 rounded-r"
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
