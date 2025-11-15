import { slugify } from './slugify'
import type { Entity, EntityField, EntityNote, EntityRelation } from '@renderer/store/slices/entitySlice'

/**
 * Entity Templates
 */

export const ENTITY_TEMPLATES = {
  person: {
    type: 'person' as const,
    defaultFields: [
      { name: 'Name', value: '', type: 'text' as const },
      { name: 'Age', value: '', type: 'number' as const },
      { name: 'Occupation', value: '', type: 'text' as const },
      { name: 'Description', value: '', type: 'textarea' as const }
    ],
    defaultField: 'Name'
  },
  place: {
    type: 'place' as const,
    defaultFields: [
      { name: 'Name', value: '', type: 'text' as const },
      { name: 'Location', value: '', type: 'text' as const },
      { name: 'Description', value: '', type: 'textarea' as const }
    ],
    defaultField: 'Name'
  },
  custom: {
    type: 'custom' as const,
    defaultFields: [
      { name: 'Name', value: '', type: 'text' as const },
      { name: 'Description', value: '', type: 'textarea' as const }
    ],
    defaultField: 'Name'
  }
}

/**
 * Generate a unique slug for an entity
 */
export function generateEntitySlug(name: string, existingSlugs: string[]): string {
  const baseSlug = slugify(name)

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }

  // If slug exists, append a number
  let counter = 1
  let newSlug = `${baseSlug}-${counter}`

  while (existingSlugs.includes(newSlug)) {
    counter++
    newSlug = `${baseSlug}-${counter}`
  }

  return newSlug
}

/**
 * Validate entity slug
 */
export function isValidEntitySlug(slug: string): boolean {
  // Slug must be lowercase, alphanumeric with hyphens, no spaces
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugPattern.test(slug) && slug.length > 0 && slug.length <= 100
}

/**
 * Check if a slug is unique
 */
export function isSlugUnique(slug: string, entities: Record<string, Entity>, excludeSlug?: string): boolean {
  if (excludeSlug && slug === excludeSlug) {
    return true
  }
  return !entities[slug]
}

/**
 * Create a new entity from template
 */
export function createEntityFromTemplate(
  name: string,
  templateType: keyof typeof ENTITY_TEMPLATES,
  existingSlugs: string[]
): Entity {
  const template = ENTITY_TEMPLATES[templateType]
  const slug = generateEntitySlug(name, existingSlugs)
  const now = new Date().toISOString()

  return {
    slug,
    type: template.type,
    name,
    fields: template.defaultFields.map((field) => ({ ...field })),
    defaultField: template.defaultField,
    notes: [],
    relations: [],
    metadata: {
      created: now,
      modified: now,
      usageCount: 0,
      usageLocations: []
    }
  }
}

/**
 * Add a field to an entity
 */
export function addField(
  entity: Entity,
  field: EntityField
): Entity {
  return {
    ...entity,
    fields: [...entity.fields, field],
    metadata: {
      ...entity.metadata,
      modified: new Date().toISOString()
    }
  }
}

/**
 * Update a field in an entity
 */
export function updateField(
  entity: Entity,
  fieldIndex: number,
  updates: Partial<EntityField>
): Entity {
  const newFields = [...entity.fields]
  newFields[fieldIndex] = { ...newFields[fieldIndex], ...updates }

  return {
    ...entity,
    fields: newFields,
    metadata: {
      ...entity.metadata,
      modified: new Date().toISOString()
    }
  }
}

/**
 * Remove a field from an entity
 */
export function removeField(
  entity: Entity,
  fieldIndex: number
): Entity {
  return {
    ...entity,
    fields: entity.fields.filter((_, idx) => idx !== fieldIndex),
    metadata: {
      ...entity.metadata,
      modified: new Date().toISOString()
    }
  }
}

/**
 * Reorder fields
 */
export function reorderFields(
  entity: Entity,
  fromIndex: number,
  toIndex: number
): Entity {
  const newFields = [...entity.fields]
  const [removed] = newFields.splice(fromIndex, 1)
  newFields.splice(toIndex, 0, removed)

  return {
    ...entity,
    fields: newFields,
    metadata: {
      ...entity.metadata,
      modified: new Date().toISOString()
    }
  }
}

/**
 * Get field value by name
 */
export function getFieldValue(entity: Entity, fieldName: string): string | undefined {
  const field = entity.fields.find((f) => f.name === fieldName)
  return field?.value
}

/**
 * Get default field value
 */
export function getDefaultFieldValue(entity: Entity): string {
  return getFieldValue(entity, entity.defaultField) || entity.name
}

/**
 * Validate entity data
 */
export interface EntityValidationError {
  field: string
  message: string
}

export function validateEntity(entity: Partial<Entity>): EntityValidationError[] {
  const errors: EntityValidationError[] = []

  if (!entity.name || entity.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' })
  }

  if (!entity.slug || !isValidEntitySlug(entity.slug)) {
    errors.push({ field: 'slug', message: 'Invalid slug format' })
  }

  if (!entity.type || !['person', 'place', 'custom'].includes(entity.type)) {
    errors.push({ field: 'type', message: 'Invalid entity type' })
  }

  if (!entity.fields || entity.fields.length === 0) {
    errors.push({ field: 'fields', message: 'At least one field is required' })
  }

  if (entity.defaultField && entity.fields) {
    const hasDefaultField = entity.fields.some((f) => f.name === entity.defaultField)
    if (!hasDefaultField) {
      errors.push({ field: 'defaultField', message: 'Default field does not exist in fields' })
    }
  }

  return errors
}

/**
 * Search entities by name or field value
 */
export function searchEntities(
  entities: Record<string, Entity>,
  query: string
): Entity[] {
  const lowerQuery = query.toLowerCase()

  return Object.values(entities).filter((entity) => {
    // Search in name
    if (entity.name.toLowerCase().includes(lowerQuery)) {
      return true
    }

    // Search in slug
    if (entity.slug.toLowerCase().includes(lowerQuery)) {
      return true
    }

    // Search in field values
    return entity.fields.some((field) =>
      field.value.toLowerCase().includes(lowerQuery)
    )
  })
}

/**
 * Group entities by type
 */
export function groupEntitiesByType(
  entities: Record<string, Entity>
): Record<string, Entity[]> {
  const grouped: Record<string, Entity[]> = {
    person: [],
    place: [],
    custom: []
  }

  Object.values(entities).forEach((entity) => {
    grouped[entity.type].push(entity)
  })

  return grouped
}

/**
 * Sort entities by various criteria
 */
export type EntitySortKey = 'name' | 'created' | 'modified' | 'usage'

export function sortEntities(
  entities: Entity[],
  sortKey: EntitySortKey,
  ascending = true
): Entity[] {
  const sorted = [...entities].sort((a, b) => {
    let comparison = 0

    switch (sortKey) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'created':
        comparison = new Date(a.metadata.created).getTime() - new Date(b.metadata.created).getTime()
        break
      case 'modified':
        comparison = new Date(a.metadata.modified).getTime() - new Date(b.metadata.modified).getTime()
        break
      case 'usage':
        comparison = a.metadata.usageCount - b.metadata.usageCount
        break
    }

    return ascending ? comparison : -comparison
  })

  return sorted
}
