import React, { useEffect, useState } from 'react'
import { logger } from '@renderer/lib/logger'
import { Titlebar } from '../Titlebar'
import { Sidebar } from '../Sidebar'
import { StatusBar } from '../StatusBar'
import { DockLayout } from '../DockLayout'
import {
  IntegrityCheckDialog,
  type IntegrityIssue
} from '@renderer/components/workspace/IntegrityCheckDialog'
import { CreateChapterDialog } from '@renderer/components/books/CreateChapterDialog'
import { useStore, type TabEditorData } from '@renderer/store'
import { useKeyboard } from '@renderer/hooks/useKeyboard'
import { useSaveActiveChapter, useSaveAllChapters } from '@renderer/hooks/useSaveChapter'
import { toast } from '@renderer/lib/toast'
import { checkWorkspaceIntegrity, repairWorkspaceStructure } from '@renderer/lib/directory'

export const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [integrityDialogOpen, setIntegrityDialogOpen] = useState(false)
  const [integrityIssues, setIntegrityIssues] = useState<IntegrityIssue[]>([])

  const workspacePath = useStore((state) => state.workspacePath)
  const activeTabId = useStore((state) => state.activeTabId)
  const openTabs = useStore((state) => state.openTabs)
  const createChapterDialogOpen = useStore((state) => state.createChapterDialogOpen)
  const setCreateChapterDialogOpen = useStore((state) => state.setCreateChapterDialogOpen)

  const activeEditorBookSlug = (() => {
    const tab = openTabs.find((t) => t.id === activeTabId)
    if (tab?.type === 'editor' && tab.data) return (tab.data as TabEditorData).bookSlug
    return null
  })()
  const loadAllEntities = useStore((state) => state.loadAllEntities)
  const loadAllBooks = useStore((state) => state.loadAllBooks)
  const loadAllImages = useStore((state) => state.loadAllImages)
  const loadAllNotes = useStore((state) => state.loadAllNotes)
  const toggleSidebar = useStore((state) => state.toggleSidebar)
  const saveActiveChapter = useSaveActiveChapter()
  const saveAllChapters = useSaveAllChapters()

  // Load entities, books, images, and notes when workspace is available
  useEffect(() => {
    if (workspacePath) {
      // Check workspace integrity first
      const performIntegrityCheck = async (): Promise<void> => {
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
          logger.error('Integrity check failed:', 'MainLayout', error)
        }
      }

      performIntegrityCheck()

      // Load entities
      loadAllEntities(workspacePath).catch((error) => {
        logger.error('Failed to load entities:', 'MainLayout', error)
      })

      // Load books
      loadAllBooks(workspacePath).catch((error) => {
        logger.error('Failed to load books:', 'MainLayout', error)
      })

      // Load images
      loadAllImages(workspacePath).catch((error) => {
        logger.error('Failed to load images:', 'MainLayout', error)
      })

      // Load notes
      loadAllNotes(workspacePath).catch((error) => {
        logger.error('Failed to load notes:', 'MainLayout', error)
      })
    }
  }, [workspacePath, loadAllEntities, loadAllBooks, loadAllImages, loadAllNotes])

  // Save current file
  const handleSave = (): void => {
    saveActiveChapter()
  }

  // Save all files
  const handleSaveAll = (): void => {
    saveAllChapters()
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
    logger.info('User ignored integrity issues', 'MainLayout')
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
      <div className="h-screen w-screen flex flex-col bg-surface">
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

      {/* Create Chapter Dialog (globally mounted, driven by store) */}
      {activeEditorBookSlug && (
        <CreateChapterDialog
          bookSlug={activeEditorBookSlug}
          open={createChapterDialogOpen}
          onOpenChange={setCreateChapterDialogOpen}
        />
      )}

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
