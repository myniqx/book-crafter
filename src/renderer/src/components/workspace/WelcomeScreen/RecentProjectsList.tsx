import React from 'react'
import { FolderOpen, Trash2, Clock } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { usePersistedStore } from '@renderer/hooks/usePersistedStore'
import { useCoreStore } from '@renderer/store'
import type { RecentProject } from './types'
import { toast } from '@renderer/lib/toast'
import { fs } from '@renderer/lib/ipc'  // Still needed for validateProjects
import { formatRelativeTime } from '@renderer/lib/dateFormat'

export const RecentProjectsList: React.FC = () => {
  const [recentProjects, setRecentProjects] = usePersistedStore<RecentProject[]>(
    'recentProjects',
    []
  )

  const loadWorkspace = useCoreStore((state) => state.loadWorkspace)

  // Validate projects on mount
  React.useEffect(() => {
    const validateProjects = async () => {
      const validated = await Promise.all(
        recentProjects.map(async (project) => {
          const exists = await fs.exists(`${project.path}/book-crafter.json`).catch(() => false)
          return { ...project, exists }
        })
      )
      if (JSON.stringify(validated) !== JSON.stringify(recentProjects)) {
        setRecentProjects(validated)
      }
    }

    if (recentProjects.length > 0) {
      validateProjects()
    }
  }, []) // Run once on mount

  const handleOpenProject = async (project: RecentProject) => {
    if (!project.exists) {
      toast.error('Project not found', `The project at ${project.path} no longer exists`)
      return
    }

    try {
      // Load workspace using store action
      await loadWorkspace(project.path)

      // Update last opened time and move to top
      const updated = recentProjects.map((p) =>
        p.path === project.path
          ? { ...p, lastOpened: new Date().toISOString() }
          : p
      )
      // Sort by lastOpened (most recent first)
      updated.sort((a, b) => new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime())
      setRecentProjects(updated)

      toast.success('Workspace opened', project.name)
    } catch (error) {
      toast.error('Failed to open project', String(error))
    }
  }

  const handleRemoveProject = (path: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setRecentProjects(recentProjects.filter((p) => p.path !== path))
    toast.success('Removed', 'Project removed from recent list')
  }

  const handleClearAll = () => {
    setRecentProjects([])
    toast.success('Cleared', 'Recent projects list cleared')
  }


  if (recentProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
        <Clock className="h-10 w-10 mb-4 opacity-30" />
        <p className="text-sm">No recent projects</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-1 p-2">
        {recentProjects.map((project) => (
          <button
            key={project.path}
            onClick={() => handleOpenProject(project)}
            disabled={!project.exists}
            className={cn(
              'w-full text-left p-3 rounded-lg transition-colors duration-150 group',
              'hover:bg-surface-container-high flex items-center justify-between',
              !project.exists && 'opacity-40 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FolderOpen className="h-4 w-4 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{project.name}</p>
                <p className="text-xs text-on-surface-variant truncate">{project.path}</p>
                <p className="text-xs text-outline mt-0.5">{formatRelativeTime(project.lastOpened)}</p>
              </div>
            </div>
            <button
              onClick={(e) => handleRemoveProject(project.path, e)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error-container/20 rounded"
              title="Remove from recent"
            >
              <Trash2 className="h-3.5 w-3.5 text-error" />
            </button>
          </button>
        ))}
      </div>

      {recentProjects.length > 0 && (
        <div className="border-t border-outline-variant p-2">
          <button
            onClick={handleClearAll}
            className="w-full text-xs text-on-surface-variant hover:text-on-surface py-2 rounded hover:bg-surface-container transition-colors duration-150"
          >
            Clear Recent List
          </button>
        </div>
      )}
    </div>
  )
}
