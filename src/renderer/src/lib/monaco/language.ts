import type { languages } from 'monaco-editor'

// Custom Markdown language with @mentions and comments
export const bookCrafterMarkdownLanguage: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.md',

  // Escape codes for special characters
  control: /[\\`*_\[\]{}()#+\-.!]/,
  noncontrol: /[^\\`*_\[\]{}()#+\-.!]/,
  escapes: /\\(?:@control)/,

  // Tokenizer rules
  tokenizer: {
    root: [
      // Headers
      [/^(\s{0,3})(#+)((?:[^\\#]|@escapes)+)/, ['white', 'keyword', 'keyword']],

      // @mentions (entity references)
      [/@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)?/, 'type'],

      // Single-line comments
      [/\/\/.*$/, 'comment'],

      // Multi-line comments
      [/\/\*/, 'comment', '@comment'],

      // Code blocks
      [/^\s*```\s*([a-z]+)?\s*$/, { token: 'string', next: '@codeblock' }],

      // Inline code
      [/`[^`]+`/, 'string'],

      // Bold
      [/\*\*[^*]+\*\*/, 'strong'],
      [/__[^_]+__/, 'strong'],

      // Italic
      [/\*[^*]+\*/, 'emphasis'],
      [/_[^_]+_/, 'emphasis'],

      // Lists
      [/^\s*[-*+]\s+/, 'keyword'],
      [/^\s*\d+\.\s+/, 'keyword'],

      // Links
      [/\[([^\]]+)\]\(([^)]+)\)/, ['string', 'string.link']],

      // Images
      [/!\[([^\]]*)\]\(([^)]+)\)/, ['string', 'string.link']],

      // Blockquotes
      [/^\s*>+/, 'keyword'],

      // Horizontal rules
      [/^\s*[-*_]{3,}\s*$/, 'keyword']
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment']
    ],

    codeblock: [
      [/^\s*```\s*$/, { token: 'string', next: '@pop' }],
      [/.*$/, 'variable.source']
    ]
  }
}

// Language configuration for auto-closing brackets, comments, etc.
export const bookCrafterMarkdownConfig: languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/']
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '`', close: '`' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: '**', close: '**' },
    { open: '__', close: '__' },
    { open: '*', close: '*' },
    { open: '_', close: '_' }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '`', close: '`' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: '*', close: '*' },
    { open: '_', close: '_' }
  ],
  folding: {
    markers: {
      start: /^\s*<!--\s*#?region\b.*-->/,
      end: /^\s*<!--\s*#?endregion\b.*-->/
    }
  }
}

// Register the custom language
export function registerBookCrafterMarkdown(monaco: typeof import('monaco-editor')): void {
  // Register the language
  monaco.languages.register({ id: 'book-crafter-markdown' })

  // Set the language configuration
  monaco.languages.setLanguageConfiguration('book-crafter-markdown', bookCrafterMarkdownConfig)

  // Set the tokenizer
  monaco.languages.setMonarchTokensProvider('book-crafter-markdown', bookCrafterMarkdownLanguage)
}
