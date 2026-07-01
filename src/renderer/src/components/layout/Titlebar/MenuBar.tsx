import React, { useState } from 'react'
import { logger } from '@renderer/lib/logger'
import { cn } from '@renderer/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut
} from '@renderer/components/ui/dropdown-menu'
import {
  FolderPlus,
  FolderOpen,
  FolderX,
  BookPlus,
  Save,
  SaveAll,
  Settings,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  Clipboard,
  PanelLeft,
  Users,
  Image,
  StickyNote,
  Search,
  MessageSquare,
  Clock,
  Eye,
  LayoutDashboard,
  Minus,
  Maximize2,
  BookOpen,
  Keyboard,
  Info
} from 'lucide-react'
import { useStore } from '@renderer/store'
import { toast } from '@renderer/lib/toast'
import { CreateProjectDialog } from '@renderer/components/workspace/CreateProjectDialog'
import { OpenProjectDialog } from '@renderer/components/workspace/OpenProjectDialog'

type MenuItem =
  | { separator: true }
  | {
      label: string
      action?: string
      shortcut?: string
      disabled?: boolean
      icon?: React.ComponentType<{ className?: string }>
      submenu?: MenuItem[]
    }

interface MenuBarProps {
  className?: string
}

export const MenuBar: React.FC<MenuBarProps> = ({ className }) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false)
  const [openProjectDialogOpen, setOpenProjectDialogOpen] = useState(false)

  // Store hooks (self-contained, no props!)
  const setCreateBookDialogOpen = useStore((state) => state.setCreateBookDialogOpen)
  const setCreateEntityDialogOpen = useStore((state) => state.setCreateEntityDialogOpen)
  const setCreateNoteDialogOpen = useStore((state) => state.setCreateNoteDialogOpen)
  const setSettingsDialogOpen = useStore((state) => state.setSettingsDialogOpen)
  const closeWorkspace = useStore((state) => state.closeWorkspace)
  const toggleSidebar = useStore((state) => state.toggleSidebar)
  const togglePanel = useStore((state) => state.togglePanel)
  const workspaceConfig = useStore((state) => state.workspaceConfig)

  // Menu action handler
  const handleAction = async (action: string) => {
    setOpenMenu(null) // Close menu after action

    switch (action) {
      // File menu
      case 'new-project':
        setCreateProjectDialogOpen(true)
        break

      case 'open-folder':
        setOpenProjectDialogOpen(true)
        break

      case 'close-workspace':
        if (workspaceConfig) {
          closeWorkspace()
          toast.success('Workspace closed', 'Workspace has been closed')
        }
        break

      case 'new-book':
        setCreateBookDialogOpen(true)
        break

      case 'new-entity':
        setCreateEntityDialogOpen(true)
        break

      case 'new-note':
        setCreateNoteDialogOpen(true)
        break

      case 'open-workspace':
        setOpenProjectDialogOpen(true)
        break

      case 'save':
        toast.info('Save', 'Saving current file...')
        // TODO: Implement save
        break

      case 'save-all':
        toast.info('Save All', 'Saving all files...')
        // TODO: Implement save all
        break

      case 'workspace-settings':
        setSettingsDialogOpen(true)
        break

      // Edit menu
      case 'undo':
        document.execCommand('undo')
        break

      case 'redo':
        document.execCommand('redo')
        break

      case 'cut':
        document.execCommand('cut')
        break

      case 'copy':
        document.execCommand('copy')
        break

      case 'paste':
        document.execCommand('paste')
        break

      // View menu
      case 'toggle-sidebar':
        toggleSidebar()
        break

      case 'panel-entity-browser':
        togglePanel('entity-browser')
        break

      case 'panel-image-gallery':
        togglePanel('image-gallery')
        break

      case 'panel-notes':
        togglePanel('notes')
        break

      case 'panel-search':
        togglePanel('search')
        break

      case 'panel-ai-chat':
        togglePanel('ai-chat')
        break

      case 'panel-timeline':
        togglePanel('timeline')
        break

      case 'panel-preview':
        togglePanel('markdown-preview')
        break

      // Window menu
      case 'reset-layout':
        localStorage.removeItem('book-crafter-layout')
        toast.success('Layout Reset', 'Reload the app to see changes')
        break

      case 'minimize':
        // TODO: IPC minimize window
        break

      case 'maximize':
        // TODO: IPC maximize window
        break

      // Help menu
      case 'docs':
        // TODO: Open docs
        toast.info('Documentation', 'Opening documentation...')
        break

      case 'shortcuts':
        toast.info('Keyboard Shortcuts', 'Ctrl+Shift+P - Command Palette')
        break

      case 'about':
        toast.info('About', 'Book Crafter v1.0.0')
        break

      default:
        logger.warn(`Unknown menu action: ${action}`, 'MenuBar')
    }
  }

  const fileMenuItems: MenuItem[] = [
    { label: 'New Project', action: 'new-project', shortcut: 'Ctrl+Shift+N', icon: FolderPlus },
    { label: 'Open Folder', action: 'open-folder', shortcut: 'Ctrl+O', icon: FolderOpen },
    { label: 'Close Workspace', action: 'close-workspace', disabled: !workspaceConfig, icon: FolderX },
    { separator: true },
    { label: 'New Book', action: 'new-book', shortcut: 'Ctrl+N', disabled: !workspaceConfig, icon: BookPlus },
    { label: 'New Entity', action: 'new-entity', shortcut: 'Ctrl+Shift+E', disabled: !workspaceConfig, icon: Users },
    { label: 'New Note', action: 'new-note', shortcut: 'Ctrl+Shift+N', disabled: !workspaceConfig, icon: StickyNote },
    { separator: true },
    { label: 'Save', action: 'save', shortcut: 'Ctrl+S', disabled: !workspaceConfig, icon: Save },
    { label: 'Save All', action: 'save-all', shortcut: 'Ctrl+Shift+S', disabled: !workspaceConfig, icon: SaveAll },
    { separator: true },
    { label: 'Workspace Settings', action: 'workspace-settings', disabled: !workspaceConfig, icon: Settings }
  ]

  const editMenuItems: MenuItem[] = [
    { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z', icon: Undo2 },
    { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y', icon: Redo2 },
    { separator: true },
    { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X', icon: Scissors },
    { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C', icon: Copy },
    { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V', icon: Clipboard }
  ]

  const viewMenuItems: MenuItem[] = [
    { label: 'Toggle Sidebar', action: 'toggle-sidebar', shortcut: 'Ctrl+B', icon: PanelLeft },
    { separator: true },
    { label: 'Entity Browser', action: 'panel-entity-browser', icon: Users },
    { label: 'Image Gallery', action: 'panel-image-gallery', icon: Image },
    { label: 'Notes', action: 'panel-notes', icon: StickyNote },
    { label: 'Search', action: 'panel-search', icon: Search },
    { label: 'AI Chat', action: 'panel-ai-chat', icon: MessageSquare },
    { label: 'Timeline', action: 'panel-timeline', icon: Clock },
    { label: 'Markdown Preview', action: 'panel-preview', icon: Eye }
  ]

  const windowMenuItems: MenuItem[] = [
    { label: 'Reset Layout', action: 'reset-layout', icon: LayoutDashboard },
    { separator: true },
    { label: 'Minimize', action: 'minimize', disabled: true, icon: Minus },
    { label: 'Maximize', action: 'maximize', disabled: true, icon: Maximize2 }
  ]

  const helpMenuItems: MenuItem[] = [
    { label: 'Documentation', action: 'docs', icon: BookOpen },
    { label: 'Keyboard Shortcuts', action: 'shortcuts', shortcut: 'Ctrl+/', icon: Keyboard },
    { separator: true },
    { label: 'About Book Crafter', action: 'about', icon: Info }
  ]

  // Render menu items
  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item, index) => {
      if ('separator' in item) {
        return <DropdownMenuSeparator key={`separator-${index}`} />
      }

      const Icon = item.icon
      return (
        <DropdownMenuItem
          key={item.label}
          onClick={() => item.action && handleAction(item.action)}
          disabled={item.disabled}
          className={cn('cursor-pointer gap-2', item.disabled && 'opacity-50 cursor-not-allowed')}
        >
          {Icon && <Icon className="h-3.5 w-3.5 text-on-surface-variant shrink-0" />}
          <span>{item.label}</span>
          {item.shortcut && (
            <DropdownMenuShortcut className="ml-auto">{item.shortcut}</DropdownMenuShortcut>
          )}
        </DropdownMenuItem>
      )
    })
  }

  // Menu button component
  const MenuButton: React.FC<{ label: string; items: MenuItem[] }> = ({ label, items }) => {
    const menuKey = label.toLowerCase()
    const isOpen = openMenu === menuKey

    return (
      <DropdownMenu open={isOpen} onOpenChange={(open) => setOpenMenu(open ? menuKey : null)}>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'px-3 h-8 flex items-center text-xs font-medium',
              'text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-150 rounded',
              isOpen && 'bg-surface-container text-on-surface'
            )}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {label}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[220px] bg-surface-container-high border-outline-variant"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {renderMenuItems(items)}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <div className={cn('flex items-center gap-0.5', className)}>
        <MenuButton label="File" items={fileMenuItems} />
        <MenuButton label="Edit" items={editMenuItems} />
        <MenuButton label="View" items={viewMenuItems} />
        <MenuButton label="Window" items={windowMenuItems} />
        <MenuButton label="Help" items={helpMenuItems} />
      </div>

      {/* Dialogs */}
      <CreateProjectDialog
        open={createProjectDialogOpen}
        onOpenChange={setCreateProjectDialogOpen}
      />
      <OpenProjectDialog open={openProjectDialogOpen} onOpenChange={setOpenProjectDialogOpen} />
    </>
  )
}
