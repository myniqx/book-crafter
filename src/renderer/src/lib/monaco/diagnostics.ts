import type { editor, IRange, languages } from 'monaco-editor'
import type { Entity } from '@renderer/store/slices/entitySlice'

// Diagnostics provider for entity validation
export class EntityDiagnosticsProvider {
  private monaco: typeof import('monaco-editor')
  private entities: Map<string, Entity> = new Map()

  constructor(monaco: typeof import('monaco-editor')) {
    this.monaco = monaco
  }

  // Update entities list
  updateEntities(entities: Record<string, Entity>): void {
    this.entities.clear()
    Object.values(entities).forEach((entity) => {
      this.entities.set(entity.slug, entity)
    })
  }

  // Validate document and provide diagnostics
  validate(model: editor.ITextModel): void {
    const diagnostics: editor.IMarkerData[] = []
    const content = model.getValue()
    const lines = content.split('\n')

    lines.forEach((line, lineIndex) => {
      // Find all @mentions in the line
      const mentionRegex = /@([a-zA-Z0-9_-]+)(?:\.([a-zA-Z0-9_-]+))?/g
      let match: RegExpExecArray | null

      while ((match = mentionRegex.exec(line)) !== null) {
        const fullMatch = match[0]
        const entitySlug = match[1]
        const fieldSlug = match[2]

        const startColumn = match.index + 1
        const endColumn = startColumn + fullMatch.length

        // Check if entity exists
        const entity = this.entities.get(entitySlug)
        if (!entity) {
          diagnostics.push({
            severity: this.monaco.MarkerSeverity.Error,
            startLineNumber: lineIndex + 1,
            startColumn,
            endLineNumber: lineIndex + 1,
            endColumn,
            message: `Undefined entity: @${entitySlug}`,
            code: 'undefined-entity'
          })
          continue
        }

        // If field is specified, check if it exists
        if (fieldSlug) {
          // Find field by name (converted to slug format)
          const field = entity.fields.find((f) => {
            const fSlug = f.name.toLowerCase().replace(/\s+/g, '-')
            return fSlug === fieldSlug || f.name.toLowerCase() === fieldSlug.toLowerCase()
          })

          if (!field) {
            diagnostics.push({
              severity: this.monaco.MarkerSeverity.Error,
              startLineNumber: lineIndex + 1,
              startColumn: startColumn + entitySlug.length + 1, // After @entity.
              endLineNumber: lineIndex + 1,
              endColumn,
              message: `Undefined field: ${fieldSlug} in @${entitySlug}`,
              code: 'undefined-field'
            })
          }
        }
      }

      // Check for unclosed comments
      if (line.includes('/*') && !line.includes('*/')) {
        const index = line.indexOf('/*')
        diagnostics.push({
          severity: this.monaco.MarkerSeverity.Warning,
          startLineNumber: lineIndex + 1,
          startColumn: index + 1,
          endLineNumber: lineIndex + 1,
          endColumn: index + 3,
          message: 'Unclosed block comment',
          code: 'unclosed-comment'
        })
      }
    })

    // Set markers
    this.monaco.editor.setModelMarkers(model, 'book-crafter', diagnostics)
  }

  // Clear diagnostics
  clear(model: editor.ITextModel): void {
    this.monaco.editor.setModelMarkers(model, 'book-crafter', [])
  }
}

// Create and setup diagnostics provider
export function setupDiagnostics(
  monaco: typeof import('monaco-editor'),
  entities: Record<string, Entity>
): EntityDiagnosticsProvider {
  const provider = new EntityDiagnosticsProvider(monaco)
  provider.updateEntities(entities)

  return provider
}
