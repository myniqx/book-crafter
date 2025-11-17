import React from 'react'
import { useSidebarStore, useCoreStore, type PanelId } from '@renderer/store'
import { ActivityBar } from './ActivityBar'
import { SidebarPanel } from './SidebarPanel'
import {
  FileExplorerPanel,
  EntityBrowserPanel,
  ImageGalleryPanel,
  NotesPanel,
  SearchPanel,
  AIChatPanel,
  TimelinePanel,
  MarkdownPreviewPanel
} from './panels'

interface PanelConfig {
  id: PanelId
  title: string
  component: React.ComponentType
  requiresWorkspace: boolean
}

const panelConfigs: PanelConfig[] = [
  { id: 'file-explorer', title: 'Files', component: FileExplorerPanel, requiresWorkspace: true },
  { id: 'entity-browser', title: 'Entities', component: EntityBrowserPanel, requiresWorkspace: true },
  { id: 'image-gallery', title: 'Images', component: ImageGalleryPanel, requiresWorkspace: true },
  { id: 'notes', title: 'Notes', component: NotesPanel, requiresWorkspace: true },
  { id: 'search', title: 'Search', component: SearchPanel, requiresWorkspace: true },
  { id: 'ai-chat', title: 'AI Chat', component: AIChatPanel, requiresWorkspace: false },
  { id: 'timeline', title: 'Timeline', component: TimelinePanel, requiresWorkspace: true },
  { id: 'markdown-preview', title: 'Preview', component: MarkdownPreviewPanel, requiresWorkspace: false }
]

export const Sidebar: React.FC = () => {
  const activePanel = useSidebarStore((state) => state.activePanel)
  const panelVisible = useSidebarStore((state) => state.panelVisible)
  const closePanel = useSidebarStore((state) => state.closePanel)
  const workspaceConfig = useCoreStore((state) => state.workspaceConfig)

  const hasWorkspace = workspaceConfig !== null

  // Find active panel config
  const activePanelConfig = panelConfigs.find((config) => config.id === activePanel)

  // Close workspace-dependent panels when workspace is closed
  React.useEffect(() => {
    if (!hasWorkspace && activePanelConfig?.requiresWorkspace) {
      closePanel()
    }
  }, [hasWorkspace, activePanelConfig, closePanel])

  // Render active panel component
  const PanelComponent = activePanelConfig?.component

  return (
    <div className="h-full flex">
      {/* Activity Bar (Icon Bar) - Always visible */}
      <ActivityBar />

      {/* Sidebar Panel (Content Area) - Conditionally visible */}
      {panelVisible && activePanelConfig && PanelComponent && (
        <SidebarPanel title={activePanelConfig.title}>
          <PanelComponent />
        </SidebarPanel>
      )}
    </div>
  )
}

