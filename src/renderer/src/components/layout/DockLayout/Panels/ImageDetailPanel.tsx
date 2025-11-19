import React from 'react'
import { ImageCard } from '@renderer/components/images/ImageCard'
import { useContentStore } from '@renderer/store'

export const ImageDetailPanel: React.FC = () => {
  const selectedImageSlug = useContentStore((state) => state.selectedImageSlug)

  if (!selectedImageSlug) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))]">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Image Selected</h3>
          <p className="text-sm">Select an image from the Image Gallery to view details</p>
        </div>
      </div>
    )
  }

  return <ImageCard imageSlug={selectedImageSlug} variant="detail" />
}
