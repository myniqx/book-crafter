import type { languages, editor, IRange } from 'monaco-editor'
import type { Entity } from '@renderer/types'

// Completion provider for @mentions
export class EntityCompletionProvider implements languages.CompletionItemProvider {
  triggerCharacters = ['@', '.']

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

  provideCompletionItems(
    model: editor.ITextModel,
    position: languages.Position
  ): languages.ProviderResult<languages.CompletionList> {
    const textUntilPosition = model.getValueInRange({
      startLineNumber: position.lineNumber,
      startColumn: 1,
      endLineNumber: position.lineNumber,
      endColumn: position.column
    })

    // Check if we're typing an @mention
    const mentionMatch = textUntilPosition.match(/@([a-zA-Z0-9_-]*)$/)
    if (mentionMatch) {
      return this.provideEntitySuggestions(mentionMatch[1], model, position)
    }

    // Check if we're accessing a field (e.g., @john-doe.)
    const fieldMatch = textUntilPosition.match(/@([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_-]*)$/)
    if (fieldMatch) {
      const entitySlug = fieldMatch[1]
      const partialField = fieldMatch[2]
      return this.provideFieldSuggestions(entitySlug, partialField, model, position)
    }

    return { suggestions: [] }
  }

  // Provide entity suggestions
  private provideEntitySuggestions(
    partial: string,
    model: editor.ITextModel,
    position: languages.Position
  ): languages.CompletionList {
    const word = model.getWordUntilPosition(position)
    const range: IRange = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn - 1, // Include @ symbol
      endColumn: word.endColumn
    }

    const suggestions: languages.CompletionItem[] = []

    this.entities.forEach((entity) => {
      // Fuzzy filter
      if (entity.slug.toLowerCase().includes(partial.toLowerCase())) {
        const defaultField = entity.fields.find((f) => f.isDefault)
        const preview = defaultField ? String(defaultField.value) : entity.slug

        suggestions.push({
          label: entity.slug,
          kind: 9, // Variable
          detail: entity.type,
          documentation: {
            value: `**${entity.type}**\n\n${preview}\n\n---\n\nFields: ${entity.fields.map((f) => f.label).join(', ')}`
          },
          insertText: entity.slug,
          range
        })
      }
    })

    return { suggestions }
  }

  // Provide field suggestions
  private provideFieldSuggestions(
    entitySlug: string,
    partialField: string,
    model: editor.ITextModel,
    position: languages.Position
  ): languages.CompletionList {
    const entity = this.entities.get(entitySlug)
    if (!entity) {
      return { suggestions: [] }
    }

    const word = model.getWordUntilPosition(position)
    const range: IRange = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn
    }

    const suggestions: languages.CompletionItem[] = []

    entity.fields.forEach((field) => {
      if (field.slug.toLowerCase().includes(partialField.toLowerCase())) {
        suggestions.push({
          label: field.slug,
          kind: 5, // Field
          detail: `${field.label} (${field.type})`,
          documentation: {
            value: `**Value:** ${String(field.value)}\n\n**Type:** ${field.type}`
          },
          insertText: field.slug,
          range
        })
      }
    })

    return { suggestions }
  }
}

// Register the completion provider
export function registerEntityCompletionProvider(
  monaco: typeof import('monaco-editor'),
  entities: Record<string, Entity>
): EntityCompletionProvider {
  const provider = new EntityCompletionProvider()
  provider.updateEntities(entities)

  monaco.languages.registerCompletionItemProvider('book-crafter-markdown', provider)

  return provider
}
