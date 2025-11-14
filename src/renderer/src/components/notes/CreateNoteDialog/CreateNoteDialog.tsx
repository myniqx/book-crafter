import React, { useState, FormEvent } from 'react'
import { useStore } from '@renderer/store'
import { createNote, type NoteType, getNoteTypeLabel, getNoteTypeIcon } from '@renderer/lib/note'
import type { CreateNoteDialogProps } from './types'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Plus } from 'lucide-react'

const NOTE_TYPES: NoteType[] = ['general', 'character', 'plot', 'worldbuilding', 'research', 'todo']

export const CreateNoteDialog: React.FC<CreateNoteDialogProps> = ({ triggerProps }) => {
  const [title, setTitle] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('general')
  const [errors, setErrors] = useState<string[]>([])

  const workspacePath = useStore((state) => state.workspacePath)
  const notes = useStore((state) => state.notes)
  const addNote = useStore((state) => state.addNote)
  const saveNoteToDisk = useStore((state) => state.saveNoteToDisk)

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()

    // Validation
    const newErrors: string[] = []
    if (!title.trim()) {
      newErrors.push('Title is required')
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    if (!workspacePath) {
      setErrors(['No workspace selected'])
      return
    }

    // Create note
    const existingSlugs = Object.keys(notes)
    const note = createNote(title.trim(), noteType, existingSlugs)

    // Add to store
    addNote(note)

    // Save to disk
    try {
      await saveNoteToDisk(workspacePath, note.slug)
    } catch (error) {
      console.error('Failed to save note:', error)
      setErrors(['Failed to save note'])
      return
    }

    // Reset form
    setTitle('')
    setNoteType('general')
    setErrors([])
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button {...triggerProps}>
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Add a new note to organize your ideas, research, and todo items.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              autoFocus
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="note-type">Type</Label>
            <Select value={noteType} onValueChange={(value) => setNoteType(value as NoteType)}>
              <SelectTrigger id="note-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getNoteTypeIcon(type)} {getNoteTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="text-sm text-red-500">
              {errors.map((error, i) => (
                <p key={i}>{error}</p>
              ))}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type="submit">Create Note</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
