import React, { useState } from 'react'
import { FolderOpen, BookOpen } from 'lucide-react'
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
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { useCoreStore } from '@renderer/store'
import { usePersistedStore } from '@renderer/hooks/usePersistedStore'
import { dialog, fs } from '@renderer/lib/ipc'
import { toast } from '@renderer/lib/toast'
import { initializeWorkspace } from '@renderer/lib/directory'
import type { CreateProjectFormData, CreateProjectDialogProps } from './types'
import type { RecentProject } from '../WelcomeScreen/types'

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({
  open,
  onOpenChange,
  children
}) => {
  const [formData, setFormData] = useState<CreateProjectFormData>({
    projectName: '',
    author: '',
    location: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  const setWorkspaceConfig = useCoreStore((state) => state.setWorkspaceConfig)
  const setWorkspacePath = useCoreStore((state) => state.setWorkspacePath)
  const createNewWorkspace = useCoreStore((state) => state.createNewWorkspace)

  const [recentProjects, setRecentProjects] = usePersistedStore<RecentProject[]>(
    'recentProjects',
    []
  )

  const handleSelectLocation = async () => {
    try {
      const result = await dialog.openDirectory({
        title: 'Select Location for New Project',
        buttonLabel: 'Select'
      })

      if (!result.canceled && result.filePath) {
        setFormData((prev) => ({ ...prev, location: result.filePath || '' }))
      }
    } catch (error) {
      toast.error('Failed to select location', String(error))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.projectName.trim()) {
      toast.error('Validation error', 'Project name is required')
      return
    }

    if (!formData.author.trim()) {
      toast.error('Validation error', 'Author name is required')
      return
    }

    if (!formData.location) {
      toast.error('Validation error', 'Please select a location')
      return
    }

    setIsCreating(true)

    try {
      const configPath = `${formData.location}/book-crafter.json`

      // Check if location already has a project
      const exists = await fs.exists(configPath).catch(() => false)

      if (exists) {
        toast.error('Project exists', 'This location already contains a Book Crafter project')
        setIsCreating(false)
        return
      }

      // Create workspace config
      const config = createNewWorkspace(formData.projectName, formData.author)

      // Save book-crafter.json
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), true)

      // Initialize workspace structure (create folders)
      await initializeWorkspace({
        rootPath: formData.location,
        projectName: formData.projectName,
        author: formData.author
      })

      // Set workspace in store
      setWorkspaceConfig(config)
      setWorkspacePath(formData.location)

      // Add to recent projects
      const newProject: RecentProject = {
        path: formData.location,
        name: formData.projectName,
        lastOpened: new Date().toISOString(),
        exists: true
      }

      setRecentProjects([newProject, ...recentProjects.slice(0, 9)]) // Keep max 10

      toast.success('Project created', `${formData.projectName} created successfully`)

      // Close dialog
      if (onOpenChange) {
        onOpenChange(false)
      }

      // Reset form
      setFormData({ projectName: '', author: '', location: '' })
    } catch (error) {
      toast.error('Failed to create project', String(error))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Create a new Book Crafter workspace with the default folder structure
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                placeholder="My Awesome Book"
                value={formData.projectName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, projectName: e.target.value }))
                }
                disabled={isCreating}
                required
              />
            </div>

            {/* Author */}
            <div className="space-y-2">
              <Label htmlFor="author">Author Name *</Label>
              <Input
                id="author"
                placeholder="Your Name"
                value={formData.author}
                onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                disabled={isCreating}
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="flex gap-2">
                <Input
                  id="location"
                  placeholder="Select a folder..."
                  value={formData.location}
                  readOnly
                  disabled={isCreating}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSelectLocation}
                  disabled={isCreating}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                A new folder will be created at this location
              </p>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isCreating}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
