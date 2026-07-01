import React, { useState, useMemo } from 'react'
import { useStore } from '@renderer/store'
import {
  globalSearch,
  replaceInText,
  getTotalMatches,
  groupResultsByType,
  type SearchOptions,
  type SearchResult
} from '@renderer/lib/search'
import { cn } from '@renderer/lib/utils'
import { Search, Replace, FileText, Users, StickyNote, ArrowRight } from 'lucide-react'
import { Input } from '@renderer/components/ui/input'
import { Button } from '@renderer/components/ui/button'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Label } from '@renderer/components/ui/label'
import { Badge } from '@renderer/components/ui/badge'
import { Card } from '@renderer/components/ui/card'

export const SearchPanel: React.FC = () => {
  const [query, setQuery] = useState('')
  const [replaceWith, setReplaceWith] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [searchInChapters, setSearchInChapters] = useState(true)
  const [searchInEntities, setSearchInEntities] = useState(true)
  const [searchInNotes, setSearchInNotes] = useState(true)
  const [showReplace, setShowReplace] = useState(false)

  const workspacePath = useStore((state) => state.workspacePath)
  const books = useStore((state) => state.books)
  const entities = useStore((state) => state.entities)
  const notes = useStore((state) => state.notes)
  const updateChapterContent = useStore((state) => state.updateChapterContent)
  const saveChapterToDisk = useStore((state) => state.saveChapterToDisk)

  const searchOptions: SearchOptions = useMemo(
    () => ({
      query,
      caseSensitive,
      useRegex,
      searchInChapters,
      searchInEntities,
      searchInNotes
    }),
    [query, caseSensitive, useRegex, searchInChapters, searchInEntities, searchInNotes]
  )

  const results = useMemo(() => {
    if (!query.trim()) return []
    return globalSearch(books, entities, notes, searchOptions)
  }, [books, entities, notes, searchOptions, query])

  const groupedResults = useMemo(() => groupResultsByType(results), [results])
  const totalMatches = useMemo(() => getTotalMatches(results), [results])

  const handleReplaceAll = async (): Promise<void> => {
    if (!workspacePath || !query.trim() || !showReplace) return

    const chapterResults = groupedResults.chapter
    let replacedCount = 0

    for (const result of chapterResults) {
      if (result.bookSlug && result.chapterSlug) {
        const book = books[result.bookSlug]
        const chapter = book?.chapters.find((c) => c.slug === result.chapterSlug)

        if (chapter) {
          const newContent = replaceInText(chapter.content, query, replaceWith, {
            caseSensitive,
            useRegex
          })

          if (newContent !== chapter.content) {
            updateChapterContent(result.bookSlug, result.chapterSlug, newContent)
            await saveChapterToDisk(workspacePath, result.bookSlug, result.chapterSlug)
            replacedCount++
          }
        }
      }
    }

    alert(`Replaced in ${replacedCount} chapter(s)`)
    setQuery('')
    setReplaceWith('')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-outline-variant px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Search</h3>
          {results.length > 0 && (
            <Badge variant="secondary">{results.length} ({totalMatches})</Badge>
          )}
        </div>

        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="h-8 text-xs" autoFocus />

        {showReplace && (
          <div className="space-y-1.5">
            <Input value={replaceWith} onChange={(e) => setReplaceWith(e.target.value)} placeholder="Replace with..." className="h-8 text-xs" />
            <Button size="sm" onClick={handleReplaceAll} disabled={!query.trim() || groupedResults.chapter.length === 0} className="w-full h-7">
              <Replace className="h-3 w-3 mr-1" />Replace All in Chapters
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <Checkbox id="case-sensitive" checked={caseSensitive} onCheckedChange={(c) => setCaseSensitive(c === true)} />
            <Label htmlFor="case-sensitive" className="text-xs cursor-pointer">Aa</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <Checkbox id="use-regex" checked={useRegex} onCheckedChange={(c) => setUseRegex(c === true)} />
            <Label htmlFor="use-regex" className="text-xs cursor-pointer">.*</Label>
          </div>
          <Button size="sm" variant={showReplace ? 'default' : 'outline'} onClick={() => setShowReplace(!showReplace)} className="h-6 text-xs px-2">
            <Replace className="h-3 w-3 mr-1" />Replace
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'search-chapters', checked: searchInChapters, onChange: setSearchInChapters, label: 'Chapters' },
            { id: 'search-entities', checked: searchInEntities, onChange: setSearchInEntities, label: 'Entities' },
            { id: 'search-notes', checked: searchInNotes, onChange: setSearchInNotes, label: 'Notes' },
          ].map(({ id, checked, onChange, label }) => (
            <div key={id} className="flex items-center gap-1.5">
              <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(c === true)} />
              <Label htmlFor={id} className="text-xs cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {!query.trim() ? (
          <div className="text-center py-8 text-xs text-on-surface-variant">Enter a search query to find text across your workspace</div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-xs text-on-surface-variant">No results found</div>
        ) : (
          <>
            {groupedResults.chapter.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  <FileText className="h-3 w-3" />Chapters ({groupedResults.chapter.length})
                </div>
                {groupedResults.chapter.map((result) => <ResultCard key={result.id} result={result} />)}
              </div>
            )}
            {groupedResults.entity.length > 0 && (
              <div className="space-y-1.5 mt-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  <Users className="h-3 w-3" />Entities ({groupedResults.entity.length})
                </div>
                {groupedResults.entity.map((result) => <ResultCard key={result.id} result={result} />)}
              </div>
            )}
            {groupedResults.note.length > 0 && (
              <div className="space-y-1.5 mt-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  <StickyNote className="h-3 w-3" />Notes ({groupedResults.note.length})
                </div>
                {groupedResults.note.map((result) => <ResultCard key={result.id} result={result} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const ResultCard: React.FC<{ result: SearchResult }> = ({ result }) => {
  return (
    <Card className="p-2.5 hover:bg-surface-container-high transition-colors duration-150 cursor-pointer bg-surface-container border-outline-variant">
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-on-surface truncate">{result.title}</h3>
            <p className="text-xs text-on-surface-variant">{result.subtitle}</p>
          </div>
          <Badge variant="secondary" className="text-xs">{result.matchCount}</Badge>
        </div>

        {result.matches.length > 0 && (
          <div className="text-xs text-on-surface-variant space-y-0.5">
            {result.matches.slice(0, 3).map((match, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-outline font-mono">L{match.line}</span>
                <ArrowRight className="h-3 w-3 text-outline mt-0.5 shrink-0" />
                <span className="flex-1 truncate">{match.text}</span>
              </div>
            ))}
            {result.matches.length > 3 && (
              <p className="text-outline">+{result.matches.length - 3} more matches</p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
