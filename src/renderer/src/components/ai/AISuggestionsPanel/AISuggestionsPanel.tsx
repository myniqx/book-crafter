import React, { useState } from 'react'
import { useToolsStore } from '@renderer/store'
import type { AISuggestion } from '@renderer/lib/ai/types'
import { cn } from '@renderer/lib/utils'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { History, Check, X, Eye, Trash2 } from 'lucide-react'
import { DiffViewer } from '@renderer/components/ai/DiffViewer'

export const AISuggestionsPanel: React.FC = () => {
  const suggestions = useToolsStore((state) => state.suggestions)
  const clearSuggestions = useToolsStore((state) => state.clearSuggestions)
  const applySuggestion = useToolsStore((state) => state.applySuggestion)

  const [viewingSuggestion, setViewingSuggestion] = useState<AISuggestion | null>(null)

  const handleClear = (): void => {
    if (confirm('Are you sure you want to clear all suggestions history?')) {
      clearSuggestions()
    }
  }

  const handleApply = (suggestion: AISuggestion): void => {
    // Copy to clipboard
    navigator.clipboard.writeText(suggestion.suggested)
    applySuggestion(suggestion.id)
    setViewingSuggestion(null)
  }

  const handleReject = (): void => {
    setViewingSuggestion(null)
  }

  const getSuggestionTypeLabel = (type: AISuggestion['type']): string => {
    const labels = {
      grammar: 'Grammar',
      expansion: 'Expansion',
      dramatic: 'Dramatic',
      dialogue: 'Dialogue',
      improvement: 'Improvement',
      custom: 'Custom'
    }
    return labels[type]
  }

  const getSuggestionTypeColor = (type: AISuggestion['type']): string => {
    const colors = {
      grammar: 'bg-blue-900 text-blue-300',
      expansion: 'bg-purple-900 text-purple-300',
      dramatic: 'bg-red-900 text-red-300',
      dialogue: 'bg-green-900 text-green-300',
      improvement: 'bg-yellow-900 text-yellow-300',
      custom: 'bg-slate-700 text-slate-300'
    }
    return colors[type]
  }

  return (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-slate-300">AI Suggestions History</span>
            <Badge variant="secondary" className="text-xs">
              {suggestions.length}
            </Badge>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={suggestions.length === 0}
            className="h-7"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Diff Viewer (if viewing) */}
      {viewingSuggestion && (
        <div className="border-b border-slate-800 p-4">
          <DiffViewer
            original={viewingSuggestion.original}
            suggested={viewingSuggestion.suggested}
            title={getSuggestionTypeLabel(viewingSuggestion.type)}
            onApply={() => handleApply(viewingSuggestion)}
            onReject={handleReject}
          />
        </div>
      )}

      {/* Suggestions List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-12 w-12 text-slate-700 mb-4" />
              <h3 className="text-sm font-medium text-slate-400 mb-2">No Suggestions Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                AI suggestions will appear here when you use AI actions in the editor.
              </p>
            </div>
          )}

          {suggestions.map((suggestion) => (
            <Card
              key={suggestion.id}
              className={cn(
                'p-3 border-slate-700 transition-colors cursor-pointer',
                suggestion.applied ? 'bg-slate-800/50 opacity-75' : 'bg-slate-800 hover:bg-slate-750'
              )}
              onClick={() => setViewingSuggestion(suggestion)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getSuggestionTypeColor(suggestion.type)} variant="outline">
                      {getSuggestionTypeLabel(suggestion.type)}
                    </Badge>
                    {suggestion.applied && (
                      <Badge variant="outline" className="bg-green-900/20 text-green-400">
                        <Check className="h-3 w-3 mr-1" />
                        Applied
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-1">
                    {suggestion.prompt}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span>{new Date(suggestion.timestamp).toLocaleString()}</span>
                    {suggestion.bookSlug && (
                      <>
                        <span>•</span>
                        <span>{suggestion.bookSlug}</span>
                        {suggestion.chapterSlug && (
                          <>
                            <span>/</span>
                            <span>{suggestion.chapterSlug}</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setViewingSuggestion(suggestion)
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
