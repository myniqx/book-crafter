import React, { useState, useMemo } from 'react'
import { useContentStore, useCoreStore } from '@renderer/store'
import { formatFileSize } from '@renderer/lib/image'
import { getImageUrl } from '@renderer/lib/images'
import { cn } from '@renderer/lib/utils'
import {
  FileImage,
  Trash2,
  Copy,
  Tag,
  Link as LinkIcon,
  Info,
  X
} from 'lucide-react'
import type { ImageCardProps } from './types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Badge } from '@renderer/components/ui/badge'

export const ImageCard: React.FC<ImageCardProps> = ({
  imageSlug,
  variant = 'grid',
  className
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedDescription, setEditedDescription] = useState('')
  const [newTag, setNewTag] = useState('')

  const workspacePath = useCoreStore((state) => state.workspacePath)
  const images = useContentStore((state) => state.images)
  const updateDescription = useContentStore((state) => state.updateDescription)
  const addTag = useContentStore((state) => state.addTag)
  const removeTag = useContentStore((state) => state.removeTag)
  const deleteImageFromDisk = useContentStore((state) => state.deleteImageFromDisk)
  const saveImageToDisk = useContentStore((state) => state.saveImageToDisk)

  const image = images[imageSlug]

  if (!image || !workspacePath) {
    return null
  }

  const imageUrl = getImageUrl(workspacePath, image)

  const handleDelete = async (): Promise<void> => {
    if (!confirm(`Delete image "${image.slug}"?`)) {
      return
    }

    try {
      await deleteImageFromDisk(workspacePath, imageSlug)
    } catch (error) {
      console.error('Failed to delete image:', error)
      alert('Failed to delete image')
    }
  }

  const handleDescriptionSave = async (): Promise<void> => {
    updateDescription(imageSlug, editedDescription)
    await saveImageToDisk(workspacePath, imageSlug)
    setIsEditing(false)
  }

  const handleDescriptionEdit = (): void => {
    setEditedDescription(image.description)
    setIsEditing(true)
  }

  const handleAddTag = async (): Promise<void> => {
    if (newTag.trim()) {
      addTag(imageSlug, newTag.trim())
      await saveImageToDisk(workspacePath, imageSlug)
      setNewTag('')
    }
  }

  const handleRemoveTag = async (tag: string): Promise<void> => {
    removeTag(imageSlug, tag)
    await saveImageToDisk(workspacePath, imageSlug)
  }

  const handleCopySlug = (): void => {
    navigator.clipboard.writeText(`@image-${imageSlug}`)
  }

  const usageCount = useMemo(() => {
    return (
      image.linkedEntities.length +
      image.linkedBooks.length +
      image.linkedNotes.length
    )
  }, [image])

  // Grid variant - compact card
  if (variant === 'grid') {
    return (
      <Card className={cn('group relative overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all', className)}>
        <div className="aspect-square relative bg-slate-900">
          <img
            src={imageUrl}
            alt={image.description || image.slug}
            className="w-full h-full object-cover"
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopySlug}
              title="Copy @image-slug"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        </div>

        <CardContent className="p-3">
          <p className="text-sm font-medium text-slate-300 truncate">
            {image.slug}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-500">
              {image.width && image.height ? `${image.width}×${image.height}` : 'Unknown'}
            </p>
            <p className="text-xs text-slate-500">{formatFileSize(image.size)}</p>
          </div>
          {image.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {image.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {image.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{image.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Detail variant - full info card
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              {image.slug}
            </CardTitle>
            <CardDescription>{image.originalFilename}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={handleCopySlug} title="Copy @image-slug">
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Image Preview */}
        <div className="relative bg-slate-900 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt={image.description || image.slug}
            className="w-full h-auto max-h-96 object-contain"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description</Label>
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Add description..."
                className="flex-1"
              />
              <Button size="sm" onClick={handleDescriptionSave}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div
              onClick={handleDescriptionEdit}
              className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 min-h-[2rem] p-2 border border-slate-800 rounded hover:border-slate-700"
            >
              {image.description || 'Click to add description...'}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-1">
            {image.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-400"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
            <div className="flex gap-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag..."
                className="h-7 text-xs w-24"
              />
              <Button size="sm" variant="ghost" onClick={handleAddTag} className="h-7 px-2">
                <Tag className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div>
            <span className="font-medium">Size:</span> {formatFileSize(image.size)}
          </div>
          <div>
            <span className="font-medium">Dimensions:</span>{' '}
            {image.width && image.height ? `${image.width}×${image.height}` : 'Unknown'}
          </div>
          <div>
            <span className="font-medium">Type:</span> {image.mimeType}
          </div>
          <div>
            <span className="font-medium">Usage:</span> {usageCount} references
          </div>
        </div>

        {/* Linked items */}
        {(image.linkedEntities.length > 0 ||
          image.linkedBooks.length > 0 ||
          image.linkedNotes.length > 0) && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              Linked To
            </Label>
            <div className="space-y-1 text-xs text-slate-400">
              {image.linkedEntities.length > 0 && (
                <div>Entities: {image.linkedEntities.join(', ')}</div>
              )}
              {image.linkedBooks.length > 0 && (
                <div>Books: {image.linkedBooks.join(', ')}</div>
              )}
              {image.linkedNotes.length > 0 && (
                <div>Notes: {image.linkedNotes.length}</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
