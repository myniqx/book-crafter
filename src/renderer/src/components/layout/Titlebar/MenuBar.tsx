import React, { useState } from 'react'
import { cn } from '@renderer/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut
} from '@renderer/components/ui/dropdown-menu'
import { useStore, useCoreStore, useSidebarStore } from '@renderer/store'
import { dialog } from '@renderer/lib/ipc'
import { toast } from '@renderer/lib/toast'

interface MenuItem {
  label: string
  action?: string
  shortcut?: string
  separator?: boolean
  disabled?: boolean
  submenu?: MenuItem[]
}

interface MenuBarProps {
  className?: string
}

export const MenuBar: React.FC<MenuBarProps> = ({ className }) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  // Store hooks (self-contained, no props!)
  const setCreateBookDialogOpen = useCoreStore((state) => state.setCreateBookDialogOpen)
  const setCreateEntityDialogOpen = useCoreStore((state) => state.setCreateEntityDialogOpen)
  const setCreateNoteDialogOpen = useCoreStore((state) => state.setCreateNoteDialogOpen)
  const setSettingsDialogOpen = useCoreStore((state) => state.setSettingsDialogOpen)
  const toggleSidebar = useStore((state) => state.toggleSidebar)
  const togglePanel = useSidebarStore((state) => state.togglePanel)
  const workspaceConfig = useCoreStore((state) => state.workspaceConfig)

  // Menu action handler
  const handleAction = async (action: string) => {
    setOpenMenu(null) // Close menu after action

    switch (action) {
      // File menu
      case 'new-book':
        setCreateBookDialogOpen(true)
        break

      case 'open-workspace':
        try {
          const result = await dialog.openDirectory({
            title: 'Open Workspace',
            buttonLabel: 'Open'
          })
          if (!result.canceled && result.filePath) {
            toast.info('Open Workspace', `Selected: ${result.filePath}`)
            // TODO: Load workspace from path
          }
        } catch (error) {
          toast.error('Failed to open workspace', String(error))
        }
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
        console.warn('Unknown menu action:', action)
    }
  }

  // File menu items
  const fileMenuItems: MenuItem[] = [
    { label: 'New Book', action: 'new-book', shortcut: 'Ctrl+N' },
    { label: 'Open Workspace', action: 'open-workspace', shortcut: 'Ctrl+O' },
    { separator: true },
    { label: 'Save', action: 'save', shortcut: 'Ctrl+S', disabled: !workspaceConfig },
    { label: 'Save All', action: 'save-all', shortcut: 'Ctrl+Shift+S', disabled: !workspaceConfig },
    { separator: true },
    { label: 'Workspace Settings', action: 'workspace-settings', disabled: !workspaceConfig }
  ]

  // Edit menu items
  const editMenuItems: MenuItem[] = [
    { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
    { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
    { separator: true },
    { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
    { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
    { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V' }
  ]

  // View menu items
  const viewMenuItems: MenuItem[] = [
    { label: 'Toggle Sidebar', action: 'toggle-sidebar', shortcut: 'Ctrl+B' },
    { separator: true },
    { label: 'Entity Browser', action: 'panel-entity-browser' },
    { label: 'Image Gallery', action: 'panel-image-gallery' },
    { label: 'Notes', action: 'panel-notes' },
    { label: 'Search', action: 'panel-search' },
    { label: 'AI Chat', action: 'panel-ai-chat' },
    { label: 'Timeline', action: 'panel-timeline' },
    { label: 'Markdown Preview', action: 'panel-preview' }
  ]

  // Window menu items
  const windowMenuItems: MenuItem[] = [
    { label: 'Reset Layout', action: 'reset-layout' },
    { separator: true },
    { label: 'Minimize', action: 'minimize', disabled: true },
    { label: 'Maximize', action: 'maximize', disabled: true }
  ]

  // Help menu items
  const helpMenuItems: MenuItem[] = [
    { label: 'Documentation', action: 'docs' },
    { label: 'Keyboard Shortcuts', action: 'shortcuts', shortcut: 'Ctrl+/' },
    { separator: true },
    { label: 'About Book Crafter', action: 'about' }
  ]

  // Render menu items
  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item, index) => {
      if (item.separator) {
        return <DropdownMenuSeparator key={`separator-${index}`} />
      }

      return (
        <DropdownMenuItem
          key={item.label}
          onClick={() => item.action && handleAction(item.action)}
          disabled={item.disabled}
          className={cn('cursor-pointer', item.disabled && 'opacity-50 cursor-not-allowed')}
        >
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
              'px-3 h-8 flex items-center text-sm font-medium',
              'hover:bg-slate-700 transition-colors rounded',
              'text-slate-300 hover:text-slate-100',
              isOpen && 'bg-slate-700 text-slate-100'
            )}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {label}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="min-w-[220px] bg-slate-800 border-slate-700"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          {renderMenuItems(items)}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <MenuButton label="File" items={fileMenuItems} />
      <MenuButton label="Edit" items={editMenuItems} />
      <MenuButton label="View" items={viewMenuItems} />
      <MenuButton label="Window" items={windowMenuItems} />
      <MenuButton label="Help" items={helpMenuItems} />
    </div>
  )
}
