import React, { useState } from 'react'
import { Trash2, Save, Plus, Minus, Users, MapPin, Box } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Separator } from '@renderer/components/ui/separator'
import { cn } from '@renderer/lib/utils'
import { useContentStore, useCoreStore } from '@renderer/store'
import type { EntityField } from '@renderer/store/slices/entitySlice'
import type { EntityCardProps } from './types'

const TYPE_ICONS = {
  person: Users,
  place: MapPin,
  custom: Box
}

const TYPE_LABELS = {
  person: 'Character',
  place: 'Location',
  custom: 'Custom'
}

export const EntityCard: React.FC<EntityCardProps> = ({ entitySlug, className }) => {
  const entity = useContentStore((state) => state.entities[entitySlug])
  const updateEntity = useContentStore((state) => state.updateEntity)
  const updateEntityField = useContentStore((state) => state.updateEntityField)
  const addEntityField = useContentStore((state) => state.addEntityField)
  const removeEntityField = useContentStore((state) => state.removeEntityField)
  const deleteEntityFromDisk = useContentStore((state) => state.deleteEntityFromDisk)
  const saveEntityToDisk = useContentStore((state) => state.saveEntityToDisk)
  const workspacePath = useCoreStore((state) => state.workspacePath)

  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newFieldName, setNewFieldName] = useState('')
  const [newFieldType, setNewFieldType] = useState<EntityField['type']>('text')

  if (!entity) {
    return (
      <div className={cn('h-full flex items-center justify-center p-6 text-center', className)}>
        <div>
          <h4 className="text-sm font-medium mb-1">Entity not found</h4>
          <p className="text-xs text-muted-foreground">
            The entity "{entitySlug}" does not exist
          </p>
        </div>
      </div>
    )
  }

  const Icon = TYPE_ICONS[entity.type]
  const typeLabel = TYPE_LABELS[entity.type]

  const handleSave = async (): Promise<void> => {
    if (!workspacePath) return

    setIsSaving(true)
    try {
      await saveEntityToDisk(workspacePath, entitySlug)
    } catch (error) {
      console.error('Failed to save entity:', error)
      alert('Failed to save entity. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!workspacePath) return

    const confirmed = confirm(`Are you sure you want to delete "${entity.name}"? This cannot be undone.`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteEntityFromDisk(workspacePath, entitySlug)
    } catch (error) {
      console.error('Failed to delete entity:', error)
      alert('Failed to delete entity. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddField = (): void => {
    if (!newFieldName.trim()) return

    const newField: EntityField = {
      name: newFieldName.trim(),
      value: '',
      type: newFieldType
    }

    addEntityField(entitySlug, newField)
    setNewFieldName('')
    setNewFieldType('text')
  }

  const handleRemoveField = (index: number): void => {
    if (entity.fields.length <= 1) {
      alert('Cannot remove the last field. Entities must have at least one field.')
      return
    }

    removeEntityField(entitySlug, index)
  }

  const handleFieldValueChange = (index: number, value: string): void => {
    updateEntityField(entitySlug, index, { value })
  }

  const handleNameChange = (name: string): void => {
    updateEntity(entitySlug, { name })
  }

  return (
    <div className={cn('h-full overflow-y-auto', className)}>
      <Card className="border-0 shadow-none">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-[hsl(var(--primary))]" />
              <div>
                <CardTitle className="text-xl">{entity.name}</CardTitle>
                <CardDescription>
                  {typeLabel} • {entity.slug}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="entity-name">Entity Name</Label>
            <Input
              id="entity-name"
              value={entity.name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          <Separator />

          {/* Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Fields</h3>
              <span className="text-xs text-muted-foreground">
                Default: {entity.defaultField}
              </span>
            </div>

            {entity.fields.map((field, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`field-${index}`}>
                    {field.name}
                    {field.name === entity.defaultField && (
                      <span className="ml-2 text-xs text-[hsl(var(--primary))]">(default)</span>
                    )}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveField(index)}
                    className="h-6 px-2"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  id={`field-${index}`}
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  value={field.value}
                  onChange={(e) => handleFieldValueChange(index, e.target.value)}
                  placeholder={`Enter ${field.name.toLowerCase()}`}
                />
              </div>
            ))}

            {/* Add New Field */}
            <div className="space-y-2 pt-2 border-t">
              <Label>Add New Field</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Field name"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as EntityField['type'])}
                  className="px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddField}
                  disabled={!newFieldName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Metadata</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p>{new Date(entity.metadata.created).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Modified</p>
                <p>{new Date(entity.metadata.modified).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Usage Count</p>
                <p>{entity.metadata.usageCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Relations</p>
                <p>{entity.relations.length}</p>
              </div>
            </div>
          </div>

          {/* Relations */}
          {entity.relations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Relations ({entity.relations.length})</h3>
                <div className="space-y-2">
                  {entity.relations.map((relation) => (
                    <div
                      key={relation.id}
                      className="p-2 rounded-md border bg-muted/50 text-sm"
                    >
                      <div className="font-medium">{relation.type}</div>
                      <div className="text-muted-foreground text-xs">
                        → {relation.targetEntitySlug}
                      </div>
                      {relation.description && (
                        <div className="text-muted-foreground text-xs mt-1">
                          {relation.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {entity.notes.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Notes ({entity.notes.length})</h3>
                <div className="space-y-2">
                  {entity.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-md border bg-muted/50 text-sm"
                    >
                      <div className="text-muted-foreground text-xs mb-1">
                        {note.type === 'checklist' ? '☑️ Checklist' : '📝 Note'}
                      </div>
                      <div className="whitespace-pre-wrap">{note.content}</div>
                      {note.checklistItems && note.checklistItems.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {note.checklistItems.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                readOnly
                                className="rounded"
                              />
                              <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
