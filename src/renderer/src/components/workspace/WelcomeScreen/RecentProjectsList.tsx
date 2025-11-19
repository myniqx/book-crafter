import React from 'react'
import { FolderOpen, Trash2, Clock } from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { usePersistedStore } from '@renderer/hooks/usePersistedStore'
import { useCoreStore } from '@renderer/store'
import type { RecentProject } from './types'
import { toast } from '@renderer/lib/toast'
import { fs } from '@renderer/lib/ipc'  // Still needed for validateProjects

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

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (recentProjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Clock className="h-12 w-12 mb-4 opacity-50" />
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
              'w-full text-left p-3 rounded-lg transition-colors group',
              'hover:bg-slate-700 flex items-center justify-between',
              !project.exists && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FolderOpen className="h-5 w-5 flex-shrink-0 text-blue-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{project.name}</p>
                <p className="text-xs text-slate-400 truncate">{project.path}</p>
                <p className="text-xs text-slate-500 mt-1">{formatDate(project.lastOpened)}</p>
              </div>
            </div>
            <button
              onClick={(e) => handleRemoveProject(project.path, e)}
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'p-1 hover:bg-slate-600 rounded'
              )}
              title="Remove from recent"
            >
              <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-400" />
            </button>
          </button>
        ))}
      </div>

      {recentProjects.length > 0 && (
        <div className="border-t border-slate-700 p-2">
          <button
            onClick={handleClearAll}
            className="w-full text-xs text-slate-400 hover:text-slate-200 py-2 rounded hover:bg-slate-700 transition-colors"
          >
            Clear Recent List
          </button>
        </div>
      )}
    </div>
  )
}
