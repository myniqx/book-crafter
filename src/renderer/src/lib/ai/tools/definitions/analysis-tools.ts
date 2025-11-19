import type { ToolDefinition } from '../../types'

/**
 * Analysis tools - checking consistency, summarizing, finding issues
 */
export const analysisTools: ToolDefinition[] = [
  {
    name: 'analyze_entity_usage',
    description: 'Analyze how an entity is used across chapters, including frequency and context',
    category: 'analysis',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        entitySlug: {
          type: 'string',
          description: 'The slug identifier of the entity to analyze'
        },
        bookSlug: {
          type: 'string',
          description: 'Optional: limit analysis to a specific book'
        }
      },
      required: ['entitySlug']
    }
  },
  {
    name: 'check_consistency',
    description:
      'Check for consistency issues in entity descriptions, timeline, or plot across chapters',
    category: 'analysis',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        bookSlug: {
          type: 'string',
          description: 'The slug identifier of the book to check'
        },
        checkType: {
          type: 'string',
          description: 'Type of consistency check to perform',
          enum: ['entity', 'timeline', 'plot', 'all']
        }
      },
      required: ['bookSlug']
    }
  },
  {
    name: 'summarize_chapter',
    description: 'Generate a summary of a chapter',
    category: 'analysis',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        bookSlug: {
          type: 'string',
          description: 'The slug identifier of the book'
        },
        chapterSlug: {
          type: 'string',
          description: 'The slug identifier of the chapter'
        },
        length: {
          type: 'string',
          description: 'Desired summary length',
          enum: ['brief', 'medium', 'detailed']
        }
      },
      required: ['bookSlug', 'chapterSlug']
    }
  },
  {
    name: 'summarize_book',
    description: 'Generate a summary of an entire book',
    category: 'analysis',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        bookSlug: {
          type: 'string',
          description: 'The slug identifier of the book'
        },
        length: {
          type: 'string',
          description: 'Desired summary length',
          enum: ['brief', 'medium', 'detailed']
        }
      },
      required: ['bookSlug']
    }
  },
  {
    name: 'find_plot_holes',
    description: 'Identify potential plot holes or logical inconsistencies in the narrative',
    category: 'analysis',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        bookSlug: {
          type: 'string',
          description: 'The slug identifier of the book'
        },
        chapterSlug: {
          type: 'string',
          description: 'Optional: limit analysis to a specific chapter'
        }
      },
      required: ['bookSlug']
    }
  },
  {
    name: 'analyze_character_arc',
    description: "Analyze a character's development and arc throughout the story",
    category: 'analysis',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        entitySlug: {
          type: 'string',
          description: 'The slug identifier of the character entity'
        },
        bookSlug: {
          type: 'string',
          description: 'The slug identifier of the book'
        }
      },
      required: ['entitySlug', 'bookSlug']
    }
  },
  {
    name: 'get_word_count',
    description: 'Get word count statistics for a book or chapter',
    category: 'analysis',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        bookSlug: {
          type: 'string',
          description: 'The slug identifier of the book'
        },
        chapterSlug: {
          type: 'string',
          description: 'Optional: get count for a specific chapter only'
        }
      },
      required: ['bookSlug']
    }
  },
  {
    name: 'compare_chapters',
    description: 'Compare two chapters for style, tone, or content differences',
    category: 'analysis',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        bookSlug: {
          type: 'string',
          description: 'The slug identifier of the book'
        },
        chapter1Slug: {
          type: 'string',
          description: 'The slug identifier of the first chapter'
        },
        chapter2Slug: {
          type: 'string',
          description: 'The slug identifier of the second chapter'
        },
        compareType: {
          type: 'string',
          description: 'What aspect to compare',
          enum: ['style', 'tone', 'characters', 'all']
        }
      },
      required: ['bookSlug', 'chapter1Slug', 'chapter2Slug']
    }
  }
]
