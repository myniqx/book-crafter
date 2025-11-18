/**
 * Store Index - Feature-Based Stores
 *
 * This application uses modular, feature-based Zustand stores:
 * - useCoreStore: Workspace + UI (theme, dialogs)
 * - useContentStore: Books + Entities + Images + Notes
 * - useToolsStore: AI + Settings
 * - useSidebarStore: Sidebar state management
 */

// Export feature-based stores
export { useCoreStore, type CoreStore } from './coreStore'
export { useContentStore, type ContentStore } from './contentStore'
export { useToolsStore, type ToolsStore } from './toolsStore'
export { useSidebarStore, type SidebarState } from './sidebarStore'
export type { PanelId } from './sidebarStore'

// Re-export slice types for convenience
export type { WorkspaceSlice } from './slices/workspaceSlice'
export type { EntitySlice } from './slices/entitySlice'
export type { BooksSlice } from './slices/booksSlice'
export type { UISlice } from './slices/uiSlice'
export type { ImageSlice } from './slices/imageSlice'
export type { NoteSlice } from './slices/noteSlice'
export type { AISlice } from './slices/aiSlice'
export type { SettingsSlice } from './slices/settingsSlice'
