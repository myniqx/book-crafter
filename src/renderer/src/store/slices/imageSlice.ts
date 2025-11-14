import { StateCreator } from 'zustand'
import { AppStore } from '..'
import type { Image } from '@renderer/lib/image'
import { generateImageSlug, createImageMetadata } from '@renderer/lib/image'
import {
  loadAllImages,
  saveImageMetadata,
  copyImageToWorkspace,
  deleteImage as deleteImageFile,
  updateImageMetadata
} from '@renderer/lib/images'

export interface ImageSlice {
  images: Record<string, Image>
  selectedImageSlug: string | null
  isLoadingImages: boolean
  uploadProgress: number | null

  // CRUD operations
  addImage: (image: Image) => void
  updateImage: (slug: string, updates: Partial<Image>) => void
  deleteImage: (slug: string) => void
  selectImage: (slug: string | null) => void

  // File operations
  loadAllImages: (workspacePath: string) => Promise<void>
  uploadImage: (workspacePath: string, file: File) => Promise<string>
  saveImageToDisk: (workspacePath: string, slug: string) => Promise<void>
  deleteImageFromDisk: (workspacePath: string, slug: string) => Promise<void>

  // Tagging
  addTag: (slug: string, tag: string) => void
  removeTag: (slug: string, tag: string) => void
  setTags: (slug: string, tags: string[]) => void

  // Linking
  linkToEntity: (slug: string, entitySlug: string) => void
  unlinkFromEntity: (slug: string, entitySlug: string) => void
  linkToBook: (slug: string, bookSlug: string) => void
  unlinkFromBook: (slug: string, bookSlug: string) => void
  linkToNote: (slug: string, noteId: string) => void
  unlinkFromNote: (slug: string, noteId: string) => void

  // Metadata updates
  updateDescription: (slug: string, description: string) => void
}

export const createImageSlice: StateCreator<
  AppStore,
  [['zustand/immer', never], ['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  ImageSlice
> = (set, get) => ({
  images: {},
  selectedImageSlug: null,
  isLoadingImages: false,
  uploadProgress: null,

  // CRUD operations
  addImage: (image) =>
    set((state) => {
      state.images[image.slug] = image
    }),

  updateImage: (slug, updates) =>
    set((state) => {
      if (state.images[slug]) {
        state.images[slug] = {
          ...state.images[slug],
          ...updates,
          modified: new Date().toISOString()
        }
      }
    }),

  deleteImage: (slug) =>
    set((state) => {
      delete state.images[slug]
      if (state.selectedImageSlug === slug) {
        state.selectedImageSlug = null
      }
    }),

  selectImage: (slug) =>
    set((state) => {
      state.selectedImageSlug = slug
    }),

  // File operations
  loadAllImages: async (workspacePath) => {
    set((state) => {
      state.isLoadingImages = true
    })

    try {
      const images = await loadAllImages(workspacePath)
      set((state) => {
        state.images = images
      })
    } catch (error) {
      console.error('Failed to load images:', error)
      throw error
    } finally {
      set((state) => {
        state.isLoadingImages = false
      })
    }
  },

  uploadImage: async (workspacePath, file) => {
    try {
      set((state) => {
        state.uploadProgress = 0
      })

      // Generate unique slug
      const existingSlugs = Object.keys(get().images)
      const slug = generateImageSlug(file.name, existingSlugs)

      // Copy file to workspace
      set((state) => {
        state.uploadProgress = 30
      })

      const extension = file.name.match(/\.[^.]+$/)?.[0] || ''
      const targetFilename = `${slug}${extension}`

      // For browser File API, we need to use FileReader to get the file content
      // Then write it via IPC
      const relativePath = await new Promise<string>(async (resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer
            const uint8Array = new Uint8Array(arrayBuffer)

            // Write file via IPC
            const imagesDir = `${workspacePath}/.assets/images`
            const targetPath = `${imagesDir}/${targetFilename}`

            if (window.api?.fs?.writeFile) {
              // Convert Uint8Array to base64 for transfer
              const base64 = btoa(String.fromCharCode(...uint8Array))
              await window.api.fs.writeFile(targetPath, base64, 'base64' as any)
            }

            resolve(`.assets/images/${targetFilename}`)
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })

      set((state) => {
        state.uploadProgress = 60
      })

      // Create metadata
      const imageMetadata = await createImageMetadata(file, slug, relativePath)

      set((state) => {
        state.uploadProgress = 80
      })

      // Save metadata
      await saveImageMetadata(workspacePath, imageMetadata)

      // Add to store
      get().addImage(imageMetadata)

      set((state) => {
        state.uploadProgress = 100
      })

      // Clear progress after delay
      setTimeout(() => {
        set((state) => {
          state.uploadProgress = null
        })
      }, 1000)

      return slug
    } catch (error) {
      set((state) => {
        state.uploadProgress = null
      })
      console.error('Failed to upload image:', error)
      throw error
    }
  },

  saveImageToDisk: async (workspacePath, slug) => {
    const image = get().images[slug]
    if (!image) {
      throw new Error(`Image not found: ${slug}`)
    }

    try {
      await saveImageMetadata(workspacePath, image)
    } catch (error) {
      console.error(`Failed to save image ${slug}:`, error)
      throw error
    }
  },

  deleteImageFromDisk: async (workspacePath, slug) => {
    const image = get().images[slug]
    if (!image) {
      throw new Error(`Image not found: ${slug}`)
    }

    try {
      await deleteImageFile(workspacePath, image)
      get().deleteImage(slug)
    } catch (error) {
      console.error(`Failed to delete image ${slug}:`, error)
      throw error
    }
  },

  // Tagging
  addTag: (slug, tag) =>
    set((state) => {
      const image = state.images[slug]
      if (image && !image.tags.includes(tag)) {
        image.tags.push(tag)
        image.modified = new Date().toISOString()
      }
    }),

  removeTag: (slug, tag) =>
    set((state) => {
      const image = state.images[slug]
      if (image) {
        image.tags = image.tags.filter((t) => t !== tag)
        image.modified = new Date().toISOString()
      }
    }),

  setTags: (slug, tags) =>
    set((state) => {
      const image = state.images[slug]
      if (image) {
        image.tags = tags
        image.modified = new Date().toISOString()
      }
    }),

  // Linking
  linkToEntity: (slug, entitySlug) =>
    set((state) => {
      const image = state.images[slug]
      if (image && !image.linkedEntities.includes(entitySlug)) {
        image.linkedEntities.push(entitySlug)
        image.modified = new Date().toISOString()
      }
    }),

  unlinkFromEntity: (slug, entitySlug) =>
    set((state) => {
      const image = state.images[slug]
      if (image) {
        image.linkedEntities = image.linkedEntities.filter((e) => e !== entitySlug)
        image.modified = new Date().toISOString()
      }
    }),

  linkToBook: (slug, bookSlug) =>
    set((state) => {
      const image = state.images[slug]
      if (image && !image.linkedBooks.includes(bookSlug)) {
        image.linkedBooks.push(bookSlug)
        image.modified = new Date().toISOString()
      }
    }),

  unlinkFromBook: (slug, bookSlug) =>
    set((state) => {
      const image = state.images[slug]
      if (image) {
        image.linkedBooks = image.linkedBooks.filter((b) => b !== bookSlug)
        image.modified = new Date().toISOString()
      }
    }),

  linkToNote: (slug, noteId) =>
    set((state) => {
      const image = state.images[slug]
      if (image && !image.linkedNotes.includes(noteId)) {
        image.linkedNotes.push(noteId)
        image.modified = new Date().toISOString()
      }
    }),

  unlinkFromNote: (slug, noteId) =>
    set((state) => {
      const image = state.images[slug]
      if (image) {
        image.linkedNotes = image.linkedNotes.filter((n) => n !== noteId)
        image.modified = new Date().toISOString()
      }
    }),

  // Metadata updates
  updateDescription: (slug, description) =>
    set((state) => {
      const image = state.images[slug]
      if (image) {
        image.description = description
        image.modified = new Date().toISOString()
      }
    })
})
