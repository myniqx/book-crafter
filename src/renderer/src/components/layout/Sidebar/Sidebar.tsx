import React from 'react'
import {
  FileText,
  Users,
  Image as ImageIcon,
  StickyNote,
  MessageSquare,
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
  { id: 'ai-chat', icon: MessageSquare, label: 'AI Chat' },
  { id: 'timeline', icon: Clock, label: 'Timeline' },
  { id: 'markdown-preview', icon: Eye, label: 'Preview' }
]

export const Sidebar: React.FC = () => {
  const sidebarOpen = useStore((state) => state.sidebarOpen)
  const visiblePanels = useStore((state) => state.visiblePanels)
  const setSidebarOpen = useStore((state) => state.setSidebarOpen)
  const togglePanel = useStore((state) => state.togglePanel)

  const handleToggle = (): void => {
    setSidebarOpen(!sidebarOpen)
  }

  const handlePanelClick = (panelId: PanelId): void => {
    togglePanel(panelId)
  }

  return (
    <div
      className={cn(
        'h-full bg-[hsl(var(--background))] border-r border-[hsl(var(--border))]',
        'flex flex-col transition-all duration-200',
        sidebarOpen ? 'w-12' : 'w-0 overflow-hidden'
      )}
    >
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className={cn(
          'h-8 w-full flex items-center justify-center',
          'hover:bg-[hsl(var(--accent))] transition-colors',
          'border-b border-[hsl(var(--border))]'
        )}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {/* Panel buttons */}
      <div className="flex-1 flex flex-col gap-1 py-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          const isVisible = visiblePanels[item.id]

          return (
            <button
              key={item.id}
              onClick={() => handlePanelClick(item.id)}
              className={cn(
                'h-10 w-full flex items-center justify-center',
                'hover:bg-[hsl(var(--accent))] transition-colors relative',
                isVisible && 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))]'
              )}
              title={item.label}
            >
              <Icon className="h-5 w-5" />
              {isVisible && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[hsl(var(--primary))] rounded-r" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
