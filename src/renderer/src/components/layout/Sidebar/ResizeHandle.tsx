import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@renderer/lib/utils'
import { useSidebarStore } from '@renderer/store'

const MIN_WIDTH = 200
const MAX_WIDTH = 400

export const ResizeHandle: React.FC = () => {
  const setSidebarWidth = useSidebarStore((state) => state.setSidebarWidth)
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    startXRef.current = e.clientX

    // Get current width from the panel element
    const panel = document.querySelector('[data-sidebar-panel]') as HTMLElement
    if (panel) {
      startWidthRef.current = panel.offsetWidth
    }
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - startXRef.current
      const newWidth = startWidthRef.current + deltaX

      // Constrain to min/max
      const constrainedWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth))

      setSidebarWidth(constrainedWidth)
    },
    [isDragging, setSidebarWidth]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      // Prevent text selection while dragging
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      }
    }

    return undefined
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div
      className={cn(
        'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize',
        'hover:bg-blue-500/50 transition-colors',
        'group',
        isDragging && 'bg-blue-500'
      )}
      onMouseDown={handleMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
    >
      {/* Wider hover target */}
      <div className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  )
}
