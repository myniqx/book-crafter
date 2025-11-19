import type { ToolDefinition } from '../../types'

/**
 * Generation tools - creating content, characters, scenes
 */
export const generationTools: ToolDefinition[] = [
  {
    name: 'generate_character',
    description: 'Generate a new character with detailed attributes based on requirements',
    category: 'generation',
    requiresApproval: true,
    parameters: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          description: 'The role of the character (protagonist, antagonist, supporting, minor)'
        },
        traits: {
          type: 'array',
          description: 'Desired personality traits',
          items: {
            type: 'string'
          }
        },
        context: {
          type: 'string',
          description: 'Context about the story/setting for character generation'
        },
        gender: {
          type: 'string',
          description: 'Optional: preferred gender',
          enum: ['male', 'female', 'non-binary', 'any']
        },
        ageRange: {
          type: 'string',
          description: 'Optional: age range',
          enum: ['child', 'teen', 'young-adult', 'adult', 'middle-aged', 'elderly']
        }
      },
      required: ['role']
    }
  },
  {
    name: 'generate_location',
    description: 'Generate a new location with detailed description',
    category: 'generation',
    requiresApproval: true,
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Type of location',
          enum: ['city', 'building', 'natural', 'room', 'vehicle', 'other']
        },
        mood: {
          type: 'string',
          description: 'The mood/atmosphere of the location',
          enum: ['peaceful', 'ominous', 'bustling', 'abandoned', 'mysterious', 'cozy']
        },
        context: {
          type: 'string',
          description: 'Context about the story/setting'
        },
        features: {
          type: 'array',
          description: 'Specific features to include',
          items: {
            type: 'string'
          }
        }
      },
      required: ['type']
    }
  },
  {
    name: 'write_scene',
    description: 'Write a scene based on given parameters',
    category: 'generation',
    requiresApproval: true,
    parameters: {
      type: 'object',
      properties: {
        characters: {
          type: 'array',
          description: 'Entity slugs of characters in the scene',
          items: {
            type: 'string'
          }
        },
        location: {
          type: 'string',
          description: 'Entity slug of the location (or description if no entity)'
        },
        goal: {
          type: 'string',
          description: 'What should happen in this scene'
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
  {
    name: 'suggest_dialogue',
    description: 'Generate dialogue between characters',
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
  {
    name: 'generate_outline',
    description: 'Generate a chapter or story outline',
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
  {
    name: 'expand_text',
    description: 'Expand a short text into a longer, more detailed version',
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
  {
    name: 'brainstorm_ideas',
    description: 'Generate creative ideas for plot, characters, or scenes',
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
