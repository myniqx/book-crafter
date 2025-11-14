import type { Entity } from '@renderer/store/slices/entitySlice'
import { validateEntity } from './entity'

/**
 * Entity File Operations
 * These functions interact with the file system through IPC to save/load entities
 */

const ENTITIES_DIR = '.entities'

/**
 * Get the path to an entity file
 */
export function getEntityPath(workspacePath: string, slug: string): string {
  return `${workspacePath}/${ENTITIES_DIR}/${slug}.json`
}

/**
 * Get the entities directory path
 */
export function getEntitiesDir(workspacePath: string): string {
  return `${workspacePath}/${ENTITIES_DIR}`
}

/**
 * Save an entity to disk
 */
export async function saveEntity(workspacePath: string, entity: Entity): Promise<void> {
  // Validate entity before saving
  const errors = validateEntity(entity)
  if (errors.length > 0) {
    throw new Error(`Invalid entity: ${errors.map((e) => e.message).join(', ')}`)
  }

  const entityPath = getEntityPath(workspacePath, entity.slug)
  const entityData = JSON.stringify(entity, null, 2)

  // Use IPC to write file
  if (window.api?.fs?.writeFile) {
    await window.api.fs.writeFile(entityPath, entityData, 'utf-8')
  } else {
    throw new Error('File system API not available')
  }
}

/**
 * Load an entity from disk
 */
export async function loadEntity(workspacePath: string, slug: string): Promise<Entity> {
  const entityPath = getEntityPath(workspacePath, slug)

  // Use IPC to read file
  if (window.api?.fs?.readFile) {
    const data = await window.api.fs.readFile(entityPath, 'utf-8')
    const entity = JSON.parse(data) as Entity

    // Validate loaded entity
    const errors = validateEntity(entity)
    if (errors.length > 0) {
      throw new Error(`Invalid entity file: ${errors.map((e) => e.message).join(', ')}`)
    }

    return entity
  } else {
    throw new Error('File system API not available')
  }
}

/**
 * Delete an entity from disk
 */
export async function deleteEntity(workspacePath: string, slug: string): Promise<void> {
  const entityPath = getEntityPath(workspacePath, slug)

  if (window.api?.fs?.deleteFile) {
    await window.api.fs.deleteFile(entityPath)
  } else {
    throw new Error('File system API not available')
  }
}

/**
 * Load all entities from the workspace
 */
export async function loadAllEntities(workspacePath: string): Promise<Record<string, Entity>> {
  const entitiesDir = getEntitiesDir(workspacePath)

  if (!window.api?.fs?.readDir) {
    throw new Error('File system API not available')
  }

  // Check if entities directory exists
  const dirExists = window.api.fs.dirExists
    ? await window.api.fs.dirExists(entitiesDir)
    : true

  if (!dirExists) {
    // If directory doesn't exist, create it and return empty object
    if (window.api.fs.mkdir) {
      await window.api.fs.mkdir(entitiesDir, { recursive: true })
    }
    return {}
  }

  // Read all .json files from entities directory
  const files = await window.api.fs.readDir(entitiesDir, {
    recursive: false,
    filter: '*.json'
  })

  const entities: Record<string, Entity> = {}

  // Load each entity file
  for (const file of files) {
    try {
      // Extract slug from filename (remove .json extension)
      const slug = file.replace('.json', '')
      const entity = await loadEntity(workspacePath, slug)
      entities[entity.slug] = entity
    } catch (error) {
      console.error(`Failed to load entity ${file}:`, error)
      // Continue loading other entities even if one fails
    }
  }

  return entities
}

/**
 * Rename an entity (update slug)
 */
export async function renameEntity(
  workspacePath: string,
  oldSlug: string,
  newSlug: string
): Promise<void> {
  const oldPath = getEntityPath(workspacePath, oldSlug)
  const newPath = getEntityPath(workspacePath, newSlug)

  if (window.api?.fs?.moveFile) {
    await window.api.fs.moveFile(oldPath, newPath)
  } else {
    throw new Error('File system API not available')
  }
}

/**
 * Check if an entity file exists
 */
export async function entityExists(workspacePath: string, slug: string): Promise<boolean> {
  const entityPath = getEntityPath(workspacePath, slug)

  if (window.api?.fs?.fileExists) {
    return await window.api.fs.fileExists(entityPath)
  }

  return false
}

/**
 * Export all entities to a JSON file (backup)
 */
export async function exportEntities(
  workspacePath: string,
  entities: Record<string, Entity>
): Promise<void> {
  const exportPath = `${workspacePath}/entities-backup-${Date.now()}.json`
  const data = JSON.stringify(entities, null, 2)

  if (window.api?.fs?.writeFile) {
    await window.api.fs.writeFile(exportPath, data, 'utf-8')
  } else {
    throw new Error('File system API not available')
  }
}

/**
 * Import entities from a JSON file
 */
export async function importEntities(
  workspacePath: string,
  filePath: string
): Promise<Record<string, Entity>> {
  if (window.api?.fs?.readFile) {
    const data = await window.api.fs.readFile(filePath, 'utf-8')
    const entities = JSON.parse(data) as Record<string, Entity>

    // Validate all entities
    for (const [slug, entity] of Object.entries(entities)) {
      const errors = validateEntity(entity)
      if (errors.length > 0) {
        throw new Error(`Invalid entity ${slug}: ${errors.map((e) => e.message).join(', ')}`)
      }
    }

    return entities
  } else {
    throw new Error('File system API not available')
  }
}
