import React, { useMemo } from 'react'
import type { DiffViewerProps, DiffLine } from './types'
import { cn } from '@renderer/lib/utils'
import { Button } from '@renderer/components/ui/button'
import { Card } from '@renderer/components/ui/card'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Check, X, ArrowRight } from 'lucide-react'

export const DiffViewer: React.FC<DiffViewerProps> = ({
  original,
  suggested,
  onApply,
  onReject,
  title = 'AI Suggestion'
}) => {
  // Simple diff calculation (line-by-line)
  const diff = useMemo(() => {
    const originalLines = original.split('\n')
    const suggestedLines = suggested.split('\n')

    const maxLength = Math.max(originalLines.length, suggestedLines.length)
    const result: { original: DiffLine[]; suggested: DiffLine[] } = {
      original: [],
      suggested: []
    }

    for (let i = 0; i < maxLength; i++) {
      const origLine = originalLines[i] || ''
      const suggLine = suggestedLines[i] || ''

      if (origLine === suggLine) {
        // Unchanged
        result.original.push({ type: 'unchanged', content: origLine, lineNumber: i + 1 })
        result.suggested.push({ type: 'unchanged', content: suggLine, lineNumber: i + 1 })
      } else {
        // Changed
        if (origLine) {
          result.original.push({ type: 'removed', content: origLine, lineNumber: i + 1 })
        }
        if (suggLine) {
          result.suggested.push({ type: 'added', content: suggLine, lineNumber: i + 1 })
        }
      }
    }

    return result
  }, [original, suggested])

  const stats = useMemo(() => {
    const added = diff.suggested.filter((l) => l.type === 'added').length
    const removed = diff.original.filter((l) => l.type === 'removed').length
    const unchanged = diff.original.filter((l) => l.type === 'unchanged').length
    return { added, removed, unchanged }
  }, [diff])

  return (
    <Card className="border-slate-700 bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-red-900"></span>
                {stats.removed} removed
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-green-900"></span>
                {stats.added} added
              </span>
              <span>{stats.unchanged} unchanged</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => onReject()} variant="outline" size="sm">
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button onClick={() => onApply(suggested)} size="sm">
              <Check className="h-4 w-4 mr-1" />
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* Side-by-side diff */}
      <div className="grid grid-cols-2 gap-0 divide-x divide-slate-700">
        {/* Original */}
        <div className="flex flex-col">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
            <h4 className="text-xs font-medium text-slate-400 flex items-center gap-2">
              Original
            </h4>
          </div>
          <ScrollArea className="h-96">
            <div className="p-2">
              {diff.original.map((line, idx) => (
                <DiffLineComponent key={`orig-${idx}`} line={line} side="original" />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Suggested */}
        <div className="flex flex-col">
          <div className="bg-slate-800 px-4 py-2 border-b border-slate-700">
            <h4 className="text-xs font-medium text-slate-400 flex items-center gap-2">
              AI Suggestion
              <ArrowRight className="h-3 w-3" />
            </h4>
          </div>
          <ScrollArea className="h-96">
            <div className="p-2">
              {diff.suggested.map((line, idx) => (
                <DiffLineComponent key={`sugg-${idx}`} line={line} side="suggested" />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </Card>
  )
}

/**
 * Individual diff line component
 */
const DiffLineComponent: React.FC<{
  line: DiffLine
  side: 'original' | 'suggested'
}> = ({ line, side }) => {
  const bgColor = {
    unchanged: 'bg-transparent',
    added: side === 'suggested' ? 'bg-green-900/20' : 'bg-transparent',
    removed: side === 'original' ? 'bg-red-900/20' : 'bg-transparent'
  }[line.type]

  const textColor = {
    unchanged: 'text-slate-300',
    added: 'text-green-300',
    removed: 'text-red-300'
  }[line.type]

  const prefix = {
    unchanged: ' ',
    added: '+',
    removed: '-'
  }[line.type]

  return (
    <div
      className={cn(
        'flex items-start gap-2 px-2 py-0.5 font-mono text-xs',
        bgColor,
        textColor
      )}
    >
      <span className="w-8 text-right text-slate-600 select-none">{line.lineNumber}</span>
      <span className="w-4 select-none">{prefix}</span>
      <span className="flex-1 whitespace-pre-wrap break-all">{line.content || '\u00A0'}</span>
    </div>
  )
}
