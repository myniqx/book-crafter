import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { useStore } from '@renderer/store'
import { processMarkdownForPreview, countMarkdownWords, getReadingTime } from '@renderer/lib/markdown'
import { useDebounce } from '@renderer/hooks/useDebounce'
import type { MarkdownPreviewProps } from './types'
import { cn } from '@renderer/lib/utils'
import { BookOpen, FileText, Clock } from 'lucide-react'

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ className }) => {
  const entities = useStore((state) => state.entities)
  const images = useStore((state) => state.images)
  const workspacePath = useStore((state) => state.workspacePath)
  const books = useStore((state) => state.books)
  const openEditorTabs = useStore((state) => state.openEditorTabs)
  const activeTabIndex = useStore((state) => state.activeTabIndex)

  // Get active tab data
  const activeTabData = useMemo(() => {
    if (activeTabIndex >= 0 && openEditorTabs[activeTabIndex]) {
      const tab = openEditorTabs[activeTabIndex]
      const book = books[tab.bookSlug]
      if (book) {
        const chapter = book.chapters.find((c) => c.slug === tab.chapterSlug)
        return { book, chapter, tab }
      }
    }
    return null
  }, [openEditorTabs, activeTabIndex, books])

  // Get raw content from active chapter
  const rawContent = useMemo(() => {
    return activeTabData?.chapter?.content || ''
  }, [activeTabData])

  // Debounce content to prevent excessive re-renders
  const debouncedContent = useDebounce(rawContent, 300)

  // Process markdown content
  const processedContent = useMemo(() => {
    if (!workspacePath) return debouncedContent
    return processMarkdownForPreview(debouncedContent, entities, images, workspacePath)
  }, [debouncedContent, entities, images, workspacePath])

  // Calculate statistics
  const wordCount = useMemo(() => {
    return countMarkdownWords(processedContent)
  }, [processedContent])

  const readingTime = useMemo(() => {
    return getReadingTime(wordCount)
  }, [wordCount])

  // Empty state
  if (!activeTabData || !activeTabData.chapter) {
    return (
      <div className={cn('flex h-full items-center justify-center bg-slate-950', className)}>
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <FileText className="h-16 w-16 opacity-20" />
          <p className="text-sm">No chapter selected</p>
          <p className="text-xs text-slate-500">Open a chapter to see the preview</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col bg-slate-950', className)}>
      {/* Preview Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">
            {activeTabData.book.title}
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-sm text-slate-400">{activeTabData.chapter.title}</span>
        </div>

        {/* Statistics */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{wordCount} words</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{readingTime}</span>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div
          className={cn(
            'prose prose-invert prose-slate mx-auto max-w-4xl',
            'prose-headings:font-bold prose-headings:text-slate-100',
            'prose-h1:text-4xl prose-h1:mb-4',
            'prose-h2:text-3xl prose-h2:mb-3 prose-h2:mt-8',
            'prose-h3:text-2xl prose-h3:mb-2 prose-h3:mt-6',
            'prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4',
            'prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline',
            'prose-strong:text-slate-200 prose-strong:font-semibold',
            'prose-em:text-slate-300 prose-em:italic',
            'prose-code:text-purple-400 prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
            'prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800',
            'prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-400',
            'prose-ul:list-disc prose-ul:pl-6 prose-ul:text-slate-300',
            'prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-slate-300',
            'prose-li:mb-1',
            'prose-hr:border-slate-800 prose-hr:my-8',
            'prose-table:border-collapse prose-table:w-full',
            'prose-th:border prose-th:border-slate-700 prose-th:bg-slate-800 prose-th:px-4 prose-th:py-2 prose-th:text-left',
            'prose-td:border prose-td:border-slate-700 prose-td:px-4 prose-td:py-2',
            'prose-img:rounded-lg prose-img:shadow-lg'
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
          >
            {processedContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
