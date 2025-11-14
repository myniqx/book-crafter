// ============================================================================
// Workspace Configuration Types
// ============================================================================

export interface AIProvider {
  type: 'ollama' | 'openai' | 'anthropic'
  endpoint: string
  model: string
  apiKey?: string
  maxTokens?: number
  temperature?: number
}

export interface EditorSettings {
  fontSize: number
  lineHeight: number
  wordWrap: boolean
  minimap: boolean
  lineNumbers: boolean
  tabSize: number
  autoSave: boolean
  autoSaveDelay: number
}

export interface WorkspaceConfig {
  projectName: string
  version: string
  author: string
  created: string
  modified: string
  aiConfig?: AIProvider
  editorSettings: EditorSettings
}

// ============================================================================
// Book & Chapter Types
// ============================================================================

export interface Chapter {
  slug: string
  title: string
  order: number
  content: string
  wordCount: number
  created: string
  modified: string
  tags?: string[]
}

export interface Book {
  slug: string
  title: string
  subtitle?: string
  author: string
  description?: string
  coverImage?: string
  chapters: string[]
  created: string
  modified: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

// ============================================================================
// Entity Types
// ============================================================================

export type EntityFieldType = 'text' | 'number' | 'date' | 'boolean' | 'longtext'

export interface EntityField {
  slug: string
  label: string
  type: EntityFieldType
  value: string | number | boolean
  isDefault?: boolean
}

export interface EntityRelation {
  targetSlug: string
  type: string
  description?: string
}

export interface ChecklistItem {
  id: string
  content: string
  completed: boolean
  completedAt?: string
  completedIn?: {
    bookSlug: string
    chapterSlug: string
    line: number
  }
}

export interface EntityNote {
  id: string
  content: string
  type: 'note' | 'checklist'
  checklistItems?: ChecklistItem[]
  created: string
  modified: string
}

export interface EntityUsageLocation {
  bookSlug: string
  chapterSlug: string
  line: number
  context: string
}

export interface Entity {
  slug: string
  type: string
  fields: EntityField[]
  relations: EntityRelation[]
  notes: EntityNote[]
  usage: {
    count: number
    locations: EntityUsageLocation[]
  }
  created: string
  modified: string
}

// ============================================================================
// Image Types
// ============================================================================

export interface Image {
  id: string
  slug: string
  filename: string
  path: string
  thumbnailPath?: string
  width?: number
  height?: number
  size: number
  mimeType: string
  tags?: string[]
  linkedEntities?: string[]
  linkedNotes?: string[]
  created: string
  modified: string
}

// ============================================================================
// Note Types
// ============================================================================

export interface Note {
  id: string
  slug: string
  title: string
  content: string
  type: 'general' | 'research' | 'todo' | 'idea'
  tags?: string[]
  linkedEntities?: string[]
  linkedImages?: string[]
  linkedChapters?: Array<{
    bookSlug: string
    chapterSlug: string
  }>
  created: string
  modified: string
}

// ============================================================================
// File Structure Types
// ============================================================================

export interface DirectoryStructure {
  root: string
  entities: string
  assets: string
  notes: string
  books: string
}

export interface FileSystemError extends Error {
  code: string
  path?: string
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// ============================================================================
// Migration Types
// ============================================================================

export interface MigrationContext {
  fromVersion: string
  toVersion: string
  config: unknown
}

export type MigrationFunction = (context: MigrationContext) => Promise<WorkspaceConfig>

export interface Migration {
  version: string
  up: MigrationFunction
  description: string
}

// ============================================================================
// Utility Types
// ============================================================================

export type Sluggable = {
  slug: string
  [key: string]: unknown
}

export type Timestamp = {
  created: string
  modified: string
}
