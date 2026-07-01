/**
 * File watch event bus.
 * FileWatcherService emits events here; slices and components subscribe.
 *
 * markInternalWrite() is called by ipc.ts writeFile so the watcher can
 * distinguish app-originated writes from external ones.
 */

const recentWrites = new Map<string, number>()

export function markInternalWrite(path: string): void {
  recentWrites.set(path, Date.now())
}

export function isInternalWrite(path: string): boolean {
  const ts = recentWrites.get(path)
  if (!ts) return false
  if (Date.now() - ts < 2000) return true
  recentWrites.delete(path)
  return false
}

export type WatchEventType =
  | 'workspace-config-changed'
  | 'book-changed'
  | 'chapter-meta-changed'
  | 'chapter-content-changed'
  | 'entity-changed'
  | 'note-changed'
  | 'image-changed'

export interface WatchEvent {
  type: WatchEventType
  /** Absolute path of the changed file */
  path: string
  bookSlug?: string
  chapterSlug?: string
  /** Entity/note/image slug derived from filename */
  slug?: string
}

type Listener = (event: WatchEvent) => void

const listeners = new Map<WatchEventType, Set<Listener>>()

export const watchEvents = {
  on(type: WatchEventType, listener: Listener): () => void {
    if (!listeners.has(type)) listeners.set(type, new Set())
    listeners.get(type)!.add(listener)
    return () => listeners.get(type)?.delete(listener)
  },

  emit(event: WatchEvent): void {
    listeners.get(event.type)?.forEach((l) => l(event))
  }
}
