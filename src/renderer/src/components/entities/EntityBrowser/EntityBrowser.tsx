import React, { useState, useMemo } from 'react'
import { Search, Users, MapPin, Box, ChevronDown, ChevronRight } from 'lucide-react'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { cn } from '@renderer/lib/utils'
import { useStore } from '@renderer/store'
import { searchEntities, sortEntities, type EntitySortKey } from '@renderer/lib/entity'
import { CreateEntityDialog } from '../CreateEntityDialog'
import type { EntityBrowserProps } from './types'

const TYPE_ICONS = {
  person: Users,
  place: MapPin,
  custom: Box
}

const TYPE_LABELS = {
  person: 'Characters',
  place: 'Locations',
  custom: 'Custom'
}

export const EntityBrowser: React.FC<EntityBrowserProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<EntitySortKey>('name')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const entities = useStore((state) => state.entities)
  const selectedEntitySlug = useStore((state) => state.selectedEntitySlug)
  const selectEntity = useStore((state) => state.selectEntity)

  // Search and filter entities
  const filteredEntities = useMemo(() => {
    if (searchQuery.trim()) {
      return searchEntities(entities, searchQuery)
    }
    return Object.values(entities)
  }, [entities, searchQuery])

  // Sort entities
  const sortedEntities = useMemo(() => {
    return sortEntities(filteredEntities, sortKey)
  }, [filteredEntities, sortKey])

  // Group by type
  const groupedEntities = useMemo(() => {
    const grouped = {
      person: [] as typeof sortedEntities,
      place: [] as typeof sortedEntities,
      custom: [] as typeof sortedEntities
    }

    sortedEntities.forEach((entity) => {
      grouped[entity.type].push(entity)
    })

    return grouped
  }, [sortedEntities])

  const toggleGroup = (type: string): void => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const handleSelectEntity = (slug: string): void => {
    selectEntity(slug === selectedEntitySlug ? null : slug)
  }

  const totalCount = Object.keys(entities).length

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="px-3 py-2 border-b border-outline-variant space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Entities ({totalCount})</h3>
          <CreateEntityDialog />
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-on-surface-variant" />
          <Input placeholder="Search entities..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-xs" />
        </div>

        <Select value={sortKey} onValueChange={(v) => setSortKey(v as EntitySortKey)}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="created">Date Created</SelectItem>
            <SelectItem value="modified">Last Modified</SelectItem>
            <SelectItem value="usage">Usage Count</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedEntities).map(([type, entityList]) => {
          if (entityList.length === 0) return null
          const isCollapsed = collapsedGroups.has(type)
          const Icon = TYPE_ICONS[type as keyof typeof TYPE_ICONS]
          const label = TYPE_LABELS[type as keyof typeof TYPE_LABELS]

          return (
            <div key={type} className="border-b border-outline-variant">
              <button
                onClick={() => toggleGroup(type)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-container-high transition-colors duration-150 text-xs font-semibold text-on-surface-variant uppercase tracking-wide"
              >
                {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                <Icon className="h-3.5 w-3.5" />
                <span>{label} ({entityList.length})</span>
              </button>

              {!isCollapsed && (
                <div>
                  {entityList.map((entity) => (
                    <button
                      key={entity.slug}
                      onClick={() => handleSelectEntity(entity.slug)}
                      className={cn(
                        'w-full flex items-center gap-2 px-6 py-2',
                        'hover:bg-surface-container transition-colors duration-150 text-sm text-left',
                        selectedEntitySlug === entity.slug && 'bg-surface-container text-primary border-l-2 border-primary'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-on-surface">{entity.name}</div>
                        <div className="text-xs text-on-surface-variant truncate">{entity.slug}</div>
                      </div>
                      {entity.metadata.usageCount > 0 && (
                        <div className="text-xs text-on-surface-variant">{entity.metadata.usageCount}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {totalCount === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Box className="h-10 w-10 text-on-surface-variant opacity-30 mb-3" />
            <h4 className="text-sm font-medium text-on-surface mb-1">No entities yet</h4>
            <p className="text-xs text-on-surface-variant mb-4">Create your first entity to get started</p>
            <CreateEntityDialog triggerProps={{ size: 'sm' }} />
          </div>
        )}

        {totalCount > 0 && filteredEntities.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Search className="h-10 w-10 text-on-surface-variant opacity-30 mb-3" />
            <h4 className="text-sm font-medium text-on-surface mb-1">No results found</h4>
            <p className="text-xs text-on-surface-variant">Try adjusting your search query</p>
          </div>
        )}
      </div>
    </div>
  )
}
