import type { Entity } from '@renderer/store/slices/entitySlice'
import type { Image } from './image'
import { getDefaultFieldValue } from './entity'
import { getImageUrl } from './images'

/**
 * Remove single-line comments (//) from markdown content
 */
export function removeSingleLineComments(content: string): string {
  const lines = content.split('\n')
  const filtered = lines.filter((line) => {
    const trimmed = line.trim()
    return !trimmed.startsWith('//')
  })
  return filtered.join('\n')
}

/**
 * Remove multi-line comments (/* *\/) from markdown content
 */
export function removeMultiLineComments(content: string): string {
  // Remove /* ... */ comments (non-greedy, multiline)
  return content.replace(/\/\*[\s\S]*?\*\//g, '')
}

/**
 * Remove all comments (both single-line and multi-line) from markdown content
 */
export function removeComments(content: string): string {
  let result = content
  result = removeMultiLineComments(result)
  result = removeSingleLineComments(result)
  return result
}

/**
 * Replace @entity-slug mentions with entity's default field value
 * Example: @john-doe -> "John Doe"
 */
export function replaceEntityMentions(
  content: string,
  entities: Record<string, Entity>
): string {
  // Match @entity-slug (alphanumeric, hyphens, underscores)
  const mentionRegex = /@([a-zA-Z0-9_-]+)(?!\.)/g

  return content.replace(mentionRegex, (match, slug) => {
    const entity = entities[slug]
    if (!entity) {
      // Keep the mention as-is if entity not found
      return match
    }

    const defaultValue = getDefaultFieldValue(entity)
    return defaultValue || entity.name || match
  })
}

/**
 * Replace @entity-slug.field mentions with the field's value
 * Example: @john-doe.Age -> "42"
 */
export function replaceEntityFieldMentions(
  content: string,
  entities: Record<string, Entity>
): string {
  // Match @entity-slug.FieldName
  const fieldMentionRegex = /@([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]+)/g

  return content.replace(fieldMentionRegex, (match, slug, fieldName) => {
    const entity = entities[slug]
    if (!entity) {
      return match
    }

    // Find field by name (case-insensitive)
    const field = entity.fields.find(
      (f) => f.name.toLowerCase() === fieldName.toLowerCase()
    )

    if (!field) {
      return match
    }

    return field.value || '(empty)'
  })
}

/**
 * Replace @image-slug mentions with actual image tags
 * Example: @image-photo-1 -> <img src="file://..." alt="photo-1" />
 */
export function replaceImageMentions(
  content: string,
  images: Record<string, Image>,
  workspacePath: string
): string {
  // Match @image-slug
  const imageRegex = /@image-([a-zA-Z0-9_-]+)/g

  return content.replace(imageRegex, (match, slug) => {
    const image = images[slug]
    if (!image) {
      // Keep the mention as-is if image not found
      return match
    }

    const imageUrl = getImageUrl(workspacePath, image)
    const alt = image.description || image.slug

    // Return markdown image syntax
    return `![${alt}](${imageUrl})`
  })
}

/**
 * Process markdown content for preview:
 * - Remove comments
 * - Replace @image mentions with image tags
 * - Replace @entity mentions with values
 * - Replace @entity.field mentions with field values
 */
export function processMarkdownForPreview(
  content: string,
  entities: Record<string, Entity>,
  images: Record<string, Image>,
  workspacePath: string
): string {
  let result = content

  // Step 1: Remove comments
  result = removeComments(result)

  // Step 2: Replace @image mentions
  result = replaceImageMentions(result, images, workspacePath)

  // Step 3: Replace @entity.field mentions (must be before @entity to avoid conflicts)
  result = replaceEntityFieldMentions(result, entities)

  // Step 4: Replace @entity mentions
  result = replaceEntityMentions(result, entities)

  return result
}

/**
 * Count words in markdown content (after processing)
 */
export function countMarkdownWords(content: string): number {
  // Remove markdown syntax for accurate word count
  let text = content

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '')

  // Remove inline code
  text = text.replace(/`[^`]+`/g, '')

  // Remove links [text](url)
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Remove images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')

  // Remove headers #
  text = text.replace(/^#+\s+/gm, '')

  // Remove bold/italic **text** or *text*
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/\*([^*]+)\*/g, '$1')

  // Remove underscores __text__ or _text_
  text = text.replace(/__([^_]+)__/g, '$1')
  text = text.replace(/_([^_]+)_/g, '$1')

  // Split by whitespace and filter empty strings
  const words = text
    .split(/\s+/)
    .filter((word) => word.length > 0 && /\w/.test(word))

  return words.length
}

/**
 * Extract plain text from markdown (no formatting)
 */
export function extractPlainText(content: string): string {
  let text = content

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '')

  // Remove inline code
  text = text.replace(/`[^`]+`/g, '')

  // Remove links [text](url) -> keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')

  // Remove headers
  text = text.replace(/^#+\s+/gm, '')

  // Remove bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/\*([^*]+)\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1')
  text = text.replace(/_([^_]+)_/g, '$1')

  // Remove strikethrough
  text = text.replace(/~~([^~]+)~~/g, '$1')

  return text.trim()
}

/**
 * Get reading time estimate (words per minute = 200)
 */
export function getReadingTime(wordCount: number): string {
  const wordsPerMinute = 200
  const minutes = Math.ceil(wordCount / wordsPerMinute)

  if (minutes === 1) {
    return '1 min read'
  }

  return `${minutes} min read`
}
