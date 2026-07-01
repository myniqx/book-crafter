import { toast } from 'sonner'
import { logger } from './logger'

export function handleExternalChange(
  behavior: 'auto' | 'ask' | 'never',
  label: string,
  reload: () => Promise<void>
): void {
  if (behavior === 'never') return

  if (behavior === 'auto') {
    reload().catch((e) => logger.error(`Auto-reload failed: ${label}`, 'fileReload', e))
    return
  }

  toast(`${label} was changed externally.`, {
    action: {
      label: 'Reload',
      onClick: () =>
        reload().catch((e) => logger.error(`Manual reload failed: ${label}`, 'fileReload', e))
    },
    duration: 8000
  })
}
