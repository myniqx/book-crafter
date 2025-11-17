import React, { useState, useEffect } from 'react'
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
import { MonacoEditor } from '@renderer/components/editor/MonacoEditor'
import { useStore, useContentStore } from '@renderer/store'
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
  const [isSaving, setIsSaving] = useState(false)

  const workspacePath = useStore((state) => state.workspacePath)
  const book = useContentStore((state) => state.books[bookSlug])
  const chapter = book?.chapters.find((c) => c.slug === chapterSlug)
  const updateChapter = useContentStore((state) => state.updateChapter)
  const setHasUnsavedChanges = useStore((state) => state.setHasUnsavedChanges)

  // Load chapter content from disk
  useEffect(() => {
    const loadContent = async () => {
      if (!workspacePath || !chapter) return

      try {
        setIsLoading(true)
        const contentPath = getChapterContentPath(workspacePath, bookSlug, chapterSlug)
        const loadedContent = await fs.readFile(contentPath, 'utf-8')
        setContent(loadedContent)
      } catch (error) {
        console.error('Failed to load chapter content:', error)
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
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-slate-400">Loading chapter...</p>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-slate-400">Chapter not found</p>
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

// Create editor tabs from store
export function createEditorTabsFromStore(
  openEditorTabs: Array<{ bookSlug: string; chapterSlug: string }>,
  books: Record<string, { title: string; chapters: Array<{ slug: string; title: string }> }>
): TabData[] {
  return openEditorTabs.map(({ bookSlug, chapterSlug }) => {
    const book = books[bookSlug]
    const chapter = book?.chapters.find((c) => c.slug === chapterSlug)

    return {
      id: `editor-${bookSlug}-${chapterSlug}`,
      title: chapter?.title || chapterSlug,
      content: <ChapterEditorPanel bookSlug={bookSlug} chapterSlug={chapterSlug} />,
      closable: true
    }
  })
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
