import React, { useState, useMemo } from 'react'
import { useStore } from '@renderer/store'
import { logger } from '@renderer/lib/logger'
import { formatDate } from '@renderer/lib/dateFormat'
import {
  searchNotes,
  sortNotes,
  filterNotesByType,
  getChecklistProgress,
  type NoteType,
  type NoteSortBy,
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
      logger.error('Failed to delete note:', 'NotesList', error)
    }
  }

  const handleTogglePin = async (e: React.MouseEvent, slug: string): Promise<void> => {
    e.stopPropagation()
    if (!workspacePath) return

    togglePin(slug)
    try {
      await saveNoteToDisk(workspacePath, slug)
    } catch (error) {
      logger.error('Failed to save note:', 'NotesList', error)
    }
  }

  // Empty state
  if (Object.keys(notes).length === 0) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="flex items-center justify-between border-b border-outline-variant px-3 py-2">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Notes</h3>
          <CreateNoteDialog />
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center space-y-3">
            <StickyNote className="h-10 w-10 text-on-surface-variant opacity-30 mx-auto" />
            <div>
              <h3 className="text-sm font-medium text-on-surface">No Notes</h3>
              <p className="text-xs text-on-surface-variant mt-1">Create notes to organize your ideas</p>
            </div>
            <CreateNoteDialog />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="space-y-2 border-b border-outline-variant px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Notes</h3>
            <Badge variant="secondary">{filteredNotes.length}</Badge>
          </div>
          <CreateNoteDialog triggerProps={{ size: 'sm', variant: 'outline' }} />
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search notes..." className="pl-8 h-8 text-xs" />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={(value) => setFilterType(value as NoteType | 'all')}>
            <SelectTrigger className="h-7 text-xs w-[130px]"><SelectValue /></SelectTrigger>
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
            <SelectTrigger className="h-7 text-xs w-[100px]"><SelectValue /></SelectTrigger>
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
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-xs text-on-surface-variant">No notes match your filters</div>
        ) : (
          filteredNotes.map((note) => {
            const progress = getChecklistProgress(note.checklist)
            return (
              <Card
                key={note.slug}
                onClick={() => handleNoteClick(note.slug)}
                className="p-3 cursor-pointer hover:bg-surface-container-high transition-colors duration-150 relative bg-surface-container border-outline-variant"
              >
                {note.pinned && (
                  <Pin className="absolute top-2 right-2 h-3 w-3 text-tertiary fill-tertiary" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getNoteTypeIcon(note.type)}</span>
                      <h3 className="font-medium text-sm text-on-surface truncate">{note.title}</h3>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {formatDate(note.modified)}
                    </p>

                    {note.checklist.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-surface-container-high rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all" style={{ width: `${progress.percentage}%` }} />
                        </div>
                        <span className="text-xs text-on-surface-variant">{progress.completed}/{progress.total}</span>
                      </div>
                    )}

                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {note.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                        {note.tags.length > 2 && (
                          <Badge variant="secondary" className="text-xs">+{note.tags.length - 2}</Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => handleTogglePin(e, note.slug)}>
                      <Pin className={cn('h-3 w-3', note.pinned ? 'text-tertiary fill-tertiary' : 'text-on-surface-variant')} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={(e) => handleDelete(e, note.slug)}>
                      <Trash2 className="h-3 w-3 text-error" />
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
