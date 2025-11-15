import React, { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { useStore } from '@renderer/store'
import { createEntityFromTemplate, ENTITY_TEMPLATES } from '@renderer/lib/entity'
import type { CreateEntityDialogProps } from './types'

export const CreateEntityDialog: React.FC<CreateEntityDialogProps> = ({ triggerProps }) => {
  const [name, setName] = useState('')
  const [templateType, setTemplateType] = useState<keyof typeof ENTITY_TEMPLATES>('person')
  const [customSlug, setCustomSlug] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const entities = useStore((state) => state.entities)
  const addEntity = useStore((state) => state.addEntity)
  const saveEntityToDisk = useStore((state) => state.saveEntityToDisk)
  const workspacePath = useStore((state) => state.workspacePath)
  const open = useStore((state) => state.createEntityDialogOpen)
  const setOpen = useStore((state) => state.setCreateEntityDialogOpen)

  // Get existing slugs for validation
  const existingSlugs = useMemo(() => Object.keys(entities), [entities])

  // Get template fields preview
  const templateFields = ENTITY_TEMPLATES[templateType].defaultFields

  const handleCreate = async (): Promise<void> => {
    if (!name.trim() || !workspacePath) return

    setIsCreating(true)

    try {
      // Create entity from template
      const entity = createEntityFromTemplate(name.trim(), templateType, existingSlugs)

      // Use custom slug if provided
      if (customSlug.trim()) {
        entity.slug = customSlug.trim()
      }

      // Add to store
      addEntity(entity)

      // Save to disk
      await saveEntityToDisk(workspacePath, entity.slug)

      // Reset form
      setName('')
      setCustomSlug('')
      setTemplateType('person')

      // Close dialog after success
      setOpen(false)
    } catch (error) {
      console.error('Failed to create entity:', error)
      alert('Failed to create entity. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleNameChange = (value: string): void => {
    setName(value)
    // Clear custom slug when name changes (will auto-generate)
    setCustomSlug('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" {...triggerProps}>
          <Plus className="h-4 w-4 mr-2" />
          New Entity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Entity</DialogTitle>
          <DialogDescription>
            Add a new entity to your workspace. Entities can be characters, places, or custom types.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Template Type */}
          <div className="grid gap-2">
            <Label htmlFor="template">Template</Label>
            <Select value={templateType} onValueChange={(v) => setTemplateType(v as keyof typeof ENTITY_TEMPLATES)}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Person (Character)</SelectItem>
                <SelectItem value="place">Place (Location)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter entity name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              autoFocus
            />
          </div>

          {/* Custom Slug (Optional) */}
          <div className="grid gap-2">
            <Label htmlFor="slug">
              Slug <span className="text-xs text-muted-foreground">(optional, auto-generated)</span>
            </Label>
            <Input
              id="slug"
              placeholder="custom-slug"
              value={customSlug}
              onChange={(e) => setCustomSlug(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to auto-generate from name
            </p>
          </div>

          {/* Fields Preview */}
          <div className="grid gap-2">
            <Label>Default Fields</Label>
            <div className="rounded-md border p-3 bg-muted/50">
              <ul className="space-y-1 text-sm">
                {templateFields.map((field, idx) => (
                  <li key={idx} className="text-muted-foreground">
                    • {field.name} ({field.type})
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                You can add more fields after creation
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={isCreating}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Entity'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
