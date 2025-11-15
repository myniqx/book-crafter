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
    <div className="flex h-full flex-col bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900 px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">Search</span>
          {results.length > 0 && (
            <Badge variant="secondary">
              {results.length} results ({totalMatches} matches)
            </Badge>
          )}
        </div>

        {/* Search Input */}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="h-9"
          autoFocus
        />

        {/* Replace Input */}
        {showReplace && (
          <div className="space-y-2">
            <Input
              value={replaceWith}
              onChange={(e) => setReplaceWith(e.target.value)}
              placeholder="Replace with..."
              className="h-9"
            />
            <Button
              size="sm"
              onClick={handleReplaceAll}
              disabled={!query.trim() || groupedResults.chapter.length === 0}
              className="w-full"
            >
              <Replace className="h-3 w-3 mr-1" />
              Replace All in Chapters
            </Button>
          </div>
        )}

        {/* Options */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="case-sensitive"
              checked={caseSensitive}
              onCheckedChange={(checked) => setCaseSensitive(checked === true)}
            />
            <Label htmlFor="case-sensitive" className="text-xs cursor-pointer">
              Case sensitive
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="use-regex"
              checked={useRegex}
              onCheckedChange={(checked) => setUseRegex(checked === true)}
            />
            <Label htmlFor="use-regex" className="text-xs cursor-pointer">
              Regex
            </Label>
          </div>

          <Button
            size="sm"
            variant={showReplace ? 'default' : 'outline'}
            onClick={() => setShowReplace(!showReplace)}
            className="h-7"
          >
            <Replace className="h-3 w-3 mr-1" />
            Replace
          </Button>
        </div>

        {/* Search In */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="search-chapters"
              checked={searchInChapters}
              onCheckedChange={(checked) => setSearchInChapters(checked === true)}
            />
            <Label htmlFor="search-chapters" className="text-xs cursor-pointer">
              Chapters
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="search-entities"
              checked={searchInEntities}
              onCheckedChange={(checked) => setSearchInEntities(checked === true)}
            />
            <Label htmlFor="search-entities" className="text-xs cursor-pointer">
              Entities
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="search-notes"
              checked={searchInNotes}
              onCheckedChange={(checked) => setSearchInNotes(checked === true)}
            />
            <Label htmlFor="search-notes" className="text-xs cursor-pointer">
              Notes
            </Label>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {!query.trim() ? (
          <div className="text-center py-8 text-sm text-slate-500">
            Enter a search query to find text across your workspace
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">No results found</div>
        ) : (
          <>
            {/* Chapters */}
            {groupedResults.chapter.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <FileText className="h-3 w-3" />
                  Chapters ({groupedResults.chapter.length})
                </div>
                {groupedResults.chapter.map((result) => (
                  <ResultCard key={result.id} result={result} />
                ))}
              </div>
            )}

            {/* Entities */}
            {groupedResults.entity.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <Users className="h-3 w-3" />
                  Entities ({groupedResults.entity.length})
                </div>
                {groupedResults.entity.map((result) => (
                  <ResultCard key={result.id} result={result} />
                ))}
              </div>
            )}

            {/* Notes */}
            {groupedResults.note.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  <StickyNote className="h-3 w-3" />
                  Notes ({groupedResults.note.length})
                </div>
                {groupedResults.note.map((result) => (
                  <ResultCard key={result.id} result={result} />
                ))}
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
    <Card className="p-3 hover:bg-slate-800 transition-colors cursor-pointer">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-slate-200 truncate">{result.title}</h3>
            <p className="text-xs text-slate-500">{result.subtitle}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {result.matchCount}
          </Badge>
        </div>

        {result.matches.length > 0 && (
          <div className="text-xs text-slate-400 space-y-1">
            {result.matches.slice(0, 3).map((match, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-slate-600">L{match.line}</span>
                <ArrowRight className="h-3 w-3 text-slate-600 mt-0.5" />
                <span className="flex-1 truncate">{match.text}</span>
              </div>
            ))}
            {result.matches.length > 3 && (
              <p className="text-slate-600">+{result.matches.length - 3} more matches</p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
