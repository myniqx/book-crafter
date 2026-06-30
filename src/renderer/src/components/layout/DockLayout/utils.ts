import React from 'react'
import type { LayoutData, TabData } from 'rc-dock'
import type { PanelConfig, TabMetadata, TabEditorData, TabPanelData } from './types'
import { AISuggestionsPanel } from '@renderer/components/ai/AISuggestionsPanel'
import { useContentStore } from '@renderer/store'
import { logger } from '@renderer/lib/logger'
import { ChapterEditorPanel } from './Panels/ChapterEditorPanel'
import { EntityDetailPanel } from './Panels/EntityDetailPanel'
import { ImageDetailPanel } from './Panels/ImageDetailPanel'
import { EditorWelcome } from './Panels/EditorWelcome'

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
      content: React.createElement(EntityDetailPanel),
      group: 'detail',
      minWidth: 300,
      closable: true
    },
    {
      id: 'image-detail',
      title: 'Image Detail',
      content: React.createElement(ImageDetailPanel),
      group: 'detail',
      minWidth: 300,
      closable: true
    },
    {
      id: 'ai-suggestions',
      title: 'AI Suggestions',
      content: React.createElement(AISuggestionsPanel),
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
              content: React.createElement(EditorWelcome),
              closable: true
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

/**
 * HELPER FUNCTIONS FOR TAB <-> STORE SYNC
 * ========================================
 */

/**
 * Convert TabMetadata to rc-dock TabData
 * Used when syncing FROM Store TO DockLayout
 */
export function createTabDataFromMetadata(metadata: TabMetadata): TabData {
  logger.debug(`Creating tab for: ${JSON.stringify(metadata)}`, 'DockLayout')

  if (metadata.type === 'editor' && metadata.data) {
    const editorData = metadata.data as TabEditorData
    logger.debug(`Editor tab: ${JSON.stringify(editorData)}`, 'DockLayout')

    const tabData: TabData = {
      id: metadata.id,
      title: metadata.title,
      content: React.createElement(ChapterEditorPanel, {
        bookSlug: editorData.bookSlug,
        chapterSlug: editorData.chapterSlug
      }),
      closable: metadata.closable
    }

    logger.debug(`Created editor TabData: ${tabData.id}`, 'DockLayout')
    return tabData
  }

  if (metadata.type === 'panel' && metadata.data) {
    const panelData = metadata.data as TabPanelData
    const panelConfig = getPanel(panelData.panelId)
    if (panelConfig) {
      return {
        id: metadata.id,
        title: metadata.title,
        content: panelConfig.content,
        closable: metadata.closable
      }
    }
  }

  // Fallback
  logger.warn(`Unknown tab type, using fallback: ${metadata.type}`, 'DockLayout')
  return {
    id: metadata.id,
    title: metadata.title,
    content: React.createElement('div', null, `Unknown tab type: ${metadata.type}`),
    closable: true
  }
}

/**
 * Extract TabMetadata from rc-dock LayoutData
 * Used when syncing FROM DockLayout TO Store
 *
 * This recursively walks the layout tree and collects all tabs
 */
export function extractTabsFromLayout(layout: LayoutData): TabMetadata[] {
  const tabs: TabMetadata[] = []

  function collectTabs(data: LayoutData | Record<string, unknown>): void {
    if (!data) return

    // Check if this node has tabs
    const dataWithTabs = data as { tabs?: unknown[] }
    if (dataWithTabs.tabs && Array.isArray(dataWithTabs.tabs)) {
      dataWithTabs.tabs.forEach((tab: unknown) => {
        const tabObj = tab as { id?: string; title?: string; closable?: boolean }
        // Skip welcome tab
        if (tabObj.id === 'editor-welcome') return

        logger.debug(`Found tab in layout: ${tabObj.id}`, 'DockLayout')

        // Try to reconstruct TabMetadata from tab.id
        const metadata = reconstructTabMetadata(tabObj)
        if (metadata) {
          logger.debug(`Reconstructed metadata: ${metadata.id}`, 'DockLayout')
          tabs.push(metadata)
        } else {
          logger.warn(`Failed to reconstruct metadata for tab: ${tabObj.id}`, 'DockLayout')
        }
      })
    }

    // Recursively check children
    const dataWithChildren = data as { children?: unknown[] }
    if (dataWithChildren.children && Array.isArray(dataWithChildren.children)) {
      dataWithChildren.children.forEach((child: unknown) =>
        collectTabs(child as Record<string, unknown>)
      )
    }

    // Check dockbox
    const dataWithDockbox = data as { dockbox?: Record<string, unknown> }
    if (dataWithDockbox.dockbox) {
      collectTabs(dataWithDockbox.dockbox)
    }
  }

  collectTabs(layout)
  logger.debug(`Total tabs extracted: ${tabs.length}`, 'DockLayout')
  return tabs
}

/**
 * Reconstruct TabMetadata from tab ID and title
 * This is needed because rc-dock doesn't preserve our custom metadata
 */
function reconstructTabMetadata(tab: {
  id?: string
  title?: string
  closable?: boolean
}): TabMetadata | null {
  const { id, title, closable = true } = tab

  if (!id) return null

  logger.debug(`Reconstructing tab from id: ${id}`, 'DockLayout')

  // Editor tab: format is "editor-{bookSlug}-{chapterSlug}"
  if (id.startsWith('editor-')) {
    const parts = id.split('-')
    logger.debug(`Editor tab parts: ${parts.join(' / ')}`, 'DockLayout')

    if (parts.length >= 3) {
      const bookSlug = parts[1]
      const chapterSlug = parts.slice(2).join('-') // Handle slugs with dashes

      // If title is undefined, try to get it from store
      let finalTitle = title
      if (!finalTitle || finalTitle === 'undefined') {
        logger.warn('Title is undefined, fetching from store', 'DockLayout')
        const books = useContentStore.getState().books
        const book = books[bookSlug]
        const chapter = book?.chapters.find(
          (c: { slug: string; title: string }) => c.slug === chapterSlug
        )
        finalTitle = chapter?.title || chapterSlug
        logger.debug(`Fetched title from store: ${finalTitle}`, 'DockLayout')
      }

      const metadata: TabMetadata = {
        id,
        type: 'editor',
        title: finalTitle,
        closable,
        data: { bookSlug, chapterSlug } as TabEditorData
      }

      logger.debug(`Created editor metadata: ${metadata.id}`, 'DockLayout')
      return metadata
    }
  }

  // Panel tab: format is panel ID (entity-detail, image-detail, etc.)
  if (id.includes('-detail') || id.includes('-suggestions')) {
    return {
      id,
      type: 'panel',
      title: title || id,
      closable,
      data: { panelId: id } as TabPanelData
    }
  }

  logger.warn(`Could not reconstruct metadata for tab: ${id}`, 'DockLayout')
  return null
}
