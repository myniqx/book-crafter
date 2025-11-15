import type { languages, editor, IRange, IPosition } from 'monaco-editor'
import type { Entity } from '@renderer/store/slices/entitySlice'
import { getDefaultFieldValue, getFieldValue } from '@renderer/lib/entity'

// Hover provider for @mentions
export class EntityHoverProvider implements languages.HoverProvider {
  private entities: Map<string, Entity> = new Map()

  constructor() {
    // Constructor can be empty, entities will be updated dynamically
  }

  // Update entities list
  updateEntities(entities: Record<string, Entity>): void {
    this.entities.clear()
    Object.values(entities).forEach((entity) => {
      this.entities.set(entity.slug, entity)
    })
  }

  provideHover(
    model: editor.ITextModel,
    position: IPosition
  ): languages.ProviderResult<languages.Hover> {
    const word = model.getWordAtPosition(position)
    if (!word) return null

    const lineContent = model.getLineContent(position.lineNumber)
    const wordStart = word.startColumn
    const wordEnd = word.endColumn

    // Check if there's an @ symbol before the word
    if (wordStart > 1 && lineContent[wordStart - 2] === '@') {
      const entitySlug = word.word

      // Check if it's a field access (e.g., @entity.field)
      if (wordEnd <= lineContent.length && lineContent[wordEnd - 1] === '.') {
        // This is the entity part of @entity.field
        return this.createEntityHover(entitySlug, position)
      } else if (wordStart > 1 && lineContent[wordStart - 3] === '.') {
        // This is the field part of @entity.field
        // Find the entity slug
        const beforeWord = lineContent.substring(0, wordStart - 2)
        const entityMatch = beforeWord.match(/@([a-zA-Z0-9_-]+)$/)
        if (entityMatch) {
          const entitySlug = entityMatch[1]
          const fieldSlug = word.word
          return this.createFieldHover(entitySlug, fieldSlug, position)
        }
      } else {
        // Just @entity
        return this.createEntityHover(entitySlug, position)
      }
    }

    return null
  }

  // Create hover for entity
  private createEntityHover(
    entitySlug: string,
    position: IPosition
  ): languages.Hover | null {
    const entity = this.entities.get(entitySlug)
    if (!entity) {
      return {
        range: this.createRange(position),
        contents: [
          { value: '**⚠️ Undefined Entity**' },
          { value: `Entity \`@${entitySlug}\` not found` }
        ]
      }
    }

    const defaultValue = getDefaultFieldValue(entity)

    const fieldsTable = entity.fields
      .map((f) => {
        const mark = f.name === entity.defaultField ? '⭐' : ''
        return `| ${mark} ${f.name} | \`${f.value || '(empty)'}\` | ${f.type} |`
      })
      .join('\n')

    const relationsInfo =
      entity.relations.length > 0
        ? `\n\n**Relations:** ${entity.relations.map((r) => `${r.type} → @${r.targetEntitySlug}`).join(', ')}`
        : ''

    const notesInfo =
      entity.notes.length > 0 ? `\n\n**Notes:** ${entity.notes.length} note(s)` : ''

    const usageInfo = `\n\n**Usage:** ${entity.metadata.usageCount} occurrence(s)`

    return {
      range: this.createRange(position),
      contents: [
        { value: `**${entity.type}**: ${entity.name}` },
        { value: `**Slug:** @${entity.slug}` },
        { value: `**Default:** ${defaultValue}` },
        { value: '---' },
        { value: '**Fields:**\n\n| Field | Value | Type |\n|-------|-------|------|\n' + fieldsTable },
        { value: relationsInfo + notesInfo + usageInfo }
      ]
    }
  }

  // Create hover for field
  private createFieldHover(
    entitySlug: string,
    fieldSlug: string,
    position: IPosition
  ): languages.Hover | null {
    const entity = this.entities.get(entitySlug)
    if (!entity) {
      return {
        range: this.createRange(position),
        contents: [
          { value: '**⚠️ Undefined Entity**' },
          { value: `Entity \`@${entitySlug}\` not found` }
        ]
      }
    }

    // Find field by name (converted to slug format)
    const field = entity.fields.find((f) => {
      const fSlug = f.name.toLowerCase().replace(/\s+/g, '-')
      return fSlug === fieldSlug || f.name.toLowerCase() === fieldSlug.toLowerCase()
    })

    if (!field) {
      return {
        range: this.createRange(position),
        contents: [
          { value: '**⚠️ Undefined Field**' },
          { value: `Field \`${fieldSlug}\` not found in @${entitySlug}` }
        ]
      }
    }

    const isDefault = field.name === entity.defaultField ? ' ⭐ (default)' : ''

    return {
      range: this.createRange(position),
      contents: [
        { value: `**${field.name}**${isDefault}` },
        { value: `**Value:** \`${field.value || '(empty)'}\`` },
        { value: `**Type:** ${field.type}` },
        { value: `**Entity:** @${entitySlug} - ${entity.name} (${entity.type})` }
      ]
    }
  }

  // Create range for hover
  private createRange(position: IPosition): IRange {
    return {
      startLineNumber: position.lineNumber,
      startColumn: position.column,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    }
  }
}

// Register the hover provider
export function registerEntityHoverProvider(
  monaco: typeof import('monaco-editor'),
  entities: Record<string, Entity>
): EntityHoverProvider {
  const provider = new EntityHoverProvider()
  provider.updateEntities(entities)

  monaco.languages.registerHoverProvider('book-crafter-markdown', provider)

  return provider
}
