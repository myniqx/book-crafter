import type { ToolDefinition } from '../../types'

/**
 * File operation tools - reading, writing, searching
 */
export const fileTools: ToolDefinition[] = [
  {
    name: 'list_books',
    description: 'List all available books in the workspace with their chapter counts',
    category: 'file',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'read_chapter',
    description: 'Read the content of a specific chapter from a book',
    category: 'file',
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
        }
      },
      required: ['bookSlug', 'chapterSlug']
    }
  },
  {
    name: 'write_chapter',
    description: 'Write or update the content of a chapter',
    category: 'file',
    requiresApproval: true,
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
        content: {
          type: 'string',
          description: 'The new content for the chapter'
        }
      },
      required: ['bookSlug', 'chapterSlug', 'content']
    }
  },
  {
    name: 'list_chapters',
    description: 'List all chapters in a book',
    category: 'file',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        bookSlug: {
          type: 'string',
          description: 'The slug identifier of the book'
        }
      },
      required: ['bookSlug']
    }
  },
  {
    name: 'create_chapter',
    description: 'Create a new chapter in a book',
    category: 'file',
    requiresApproval: true,
    parameters: {
      type: 'object',
      properties: {
        bookSlug: {
          type: 'string',
          description: 'The slug identifier of the book'
        },
        title: {
          type: 'string',
          description: 'The title of the new chapter'
        },
        content: {
          type: 'string',
          description: 'Initial content for the chapter',
          default: ''
        }
      },
      required: ['bookSlug', 'title']
    }
  },
  {
    name: 'delete_chapter',
    description: 'Delete a chapter from a book',
    category: 'file',
    requiresApproval: true,
    parameters: {
      type: 'object',
      properties: {
        bookSlug: {
          type: 'string',
          description: 'The slug identifier of the book'
        },
        chapterSlug: {
          type: 'string',
          description: 'The slug identifier of the chapter to delete'
        }
      },
      required: ['bookSlug', 'chapterSlug']
    }
  },
  {
    name: 'search_content',
    description: 'Search for text across all chapters in a book or all books',
    category: 'file',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query'
        },
        bookSlug: {
          type: 'string',
          description: 'Optional: limit search to a specific book'
        },
        caseSensitive: {
          type: 'boolean',
          description: 'Whether the search should be case sensitive',
          default: false
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_entity',
    description: 'Get details of a specific entity (character, location, etc.)',
    category: 'file',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        entitySlug: {
          type: 'string',
          description: 'The slug identifier of the entity'
        }
      },
      required: ['entitySlug']
    }
  },
  {
    name: 'list_entities',
    description: 'List all entities, optionally filtered by type',
    category: 'file',
    requiresApproval: false,
    parameters: {
      type: 'object',
      properties: {
        entityType: {
          type: 'string',
          description: 'Optional: filter by entity type (person, place, custom)',
          enum: ['person', 'place', 'custom']
        }
      }
    }
  },
  {
    name: 'create_entity',
    description: 'Create a new entity (character, location, etc.)',
    category: 'file',
    requiresApproval: true,
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The name of the entity'
        },
        type: {
          type: 'string',
          description: 'The type of entity',
          enum: ['person', 'place', 'custom']
        },
        fields: {
          type: 'object',
          description: 'Key-value pairs of entity fields (e.g., age, description)'
        }
      },
      required: ['name', 'type']
    }
  },
  {
    name: 'update_entity',
    description: 'Update an existing entity',
    category: 'file',
    requiresApproval: true,
    parameters: {
      type: 'object',
      properties: {
        entitySlug: {
          type: 'string',
          description: 'The slug identifier of the entity'
        },
        fields: {
          type: 'object',
          description: 'Key-value pairs of fields to update'
        }
      },
      required: ['entitySlug', 'fields']
    }
  },
  {
    name: 'delete_entity',
    description: 'Delete an entity',
    category: 'file',
    requiresApproval: true,
    parameters: {
      type: 'object',
      properties: {
        entitySlug: {
          type: 'string',
          description: 'The slug identifier of the entity to delete'
        }
      },
      required: ['entitySlug']
    }
  }
]
