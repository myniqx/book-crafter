import React from 'react'
import { EntityCard } from '@renderer/components/entities/EntityCard'
import { useContentStore } from '@renderer/store'

export const EntityDetailPanel: React.FC = () => {
  const selectedEntitySlug = useContentStore((state) => state.selectedEntitySlug)

  if (!selectedEntitySlug) {
    return (
      <div className="h-full w-full flex items-center justify-center text-on-surface-variant">
        <div className="text-center">
          <h3 className="text-sm font-semibold mb-2 text-on-surface">No Entity Selected</h3>
          <p className="text-xs">Select an entity from the Entity Browser to view details</p>
        </div>
      </div>
    )
  }

  return <EntityCard entitySlug={selectedEntitySlug} />
}
