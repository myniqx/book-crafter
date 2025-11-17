import React from 'react'
import type { LayoutData, TabData } from 'rc-dock'
import type { PanelConfig } from './types'
import { EntityBrowser } from '@renderer/components/entities/EntityBrowser'
import { EntityCard } from '@renderer/components/entities/EntityCard'
import { BookExplorer } from '@renderer/components/books/BookExplorer'
import { MarkdownPreview } from '@renderer/components/preview/MarkdownPreview'
import { ImageGallery } from '@renderer/components/images/ImageGallery'
import { ImageCard } from '@renderer/components/images/ImageCard'
import { NotesList } from '@renderer/components/notes/NotesList'
import { SearchPanel } from '@renderer/components/search/SearchPanel'
import { AIChatPanel } from '@renderer/components/ai/AIChatPanel'
import { AISuggestionsPanel } from '@renderer/components/ai/AISuggestionsPanel'
import { useStore } from '@renderer/store'

// Placeholder panel content components
// These will be replaced with actual components later
const PlaceholderPanel: React.FC<{ title: string }> = ({ title }) => (
  <div className="h-full w-full flex items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]">
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm">This panel will be implemented soon</p>
    </div>
  </div>
)

// Entity Detail Panel (shows selected entity)
const EntityDetailPanel: React.FC = () => {
  const selectedEntitySlug = useStore((state) => state.selectedEntitySlug)

  if (!selectedEntitySlug) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Entity Selected</h3>
          <p className="text-sm">Select an entity from the Entity Browser to view details</p>
        </div>
      </div>
    )
  }

  return <EntityCard entitySlug={selectedEntitySlug} />
}

// Image Detail Panel (shows selected image)
const ImageDetailPanel: React.FC = () => {
  const selectedImageSlug = useStore((state) => state.selectedImageSlug)

  if (!selectedImageSlug) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Image Selected</h3>
          <p className="text-sm">Select an image from the Image Gallery to view details</p>
        </div>
      </div>
    )
  }

  return <ImageCard imageSlug={selectedImageSlug} variant="detail" />
}

// Panel registry
const panelRegistry: Map<string, PanelConfig> = new Map()

// Register default panels
// NOTE: Panels like file-explorer, entity-browser, notes, search, ai-chat, timeline,
// and markdown-preview are now in Sidebar. Only editor-related panels remain in DockLayout.
export function registerDefaultPanels(): void {
  const defaultPanels: PanelConfig[] = [
    {
      id: 'entity-detail',
      title: 'Entity Detail',
      content: <EntityDetailPanel />,
      group: 'detail',
      minWidth: 300,
      closable: true
    },
    {
      id: 'image-detail',
      title: 'Image Detail',
      content: <ImageDetailPanel />,
      group: 'detail',
      minWidth: 300,
      closable: true
    },
    {
      id: 'ai-suggestions',
      title: 'AI Suggestions',
      content: <AISuggestionsPanel />,
      group: 'ai',
      minWidth: 300,
      closable: true
    }
  ]

  defaultPanels.forEach((panel) => {
    panelRegistry.set(panel.id, panel)
  })
}

// Register a custom panel
export function registerPanel(config: PanelConfig): void {
  panelRegistry.set(config.id, config)
}

// Get all registered panels
export function getRegisteredPanels(): PanelConfig[] {
  if (panelRegistry.size === 0) {
    registerDefaultPanels()
  }
  return Array.from(panelRegistry.values())
}

// Get a specific panel
export function getPanel(id: string): PanelConfig | undefined {
  if (panelRegistry.size === 0) {
    registerDefaultPanels()
  }
  return panelRegistry.get(id)
}

// Welcome message for editor area
const EditorWelcome: React.FC = () => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]">
    <div className="text-center space-y-4 max-w-md">
      <h2 className="text-2xl font-semibold text-[hsl(var(--foreground))]">Welcome to Book Crafter</h2>
      <p className="text-sm">
        Open a book from the File Explorer or create a new one to start writing.
      </p>
      <div className="pt-4 text-xs space-y-1">
        <p>💡 Use <kbd className="px-2 py-1 bg-[hsl(var(--muted))] rounded">@</kbd> to reference entities</p>
        <p>💡 Toggle panels from the sidebar</p>
        <p>💡 Your work is auto-saved</p>
      </div>
    </div>
  </div>
)

// Create default layout
// NOTE: Sidebar panels (file-explorer, entity-browser, etc.) are managed separately.
// DockLayout is now focused on the main editor area.
export function createDefaultLayout(): LayoutData {
  // Ensure panels are registered
  if (panelRegistry.size === 0) {
    registerDefaultPanels()
  }

  return {
    dockbox: {
      mode: 'vertical',
      children: [
        {
          tabs: [
            {
              id: 'editor-welcome',
              title: 'Welcome',
              content: <EditorWelcome />,
              closable: false
            } as TabData
          ]
        }
      ]
    },
    floatbox: {
      mode: 'float',
      children: [] // Floating panels disabled (causes z-index issues)
    }
  }
}
