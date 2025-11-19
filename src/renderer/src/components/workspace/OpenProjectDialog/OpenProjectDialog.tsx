import React, { useState } from 'react'
import { FolderOpen } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { useCoreStore } from '@renderer/store'
import { usePersistedStore } from '@renderer/hooks/usePersistedStore'
import { dialog } from '@renderer/lib/ipc'
import { toast } from '@renderer/lib/toast'
import type { OpenProjectDialogProps } from './types'
import type { RecentProject } from '../WelcomeScreen/types'

export const OpenProjectDialog: React.FC<OpenProjectDialogProps> = ({
  open,
  onOpenChange,
  children
}) => {
  const [isOpening, setIsOpening] = useState(false)
  const [selectedPath, setSelectedPath] = useState<string>('')

  const hasUnsavedChanges = useCoreStore((state) => state.hasUnsavedChanges)
  const loadWorkspace = useCoreStore((state) => state.loadWorkspace)

  // Handle dialog open/close with unsaved changes check
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && hasUnsavedChanges) {
      toast.warning('Unsaved changes', 'Please save your changes before opening another workspace')
      return
    }
    if (onOpenChange) {
      onOpenChange(newOpen)
    }
  }

  const [recentProjects, setRecentProjects] = usePersistedStore<RecentProject[]>(
    'recentProjects',
    []
  )

  const handleSelectFolder = async () => {
    try {
      const result = await dialog.openDirectory({
        title: 'Open Workspace Folder',
        buttonLabel: 'Open'
      })

      if (!result.canceled && result.filePath) {
        setSelectedPath(result.filePath)
      }
    } catch (error) {
      toast.error('Failed to select folder', String(error))
    }
  }

  const handleOpen = async () => {
    if (!selectedPath) {
      toast.error('Validation error', 'Please select a folder')
      return
    }

    setIsOpening(true)

    try {
      // Load workspace using store action
      await loadWorkspace(selectedPath)

      // Get the loaded config for project name
      const config = useCoreStore.getState().workspaceConfig

      // Add to recent projects
      const newProject: RecentProject = {
        path: selectedPath,
        name: config?.projectName || 'Unknown Project',
        lastOpened: new Date().toISOString(),
        exists: true
      }

      // Remove if already exists, then add to top
      const filtered = recentProjects.filter((p) => p.path !== selectedPath)
      setRecentProjects([newProject, ...filtered.slice(0, 9)]) // Keep max 10

      toast.success('Workspace opened', config?.projectName || 'Project')

      // Reset and close dialog
      setSelectedPath('')
      handleOpenChange(false)
    } catch (error) {
      toast.error('Failed to open workspace', String(error))
    } finally {
      setIsOpening(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-blue-500" />
            Open Workspace
          </DialogTitle>
          <DialogDescription>
            Open an existing Book Crafter workspace folder
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectFolder}
                disabled={isOpening}
                className="flex-1"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                {selectedPath ? 'Change Folder' : 'Select Folder'}
              </Button>
            </div>

            {selectedPath && (
              <div className="p-3 bg-slate-800 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Selected:</p>
                <p className="text-sm text-slate-200 truncate">{selectedPath}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isOpening}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleOpen} disabled={isOpening || !selectedPath}>
            {isOpening ? 'Opening...' : 'Open Workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
