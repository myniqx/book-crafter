import React from 'react'
import {
  FileText,
  Users,
  Image as ImageIcon,
  StickyNote,
  MessageSquare,
  Search,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useStore } from '@renderer/store'
import type { PanelId } from '@renderer/store/slices/uiSlice'

interface SidebarItem {
  id: PanelId
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const sidebarItems: SidebarItem[] = [
  { id: 'file-explorer', icon: FileText, label: 'Files' },
  { id: 'entity-browser', icon: Users, label: 'Entities' },
  { id: 'image-gallery', icon: ImageIcon, label: 'Images' },
  { id: 'notes', icon: StickyNote, label: 'Notes' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'ai-chat', icon: MessageSquare, label: 'AI Chat' },
  { id: 'timeline', icon: Clock, label: 'Timeline' },
  { id: 'markdown-preview', icon: Eye, label: 'Preview' }
]

export const Sidebar: React.FC = () => {
  const sidebarCollapsed = useStore((state) => state.sidebarCollapsed)
  const activePanels = useStore((state) => state.activePanels)
  const toggleSidebar = useStore((state) => state.toggleSidebar)
  const togglePanel = useStore((state) => state.togglePanel)

  const handleToggle = (): void => {
    toggleSidebar()
  }

  const handlePanelClick = (panelId: PanelId): void => {
    togglePanel(panelId)
  }

  return (
    <div
      className={cn(
        'h-full bg-slate-900 border-r border-slate-700',
        'flex flex-col transition-all duration-200',
        sidebarCollapsed ? 'w-12' : 'w-12'
      )}
    >
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className={cn(
          'h-10 w-full flex items-center justify-center',
          'hover:bg-slate-800 transition-colors',
          'border-b border-slate-700',
          'text-slate-400 hover:text-slate-200'
        )}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Panel buttons */}
      {!sidebarCollapsed && (
        <div className="flex-1 flex flex-col gap-1 py-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activePanels.includes(item.id)

            return (
              <button
                key={item.id}
                onClick={() => handlePanelClick(item.id)}
                className={cn(
                  'h-10 w-full flex items-center justify-center',
                  'hover:bg-slate-800 transition-colors relative',
                  'text-slate-400 hover:text-slate-200',
                  isActive && 'bg-slate-800 text-blue-500'
                )}
                title={item.label}
              >
                <Icon className="h-5 w-5" />
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
