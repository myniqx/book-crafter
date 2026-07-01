import type { ToolDefinition } from '../../types'

/**
 * App tools - controlling the application itself (backups, settings)
 * and interacting with the user mid-run.
 */
export const appTools: ToolDefinition[] = [
  /**
   * APP COMMAND
   *
   * Single entry point for application-level actions. New actions are added
   * to the enum + executor switch instead of creating one tool per action.
   */
  {
    name: 'app_command',
    description:
      'Perform an application-level action: create a workspace backup, read the editor settings, or change an editor setting (e.g., increase the font size).',
    category: 'app',
    requiresApproval: true,
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'The action to perform',
          enum: ['create_backup', 'get_editor_settings', 'set_editor_setting']
        },
        label: {
          type: 'string',
          description: 'Optional label for the backup file (create_backup only)'
        },
        setting: {
          type: 'string',
          description: 'The editor setting to change (set_editor_setting only)',
          enum: [
            'fontSize',
            'fontFamily',
            'lineHeight',
            'wordWrap',
            'minimap',
            'lineNumbers',
            'tabSize',
            'autoSave',
            'autoSaveDelay'
          ]
        },
        value: {
          type: 'string',
          description:
            'The new value as a string (set_editor_setting only). Numbers and booleans are parsed automatically, e.g. "16", "true".'
        }
      },
      required: ['action']
    }
  },
  /**
   * ASK USER
   *
   * Lets the agent pause and ask the user a clarifying question with optional
   * clickable choices. The answer comes back as the tool result and the run
   * continues. Executed specially by the agent loop, not by the executor.
   */
  {
    name: 'ask_user',
    description:
      'Ask the user a clarifying question and wait for their answer. Use when a request is ambiguous (e.g., multiple books match "chapter 1") instead of guessing. Provide short options when the possible answers are known.',
    category: 'interaction',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The question to ask the user'
        },
        options: {
          type: 'array',
          description: 'Optional list of short answer choices shown as buttons',
          items: {
            type: 'string',
            description: 'An answer choice'
          }
        }
      },
      required: ['question']
    }
  }
]
