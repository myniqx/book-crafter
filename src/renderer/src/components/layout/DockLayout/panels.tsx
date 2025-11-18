import React, { useState, useEffect } from 'react'
import type { LayoutData, TabData } from 'rc-dock'
import type { PanelConfig, TabMetadata, TabEditorData, TabPanelData } from './types'
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
import { MonacoEditor } from '@renderer/components/editor/MonacoEditor'
import { useContentStore, useCoreStore } from '@renderer/store'
import { fs } from '@renderer/lib/ipc'
import { getChapterContentPath } from '@renderer/lib/books'

// Chapter Editor Panel
interface ChapterEditorPanelProps {
  bookSlug: string
  chapterSlug: string
}

const ChapterEditorPanel: React.FC<ChapterEditorPanelProps> = ({ bookSlug, chapterSlug }) => {
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const workspacePath = useCoreStore((state) => state.workspacePath)
  const book = useContentStore((state) => state.books[bookSlug])
  const chapter = book?.chapters.find((c) => c.slug === chapterSlug)
  const updateChapter = useContentStore((state) => state.updateChapter)
  const setHasUnsavedChanges = useCoreStore((state) => state.setHasUnsavedChanges)

  console.log('[ChapterEditorPanel] Rendering:', { bookSlug, chapterSlug, workspacePath, hasBook: !!book, hasChapter: !!chapter })

  // Load chapter content from disk
  useEffect(() => {
    console.log('[ChapterEditorPanel] useEffect triggered:', { workspacePath, bookSlug, chapterSlug, hasChapter: !!chapter })

    const loadContent = async () => {
      if (!workspacePath) {
        console.error('[ChapterEditorPanel] No workspace path')
        setError('No workspace selected')
        setIsLoading(false)
        return
      }

      if (!chapter) {
        console.error('[ChapterEditorPanel] Chapter not found')
        setError('Chapter not found')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const contentPath = getChapterContentPath(workspacePath, bookSlug, chapterSlug)
        console.log('[ChapterEditorPanel] Loading content from:', contentPath)
        const loadedContent = await fs.readFile(contentPath, 'utf-8')
        console.log('[ChapterEditorPanel] Content loaded, length:', loadedContent.length)
        setContent(loadedContent)
      } catch (err) {
        console.error('[ChapterEditorPanel] Failed to load chapter content:', err)
        setError(`Failed to load chapter: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setContent('') // Initialize with empty content if file doesn't exist
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [workspacePath, bookSlug, chapterSlug, chapter])

  // Save content with debounce
  const handleContentChange = (newContent: string | undefined) => {
    if (newContent === undefined) return

    setContent(newContent)
    setHasUnsavedChanges(true)

    // Update chapter content in store
    if (chapter) {
      updateChapter(bookSlug, chapterSlug, { content: newContent })
    }

    // TODO: Implement debounced auto-save
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2">
        <p className="text-slate-400">Loading chapter...</p>
        <p className="text-xs text-slate-500">Book: {bookSlug} / Chapter: {chapterSlug}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2">
        <p className="text-red-400">Error: {error}</p>
        <p className="text-xs text-slate-500">Book: {bookSlug} / Chapter: {chapterSlug}</p>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2">
        <p className="text-slate-400">Chapter not found</p>
        <p className="text-xs text-slate-500">Book: {bookSlug} / Chapter: {chapterSlug}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <MonacoEditor
        value={content}
        onChange={handleContentChange}
        language="markdown"
      />
    </div>
  )
}

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
  const selectedEntitySlug = useContentStore((state) => state.selectedEntitySlug)

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
  const selectedImageSlug = useContentStore((state) => state.selectedImageSlug)

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

/**
 * HELPER FUNCTIONS FOR TAB <-> STORE SYNC
 * ========================================
 */

/**
 * Convert TabMetadata to rc-dock TabData
 * Used when syncing FROM Store TO DockLayout
 */
export function createTabDataFromMetadata(metadata: TabMetadata): TabData {
  console.log('[createTabDataFromMetadata] Creating tab for:', metadata)

  if (metadata.type === 'editor' && metadata.data) {
    const editorData = metadata.data as TabEditorData
    console.log('[createTabDataFromMetadata] Editor tab:', editorData)

    const tabData: TabData = {
      id: metadata.id,
      title: metadata.title,
      content: <ChapterEditorPanel bookSlug={editorData.bookSlug} chapterSlug={editorData.chapterSlug} />,
      closable: metadata.closable
    }

    console.log('[createTabDataFromMetadata] Created editor TabData:', tabData)
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
  console.warn('[createTabDataFromMetadata] Unknown tab type, using fallback:', metadata)
  return {
    id: metadata.id,
    title: metadata.title,
    content: <div>Unknown tab type: {metadata.type}</div>,
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

  function collectTabs(data: LayoutData | any): void {
    if (!data) return

    // Check if this node has tabs
    if (data.tabs && Array.isArray(data.tabs)) {
      data.tabs.forEach((tab: any) => {
        // Skip welcome tab
        if (tab.id === 'editor-welcome') return

        console.log('[extractTabsFromLayout] Found tab in layout:', tab)

        // Try to reconstruct TabMetadata from tab.id
        const metadata = reconstructTabMetadata(tab)
        if (metadata) {
          console.log('[extractTabsFromLayout] Reconstructed metadata:', metadata)
          tabs.push(metadata)
        } else {
          console.warn('[extractTabsFromLayout] Failed to reconstruct metadata for tab:', tab)
        }
      })
    }

    // Recursively check children
    if (data.children && Array.isArray(data.children)) {
      data.children.forEach((child: any) => collectTabs(child))
    }

    // Check dockbox
    if (data.dockbox) {
      collectTabs(data.dockbox)
    }
  }

  collectTabs(layout)
  console.log('[extractTabsFromLayout] Total tabs extracted:', tabs.length)
  return tabs
}

/**
 * Reconstruct TabMetadata from tab ID and title
 * This is needed because rc-dock doesn't preserve our custom metadata
 */
function reconstructTabMetadata(tab: any): TabMetadata | null {
  const { id, title, closable = true } = tab

  console.log('[reconstructTabMetadata] Reconstructing from:', { id, title, closable })

  // Editor tab: format is "editor-{bookSlug}-{chapterSlug}"
  if (id.startsWith('editor-')) {
    const parts = id.split('-')
    console.log('[reconstructTabMetadata] Editor tab, parts:', parts)

    if (parts.length >= 3) {
      const bookSlug = parts[1]
      const chapterSlug = parts.slice(2).join('-') // Handle slugs with dashes

      // If title is undefined, try to get it from store
      let finalTitle = title
      if (!finalTitle || finalTitle === 'undefined') {
        console.warn('[reconstructTabMetadata] Title is undefined, fetching from store')
        const books = useContentStore.getState().books
        const book = books[bookSlug]
        const chapter = book?.chapters.find((c: any) => c.slug === chapterSlug)
        finalTitle = chapter?.title || chapterSlug
        console.log('[reconstructTabMetadata] Fetched title from store:', finalTitle)
      }

      const metadata: TabMetadata = {
        id,
        type: 'editor',
        title: finalTitle,
        closable,
        data: { bookSlug, chapterSlug } as TabEditorData
      }

      console.log('[reconstructTabMetadata] Created editor metadata:', metadata)
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

  console.warn('[reconstructTabMetadata] Could not reconstruct metadata for:', tab)
  return null
}
