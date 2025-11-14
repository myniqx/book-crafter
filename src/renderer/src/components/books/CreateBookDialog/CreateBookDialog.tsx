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
  DialogTrigger,
  DialogClose
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { useStore } from '@renderer/store'
import { createBook } from '@renderer/lib/books'
import type { CreateBookDialogProps } from './types'

export const CreateBookDialog: React.FC<CreateBookDialogProps> = ({ triggerProps }) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const books = useStore((state) => state.books)
  const addBook = useStore((state) => state.addBook)
  const saveBookToDisk = useStore((state) => state.saveBookToDisk)
  const workspacePath = useStore((state) => state.workspacePath)
  const workspaceConfig = useStore((state) => state.workspaceConfig)

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
    } catch (error) {
      console.error('Failed to create book:', error)
      alert('Failed to create book. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog>
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
              <p className="text-xs text-muted-foreground">
                Default: {workspaceConfig.author}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isCreating}>
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild disabled={!title.trim() || isCreating}>
            <Button onClick={handleCreate} disabled={!title.trim() || isCreating}>
              {isCreating ? 'Creating...' : 'Create Book'}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
