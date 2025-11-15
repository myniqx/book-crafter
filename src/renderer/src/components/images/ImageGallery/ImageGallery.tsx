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
  if (Object.keys(images).length === 0) {
    return (
      <div className={cn('flex h-full flex-col bg-slate-950', className)}>
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Images</span>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Image</DialogTitle>
                <DialogDescription>
                  Add images to your workspace. Supported formats: PNG, JPEG, GIF, WebP, SVG
                </DialogDescription>
              </DialogHeader>
              <ImageUploader onUploadComplete={handleUploadComplete} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="text-center space-y-4">
            <ImageIcon className="h-16 w-16 text-slate-600 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-slate-300">No Images</h3>
              <p className="text-sm text-slate-500 mt-1">
                Upload images to use in your books
              </p>
            </div>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Image</DialogTitle>
                  <DialogDescription>
                    Add images to your workspace. Supported formats: PNG, JPEG, GIF, WebP, SVG
                  </DialogDescription>
                </DialogHeader>
                <ImageUploader onUploadComplete={handleUploadComplete} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col bg-slate-950', className)}>
      {/* Header */}
      <div className="space-y-2 border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Images</span>
            <Badge variant="secondary">{filteredImages.length}</Badge>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Image</DialogTitle>
                <DialogDescription>
                  Add images to your workspace. Supported formats: PNG, JPEG, GIF, WebP, SVG
                </DialogDescription>
              </DialogHeader>
              <ImageUploader onUploadComplete={handleUploadComplete} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search images..."
            className="pl-9 h-8 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as ImageSortBy)}>
            <SelectTrigger className="h-8 text-xs w-[120px]">
              <SortAsc className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="size">Size</SelectItem>
              <SelectItem value="usage">Usage</SelectItem>
            </SelectContent>
          </Select>

          {allTags.length > 0 && (
            <Select
              value={selectedTag || 'all'}
              onValueChange={(value) => setSelectedTag(value === 'all' ? null : value)}
            >
              <SelectTrigger className="h-8 text-xs w-[120px]">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Image Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredImages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-500">
              No images match your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
