import React from 'react'
import type { LayoutData, TabData } from 'rc-dock'
import type { PanelConfig } from './types'

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

// Panel registry
const panelRegistry: Map<string, PanelConfig> = new Map()

// Register default panels
export function registerDefaultPanels(): void {
  const defaultPanels: PanelConfig[] = [
    {
      id: 'file-explorer',
      title: 'Files',
      content: <PlaceholderPanel title="File Explorer" />,
      group: 'explorer',
      minWidth: 200,
      closable: false
    },
    {
      id: 'entity-browser',
      title: 'Entities',
      content: <PlaceholderPanel title="Entity Browser" />,
      group: 'explorer',
      minWidth: 200,
      closable: true
    },
    {
      id: 'markdown-preview',
      title: 'Preview',
      content: <PlaceholderPanel title="Markdown Preview" />,
      group: 'preview',
      minWidth: 300,
      closable: true
    },
    {
      id: 'image-gallery',
      title: 'Images',
      content: <PlaceholderPanel title="Image Gallery" />,
      group: 'media',
      minWidth: 200,
      closable: true
    },
    {
      id: 'notes',
      title: 'Notes',
      content: <PlaceholderPanel title="Notes & Checklist" />,
      group: 'media',
      minWidth: 200,
      closable: true
    },
    {
      id: 'ai-chat',
      title: 'AI Chat',
      content: <PlaceholderPanel title="AI Assistant" />,
      group: 'ai',
      minWidth: 300,
      closable: true
    },
    {
      id: 'timeline',
      title: 'Timeline',
      content: <PlaceholderPanel title="Activity Timeline" />,
      group: 'tools',
      minWidth: 200,
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

// Create default layout (VSCode-style)
export function createDefaultLayout(): LayoutData {
  // Ensure panels are registered
  if (panelRegistry.size === 0) {
    registerDefaultPanels()
  }

  return {
    dockbox: {
      mode: 'horizontal',
      children: [
        // Left panel: Files (collapsible, starts open)
        {
          mode: 'vertical',
          size: 280,
          children: [
            {
              tabs: [
                {
                  id: 'file-explorer',
                  title: 'Files',
                  content: <PlaceholderPanel title="File Explorer" />,
                  closable: false
                } as TabData
              ]
            }
          ]
        },
        // Center: Editor area (main, wide)
        {
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
        }
      ]
    },
    floatbox: {
      mode: 'float',
      children: []
    }
  }
}
