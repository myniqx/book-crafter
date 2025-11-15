import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Badge } from '@renderer/components/ui/badge'
import { useShortcut } from '@renderer/hooks/useKeyboard'
import { fuzzySearch, highlightMatches } from '@renderer/lib/fuzzySearch'
import { useStore } from '@renderer/store'
import {
  BookOpen,
  FileText,
  Users,
  StickyNote,
  Settings,
  Sparkles,
  Search,
  PanelLeftClose,
  PanelLeft,
  Save,
  Command as CommandIcon
} from 'lucide-react'
import type { Command } from './types'
import { cn } from '@renderer/lib/utils'

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentCommands, setRecentCommands] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)

  const toggleSidebar = useStore((state) => state.toggleSidebar)
  const togglePanel = useStore((state) => state.togglePanel)
  const sidebarCollapsed = useStore((state) => state.sidebarCollapsed)
  const openEditorTabs = useStore((state) => state.openEditorTabs)
  const books = useStore((state) => state.books)
  const activeTabIndex = useStore((state) => state.activeTabIndex)
  const setCreateBookDialogOpen = useStore((state) => state.setCreateBookDialogOpen)
  const setCreateEntityDialogOpen = useStore((state) => state.setCreateEntityDialogOpen)
  const setCreateNoteDialogOpen = useStore((state) => state.setCreateNoteDialogOpen)
  const setSettingsDialogOpen = useStore((state) => state.setSettingsDialogOpen)

  // Keyboard shortcut: Ctrl+Shift+P
  useShortcut('commandPalette', () => setOpen(true), { allowInInput: true })

  // Define all commands
  const commands: Command[] = useMemo(
    () => [
      // Create commands
      {
        id: 'new-book',
        label: 'New Book',
        description: 'Create a new book',
        category: 'Create',
        keywords: ['create', 'add', 'book'],
        icon: <BookOpen className="h-4 w-4" />,
        action: () => {
          setOpen(false)
          setCreateBookDialogOpen(true)
        }
      },
      {
        id: 'new-chapter',
        label: 'New Chapter',
        description: 'Add a new chapter to current book',
        category: 'Create',
        keywords: ['create', 'add', 'chapter'],
        icon: <FileText className="h-4 w-4" />,
        action: () => {
          setOpen(false)
          // TODO: Open create chapter dialog
          console.log('Create new chapter')
        }
      },
      {
        id: 'new-entity',
        label: 'New Entity',
        description: 'Create a new entity',
        category: 'Create',
        shortcut: 'Ctrl+Shift+E',
        keywords: ['create', 'add', 'entity', 'character', 'location'],
        icon: <Users className="h-4 w-4" />,
        action: () => {
          setOpen(false)
          setCreateEntityDialogOpen(true)
        }
      },
      {
        id: 'new-note',
        label: 'New Note',
        description: 'Create a new note',
        category: 'Create',
        shortcut: 'Ctrl+Shift+N',
        keywords: ['create', 'add', 'note'],
        icon: <StickyNote className="h-4 w-4" />,
        action: () => {
          setOpen(false)
          setCreateNoteDialogOpen(true)
        }
      },

      // Editor commands
      {
        id: 'save',
        label: 'Save File',
        description: 'Save the current file',
        category: 'Editor',
        shortcut: 'Ctrl+S',
        keywords: ['save', 'write'],
        icon: <Save className="h-4 w-4" />,
        action: () => {
          setOpen(false)
          if (activeTabIndex >= 0 && openEditorTabs[activeTabIndex]) {
            const tab = openEditorTabs[activeTabIndex]
            const book = books[tab.bookSlug]
            if (book) {
              const chapter = book.chapters.find((c) => c.slug === tab.chapterSlug)
              if (chapter) {
                console.log('Save file:', tab.bookSlug, tab.chapterSlug)
              }
            }
          }
        }
      },

      // Navigation commands
      {
        id: 'toggle-sidebar',
        label: sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar',
        description: 'Toggle the sidebar visibility',
        category: 'Navigation',
        shortcut: 'Ctrl+B',
        keywords: ['toggle', 'sidebar', 'show', 'hide'],
        icon: sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />,
        action: () => {
          setOpen(false)
          toggleSidebar()
        }
      },

      // Search commands
      {
        id: 'global-search',
        label: 'Global Search',
        description: 'Search across all files',
        category: 'Search',
        shortcut: 'Ctrl+Shift+F',
        keywords: ['search', 'find', 'global'],
        icon: <Search className="h-4 w-4" />,
        action: () => {
          setOpen(false)
          togglePanel('search')
        }
      },

      // AI commands
      {
        id: 'ai-chat',
        label: 'Open AI Chat',
        description: 'Open AI assistant chat',
        category: 'AI',
        shortcut: 'Ctrl+Shift+A',
        keywords: ['ai', 'chat', 'assistant'],
        icon: <Sparkles className="h-4 w-4" />,
        action: () => {
          setOpen(false)
          togglePanel('ai-chat')
        }
      },

      // General commands
      {
        id: 'settings',
        label: 'Open Settings',
        description: 'Open application settings',
        category: 'General',
        shortcut: 'Ctrl+,',
        keywords: ['settings', 'preferences', 'options'],
        icon: <Settings className="h-4 w-4" />,
        action: () => {
          setOpen(false)
          setSettingsDialogOpen(true)
        }
      }
    ],
    [
      toggleSidebar,
      togglePanel,
      sidebarCollapsed,
      openEditorTabs,
      books,
      activeTabIndex,
      setCreateBookDialogOpen,
      setCreateEntityDialogOpen,
      setCreateNoteDialogOpen,
      setSettingsDialogOpen
    ]
  )

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) {
      // Show recent commands first, then all commands
      const recent = commands.filter((cmd) => recentCommands.includes(cmd.id))
      const others = commands.filter((cmd) => !recentCommands.includes(cmd.id))
      return [...recent, ...others]
    }

    return fuzzySearch(commands, search, (cmd) => [
      cmd.label,
      cmd.description || '',
      ...(cmd.keywords || [])
    ])
  }, [commands, search, recentCommands])

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSearch('')
      setSelectedIndex(0)
    }
  }, [open])

  // Scroll selected item into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedIndex])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
        break

      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        break

      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
        break

      case 'Escape':
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  // Execute command and track in recent
  const executeCommand = (command: Command): void => {
    command.action()
    setOpen(false)

    // Add to recent commands (max 5)
    setRecentCommands((prev) => {
      const filtered = prev.filter((id) => id !== command.id)
      return [command.id, ...filtered].slice(0, 5)
    })
  }

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {}
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = []
      }
      groups[cmd.category].push(cmd)
    })
    return groups
  }, [filteredCommands])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <CommandIcon className="h-4 w-4" />
            Command Palette
          </DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="px-4 pb-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 text-base"
          />
        </div>

        {/* Commands list */}
        <ScrollArea className="max-h-[400px] border-t border-border">
          <div className="p-2">
            {Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="mb-3 last:mb-0">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{category}</div>
                {cmds.map((cmd, index) => {
                  const globalIndex = filteredCommands.indexOf(cmd)
                  const isSelected = globalIndex === selectedIndex
                  const highlights = highlightMatches(cmd.label, search)

                  return (
                    <div
                      key={cmd.id}
                      ref={isSelected ? selectedRef : null}
                      onClick={() => executeCommand(cmd)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-accent text-foreground'
                      )}
                    >
                      {/* Icon */}
                      <div className={cn('shrink-0', isSelected ? 'text-white' : 'text-muted-foreground')}>
                        {cmd.icon}
                      </div>

                      {/* Label and description */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {highlights.map((segment, i) => (
                            <span
                              key={i}
                              className={segment.match ? 'underline font-bold' : ''}
                            >
                              {segment.text}
                            </span>
                          ))}
                        </div>
                        {cmd.description && (
                          <div
                            className={cn(
                              'text-xs truncate',
                              isSelected ? 'text-blue-100' : 'text-muted-foreground'
                            )}
                          >
                            {cmd.description}
                          </div>
                        )}
                      </div>

                      {/* Shortcut badge */}
                      {cmd.shortcut && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs shrink-0',
                            isSelected
                              ? 'border-blue-300 text-blue-100'
                              : 'border-border text-muted-foreground'
                          )}
                        >
                          {cmd.shortcut}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}

            {filteredCommands.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No commands found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <span>Navigate with ↑↓ • Execute with Enter • Close with Esc</span>
          <span className="opacity-60">Ctrl+Shift+P</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
