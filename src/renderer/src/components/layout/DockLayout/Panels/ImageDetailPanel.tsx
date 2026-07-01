import React from 'react'
import { ImageCard } from '@renderer/components/images/ImageCard'
import { useStore } from '@renderer/store'

export const ImageDetailPanel: React.FC = () => {
  const selectedImageSlug = useStore((state) => state.selectedImageSlug)

  if (!selectedImageSlug) {
    return (
      <div className="h-full w-full flex items-center justify-center text-on-surface-variant">
        <div className="text-center">
          <h3 className="text-sm font-semibold mb-2 text-on-surface">No Image Selected</h3>
          <p className="text-xs">Select an image from the Image Gallery to view details</p>
        </div>
      </div>
    )
  }

  return <ImageCard imageSlug={selectedImageSlug} variant="detail" />
}
