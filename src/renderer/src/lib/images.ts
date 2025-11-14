import type { Image } from './image'
import { getFileExtension } from './image'

/**
 * Get images directory path
 */
export function getImagesDir(workspacePath: string): string {
  return `${workspacePath}/.assets/images`
}

/**
 * Get image metadata file path
 */
export function getImageMetadataPath(workspacePath: string, slug: string): string {
  return `${getImagesDir(workspacePath)}/${slug}.json`
}

/**
 * Get image file path
 */
export function getImageFilePath(workspacePath: string, image: Image): string {
  return `${workspacePath}/${image.path}`
}

/**
 * Save image metadata to disk
 */
export async function saveImageMetadata(
  workspacePath: string,
  image: Image
): Promise<void> {
  const metadataPath = getImageMetadataPath(workspacePath, image.slug)
  const metadata = JSON.stringify(image, null, 2)

  if (window.api?.fs?.writeFile) {
    await window.api.fs.writeFile(metadataPath, metadata, 'utf-8')
  } else {
    throw new Error('File system API not available')
  }
}

/**
 * Load image metadata from disk
 */
export async function loadImageMetadata(
  workspacePath: string,
  slug: string
): Promise<Image | null> {
  const metadataPath = getImageMetadataPath(workspacePath, slug)

  try {
    if (window.api?.fs?.readFile) {
      const content = await window.api.fs.readFile(metadataPath, 'utf-8')
      const image = JSON.parse(content) as Image
      return image
    }
  } catch (error) {
    console.error(`Failed to load image metadata for ${slug}:`, error)
  }

  return null
}

/**
 * Load all images from workspace
 */
export async function loadAllImages(workspacePath: string): Promise<Record<string, Image>> {
  const imagesDir = getImagesDir(workspacePath)
  const images: Record<string, Image> = {}

  try {
    if (!window.api?.fs?.readDir) {
      throw new Error('File system API not available')
    }

    // Read all files in .assets/images/
    const files = await window.api.fs.readDir(imagesDir)

    // Filter JSON files (metadata)
    const metadataFiles = files.filter((file) => file.endsWith('.json'))

    // Load each image metadata
    for (const file of metadataFiles) {
      const slug = file.replace('.json', '')
      const image = await loadImageMetadata(workspacePath, slug)
      if (image) {
        images[slug] = image
      }
    }
  } catch (error) {
    console.error('Failed to load images:', error)
  }

  return images
}

/**
 * Copy uploaded file to workspace .assets/images/
 */
export async function copyImageToWorkspace(
  workspacePath: string,
  sourcePath: string,
  targetFilename: string
): Promise<string> {
  const imagesDir = getImagesDir(workspacePath)
  const targetPath = `${imagesDir}/${targetFilename}`

  if (window.api?.fs?.copyFile) {
    await window.api.fs.copyFile(sourcePath, targetPath)
  } else {
    throw new Error('File system API not available')
  }

  // Return relative path from workspace root
  return `.assets/images/${targetFilename}`
}

/**
 * Delete image from workspace
 */
export async function deleteImage(workspacePath: string, image: Image): Promise<void> {
  // Delete metadata file
  const metadataPath = getImageMetadataPath(workspacePath, image.slug)
  if (window.api?.fs?.deleteFile) {
    await window.api.fs.deleteFile(metadataPath)
  }

  // Delete image file
  const imagePath = getImageFilePath(workspacePath, image)
  if (window.api?.fs?.deleteFile) {
    await window.api.fs.deleteFile(imagePath)
  }
}

/**
 * Update image metadata
 */
export async function updateImageMetadata(
  workspacePath: string,
  slug: string,
  updates: Partial<Image>
): Promise<void> {
  // Load existing metadata
  const existing = await loadImageMetadata(workspacePath, slug)
  if (!existing) {
    throw new Error(`Image not found: ${slug}`)
  }

  // Merge updates
  const updated: Image = {
    ...existing,
    ...updates,
    modified: new Date().toISOString()
  }

  // Save back
  await saveImageMetadata(workspacePath, updated)
}

/**
 * Get image URL for display (file:// protocol)
 */
export function getImageUrl(workspacePath: string, image: Image): string {
  const fullPath = getImageFilePath(workspacePath, image)
  // Convert to file:// URL for img src
  return `file://${fullPath}`
}

/**
 * Export image (copy to external location)
 */
export async function exportImage(
  workspacePath: string,
  image: Image,
  targetPath: string
): Promise<void> {
  const sourcePath = getImageFilePath(workspacePath, image)

  if (window.api?.fs?.copyFile) {
    await window.api.fs.copyFile(sourcePath, targetPath)
  } else {
    throw new Error('File system API not available')
  }
}

/**
 * Rename image slug (update metadata file and references)
 */
export async function renameImageSlug(
  workspacePath: string,
  oldSlug: string,
  newSlug: string
): Promise<void> {
  // Load existing metadata
  const image = await loadImageMetadata(workspacePath, oldSlug)
  if (!image) {
    throw new Error(`Image not found: ${oldSlug}`)
  }

  // Create new metadata with new slug
  const newImage: Image = {
    ...image,
    slug: newSlug,
    modified: new Date().toISOString()
  }

  // Save new metadata
  await saveImageMetadata(workspacePath, newImage)

  // Delete old metadata
  const oldMetadataPath = getImageMetadataPath(workspacePath, oldSlug)
  if (window.api?.fs?.deleteFile) {
    await window.api.fs.deleteFile(oldMetadataPath)
  }

  // Note: Image file itself doesn't need to be renamed (uses slug-based name already)
  // Note: References in markdown need to be updated separately (Phase 12: Search & Replace)
}
