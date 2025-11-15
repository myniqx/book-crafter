import React, { useState } from 'react'
import { FileText } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
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
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { useStore } from '@renderer/store'
import { createChapter } from '@renderer/lib/books'
import type { CreateChapterDialogProps } from './types'

export const CreateChapterDialog: React.FC<CreateChapterDialogProps> = ({ bookSlug, triggerProps }) => {
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [open, setOpen] = useState(false)

  const book = useStore((state) => state.books[bookSlug])
  const addChapter = useStore((state) => state.addChapter)
  const saveChapterToDisk = useStore((state) => state.saveChapterToDisk)
  const saveBookToDisk = useStore((state) => state.saveBookToDisk)
  const workspacePath = useStore((state) => state.workspacePath)

  if (!book) {
    return null
  }

  const handleCreate = async (): Promise<void> => {
    if (!title.trim() || !workspacePath) return

    setIsCreating(true)

    try {
      // Create chapter
      const chapter = createChapter(title.trim(), book.chapters)

      // Add to store
      addChapter(bookSlug, chapter)

      // Save chapter to disk
      await saveChapterToDisk(workspacePath, bookSlug, chapter.slug)

      // Update book.json
      await saveBookToDisk(workspacePath, bookSlug)

      // Reset form
      setTitle('')

      // Close dialog after success
      setOpen(false)
    } catch (error) {
      console.error('Failed to create chapter:', error)
      alert('Failed to create chapter. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" {...triggerProps}>
          <FileText className="h-4 w-4 mr-2" />
          New Chapter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Create New Chapter</DialogTitle>
          <DialogDescription>
            Add a new chapter to "{book.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="chapter-title">Chapter Title *</Label>
            <Input
              id="chapter-title"
              placeholder="Enter chapter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Info */}
          <div className="rounded-md border p-3 bg-muted/50 text-sm">
            <p className="text-muted-foreground">
              Chapter will be added at position {book.chapters.length + 1}. You can reorder chapters later.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isCreating}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Chapter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
