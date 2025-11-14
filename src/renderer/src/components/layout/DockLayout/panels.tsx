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

// Create default layout
export function createDefaultLayout(): LayoutData {
  // Ensure panels are registered
  if (panelRegistry.size === 0) {
    registerDefaultPanels()
  }

  return {
    dockbox: {
      mode: 'horizontal',
      children: [
        {
          mode: 'vertical',
          size: 250,
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
        {
          mode: 'vertical',
          children: [
            {
              tabs: [
                {
                  id: 'editor-main',
                  title: 'Editor',
                  content: <PlaceholderPanel title="Monaco Editor" />,
                  closable: false
                } as TabData
              ]
            }
          ]
        },
        {
          mode: 'vertical',
          size: 350,
          children: [
            {
              tabs: [
                {
                  id: 'markdown-preview',
                  title: 'Preview',
                  content: <PlaceholderPanel title="Markdown Preview" />,
                  closable: true
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
