import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Import slices
import { createBooksSlice, BooksSlice } from './slices/booksSlice'
import { createEntitySlice, EntitySlice } from './slices/entitySlice'
import { createImageSlice, ImageSlice } from './slices/imageSlice'
import { createNoteSlice, NoteSlice } from './slices/noteSlice'

// Content store type (Books + Entities + Images + Notes)
export type ContentStore = BooksSlice & EntitySlice & ImageSlice & NoteSlice

export const useContentStore = create<ContentStore>()(
  devtools(
    immer((set, get, api) => ({
      ...createBooksSlice(set as never, get as never, api as never),
      ...createEntitySlice(set as never, get as never, api as never),
      ...createImageSlice(set as never, get as never, api as never),
      ...createNoteSlice(set as never, get as never, api as never)
    })),
    { name: 'ContentStore' }
  )
)
