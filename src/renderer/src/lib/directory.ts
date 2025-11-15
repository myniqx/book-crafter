import ipcClient from '@renderer/lib/ipc'
import type { DirectoryStructure } from '@renderer/types'

// ============================================================================
// Constants
// ============================================================================

export const WORKSPACE_FOLDERS = {
  ENTITIES: '.entities',
  ASSETS: '.assets',
  NOTES: '.notes',
  BOOKS: 'books'
} as const

// ============================================================================
// Directory Structure Creation
// ============================================================================

export async function createWorkspaceStructure(rootPath: string): Promise<DirectoryStructure> {
  const structure: DirectoryStructure = {
    root: rootPath,
    entities: `${rootPath}/${WORKSPACE_FOLDERS.ENTITIES}`,
    assets: `${rootPath}/${WORKSPACE_FOLDERS.ASSETS}`,
    notes: `${rootPath}/${WORKSPACE_FOLDERS.NOTES}`,
    books: `${rootPath}/${WORKSPACE_FOLDERS.BOOKS}`
  }

  // Create all required directories
  for (const [key, path] of Object.entries(structure)) {
    if (key === 'root') continue

    const exists = await ipcClient.fs.exists(path)
    if (!exists) {
      await ipcClient.fs.mkdir(path, true)
    }
  }

  return structure
}

// ============================================================================
// Workspace Integrity Check
// ============================================================================

export interface IntegrityCheckResult {
  valid: boolean
  missing: string[]
  errors: string[]
}

export async function checkWorkspaceIntegrity(
  rootPath: string
): Promise<IntegrityCheckResult> {
  const result: IntegrityCheckResult = {
    valid: true,
    missing: [],
    errors: []
  }

  const requiredFolders = [
    WORKSPACE_FOLDERS.ENTITIES,
    WORKSPACE_FOLDERS.ASSETS,
    WORKSPACE_FOLDERS.NOTES,
    WORKSPACE_FOLDERS.BOOKS
  ]

  for (const folder of requiredFolders) {
    const path = `${rootPath}/${folder}`
    try {
      const exists = await ipcClient.fs.exists(path)
      if (!exists) {
        result.valid = false
        result.missing.push(folder)
      }
    } catch (error) {
      result.valid = false
      result.errors.push(`Failed to check ${folder}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return result
}

// ============================================================================
// Repair Functions
// ============================================================================

export async function repairWorkspaceStructure(rootPath: string): Promise<void> {
  const integrity = await checkWorkspaceIntegrity(rootPath)

  if (!integrity.valid && integrity.missing.length > 0) {
    for (const folder of integrity.missing) {
      const path = `${rootPath}/${folder}`
      await ipcClient.fs.mkdir(path, true)
    }
  }
}

// ============================================================================
// .gitignore Generation
// ============================================================================

export function generateGitignore(): string {
  return `# Node modules
node_modules/

# Build output
dist/
out/
build/

# Development
.DS_Store
Thumbs.db
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# Electron
.electron-vite/

# Temporary files
*.tmp
.cache/

# OS
.DS_Store
desktop.ini

# Book Crafter specific
.assets/cache/
*.backup

# Optional: Uncomment to ignore entities/notes (if using external sync)
# .entities/
# .notes/
`
}

export async function createGitignore(rootPath: string): Promise<void> {
  const gitignorePath = `${rootPath}/.gitignore`
  const exists = await ipcClient.fs.exists(gitignorePath)

  if (!exists) {
    const content = generateGitignore()
    await ipcClient.fs.writeFile(gitignorePath, content)
  }
}

// ============================================================================
// Workspace Initialization
// ============================================================================

export interface InitializeWorkspaceOptions {
  rootPath: string
  projectName: string
  author: string
  createGitignore?: boolean
}

export async function initializeWorkspace(
  options: InitializeWorkspaceOptions
): Promise<DirectoryStructure> {
  const { rootPath, createGitignore: shouldCreateGitignore = true } = options

  // Create directory structure
  const structure = await createWorkspaceStructure(rootPath)

  // Create .gitignore
  if (shouldCreateGitignore) {
    await createGitignore(rootPath)
  }

  return structure
}

// ============================================================================
// Path Utilities
// ============================================================================

export function getEntityPath(rootPath: string, entitySlug: string): string {
  return `${rootPath}/${WORKSPACE_FOLDERS.ENTITIES}/${entitySlug}.json`
}

export function getBookPath(rootPath: string, bookSlug: string): string {
  return `${rootPath}/${WORKSPACE_FOLDERS.BOOKS}/${bookSlug}`
}

export function getChapterPath(
  rootPath: string,
  bookSlug: string,
  chapterSlug: string
): string {
  return `${rootPath}/${WORKSPACE_FOLDERS.BOOKS}/${bookSlug}/${chapterSlug}`
}

export function getChapterContentPath(
  rootPath: string,
  bookSlug: string,
  chapterSlug: string
): string {
  return `${getChapterPath(rootPath, bookSlug, chapterSlug)}/content.md`
}

export function getNotePath(rootPath: string, noteId: string): string {
  return `${rootPath}/${WORKSPACE_FOLDERS.NOTES}/${noteId}.json`
}

export function getImagePath(rootPath: string, filename: string): string {
  return `${rootPath}/${WORKSPACE_FOLDERS.ASSETS}/${filename}`
}
