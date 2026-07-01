import ipcClient from './ipc'
import { logger } from './logger'

const BACKUPS_DIR = '.backups'

export function getBackupsDir(workspacePath: string, customPath?: string): string {
  return customPath || `${workspacePath}/${BACKUPS_DIR}`
}

function buildTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

function buildZipName(label: string): string {
  return `backup_${label}_${buildTimestamp()}.zip`
}

/**
 * Create a ZIP backup of the entire workspace into the backups directory.
 * The .backups folder itself is excluded from the archive.
 */
export async function createWorkspaceBackup(
  workspacePath: string,
  options: { maxBackups: number; backupPath?: string; label?: string }
): Promise<string> {
  const backupsDir = getBackupsDir(workspacePath, options.backupPath)
  const zipName = buildZipName(options.label ?? 'workspace')
  const destPath = `${backupsDir}/${zipName}`

  logger.info(`Creating workspace backup: ${zipName}`, 'backup')

  await ipcClient.fs.zipDirectory(workspacePath, destPath, [BACKUPS_DIR])

  await enforceMaxBackups(backupsDir, options.maxBackups)

  logger.info(`Backup created: ${destPath}`, 'backup')
  return destPath
}

/**
 * Delete oldest backups so the total count stays within maxBackups.
 */
async function enforceMaxBackups(backupsDir: string, maxBackups: number): Promise<void> {
  const exists = await ipcClient.fs.exists(backupsDir)
  if (!exists) return

  const files = await ipcClient.fs.readDir(backupsDir)
  const zipFiles = files.filter((f) => f.endsWith('.zip')).sort()

  if (zipFiles.length <= maxBackups) return

  const toDelete = zipFiles.slice(0, zipFiles.length - maxBackups)
  for (const file of toDelete) {
    await ipcClient.fs.delete(`${backupsDir}/${file}`)
    logger.debug(`Deleted old backup: ${file}`, 'backup')
  }
}
