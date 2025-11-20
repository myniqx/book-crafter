import type { ToolDefinition } from '../../types'

/**
 * Analysis tools - checking consistency, summarizing, finding issues
 * These tools retrieve data from the store for AI to analyze
 */
export const analysisTools: ToolDefinition[] = [
  /**
   * ANALYZE ENTITY USAGE
   *
   * What it does:
   * - Retrieves all mentions of an entity (@entity-slug) across chapters
   * - Returns usage locations, frequency, and context excerpts
   * - AI then analyzes the data for patterns and insights
   *
   * Parameters:
   * - entitySlug: Entity to analyze (required)
   * - bookSlug: Limit to specific book (optional)
   *
   * Returns:
   * - Usage data with excerpts for AI to analyze
   *
   * Requires Approval: false (read-only operation)
   */
  {
    name: 'analyze_entity_usage',
    description:
      'Retrieve usage data for an entity (@mention) across chapters for AI to analyze frequency, context, and patterns',
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
  /**
   * CHECK CONSISTENCY
   *
   * What it does:
   * - Retrieves all chapter contents from a book
   * - Returns the content for AI to analyze for consistency issues
   * - AI checks entity descriptions, timeline, plot logic
   *
   * Parameters:
   * - bookSlug: Book to check (required)
   * - checkType: What to check (optional)
   *
   * Returns:
   * - All chapter contents for AI to analyze
   *
   * Requires Approval: false (read-only)
   */
  {
    name: 'check_consistency',
    description:
      'Retrieve all chapter contents from a book for AI to analyze and identify consistency issues in entities, timeline, or plot',
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
  /**
   * SUMMARIZE CHAPTER
   *
   * Retrieves chapter content for AI to generate a summary.
   * Does not write anything - AI creates summary from content.
   */
  {
    name: 'summarize_chapter',
    description: 'Retrieve chapter content for AI to generate a summary',
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
  /**
   * SUMMARIZE BOOK
   *
   * Retrieves all chapter contents for AI to generate book summary.
   */
  {
    name: 'summarize_book',
    description: 'Retrieve all chapter contents for AI to generate a book summary',
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
  /**
   * FIND PLOT HOLES
   *
   * Returns narrative content for AI to identify plot holes and logical inconsistencies.
   */
  {
    name: 'find_plot_holes',
    description:
      'Retrieve narrative content for AI to identify potential plot holes or logical inconsistencies',
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
  /**
   * ANALYZE CHARACTER ARC
   *
   * Returns character entity details and usage data for AI to analyze development arc.
   */
  {
    name: 'analyze_character_arc',
    description:
      "Retrieve character entity details and usage data for AI to analyze the character's development and arc throughout the story",
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
  /**
   * GET WORD COUNT
   *
   * Calculates and returns word count statistics.
   * This tool actually computes the stats, not just retrieves data.
   */
  {
    name: 'get_word_count',
    description:
      'Calculate and return word count statistics for a book or specific chapter (words, characters)',
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
  /**
   * COMPARE CHAPTERS
   *
   * Returns contents of two chapters for AI to compare style, tone, and content.
   */
  {
    name: 'compare_chapters',
    description:
      'Retrieve contents of two chapters for AI to compare and analyze differences in style, tone, or content',
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
