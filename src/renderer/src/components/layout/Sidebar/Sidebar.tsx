import React from 'react'
import {
  FileText,
  Users,
  Image as ImageIcon,
  StickyNote,
  MessageSquare,
  Search,
  Clock,
  Eye
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
  const activePanels = useStore((state) => state.activePanels)
  const togglePanel = useStore((state) => state.togglePanel)

  const handlePanelClick = (panelId: PanelId): void => {
    console.log('Sidebar: Toggle panel', panelId)
    togglePanel(panelId)
  }

  return (
    <div
      className={cn(
        'h-full bg-background border-r border-border',
        'flex flex-col',
        'w-12'
      )}
    >
      {/* Panel buttons - always visible */}
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
                'hover:bg-accent transition-colors relative',
                'text-muted-foreground hover:text-foreground',
                isActive && 'bg-accent text-primary'
              )}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
