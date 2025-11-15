import React, { useState, useMemo } from 'react'
import { useStore } from '@renderer/store'
import {
  searchNotes,
  sortNotes,
  filterNotesByType,
  getChecklistProgress,
  type NoteType,
  type NoteSortBy,
  getNoteTypeLabel,
  getNoteTypeIcon
} from '@renderer/lib/note'
import { cn } from '@renderer/lib/utils'
import { Search, StickyNote, Trash2, Pin } from 'lucide-react'
import type { NotesListProps } from './types'
import { CreateNoteDialog } from '@renderer/components/notes/CreateNoteDialog'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Card } from '@renderer/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'

export const NotesList: React.FC<NotesListProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<NoteType | 'all'>('all')
  const [sortBy, setSortBy] = useState<NoteSortBy>('modified')

  const workspacePath = useStore((state) => state.workspacePath)
  const notes = useStore((state) => state.notes)
  const selectNote = useStore((state) => state.selectNote)
  const deleteNoteFromDisk = useStore((state) => state.deleteNoteFromDisk)
  const togglePin = useStore((state) => state.togglePin)
  const saveNoteToDisk = useStore((state) => state.saveNoteToDisk)

  const filteredNotes = useMemo(() => {
    let result = Object.values(notes)

    // Filter by type
    if (filterType !== 'all') {
      result = filterNotesByType(notes, filterType)
    }

    // Search
    if (searchQuery) {
      result = searchNotes(notes, searchQuery)
    }

    // Sort (pinned first)
    result = sortNotes(result, sortBy)
    result.sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1))

    return result
  }, [notes, searchQuery, filterType, sortBy])

  const handleNoteClick = (slug: string): void => {
    selectNote(slug)
  }

  const handleDelete = async (e: React.MouseEvent, slug: string): Promise<void> => {
    e.stopPropagation()
    if (!workspacePath || !confirm('Delete this note?')) return

    try {
      await deleteNoteFromDisk(workspacePath, slug)
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const handleTogglePin = async (e: React.MouseEvent, slug: string): Promise<void> => {
    e.stopPropagation()
    if (!workspacePath) return

    togglePin(slug)
    try {
      await saveNoteToDisk(workspacePath, slug)
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  // Empty state
  if (Object.keys(notes).length === 0) {
    return (
      <div className={cn('flex h-full flex-col bg-slate-950', className)}>
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Notes</span>
          </div>
          <CreateNoteDialog />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-4">
            <StickyNote className="h-16 w-16 text-slate-600 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-slate-300">No Notes</h3>
              <p className="text-sm text-slate-500 mt-1">Create notes to organize your ideas</p>
            </div>
            <CreateNoteDialog />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col bg-slate-950', className)}>
      {/* Header */}
      <div className="space-y-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Notes</span>
            <Badge variant="secondary">{filteredNotes.length}</Badge>
          </div>
          <CreateNoteDialog triggerProps={{ size: 'sm', variant: 'outline' }} />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="pl-9 h-8 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as NoteType | 'all')}
          >
            <SelectTrigger className="h-8 text-xs w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">📝 General</SelectItem>
              <SelectItem value="character">👤 Character</SelectItem>
              <SelectItem value="plot">📖 Plot</SelectItem>
              <SelectItem value="worldbuilding">🌍 Worldbuilding</SelectItem>
              <SelectItem value="research">🔍 Research</SelectItem>
              <SelectItem value="todo">✅ To-Do</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as NoteSortBy)}>
            <SelectTrigger className="h-8 text-xs w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modified">Modified</SelectItem>
              <SelectItem value="date">Created</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">No notes match your filters</div>
        ) : (
          filteredNotes.map((note) => {
            const progress = getChecklistProgress(note.checklist)
            return (
              <Card
                key={note.slug}
                onClick={() => handleNoteClick(note.slug)}
                className="p-3 cursor-pointer hover:bg-slate-800 transition-colors relative"
              >
                {note.pinned && (
                  <Pin className="absolute top-2 right-2 h-3 w-3 text-yellow-500 fill-yellow-500" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{getNoteTypeIcon(note.type)}</span>
                      <h3 className="font-medium text-sm text-slate-200 truncate">{note.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(note.modified).toLocaleDateString()}
                    </p>

                    {note.checklist.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${progress.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {progress.completed}/{progress.total}
                        </span>
                      </div>
                    )}

                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {note.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{note.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={(e) => handleTogglePin(e, note.slug)}
                    >
                      <Pin
                        className={cn(
                          'h-3 w-3',
                          note.pinned ? 'text-yellow-500 fill-yellow-500' : 'text-slate-500'
                        )}
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={(e) => handleDelete(e, note.slug)}
                    >
                      <Trash2 className="h-3 w-3 text-red-400" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
