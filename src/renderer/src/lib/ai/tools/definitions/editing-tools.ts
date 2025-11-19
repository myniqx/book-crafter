import type { ToolDefinition } from '../../types'

/**
 * Editing tools - proofreading, style adaptation, translation
 */
export const editingTools: ToolDefinition[] = [
  {
    name: 'proofread',
    description: 'Check text for grammar, spelling, and punctuation errors',
    category: 'editing',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to proofread'
        },
        language: {
          type: 'string',
          description: 'The language of the text',
          enum: ['en', 'tr', 'de', 'fr', 'es']
        },
        returnCorrected: {
          type: 'boolean',
          description: 'Whether to return corrected text or just list errors',
          default: true
        }
      },
      required: ['text']
    }
  },
  {
    name: 'adapt_style',
    description: 'Adapt text to a different writing style',
    category: 'editing',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to adapt'
        },
        targetStyle: {
          type: 'string',
          description: 'The target writing style',
          enum: ['formal', 'casual', 'literary', 'journalistic', 'academic', 'poetic']
        },
        preserveTone: {
          type: 'boolean',
          description: 'Whether to preserve the emotional tone',
          default: true
        }
      },
      required: ['text', 'targetStyle']
    }
  },
  {
    name: 'change_pov',
    description: 'Change the point of view of a text (first person, third person, etc.)',
    category: 'editing',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to transform'
        },
        targetPOV: {
          type: 'string',
          description: 'The target point of view',
          enum: ['first-person', 'second-person', 'third-person-limited', 'third-person-omniscient']
        },
        protagonistName: {
          type: 'string',
          description: 'Name to use when converting from first person'
        }
      },
      required: ['text', 'targetPOV']
    }
  },
  {
    name: 'change_tense',
    description: 'Change the tense of a text (past, present, future)',
    category: 'editing',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to transform'
        },
        targetTense: {
          type: 'string',
          description: 'The target tense',
          enum: ['past', 'present', 'future']
        }
      },
      required: ['text', 'targetTense']
    }
  },
  {
    name: 'simplify_text',
    description: 'Simplify complex text for better readability',
    category: 'editing',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to simplify'
        },
        targetLevel: {
          type: 'string',
          description: 'Target reading level',
          enum: ['elementary', 'middle-school', 'high-school', 'general-adult']
        }
      },
      required: ['text']
    }
  },
  {
    name: 'intensify_emotion',
    description: 'Intensify or reduce the emotional intensity of text',
    category: 'editing',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to modify'
        },
        emotion: {
          type: 'string',
          description: 'The emotion to intensify',
          enum: ['tension', 'joy', 'sadness', 'fear', 'anger', 'love', 'surprise']
        },
        intensity: {
          type: 'string',
          description: 'How much to adjust',
          enum: ['reduce', 'subtle', 'moderate', 'intense', 'extreme']
        }
      },
      required: ['text', 'emotion', 'intensity']
    }
  },
  {
    name: 'translate',
    description: 'Translate text to another language while preserving literary style',
    category: 'editing',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to translate'
        },
        targetLanguage: {
          type: 'string',
          description: 'The target language',
          enum: ['en', 'tr', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh']
        },
        preserveNames: {
          type: 'boolean',
          description: 'Whether to keep character/place names untranslated',
          default: true
        }
      },
      required: ['text', 'targetLanguage']
    }
  },
  {
    name: 'add_descriptions',
    description: 'Add sensory descriptions to text (sight, sound, smell, etc.)',
    category: 'editing',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to enhance'
        },
        senses: {
          type: 'array',
          description: 'Which senses to focus on',
          items: {
            type: 'string',
            enum: ['sight', 'sound', 'smell', 'touch', 'taste'],
            description: ''
          }
        },
        density: {
          type: 'string',
          description: 'How much description to add',
          enum: ['light', 'moderate', 'rich']
        }
      },
      required: ['text']
    }
  },
  {
    name: 'remove_filter_words',
    description: 'Remove filter words and strengthen prose (e.g., "seemed", "felt", "appeared")',
    category: 'editing',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to improve'
        },
        aggressive: {
          type: 'boolean',
          description: 'Whether to aggressively remove all filter words or be conservative',
          default: false
        }
      },
      required: ['text']
    }
  }
]
