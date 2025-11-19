import type { LayoutData, TabData, PanelData, BoxData } from 'rc-dock'
import type {
  PanelId,
  TabMetadata,
  TabEditorData,
  TabPanelData,
  TabType
} from '@renderer/store/slices/uiSlice'

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

// Re-export tab types from uiSlice for convenience
export type { TabMetadata, TabEditorData, TabPanelData, TabType, PanelId }

export type { LayoutData, TabData, PanelData, BoxData }
