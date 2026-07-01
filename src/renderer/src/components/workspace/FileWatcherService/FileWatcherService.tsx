import { useEffect, useRef } from 'react'
import { useCoreStore, useContentStore } from '@renderer/store'
import { useToolsStore } from '@renderer/store'
import { fs } from '@renderer/lib/ipc'
import { logger } from '@renderer/lib/logger'
import { watchEvents, isInternalWrite } from '@renderer/lib/watchEvents'
import { handleExternalChange } from '@renderer/lib/fileReload'
import { getEntitiesDir } from '@renderer/lib/entities'
import { getNotesDir } from '@renderer/lib/notes'
import { getImagesDir } from '@renderer/lib/images'

export const FileWatcherService: React.FC = () => {
  const workspacePath = useCoreStore((state) => state.workspacePath)
  const isWorkspaceLoaded = useCoreStore((state) => state.isWorkspaceLoaded)
  const books = useContentStore((state) => state.books)
  const reloadOnExternalChange = useToolsStore(
    (state) => state.workspacePreferences.reloadOnExternalChange
  )
  const watchExternalChanges = useToolsStore(
    (state) => state.workspacePreferences.watchExternalChanges
  )

  const reloadBehaviorRef = useRef(reloadOnExternalChange)
  useEffect(() => {
    reloadBehaviorRef.current = reloadOnExternalChange
  }, [reloadOnExternalChange])

  // Register fs.watch watchers for all workspace files
  useEffect(() => {
    if (!isWorkspaceLoaded || !workspacePath || !watchExternalChanges) return

    const unwatchers: Array<() => void> = []

    async function setup(): Promise<void> {
      if (!workspacePath) return

      const watched: Array<{ path: string; type: string; extra?: Record<string, string> }> = [
        { path: `${workspacePath}/book-crafter.json`, type: 'workspace-config-changed' },
        { path: getEntitiesDir(workspacePath), type: 'entity-changed' },
        { path: getNotesDir(workspacePath), type: 'note-changed' },
        { path: getImagesDir(workspacePath), type: 'image-changed' },
        ...Object.keys(books).map((bookSlug) => ({
          path: `${workspacePath}/books/${bookSlug}/book.json`,
          type: 'book-changed',
          extra: { bookSlug }
        }))
      ]

      for (const { path, type, extra } of watched) {
        try {
          const unwatch = await fs.watch(path, (event, filename) => {
            // Directory watchers: only care about .json files
            const isDir = !path.endsWith('.json')
            if (isDir && (!filename || !filename.endsWith('.json'))) return
            if (!isDir && event !== 'change') return

            const fullPath = isDir ? `${path}/${filename}` : path
            if (isInternalWrite(fullPath)) return

            const slug = isDir && filename ? filename.replace(/\.json$/, '') : undefined
            logger.debug(`External change: ${type} ${slug ?? ''}`, 'FileWatcherService')
            watchEvents.emit({ type: type as never, path: fullPath, slug, ...extra })
          })
          unwatchers.push(unwatch)
        } catch (e) {
          logger.warn(`Could not watch ${path}`, 'FileWatcherService', e)
        }
      }
    }

    setup()
    return () => unwatchers.forEach((u) => u())
  }, [isWorkspaceLoaded, workspacePath, watchExternalChanges, Object.keys(books).join(',')])

  // Subscribe to watch events and trigger reloads
  useEffect(() => {
    if (!workspacePath) return

    const handle = (label: string, reload: () => Promise<void>): void =>
      handleExternalChange(reloadBehaviorRef.current, label, reload)

    const unsubs = [
      watchEvents.on('workspace-config-changed', () =>
        handle('Project config', () => useCoreStore.getState().loadWorkspace(workspacePath))
      ),

      watchEvents.on('book-changed', ({ bookSlug }) =>
        handle(`Book "${bookSlug}" config`, async () => {
          await useContentStore.getState().loadAllBooks(workspacePath)
          const coreStore = useCoreStore.getState()
          const updatedBooks = useContentStore.getState().books
          coreStore.openTabs.forEach((tab) => {
            if (tab.type !== 'editor') return
            const data = tab.data as { bookSlug: string; chapterSlug: string }
            if (data.bookSlug !== bookSlug) return
            const chapterExists = updatedBooks[bookSlug]?.chapters.some(
              (c) => c.slug === data.chapterSlug
            )
            if (!chapterExists) coreStore.closeTab(tab.id)
          })
        })
      ),

      watchEvents.on('entity-changed', ({ slug }) =>
        handle(`Entity "${slug}"`, () =>
          useContentStore.getState().loadAllEntities(workspacePath)
        )
      ),

      watchEvents.on('note-changed', ({ slug }) =>
        handle(`Note "${slug}"`, () =>
          useContentStore.getState().loadAllNotes(workspacePath)
        )
      ),

      watchEvents.on('image-changed', ({ slug }) =>
        handle(`Image "${slug}"`, () =>
          useContentStore.getState().loadAllImages(workspacePath)
        )
      ),
    ]

    return () => unsubs.forEach((u) => u())
  }, [workspacePath])

  return null
}
