import slugify from 'slugify'

/**
 * Image metadata interface
 */
export interface Image {
  slug: string
  filename: string
  originalFilename: string
  path: string // Relative path from workspace root (.assets/images/...)
  size: number // bytes
  width?: number
  height?: number
  mimeType: string
  tags: string[]
  description: string
  created: string
  modified: string
  linkedEntities: string[] // Entity slugs
  linkedBooks: string[] // Book slugs (for covers)
  linkedNotes: string[] // Note IDs
}

/**
 * Supported image formats
 */
export const SUPPORTED_IMAGE_FORMATS = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/svg+xml'
] as const

export const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'] as const

/**
 * Max file size (10MB)
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024

/**
 * Generate image slug from filename
 */
export function generateImageSlug(filename: string, existingSlugs: string[]): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '')

  // Generate base slug
  let slug = slugify(nameWithoutExt, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  })

  // Ensure uniqueness
  if (!existingSlugs.includes(slug)) {
    return slug
  }

  // Add number suffix
  let counter = 1
  let uniqueSlug = `${slug}-${counter}`
  while (existingSlugs.includes(uniqueSlug)) {
    counter++
    uniqueSlug = `${slug}-${counter}`
  }

  return uniqueSlug
}

/**
 * Validate image slug
 */
export function validateImageSlug(slug: string): boolean {
  if (!slug || slug.length === 0) {
    return false
  }

  // Must be alphanumeric with hyphens/underscores
  const slugRegex = /^[a-z0-9_-]+$/
  return slugRegex.test(slug)
}

/**
 * Check if slug is unique
 */
export function isImageSlugUnique(slug: string, images: Record<string, Image>): boolean {
  return !images[slug]
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type as any)) {
    return {
      valid: false,
      error: `Unsupported image format: ${file.type}. Supported: PNG, JPEG, GIF, WebP, SVG`
    }
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Max: 10MB`
    }
  }

  return { valid: true }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const match = filename.match(/\.[^.]+$/)
  return match ? match[0] : ''
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Get image dimensions from File
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Create image metadata
 */
export async function createImageMetadata(
  file: File,
  slug: string,
  relativePath: string
): Promise<Image> {
  const now = new Date().toISOString()

  // Get dimensions (if possible)
  let width: number | undefined
  let height: number | undefined

  try {
    const dimensions = await getImageDimensions(file)
    width = dimensions.width
    height = dimensions.height
  } catch {
    // Skip dimensions for non-image files (like SVG without proper headers)
  }

  return {
    slug,
    filename: `${slug}${getFileExtension(file.name)}`,
    originalFilename: file.name,
    path: relativePath,
    size: file.size,
    width,
    height,
    mimeType: file.type,
    tags: [],
    description: '',
    created: now,
    modified: now,
    linkedEntities: [],
    linkedBooks: [],
    linkedNotes: []
  }
}

/**
 * Filter images by tag
 */
export function filterImagesByTag(images: Record<string, Image>, tag: string): Image[] {
  return Object.values(images).filter((img) => img.tags.includes(tag))
}

/**
 * Search images by slug or filename
 */
export function searchImages(images: Record<string, Image>, query: string): Image[] {
  const lowerQuery = query.toLowerCase()
  return Object.values(images).filter(
    (img) =>
      img.slug.toLowerCase().includes(lowerQuery) ||
      img.originalFilename.toLowerCase().includes(lowerQuery) ||
      img.description.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Sort images
 */
export type ImageSortBy = 'name' | 'size' | 'date' | 'usage'

export function sortImages(images: Image[], sortBy: ImageSortBy): Image[] {
  const sorted = [...images]

  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => a.slug.localeCompare(b.slug))
      break
    case 'size':
      sorted.sort((a, b) => b.size - a.size)
      break
    case 'date':
      sorted.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      break
    case 'usage':
      sorted.sort((a, b) => {
        const aUsage =
          a.linkedEntities.length + a.linkedBooks.length + a.linkedNotes.length
        const bUsage =
          b.linkedEntities.length + b.linkedBooks.length + b.linkedNotes.length
        return bUsage - aUsage
      })
      break
  }

  return sorted
}

/**
 * Get all unique tags from images
 */
export function getAllTags(images: Record<string, Image>): string[] {
  const tagSet = new Set<string>()
  Object.values(images).forEach((img) => {
    img.tags.forEach((tag) => tagSet.add(tag))
  })
  return Array.from(tagSet).sort()
}
