import type { Entity } from '@renderer/store/slices/entitySlice'
import { validateEntity } from './entity'
import ipcClient from './ipc'

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
  await ipcClient.fs.writeFile(entityPath, entityData)
}

/**
 * Load an entity from disk
 */
export async function loadEntity(workspacePath: string, slug: string): Promise<Entity> {
  const entityPath = getEntityPath(workspacePath, slug)

  // Use IPC to read file
  const data = await ipcClient.fs.readFile(entityPath)
  const entity = JSON.parse(data) as Entity

  // Validate loaded entity
  const errors = validateEntity(entity)
  if (errors.length > 0) {
    throw new Error(`Invalid entity file: ${errors.map((e) => e.message).join(', ')}`)
  }

  return entity
}

/**
 * Delete an entity from disk
 */
export async function deleteEntity(workspacePath: string, slug: string): Promise<void> {
  const entityPath = getEntityPath(workspacePath, slug)
  await ipcClient.fs.delete(entityPath)
}

/**
 * Load all entities from the workspace
 */
export async function loadAllEntities(workspacePath: string): Promise<Record<string, Entity>> {
  const entitiesDir = getEntitiesDir(workspacePath)

  // Check if entities directory exists
  const dirExists = await ipcClient.fs.exists(entitiesDir)

  if (!dirExists) {
    // If directory doesn't exist, create it and return empty object
    await ipcClient.fs.mkdir(entitiesDir, true)
    return {}
  }

  // Read all files from entities directory
  const allFiles = await ipcClient.fs.readDir(entitiesDir, false)

  // Filter .json files
  const files = allFiles.filter(file => file.endsWith('.json'))

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

  await ipcClient.fs.move(oldPath, newPath)
}

/**
 * Check if an entity file exists
 */
export async function entityExists(workspacePath: string, slug: string): Promise<boolean> {
  const entityPath = getEntityPath(workspacePath, slug)
  return await ipcClient.fs.exists(entityPath)
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
  await ipcClient.fs.writeFile(exportPath, data)
}

/**
 * Import entities from a JSON file
 */
export async function importEntities(
  workspacePath: string,
  filePath: string
): Promise<Record<string, Entity>> {
  const data = await ipcClient.fs.readFile(filePath)
  const entities = JSON.parse(data) as Record<string, Entity>

  // Validate all entities
  for (const [slug, entity] of Object.entries(entities)) {
    const errors = validateEntity(entity)
    if (errors.length > 0) {
      throw new Error(`Invalid entity ${slug}: ${errors.map((e) => e.message).join(', ')}`)
    }
  }

  return entities
}
