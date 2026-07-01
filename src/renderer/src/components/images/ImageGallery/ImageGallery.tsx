import React, { useState, useMemo } from 'react'
import { useStore } from '@renderer/store'
import { searchImages, sortImages, getAllTags, type ImageSortBy } from '@renderer/lib/image'
import { cn } from '@renderer/lib/utils'
import { Search, Upload, Image as ImageIcon, Filter, SortAsc } from 'lucide-react'
import type { ImageGalleryProps } from './types'
import { ImageCard } from '@renderer/components/images/ImageCard'
import { ImageUploader } from '@renderer/components/images/ImageUploader'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Badge } from '@renderer/components/ui/badge'

export const ImageGallery: React.FC<ImageGalleryProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<ImageSortBy>('date')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const images = useStore((state) => state.images)
  const selectImage = useStore((state) => state.selectImage)

  // Get all unique tags
  const allTags = useMemo(() => getAllTags(images), [images])

  // Filter and sort images
  const filteredImages = useMemo(() => {
    let result = Object.values(images)

    // Search filter
    if (searchQuery) {
      result = searchImages(images, searchQuery)
    }

    // Tag filter
    if (selectedTag) {
      result = result.filter((img) => img.tags.includes(selectedTag))
    }

    // Sort
    result = sortImages(result, sortBy)

    return result
  }, [images, searchQuery, selectedTag, sortBy])

  const handleImageClick = (slug: string): void => {
    selectImage(slug)
  }

  const handleUploadComplete = (slug: string): void => {
    setIsUploadDialogOpen(false)
    selectImage(slug)
  }

  // Empty state
  const uploadDialog = (
    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost"><Upload className="h-3.5 w-3.5 mr-1" />Upload</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
          <DialogDescription>Add images to your workspace. Supported formats: PNG, JPEG, GIF, WebP, SVG</DialogDescription>
        </DialogHeader>
        <ImageUploader onUploadComplete={handleUploadComplete} />
      </DialogContent>
    </Dialog>
  )

  if (Object.keys(images).length === 0) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="flex items-center justify-between border-b border-outline-variant px-3 py-2">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Images</h3>
          {uploadDialog}
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center space-y-3">
            <ImageIcon className="h-10 w-10 text-on-surface-variant opacity-30 mx-auto" />
            <div>
              <h3 className="text-sm font-medium text-on-surface">No Images</h3>
              <p className="text-xs text-on-surface-variant mt-1">Upload images to use in your books</p>
            </div>
            {uploadDialog}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="space-y-2 border-b border-outline-variant px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Images</h3>
            <Badge variant="secondary">{filteredImages.length}</Badge>
          </div>
          {uploadDialog}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-on-surface-variant" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search images..." className="pl-8 h-8 text-xs" />
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as ImageSortBy)}>
            <SelectTrigger className="h-7 text-xs w-27.5">
              <SortAsc className="h-3 w-3 mr-1" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="usage">Usage</SelectItem>
            </SelectContent>
          </Select>

          {allTags.length > 0 && (
            <Select value={selectedTag || 'all'} onValueChange={(value) => setSelectedTag(value === 'all' ? null : value)}>
              <SelectTrigger className="h-7 text-xs w-27.5">
                <Filter className="h-3 w-3 mr-1" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Image Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredImages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs text-on-surface-variant">No images match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredImages.map((image) => (
              <div key={image.slug} onClick={() => handleImageClick(image.slug)}>
                <ImageCard imageSlug={image.slug} variant="grid" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
