/**
 * System prompt building utilities for AI providers
 */

import type { AIContext, AIProvider } from '../types'

// Re-export type for internal use
type AIProviderType = AIProvider

/**
 * Default system prompt for writing assistant
 */
export function getDefaultSystemPrompt(): string {
  return `You are an AI writing assistant for Book Crafter, a professional book authoring tool.

## Core Guidelines

**Language Rules:**
- Always respond in the SAME LANGUAGE as the user's message
- When writing to chapters, use the book's primary language
- Never switch languages mid-conversation unless explicitly requested

**Tool Usage:**
- Execute requested tools immediately and concisely
- Present results clearly without listing all available tools
- Focus on answering the user's specific question
- After using tools, provide brief, actionable insights

**Writing Assistance:**
- Help with creative writing, grammar, character development, and plot consistency
- Maintain the author's voice and style
- Provide constructive feedback when requested
- Be concise and direct in your responses

**Professional Tone:**
- Be helpful and supportive
- Respect the author's creative decisions
- Provide suggestions, not instructions
- Keep responses focused and relevant`
}

/**
 * Build context-aware system prompt
 * Includes information about current book, chapter, and available resources
 */
export function buildContextAwareSystemPrompt(context?: AIContext, customPrompt?: string): string {
  const parts: string[] = []

  // Base system prompt
  if (customPrompt) {
    parts.push(customPrompt)
  } else {
    parts.push(getDefaultSystemPrompt())
  }

  // Add context information if available
  if (context) {
    const contextInfo: string[] = []

    // Current working context
    if (context.currentChapter) {
      contextInfo.push('\n## Current Working Context')
      contextInfo.push(`- **Active Book:** ${context.currentChapter.bookSlug}`)
      contextInfo.push(
        `- **Active Chapter:** ${context.currentChapter.title} (${context.currentChapter.chapterSlug})`
      )
    }

    // Entity information
    if (context.entities && context.entities.length > 0) {
      contextInfo.push(
        `- **Available Entities:** ${context.entities.length} characters/locations/items`
      )

      // List entity names for quick reference
      const entityNames = context.entities.map((e) => e.name).slice(0, 10)
      if (entityNames.length > 0) {
        contextInfo.push(
          `- **Entity Names:** ${entityNames.join(', ')}${context.entities.length > 10 ? '...' : ''}`
        )
      }
    }

    // Selection context
    if (context.selection) {
      contextInfo.push(
        `- **Selected Text:** "${context.selection.text.substring(0, 100)}${context.selection.text.length > 100 ? '...' : ''}"`
      )
    }

    if (contextInfo.length > 0) {
      parts.push(contextInfo.join('\n'))
    }

    // Tool usage hints
    parts.push('\n## Tool Usage Guidelines')
    parts.push('When performing operations:')

    if (context.currentChapter) {
      parts.push(
        `- For book operations, use the current book: "${context.currentChapter.bookSlug}"`
      )
      parts.push(
        `- For chapter operations, use the current chapter: "${context.currentChapter.chapterSlug}"`
      )
    } else {
      parts.push(
        '- No book/chapter is currently selected. Ask the user to specify which book/chapter to work with.'
      )
    }

    parts.push('- Use list_books to see all available books')
    parts.push('- Use list_entities to see all characters, locations, and items')
  }

  return parts.join('\n')
}

/**
 * Build context prompt for message history
 * This is added to conversation context, not system prompt
 */
export function buildContextPrompt(context: AIContext): string {
  const parts: string[] = []

  // Current chapter content
  if (context.currentChapter) {
    parts.push('## Current Chapter')
    parts.push(`Book: ${context.currentChapter.bookSlug}`)
    parts.push(`Chapter: ${context.currentChapter.title}`)
    if (context.currentChapter.content) {
      const preview = context.currentChapter.content.substring(0, 500)
      parts.push(
        `Content Preview:\n${preview}${context.currentChapter.content.length > 500 ? '...' : ''}`
      )
    }
  }

  // Selected text
  if (context.selection) {
    parts.push('\n## Selected Text')
    parts.push(context.selection.text)
  }

  // Entities
  if (context.entities && context.entities.length > 0) {
    parts.push('\n## Available Entities')
    context.entities.forEach((entity) => {
      const fields = entity.fields.map((f) => `${f.name}: ${f.value}`).join(', ')
      parts.push(`- ${entity.name} (${entity.slug}): ${fields}`)
    })
  }

  return parts.join('\n')
}

/**
 * Get provider-specific system prompt modifications
 */
export function getProviderSpecificPrompt(provider: AIProviderType, basePrompt: string): string {
  // Add any provider-specific modifications here
  switch (provider) {
    case 'anthropic':
      // Anthropic/Claude specific instructions
      return basePrompt
    case 'openai':
      // OpenAI specific instructions
      return basePrompt
    case 'ollama':
      // Ollama specific instructions
      return basePrompt
    default:
      return basePrompt
  }
}
