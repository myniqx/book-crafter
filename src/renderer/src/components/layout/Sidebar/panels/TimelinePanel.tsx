import React from 'react'
import { Clock } from 'lucide-react'

// Placeholder until Timeline feature is implemented
export const TimelinePanel: React.FC = () => {
  return (
    <div className="h-full w-full flex items-center justify-center p-8">
      <div className="text-center text-on-surface-variant">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <h3 className="text-sm font-semibold mb-2 text-on-surface">Timeline</h3>
        <p className="text-xs">
          This panel will show writing activity, chapter history, and entity usage timeline.
        </p>
        <p className="text-xs mt-2 opacity-50">Coming soon...</p>
      </div>
    </div>
  )
}
