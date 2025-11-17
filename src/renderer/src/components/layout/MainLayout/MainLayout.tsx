import React, { useEffect, useState } from 'react'
import { Titlebar } from '../Titlebar'
import { Sidebar } from '../Sidebar'
import { StatusBar } from '../StatusBar'
import { DockLayout } from '../DockLayout'
import { IntegrityCheckDialog, type IntegrityIssue } from '@renderer/components/workspace/IntegrityCheckDialog'
import { useStore } from '@renderer/store'
import { useKeyboard } from '@renderer/hooks/useKeyboard'
import { toast } from '@renderer/lib/toast'
import { checkWorkspaceIntegrity, repairWorkspaceStructure } from '@renderer/lib/directory'

export const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [integrityDialogOpen, setIntegrityDialogOpen] = useState(false)
  const [integrityIssues, setIntegrityIssues] = useState<IntegrityIssue[]>([])

  const workspacePath = useStore((state) => state.workspacePath)
  const loadAllEntities = useStore((state) => state.loadAllEntities)
  const loadAllBooks = useStore((state) => state.loadAllBooks)
  const loadAllImages = useStore((state) => state.loadAllImages)
  const loadAllNotes = useStore((state) => state.loadAllNotes)
  const toggleSidebar = useStore((state) => state.toggleSidebar)
  const openEditorTabs = useStore((state) => state.openEditorTabs)
  const activeTabIndex = useStore((state) => state.activeTabIndex)
  const books = useStore((state) => state.books)

  // Load entities, books, images, and notes when workspace is available
  useEffect(() => {
    if (workspacePath) {
      // Check workspace integrity first
      const performIntegrityCheck = async () => {
        try {
          const result = await checkWorkspaceIntegrity(workspacePath)

          if (!result.valid && result.missing.length > 0) {
            // Convert missing items to IntegrityIssue format
            const issues: IntegrityIssue[] = result.missing.map((item) => ({
              type: 'missing_folder',
              path: item,
              description: `Missing folder: ${item.split('/').pop()}`
            }))

            setIntegrityIssues(issues)
            setIntegrityDialogOpen(true)
          }
        } catch (error) {
          console.error('Integrity check failed:', error)
        }
      }

      performIntegrityCheck()

      // Load entities
      loadAllEntities(workspacePath).catch((error) => {
        console.error('Failed to load entities:', error)
      })

      // Load books
      loadAllBooks(workspacePath).catch((error) => {
        console.error('Failed to load books:', error)
      })

      // Load images
      loadAllImages(workspacePath).catch((error) => {
        console.error('Failed to load images:', error)
      })

      // Load notes
      loadAllNotes(workspacePath).catch((error) => {
        console.error('Failed to load notes:', error)
      })
    }
  }, [workspacePath, loadAllEntities, loadAllBooks, loadAllImages, loadAllNotes])

  // Save current file
  const handleSave = (): void => {
    if (activeTabIndex >= 0 && openEditorTabs[activeTabIndex]) {
      const tab = openEditorTabs[activeTabIndex]
      const book = books[tab.bookSlug]
      if (book) {
        const chapter = book.chapters.find((c) => c.slug === tab.chapterSlug)
        if (chapter) {
          // TODO: Implement actual save via IPC
          toast.success('File saved', `${chapter.title} has been saved`)
          console.log('Save file:', tab.bookSlug, tab.chapterSlug)
        }
      }
    } else {
      toast.info('No file to save', 'Open a file first')
    }
  }

  // Save all files
  const handleSaveAll = (): void => {
    if (openEditorTabs.length > 0) {
      // TODO: Implement actual save all via IPC
      toast.success('All files saved', `${openEditorTabs.length} file(s) saved`)
      console.log('Save all files')
    } else {
      toast.info('No files to save', 'No files are currently open')
    }
  }

  // Toggle sidebar
  const handleToggleSidebar = (): void => {
    toggleSidebar()
  }

  // Integrity check handlers
  const handleRepairWorkspace = async () => {
    if (!workspacePath) return

    try {
      await repairWorkspaceStructure(workspacePath)
      toast.success('Workspace repaired', 'Missing folders have been created')
    } catch (error) {
      toast.error('Repair failed', String(error))
    }
  }

  const handleIgnoreIntegrityIssues = () => {
    // User chose to ignore issues
    console.log('User ignored integrity issues')
  }

  // Global keyboard shortcuts
  useKeyboard({
    // Editor shortcuts
    save: {
      id: 'save',
      handler: handleSave,
      allowInInput: false
    },
    saveAll: {
      id: 'saveAll',
      handler: handleSaveAll,
      allowInInput: false
    },

    // Navigation shortcuts
    toggleSidebar: {
      id: 'toggleSidebar',
      handler: handleToggleSidebar,
      allowInInput: true
    }

    // Note: Settings, Command Palette, Create Entity, Create Note, AI Chat
    // will be handled by their respective dialog components
  })

  return (
    <>
      <div className="h-screen w-screen flex flex-col bg-[hsl(var(--background))]">
        {/* Titlebar */}
        <Titlebar />

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Dock layout area */}
          <div className="flex-1 relative">
            <DockLayout>{children}</DockLayout>
          </div>
        </div>

        {/* Status bar */}
        <StatusBar />
      </div>

      {/* Integrity Check Dialog */}
      <IntegrityCheckDialog
        open={integrityDialogOpen}
        onOpenChange={setIntegrityDialogOpen}
        issues={integrityIssues}
        onRepair={handleRepairWorkspace}
        onIgnore={handleIgnoreIntegrityIssues}
      />
    </>
  )
}
