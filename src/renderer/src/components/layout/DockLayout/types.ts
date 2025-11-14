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

export type { LayoutData, TabData, PanelData, BoxData }
