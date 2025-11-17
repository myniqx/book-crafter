import { type PanelId } from '@renderer/store'

export interface PanelConfig {
  id: PanelId
  title: string
  component: React.ComponentType
}

export type { PanelId }
