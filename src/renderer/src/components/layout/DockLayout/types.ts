import type { LayoutData, TabData, PanelData, BoxData } from 'rc-dock'
import type { PanelId } from '@renderer/store/slices/uiSlice'

export interface PanelConfig {
  id: PanelId
  title: string
  content: React.ReactNode
  group?: string
  minWidth?: number
  minHeight?: number
  closable?: boolean
}

export interface DockLayoutProps {
  children?: React.ReactNode
}

/**
 * Tab Type System
 * Defines all possible tab types that can be opened in DockLayout
 */
export type TabType = 'editor' | 'panel'

/**
 * Tab Metadata
 * Generic structure for all tabs in DockLayout
 * This is the single source of truth for tab state
 */
export interface TabMetadata {
  /** Unique identifier for the tab (e.g., 'editor-book1-chapter1') */
  id: string

  /** Type of the tab */
  type: TabType

  /** Display title */
  title: string

  /** Whether the tab can be closed */
  closable: boolean

  /** Type-specific data */
  data?: TabEditorData | TabPanelData
}

/**
 * Editor Tab Data
 * For chapter/document editors
 */
export interface TabEditorData {
  bookSlug: string
  chapterSlug: string
}

/**
 * Panel Tab Data
 * For fixed panels (entity-detail, image-detail, etc.)
 */
export interface TabPanelData {
  panelId: PanelId
}

export type { LayoutData, TabData, PanelData, BoxData }
