import type { ToolDefinition } from '../../types'

/**
 * Generation tools - creating entities that persist in the workspace.
 *
 * Text-generation tasks (writing scenes, dialogue, outlines, style rewrites,
 * proofreading, etc.) are NOT tools: the model does those natively. They live
 * as preset prompts instead — see PRESET_PROMPTS in lib/ai/types.ts.
 */
export const generationTools: ToolDefinition[] = [
  /**
   * CREATE CHARACTER ENTITY
   *
   * Creates a new character entity using the person template and saves it to
   * the store. The entity can then be referenced in chapters with @entity-slug
   * syntax, which enables usage tracking and statistics.
   */
  {
    name: 'generate_character',
    description:
      'Create a new character entity that can be referenced in chapters using @mention syntax (e.g., @john-doe or @john-doe.age)',
    category: 'generation',
    requiresApproval: true,
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Full name of the character (required)'
        },
        age: {
          type: 'number',
          description: 'Age of the character (optional)'
        },
        occupation: {
          type: 'string',
          description: 'Occupation or role of the character (optional)'
        },
        description: {
          type: 'string',
          description:
            'Character backstory, personality, and other details (optional, can be multi-line)'
        }
      },
      required: ['name']
    }
  },
  /**
   * CREATE LOCATION ENTITY
   *
   * Creates a new location entity using the place template and saves it to
   * the store. Referencable in chapters via @entity-slug.
   */
  {
    name: 'generate_location',
    description:
      'Create a new location entity that can be referenced in chapters using @mention syntax (e.g., @london or @london.description)',
    category: 'generation',
    requiresApproval: true,
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the location (required)'
        },
        location: {
          type: 'string',
          description:
            'Geographic location, address, or relative position (e.g., "Downtown Paris", "Near the lake") (optional)'
        },
        description: {
          type: 'string',
          description:
            'Detailed description of the location including atmosphere, features, and significance (optional, can be multi-line)'
        }
      },
      required: ['name']
    }
  }
]
