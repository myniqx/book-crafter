import type { ToolDefinition } from '../../types'

/**
 * Generation tools - creating content, characters, scenes
 * These tools create entities and generate content for writing
 */
export const generationTools: ToolDefinition[] = [
  /**
   * CREATE CHARACTER ENTITY
   *
   * What it does:
   * - Creates a new character entity using the person template
   * - Adds entity to store and saves to .entities/{slug}.json
   * - Entity can be referenced in chapters using @entity-slug syntax
   * - Enables usage tracking and statistics
   *
   * Parameters:
   * - name: Character name (required) - used to generate slug
   * - age: Character age (optional)
   * - occupation: Character's job/role (optional)
   * - description: Character backstory and personality (optional)
   *
   * Returns:
   * - Success message with entity slug for @mention usage
   * - Example: "Successfully created character 'John Doe' (@john-doe)"
   *
   * Requires Approval: true (creates entity file on disk)
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
   * What it does:
   * - Creates a new location entity using the place template
   * - Adds entity to store and saves to .entities/{slug}.json
   * - Entity can be referenced in chapters using @entity-slug syntax
   * - Enables usage tracking and statistics
   *
   * Parameters:
   * - name: Location name (required) - used to generate slug
   * - location: Geographic location or address (optional)
   * - description: Location details, atmosphere, features (optional)
   *
   * Returns:
   * - Success message with entity slug for @mention usage
   * - Example: "Successfully created location 'Cafe Noir' (@cafe-noir)"
   *
   * Requires Approval: true (creates entity file on disk)
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
  },
  /**
   * WRITE SCENE
   *
   * What it does:
   * - Provides scene parameters and character context for AI to write a scene
   * - Returns entity details to help AI use @mention syntax
   * - AI writes the scene using @entity-slug for characters and locations
   * - Does NOT write to chapter automatically (user must use write_chapter)
   *
   * Parameters:
   * - goal: What should happen in the scene (required)
   * - characters: Entity slugs of characters (optional)
   * - location: Entity slug of location (optional)
   * - mood: Emotional tone (optional)
   * - wordCount: Target word count (optional)
   *
   * Returns:
   * - Scene setup with entity details and @mention guidance
   * - AI then writes the scene content using @entity-slug syntax
   *
   * Requires Approval: false (only provides context, doesn't write to files)
   */
  {
    name: 'write_scene',
    description:
      'Provide scene parameters and entity context for AI to write a scene using @mention syntax for characters and locations',
    category: 'generation',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: 'What should happen in this scene'
        },
        characters: {
          type: 'array',
          description: 'Entity slugs of characters in the scene (e.g., ["john-doe", "mary-jane"])',
          items: {
            type: 'string'
          }
        },
        location: {
          type: 'string',
          description: 'Entity slug of the location (e.g., "cafe-noir")'
        },
        mood: {
          type: 'string',
          description: 'The emotional tone of the scene',
          enum: ['tense', 'romantic', 'action', 'comedic', 'dramatic', 'mysterious', 'peaceful']
        },
        wordCount: {
          type: 'number',
          description: 'Approximate target word count'
        }
      },
      required: ['goal']
    }
  },
  /**
   * SUGGEST DIALOGUE
   *
   * What it does:
   * - Provides character context for AI to generate dialogue
   * - AI creates dialogue using @mention syntax
   * - Returns conversation between specified characters
   *
   * Parameters:
   * - characters: Entity slugs (required)
   * - topic: What to discuss (required)
   * - mood: Tone of conversation (optional)
   * - lines: Approximate dialogue length (optional)
   *
   * Returns:
   * - Character details and dialogue suggestion using @mentions
   *
   * Requires Approval: false (only provides context)
   */
  {
    name: 'suggest_dialogue',
    description:
      'Provide character context for AI to generate dialogue using @mention syntax for characters',
    category: 'generation',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        characters: {
          type: 'array',
          description: 'Entity slugs of characters in the dialogue',
          items: {
            type: 'string'
          }
        },
        topic: {
          type: 'string',
          description: 'What the dialogue should be about'
        },
        mood: {
          type: 'string',
          description: 'The tone of the conversation',
          enum: ['casual', 'formal', 'heated', 'romantic', 'secretive', 'humorous']
        },
        lines: {
          type: 'number',
          description: 'Approximate number of dialogue lines',
          default: 10
        }
      },
      required: ['characters', 'topic']
    }
  },
  /**
   * GENERATE OUTLINE
   *
   * Provides parameters for AI to generate chapter/story outline.
   * Returns outline structure - does not write to files.
   */
  {
    name: 'generate_outline',
    description: 'Provide parameters for AI to generate a chapter or story outline',
    category: 'generation',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          description: 'Scope of the outline',
          enum: ['chapter', 'arc', 'book']
        },
        premise: {
          type: 'string',
          description: 'The basic premise or starting point'
        },
        beats: {
          type: 'number',
          description: 'Number of major beats/points to include',
          default: 5
        },
        includeCharacters: {
          type: 'array',
          description: 'Entity slugs of characters to include',
          items: {
            type: 'string'
          }
        }
      },
      required: ['scope', 'premise']
    }
  },
  /**
   * EXPAND TEXT
   *
   * Provides text and parameters for AI to expand into longer version.
   * AI preserves @mentions and writing style while expanding.
   */
  {
    name: 'expand_text',
    description:
      'Provide text and expansion parameters for AI to create a longer, more detailed version while preserving @mentions',
    category: 'generation',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to expand'
        },
        focus: {
          type: 'string',
          description: 'What aspect to focus on when expanding',
          enum: ['description', 'emotion', 'action', 'dialogue', 'all']
        },
        multiplier: {
          type: 'number',
          description: 'How much to expand (2 = double length, 3 = triple, etc.)',
          default: 2
        }
      },
      required: ['text']
    }
  },
  /**
   * BRAINSTORM IDEAS
   *
   * Provides topic and constraints for AI to brainstorm creative ideas.
   * Returns multiple idea suggestions - does not create entities or write files.
   */
  {
    name: 'brainstorm_ideas',
    description:
      'Provide topic and constraints for AI to generate creative ideas for plot, characters, or scenes',
    category: 'generation',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'What to brainstorm about'
        },
        type: {
          type: 'string',
          description: 'Type of ideas to generate',
          enum: ['plot-twist', 'conflict', 'backstory', 'subplot', 'ending', 'opening']
        },
        count: {
          type: 'number',
          description: 'Number of ideas to generate',
          default: 5
        },
        constraints: {
          type: 'string',
          description: 'Any constraints or requirements for the ideas'
        }
      },
      required: ['topic', 'type']
    }
  }
]
