import type { ToolDefinition } from '../../types'

/**
 * Editing tools - proofreading, style adaptation, translation
 * These tools provide text and parameters for AI to perform editing operations
 * AI preserves @mention syntax and returns edited text
 */
export const editingTools: ToolDefinition[] = [
  /**
   * PROOFREAD
   *
   * What it does:
   * - Provides text for AI to check grammar, spelling, punctuation
   * - AI returns corrected text or list of errors
   * - Preserves @mention syntax and markdown formatting
   *
   * Parameters:
   * - text: Text to proofread (required)
   * - language: Text language (optional)
   * - returnCorrected: Return corrected text or just errors (optional)
   *
   * Returns:
   * - AI-generated proofreading with corrections/suggestions
   *
   * Requires Approval: false (doesn't write to files)
   */
  {
    name: 'proofread',
    description:
      'Provide text for AI to check grammar, spelling, and punctuation errors while preserving @mentions',
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
  /**
   * ADAPT STYLE
   * Provides text and target style for AI to adapt writing style while preserving @mentions.
   */
  {
    name: 'adapt_style',
    description:
      'Provide text and target style for AI to adapt writing style (formal, casual, literary, etc.) while preserving @mentions',
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
  /**
   * CHANGE POV
   * Provides text and target POV for AI to transform perspective while preserving @mentions.
   */
  {
    name: 'change_pov',
    description:
      'Provide text and target POV for AI to change point of view (first person, third person, etc.) while preserving @mentions',
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
  /**
   * CHANGE TENSE
   * Provides text and target tense for AI to transform verb tenses while preserving @mentions.
   */
  {
    name: 'change_tense',
    description:
      'Provide text and target tense for AI to change verb tenses (past, present, future) while preserving @mentions',
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
  /**
   * SIMPLIFY TEXT
   * Provides text and reading level for AI to simplify while preserving @mentions.
   */
  {
    name: 'simplify_text',
    description:
      'Provide text and target reading level for AI to simplify complex text while preserving @mentions',
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
  /**
   * INTENSIFY EMOTION
   * Provides text and emotion parameters for AI to adjust emotional intensity while preserving @mentions.
   */
  {
    name: 'intensify_emotion',
    description:
      'Provide text and emotion parameters for AI to intensify or reduce emotional intensity while preserving @mentions',
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
  /**
   * TRANSLATE
   * Provides text and target language for AI to translate while preserving literary style and @mentions.
   */
  {
    name: 'translate',
    description:
      'Provide text and target language for AI to translate while preserving literary style and @mentions',
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
  /**
   * ADD DESCRIPTIONS
   * Provides text and sensory parameters for AI to enhance with sensory descriptions while preserving @mentions.
   */
  {
    name: 'add_descriptions',
    description:
      'Provide text and sensory parameters for AI to enhance with sensory descriptions (sight, sound, smell, etc.) while preserving @mentions',
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
  /**
   * REMOVE FILTER WORDS
   * Provides text for AI to remove filter words and strengthen prose while preserving @mentions.
   */
  {
    name: 'remove_filter_words',
    description:
      'Provide text for AI to remove filter words (e.g., "seemed", "felt", "appeared") and strengthen prose while preserving @mentions',
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
