import type { WorkspaceConfig, ValidationResult, ValidationError } from '@renderer/types'

// ============================================================================
// Constants
// ============================================================================

export const CURRENT_VERSION = '1.0.0'
export const CONFIG_FILENAME = 'book-crafter.json'

// ============================================================================
// Default Configuration Generator
// ============================================================================

export function createDefaultWorkspaceConfig(projectName: string, author: string): WorkspaceConfig {
  const now = new Date().toISOString()

  return {
    projectName,
    version: CURRENT_VERSION,
    author,
    created: now,
    modified: now,
    editorSettings: {
      fontSize: 14,
      lineHeight: 1.6,
      wordWrap: true,
      minimap: false,
      lineNumbers: true,
      tabSize: 2,
      autoSave: true,
      autoSaveDelay: 1000
    }
  }
}

// ============================================================================
// Workspace Validation
// ============================================================================

export function validateWorkspaceConfig(config: unknown): ValidationResult {
  const errors: ValidationError[] = []

  if (!config || typeof config !== 'object') {
    errors.push({
      field: 'root',
      message: 'Configuration must be an object',
      severity: 'error'
    })
    return { valid: false, errors }
  }

  const cfg = config as Partial<WorkspaceConfig>

  // Required fields
  if (!cfg.projectName || typeof cfg.projectName !== 'string') {
    errors.push({
      field: 'projectName',
      message: 'Project name is required and must be a string',
      severity: 'error'
    })
  }

  if (!cfg.version || typeof cfg.version !== 'string') {
    errors.push({
      field: 'version',
      message: 'Version is required and must be a string',
      severity: 'error'
    })
  }

  if (!cfg.author || typeof cfg.author !== 'string') {
    errors.push({
      field: 'author',
      message: 'Author is required and must be a string',
      severity: 'error'
    })
  }

  if (!cfg.created || typeof cfg.created !== 'string') {
    errors.push({
      field: 'created',
      message: 'Created timestamp is required',
      severity: 'error'
    })
  }

  if (!cfg.modified || typeof cfg.modified !== 'string') {
    errors.push({
      field: 'modified',
      message: 'Modified timestamp is required',
      severity: 'error'
    })
  }

  // Editor settings validation
  if (cfg.editorSettings) {
    const settings = cfg.editorSettings

    if (typeof settings.fontSize !== 'number' || settings.fontSize < 8 || settings.fontSize > 32) {
      errors.push({
        field: 'editorSettings.fontSize',
        message: 'Font size must be between 8 and 32',
        severity: 'error'
      })
    }

    if (
      typeof settings.lineHeight !== 'number' ||
      settings.lineHeight < 1.0 ||
      settings.lineHeight > 3.0
    ) {
      errors.push({
        field: 'editorSettings.lineHeight',
        message: 'Line height must be between 1.0 and 3.0',
        severity: 'error'
      })
    }
  } else {
    errors.push({
      field: 'editorSettings',
      message: 'Editor settings are required',
      severity: 'error'
    })
  }

  // AI Config validation (optional)
  if (cfg.aiConfig) {
    const ai = cfg.aiConfig

    if (!['ollama', 'openai', 'anthropic'].includes(ai.type)) {
      errors.push({
        field: 'aiConfig.type',
        message: 'AI type must be ollama, openai, or anthropic',
        severity: 'error'
      })
    }

    if (!ai.endpoint || typeof ai.endpoint !== 'string') {
      errors.push({
        field: 'aiConfig.endpoint',
        message: 'AI endpoint is required',
        severity: 'error'
      })
    }

    if (!ai.model || typeof ai.model !== 'string') {
      errors.push({
        field: 'aiConfig.model',
        message: 'AI model is required',
        severity: 'error'
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================================================
// Version Checking
// ============================================================================

export function isVersionCompatible(configVersion: string): boolean {
  const [configMajor] = configVersion.split('.').map(Number)
  const [currentMajor] = CURRENT_VERSION.split('.').map(Number)

  return configMajor === currentMajor
}

export function needsMigration(configVersion: string): boolean {
  return configVersion !== CURRENT_VERSION && isVersionCompatible(configVersion)
}

// ============================================================================
// Config Updates
// ============================================================================

export function updateModifiedTimestamp(config: WorkspaceConfig): WorkspaceConfig {
  return {
    ...config,
    modified: new Date().toISOString()
  }
}

export function updateEditorSettings(
  config: WorkspaceConfig,
  updates: Partial<WorkspaceConfig['editorSettings']>
): WorkspaceConfig {
  return updateModifiedTimestamp({
    ...config,
    editorSettings: {
      ...config.editorSettings,
      ...updates
    }
  })
}

export function updateAIConfig(
  config: WorkspaceConfig,
  updates: Partial<WorkspaceConfig['aiConfig']>
): WorkspaceConfig {
  return updateModifiedTimestamp({
    ...config,
    aiConfig: {
      ...(config.aiConfig || {
        type: 'ollama',
        endpoint: 'http://localhost:11434',
        model: 'llama2'
      }),
      ...updates
    }
  })
}
