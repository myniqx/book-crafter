import { ElectronAPI } from '@electron-toolkit/preload'
import type { FetchResponse, FetchOptions, StreamOptions } from '../types/ipc'

interface HTTPAPI {
  request: <T = unknown>(url: string, options?: FetchOptions) => Promise<FetchResponse<T>>
  stream: (url: string, options: StreamOptions) => Promise<void>
}

interface FSAPI {
  readFile(path: string, options?: { encoding?: string }): Promise<string>
  writeFile(path: string, content: string, options?: { encoding?: string; backup?: boolean }): Promise<void>
  readdir(path: string, options?: { recursive?: boolean }): Promise<string[]>
  readDir(path: string, options?: { recursive?: boolean }): Promise<string[]>
  exists(path: string): Promise<boolean>
  dirExists(path: string): Promise<boolean>
  mkdir(path: string, recursive?: boolean | { recursive?: boolean }): Promise<void>
  unlink(path: string): Promise<void>
  delete(path: string): Promise<void>
  deleteFile(path: string): Promise<void>
  deleteDir(path: string): Promise<void>
  move(oldPath: string, newPath: string): Promise<void>
  moveFile(oldPath: string, newPath: string): Promise<void>
  copy(sourcePath: string, destPath: string): Promise<void>
  copyFile(sourcePath: string, destPath: string): Promise<void>
  fileExists(path: string): Promise<boolean>
  stat(path: string): Promise<{ isDirectory: () => boolean }>
  stats(path: string): Promise<{ isDirectory: () => boolean; size: number; mtime: Date }>
  watch(path: string, callback: (event: string, filename: string) => void): Promise<() => void>
}

interface AppAPI {
  http: HTTPAPI
  fetch: HTTPAPI  // Alias for http for compatibility
  fs: FSAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
