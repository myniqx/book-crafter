import React from 'react'
import { FilePlus, FolderOpen, BookOpen, HelpCircle, Keyboard } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { useCoreStore } from '@renderer/store'
import { usePersistedStore } from '@renderer/hooks/usePersistedStore'
import { dialog, fs } from '@renderer/lib/ipc'
import { toast } from '@renderer/lib/toast'
import type { RecentProject } from './types'

interface StartActionProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  onClick: () => void
}

const StartAction: React.FC<StartActionProps> = ({ icon: Icon, label, description, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg transition-colors',
        'hover:bg-slate-700 flex items-center gap-3'
      )}
    >
      <Icon className="h-5 w-5 text-blue-400 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </button>
  )
}

export const StartPanel: React.FC = () => {
  const setWorkspaceConfig = useCoreStore((state) => state.setWorkspaceConfig)
  const setWorkspacePath = useCoreStore((state) => state.setWorkspacePath)
  const createNewWorkspace = useCoreStore((state) => state.createNewWorkspace)

  const [recentProjects, setRecentProjects] = usePersistedStore<RecentProject[]>(
    'recentProjects',
    []
  )

  const handleNewProject = async () => {
    try {
      const result = await dialog.openDirectory({
        title: 'Select Location for New Project',
        buttonLabel: 'Select'
      })

      if (result.canceled || !result.filePath) return

      // Check if location already has a project
      const configPath = `${result.filePath}/book-crafter.json`
      const exists = await fs.exists(configPath).catch(() => false)

      if (exists) {
        toast.error('Project exists', 'This location already contains a Book Crafter project')
        return
      }

      // Prompt for project name
      const projectName = prompt('Project Name:', 'My Book') || 'Untitled Project'
      const author = prompt('Author Name:', 'Anonymous') || 'Anonymous'

      // Create workspace config
      const config = createNewWorkspace(projectName, author)

      // Save to disk
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), true)

      // Set workspace
      setWorkspaceConfig(config)
      setWorkspacePath(result.filePath)

      // Add to recent projects
      const newProject: RecentProject = {
        path: result.filePath,
        name: projectName,
        lastOpened: new Date().toISOString(),
        exists: true
      }

      setRecentProjects([newProject, ...recentProjects.slice(0, 9)]) // Keep max 10

      toast.success('Project created', `${projectName} created successfully`)
    } catch (error) {
      toast.error('Failed to create project', String(error))
    }
  }

  const handleOpenFolder = async () => {
    try {
      const result = await dialog.openDirectory({
        title: 'Open Workspace Folder',
        buttonLabel: 'Open'
      })

      if (result.canceled || !result.filePath) return

      // Check if it's a valid workspace
      const configPath = `${result.filePath}/book-crafter.json`
      const exists = await fs.exists(configPath).catch(() => false)

      if (!exists) {
        toast.error('Not a workspace', 'Selected folder is not a Book Crafter workspace')
        return
      }

      // Load workspace config
      const configContent = await fs.readFile(configPath, 'utf-8')
      const config = JSON.parse(configContent)

      setWorkspaceConfig(config)
      setWorkspacePath(result.filePath)

      // Add to recent projects
      const newProject: RecentProject = {
        path: result.filePath,
        name: config.projectName,
        lastOpened: new Date().toISOString(),
        exists: true
      }

      // Remove if already exists, then add to top
      const filtered = recentProjects.filter((p) => p.path !== result.filePath)
      setRecentProjects([newProject, ...filtered.slice(0, 9)]) // Keep max 10

      toast.success('Workspace opened', config.projectName)
    } catch (error) {
      toast.error('Failed to open workspace', String(error))
    }
  }

  const handleDocs = () => {
    toast.info('Documentation', 'Opening documentation...')
    // TODO: Open documentation
  }

  const handleShortcuts = () => {
    toast.info('Keyboard Shortcuts', 'Ctrl+Shift+P - Command Palette\nCtrl+B - Toggle Sidebar')
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      {/* Start Section */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
          Start
        </h2>
        <div className="space-y-1">
          <StartAction
            icon={FilePlus}
            label="New Project"
            description="Create a new Book Crafter workspace"
            onClick={handleNewProject}
          />
          <StartAction
            icon={FolderOpen}
            label="Open Folder"
            description="Open an existing workspace"
            onClick={handleOpenFolder}
          />
        </div>
      </div>

      {/* Help Section */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Help</h2>
        <div className="space-y-1">
          <StartAction
            icon={HelpCircle}
            label="Documentation"
            description="Learn how to use Book Crafter"
            onClick={handleDocs}
          />
          <StartAction
            icon={Keyboard}
            label="Keyboard Shortcuts"
            description="View all keyboard shortcuts"
            onClick={handleShortcuts}
          />
        </div>
      </div>

      {/* Branding */}
      <div className="flex-1 flex items-end">
        <div className="text-center w-full">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-blue-500 opacity-50" />
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Book Crafter
          </h1>
          <p className="text-xs text-slate-400">Professional book writing tool</p>
        </div>
      </div>
    </div>
  )
}
