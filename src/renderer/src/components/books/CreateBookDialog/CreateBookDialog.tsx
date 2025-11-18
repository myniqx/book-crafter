import React, { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { useCoreStore, useContentStore } from '@renderer/store'
import { createBook } from '@renderer/lib/books'
import type { CreateBookDialogProps } from './types'

export const CreateBookDialog: React.FC<CreateBookDialogProps> = ({ triggerProps }) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Get workspace data from CoreStore
  const workspacePath = useCoreStore((state) => state.workspacePath)
  const workspaceConfig = useCoreStore((state) => state.workspaceConfig)
  const open = useCoreStore((state) => state.createBookDialogOpen)
  const setOpen = useCoreStore((state) => state.setCreateBookDialogOpen)

  // Get books data from ContentStore
  const books = useContentStore((state) => state.books)
  const addBook = useContentStore((state) => state.addBook)
  const saveBookToDisk = useContentStore((state) => state.saveBookToDisk)

  const handleCreate = async (): Promise<void> => {
    if (!title.trim() || !workspacePath) return

    setIsCreating(true)

    try {
      // Get existing slugs
      const existingSlugs = Object.keys(books)

      // Use workspace author if author field is empty
      const bookAuthor = author.trim() || workspaceConfig?.author || 'Unknown Author'

      // Create book
      const book = createBook(title.trim(), bookAuthor, existingSlugs)

      // Add to store
      addBook(book)

      // Save to disk
      await saveBookToDisk(workspacePath, book.slug)

      // Reset form
      setTitle('')
      setAuthor('')

      // Close dialog after success
      setOpen(false)
    } catch (error) {
      console.error('Failed to create book:', error)
      alert('Failed to create book. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" {...triggerProps}>
          <BookOpen className="h-4 w-4 mr-2" />
          New Book
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Create New Book</DialogTitle>
          <DialogDescription>
            Start a new book project. You can add chapters after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter book title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Author */}
          <div className="grid gap-2">
            <Label htmlFor="author">
              Author <span className="text-xs text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="author"
              placeholder={workspaceConfig?.author || 'Enter author name'}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
            {workspaceConfig?.author && (
              <p className="text-xs text-muted-foreground">Default: {workspaceConfig.author}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isCreating} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim() || isCreating}>
            {isCreating ? 'Creating...' : 'Create Book'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
