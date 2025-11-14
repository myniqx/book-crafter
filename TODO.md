## Phase 1: Project Setup & Foundation

- [ ] 1.1 Initialize Electron + Vite + React + TypeScript project
  - [ ] Install electron-vite or electron-forge
  - [ ] Install electron-vite
  - [ ] Configure TypeScript (strict mode)
  - [ ] Setup src structure (main, preload, renderer)
  - [ ] Configure hot reload for development
  - [ ] Test basic window creati
- [ ] 1.2 Install and configure Tailwind CSS 4
  - [ ] Install tailwindcss@next (v4)
  - [ ] Configure PostCSS
  - [ ] Setup base styles
  - [ ] Setup base styles and CSS variables
  - [ ] Test with simple compone
- [ ] 1.3 Setup Shadcn/ui
  - [ ] Initialize shadcn/ui
  - [ ] Install base components (Button, Input, Card, Dialog, etc.)
  - [ ] Configure theme (light/dark)
  - [ ] Create theme provider
  - [ ] Initialize shadcn/ui with Tailwind 4
  - [ ] Install base components (Button, Input, Card, Dialog, Dropdown, Tabs, etc.)
  - [ ] Configure theme (light/dark with CSS variables)
  - [ ] Create ThemeProvider compone
- [ ] 1.4 Setup Zustand state management
  - [ ] Install zustand
  - [ ] Create store structure (workspace, entities, books, ui)
  - [ ] Setup persistence middleware (for workspace config)
  - [ ] Install zustand + middleware
  - [ ] Create store slices (workspace, entities, books, ui, editor)
  - [ ] Setup persistence middleware
  - [ ] Create dev tools integrati
-

## Phase 2: Electron IPC Bridge

- [ ] 2.1 Main process file system handlers
  - [ ] readFile (async)
  - [ ] writeFile (async, with backup)
  - [ ] readDir (recursive option)
  - [ ] readFile (with encoding options)
  - [ ] writeFile (with backup before write)
  - [ ] readDir (recursive with filters)
  - [ ] mkdir (recursive)
  - [ ] deleteFile / deleteDir
  - [ ] moveFile / renameFile
  - [ ] deleteFile / deleteDir (with confirmation)
  - [ ] moveFile / renameFile (with conflict check)
  - [ ] fileExists / dirExists
  - [ ] watchFile (for external changes)
  - [ ] watchFile / watchDir (for external changes)
  - [ ] getFileStats (size, modified date, etc
- [ ] 2.2 Main process fetch wrapper
  - [ ] HTTP GET/POST wrapper
  - [ ] HTTP GET/POST/PUT/DELETE
  - [ ] Support for Ollama endpoint
  - [ ] Support for OpenAI/Anthropic APIs
  - [ ] Request timeout and error handling
  - [ ] Request timeout and abort controller
  - [ ] Streaming support (for AI responses)
  - [ ] Error handling with retry log
- [ ] 2.3 Preload script with contextIsolation
  - [ ] Expose safe IPC methods to renderer
  - [ ] Type definitions for IPC methods
  - [ ] Security: validate all paths (prevent directory traversal)
  - [ ] Type definitions for all IPC methods
  - [ ] Path validation (prevent directory traversal)
  - [ ] Security aud
- [ ] 2.4 Renderer IPC client utilities
  - [ ] TypeScript API client for IPC
  - [ ] Error handling and retry logic
  - [ ] TypeScript API client wrapper
  - [ ] Error handling and user-friendly messages
  - [ ] Loading states management
  - [ ] File operation queue (prevent race condition
-

## Phase 3: Workspace & File Structure

- [ ] 3.1 book-crafter.json schema and initialization
  ```typescript
  {
    projectName: string;
    version: string;
    author: string;
    created: Date;
    aiConfig: {...};
    editorSettings: {...};
  }
  ```

  - [ ] Create schema type definitions
  - [ ] Workspace initialization logic
  - [ ] Create TypeScript schema definitions
  - [ ] Default config generator
  - [ ] Workspace initialization wizard
  - [ ] Workspace loading/validation
  - [ ] Migration system for version changes
  - [ ] Migration system for version updat
- [ ] 3.2 Directory structure setup
  - [ ] Auto-create .entities/, .
        \ No newline at end of file
- [ ] 3.2 Directory structure manager
  - [ ] Auto-create .entities/, .assets/, .notes/, books/
  - [ ] Generate .gitignore
  - [ ] Directory watcher setup
  - [ ] Workspace integrity check

- [ ] 3.3 Book/Chapter file structure
  - [ ] Book JSON schema (metadata, chapters order, cover)
  - [ ] Chapter folder structure (slug-based)
  - [ ] Content.md auto-creation
  - [ ] Slug uniqueness validation
  - [ ] Slug renaming with update cascade

---

## Phase 4: Monaco Editor Integration

- [ ] 4.1 Monaco React integration
  - [ ] Install @monaco-editor/react
  - [ ] Create MonacoEditor wrapper component
  - [ ] Configure editor options (minimap, line numbers, etc.)
  - [ ] Theme integration (dark/light)
  - [ ] Auto-save with debouncing

- [ ] 4.2 Custom Markdown language extension
  - [ ] Register custom language mode
  - [ ] Syntax tokenization for @mentions
    - [ ] Syntax tokenization for comments (// and /\* \*/)
    - [ ] Bracket matching and auto-closing
    - [ ] Code folding regions
  - [ ] 4.3 IntelliSense for @mentions
    - [ ] Register completion item provider
    - [ ] Entity suggestions on @ trigger
    - [ ] Fuzzy filtering while typing
    - [ ] Property suggestions on . (dot) trigger
    - [ ] Tab completion
    - [ ] Insert snippet with cursor position
  - [ ] 4.4 Hover provider
    - [ ] Detect @entity-slug on hover
    - [ ] Show entity details card (fields, type, notes count)
    - [ ] Show resolved value preview
    - [ ] Performance optimization (debounce)
  - [ ] 4.5 Diagnostics (validation)
    - [ ] Real-time entity validation
    - [ ] Red underline for undefined entities
    - [ ] Red underline for undefined entity fields
    - [ ] Warning for deprecated entities
    - [ ] Quick fix suggestions
  - [ ] 4.6 Custom actions
    - [ ] Right-click "Go to entity definition"
    - [ ] Right-click "Create entity" (if undefined)
    - [ ] Command palette integration

  ***

  ## Phase 5: Entity System
  - [ ] 5.1 Entity data model
    - [ ] Entity TypeScript schema (extensible)
    - [ ] Slug generation and validation
    - [ ] Default templates (person, place, custom)
    - [ ] Field management (add, edit, remove, reorder)
    - [ ] Default field selection logic
  - [ ] 5.2 Entity CRUD operations
    - [ ] Create entity (with template)
    - [ ] Read/load entities from .entities/
    - [ ] Update entity (with validation)
    - [ ] Delete entity (with dependency check)
    - [ ] Rename entity slug (update all references)
    - [ ] Bulk operations
  - [ ] 5.3 Entity relations
    - [ ] Relation schema (type, target, description)
    - [ ] Add/remove relations
    - [ ] Bidirectional relation management
    - [ ] Relation visualization (graph view - optional)
  - [ ] 5.4 Entity notes
    - [ ] Note schema (id, content, type, checklist)
    - [ ] Add/edit/delete notes
    - [ ] Checklist items management
    - [ ] Note-to-chapter linking
  - [ ] 5.5 Entity usage tracking
    - [ ] Scan all markdown files (debounced)
    - [ ] Count usages per book/chapter
    - [ ] Track line numbers and context
    - [ ] Update usage stats in entity metadata
    - [ ] "Where used" panel

  ***

  ## Phase 6: Entity Browser Panel
  - [ ] 6.1 Entity list view
    - [ ] Tree/list view component
    - [ ] Group by type (persons, places, custom)
    - [ ] Search and filter
    - [ ] Sort options (name, usage count, date)
    - [ ] Entity count badges
  - [ ] 6.2 Entity detail view
    - [ ] Split panel or modal view
    - [ ] Show all fields (editable)
    - [ ] Show notes and checklists
    - [ ] Show relations
    - [ ] Show usage statistics and locations
    - [ ] Quick navigation to usage locations
  - [ ] 6.3 Entity creation/edit UI
    - [ ] Entity form with dynamic fields
    - [ ] Template selection
    - [ ] Field type selector (text, number, date, etc.)
    - [ ] Default field radio selection
    - [ ] Slug editor with validation
    - [ ] Delete confirmation

  ***

  ## Phase 7: Book/Chapter Management
  - [ ] 7.1 File Explorer panel
    - [ ] Tree view component (recursive)
    - [ ] Book and chapter icons
    - [ ] Expand/collapse state persistence
    - [ ] Active file highlighting
    - [ ] Lazy loading for large workspaces
  - [ ] 7.2 Context menu actions
    - [ ] New book
    - [ ] New chapter
    - [ ] Rename (with slug update)
    - [ ] Delete (with confirmation)
    - [ ] Duplicate
    - [ ] Move chapter to another book
  - [ ] 7.3 Drag & drop
    - [ ] Chapter reordering within book
    - [ ] Move chapter to different book
    - [ ] Update book.json on drop
    - [ ] Visual feedback during drag
  - [ ] 7.4 Book management UI
    - [ ] Book metadata editor (title, author, cover)
    - [ ] Chapter list with reorder controls
    - [ ] Cover image selector
    - [ ] Book statistics (word count, chapter count, etc.)

  ***

  ## Phase 8: Markdown Preview
  - [ ] 8.1 Preview panel setup
    - [ ] Install react-markdown + remark/rehype plugins
    - [ ] Split view or separate panel option
    - [ ] Responsive layout
  - [ ] 8.2 Custom renderers
    - [ ] @mention renderer (replace with entity value)
    - [ ] Comment remover (// and /\* \*/)
    - [ ] Image renderer (support @image-slug)
    - [ ] Custom styling with Tailwind prose
  - [ ] 8.3 Live sync
    - [ ] Debounced update on editor change
    - [ ] Scroll sync (optional)
    - [ ] Performance optimization for large documents
  - [ ] 8.4 Preview features
    - [ ] Toggle preview on/off
    - [ ] Copy rendered HTML
    - [ ] Export to PDF/HTML (future)

  ***

  ## Phase 9: rc-dock Layout System
  - [ ] 9.1 rc-dock installation and setup
    - [ ] Install rc-dock
    - [ ] Create DockLayout wrapper component
    - [ ] Configure default layout
    - [ ] Layout state persistence
  - [ ] 9.2 Define panels
    - [ ] File Explorer panel
    - [ ] Monaco Editor panel (main)
    - [ ] Markdown Preview panel
    - [ ] Entity Browser panel
    - [ ] Image Gallery panel
    - [ ] Notes & Checklist panel
    - [ ] AI Chat panel
    - [ ] Timeline panel (optional)
  - [ ] 9.3 Panel management
    - [ ] Register all panels
    - [ ] Panel visibility toggles
    - [ ] Panel shortcuts (Ctrl+B for explorer, etc.)
    - [ ] Reset layout option
    - [ ] Save custom layouts
  - [ ] 9.4 Tab system
    - [ ] Multiple editor tabs
    - [ ] Tab close/reorder
    - [ ] Unsaved changes indicator
    - [ ] Tab context menu

  ***

  ## Phase 10: Image Management
  - [ ] 10.1 Image data model
    - [ ] Image schema (id, slug, path, metadata)
    - [ ] Image JSON storage in .assets/
    - [ ] Thumbnail generation
    - [ ] Tag system
  - [ ] 10.2 Image upload
    - [ ] Drag & drop upload
    - [ ] File picker dialog
    - [ ] Image optimization (resize, compress)
    - [ ] Duplicate detection
  - [ ] 10.3 Image Gallery panel
    - [ ] Grid view with thumbnails
    - [ ] Lightbox viewer
    - [ ] Filter by tags
    - [ ] Search by slug/filename
    - [ ] Linked entities display
  - [ ] 10.4 Image linking
    - [ ] Link image to entity
    - [ ] Link image to note
    - [ ] Set book cover image
    - [ ] Insert image in markdown (@image-slug)

  ***

  ## Phase 11: Notes & Checklist System
  - [ ] 11.1 Note data model
    - [ ] Note schema (id, slug, content, type)
    - [ ] Checklist item schema
    - [ ] Note JSON storage in .notes/
  - [ ] 11.2 Note CRUD
    - [ ] Create note (with type selector)
    - [ ] Edit note (markdown editor)
    - [ ] Delete note (with dependency check)
    - [ ] Link note to entity/image/chapter
  - [ ] 11.3 Checklist features
    - [ ] Add/remove checklist items
    - [ ] Mark as complete/incomplete
    - [ ] Track completion location (book/chapter/line)
    - [ ] #check() comment parser
  - [ ] 11.4 Notes panel
    - [ ] List/card view
    - [ ] Filter by type, status, tags
    - [ ] Checklist progress bars
    - [ ] Click to jump to reference location
    - [ ] Search notes
  - [ ] 11.5 #check() integration
    - [ ] Parse #check(entity-slug, note-id) in markdown
    - [ ] Auto-complete checklist on compile/preview
    - [ ] Show check locations in note detail
    - [ ] Validation for invalid check references

  ***

  ## Phase 12: Search & Replace
  - [ ] 12.1 Global search
    - [ ] Search panel UI
    - [ ] Search in markdown content
    - [ ] Search in entity fields
    - [ ] Search in notes
    - [ ] Regex support
    - [ ] Case-sensitive toggle
  - [ ] 12.2 Search results
    - [ ] Result list with context
    - [ ] Group by file/entity/note
    - [ ] Click to jump to location
    - [ ] Result count
  - [ ] 12.3 Find & Replace
    - [ ] Replace single occurrence
    - [ ] Replace all
    - [ ] Preview changes before replace
    - [ ] Undo/redo support
  - [ ] 12.4 Entity usage search
    - [ ] Find all usages of entity
    - [ ] Highlight in editor
    - [ ] Usage count per file

  ***

  ## Phase 13: AI Integration
  - [ ] 13.1 AI configuration
    - [ ] AI settings UI (provider, model, endpoint)
    - [ ] Ollama connection test
    - [ ] OpenAI/Anthropic API key management
    - [ ] Save config to book-crafter.json
  - [ ] 13.2 AI service layer
    - [ ] Ollama client (via IPC fetch)
    - [ ] OpenAI client
    - [ ] Anthropic client
    - [ ] Streaming response handler
    - [ ] Token counting (approximate)
  - [ ] 13.3 AI Chat panel
    - [ ] Chat UI component
    - [ ] Message history
    - [ ] Context injection (current chapter/selection)
    - [ ] Streaming responses
    - [ ] Copy/insert response to editor
  - [ ] 13.4 AI features
    - [ ] Grammar check (inline suggestions)
    - [ ] Expand selection
    - [ ] Summarize chapter
    - [ ] Generate ideas/suggestions
    - [ ] Custom prompts
  - [ ] 13.5 AI context awareness
    - [ ] Send entity definitions as context
    - [ ] Send chapter outline
    - [ ] Character consistency checking
    - [ ] Plot hole detection (advanced)

  ***

  ## Phase 14: Timeline & History (Optional)
  - [ ] 14.1 Activity timeline
    - [ ] Track recent file changes
    - [ ] Track entity modifications
    - [ ] Timeline panel UI
  - [ ] 14.2 Version history
    - [ ] Snapshot system for markdown files
    - [ ] Diff viewer
    - [ ] Restore from snapshot

  ***

  ## Phase 15: Settings & Preferences
  - [ ] 15.1 Settings UI
    - [ ] Settings panel/dialog
    - [ ] General settings (author name, etc.)
    - [ ] Editor settings (font, size, theme)
    - [ ] AI settings
    - [ ] Keyboard shortcuts customization
  - [ ] 15.2 Workspace settings
    - [ ] Auto-save interval
    - [ ] Backup settings
    - [ ] Export/import workspace

  ***

  ## Phase 16: Polish & UX
  - [ ] 16.1 Error handling
    - [ ] Global error boundary
    - [ ] User-friendly error messages
    - [ ] Toast notifications for actions
  - [ ] 16.2 Loading states
    - [ ] Skeleton loaders
    - [ ] Progress bars for long operations
    - [ ] Optimistic UI updates
  - [ ] 16.3 Keyboard shortcuts
    - [ ] Save (Ctrl+S)
    - [ ] Search (Ctrl+F / Ctrl+Shift+F)
    - [ ] Toggle panels (Ctrl+B, etc.)
    - [ ] Quick entity create (Ctrl+Shift+E)
    - [ ] Command palette (Ctrl+Shift+P)
  - [ ] 16.4 Accessibility
    - [ ] ARIA labels
    - [ ] Keyboard navigation
    - [ ] Focus management
    - [ ] Screen reader support
  - [ ] 16.5 Performance optimization
    - [ ] Virtual scrolling for large lists
    - [ ] Debounce expensive operations
    - [ ] Memoization for computed values
    - [ ] Bundle size optimization

  ***

  ## Phase 17: Testing & Documentation
  - [ ] 17.1 Unit tests
    - [ ] Entity manager tests
    - [ ] Slug validation tests
    - [ ] Markdown parser tests
    - [ ] IPC handler tests
  - [ ] 17.2 Integration tests
    - [ ] E2E user flows (create book, add entity, etc.)
    - [ ] File system operations
  - [ ] 17.3 Documentation
    - [ ] User guide
    - [ ] API documentation
    - [ ] Contributing guidelines

  ***

  ## Phase 18: Build & Distribution
  - [ ] 18.1 Production build
    - [ ] Optimize bundle size
    - [ ] Minification
    - [ ] Source maps
  - [ ] 18.2 Electron packaging
    - [ ] Windows installer
    - [ ] macOS DMG
    - [ ] Linux AppImage/deb
  - [ ] 18.3 Auto-update
    - [ ] Update server setup
    - [ ] Auto-update integration
    - [ ] Release notes

  ***

  ## Current Priority (MVP)

  **Starting with:**
  1.  Phase 1: Project setup (TODAY)
  2.  Phase 2: IPC bridge
  3.  Phase 4: Monaco editor
  4.  Phase 5: Entity system
  5.  Phase 6: Entity browser
  6.  Phase 7: Book/Chapter management
  7.  Phase 8: Markdown preview
  8.  Phase 9: rc-dock layout

  **Then:**
  - Phase 10-13: Images, Notes, Search, AI

  **Finally:**
  - Phase 14-18: Polish, testing, distribution
