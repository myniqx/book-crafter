## Phase 1: Project Setup & Foundation

- [x] 1.1 Initialize Electron + Vite + React + TypeScript project ✅
  - [x] Install electron-vite (v2.4.0)
  - [x] Configure TypeScript (strict mode via @electron-toolkit/tsconfig)
  - [x] Setup src structure (main, preload, renderer)
  - [x] Configure hot reload for development
  - [x] Test basic window creation
- [x] 1.2 Install and configure Tailwind CSS 4 ✅
  - [x] Install tailwindcss@4.1.17
  - [x] Configure @tailwindcss/vite plugin
  - [x] Setup base styles with layer-based imports
  - [x] Setup CSS variables for theme
  - [x] Test with simple component
- [x] 1.3 Setup Shadcn/ui ✅
  - [x] Initialize shadcn/ui with components.json
  - [x] Install base components (Button, Input, Card)
  - [x] Install Dialog, Select, Tabs, Label, Separator
  - [x] Configure theme (light/dark with CSS variables)
  - [x] Create ThemeProvider component
- [x] 1.4 Setup Zustand state management ✅
  - [x] Install zustand 5.0.8 + immer 10.2.0
  - [x] Create store structure (workspace, entities, books, ui)
  - [x] Setup persistence middleware (selective persistence)
  - [x] Create store slices (workspace, entities, books, ui)
  - [x] Create dev tools integration
-

## Phase 2: Electron IPC Bridge ✅ COMPLETE (Ahead of Schedule!)

- [x] 2.1 Main process file system handlers ✅
  - [x] readFile (with encoding options)
  - [x] writeFile (with backup before write)
  - [x] readDir (recursive with filters)
  - [x] mkdir (recursive)
  - [x] deleteFile / deleteDir (with confirmation)
  - [x] moveFile / renameFile (with conflict check)
  - [x] fileExists / dirExists
  - [x] watchFile / watchDir (with cleanup on app quit)
  - [x] getFileStats (size, modified date, etc.)
- [x] 2.2 Main process fetch wrapper ✅
  - [x] HTTP GET/POST/PUT/DELETE
  - [x] Support for Ollama endpoint
  - [x] Support for OpenAI/Anthropic APIs
  - [x] Request timeout and abort controller
  - [x] Streaming support (for AI responses)
  - [x] Error handling with retry logic
- [x] 2.3 Preload script with contextIsolation ✅
  - [x] Expose safe IPC methods to renderer
  - [x] Type definitions for all IPC methods
  - [x] Path validation (prevent directory traversal)
  - [x] Security audit (context isolation enabled)
- [x] 2.4 Renderer IPC client utilities ✅
  - [x] TypeScript API client wrapper (fs, http)
  - [x] Error handling and user-friendly messages
  - [x] Retry logic for transient failures
  - [x] File operation queue (prevent race conditions)
-

## Phase 3: Workspace & File Structure ✅ COMPLETE

- [x] 3.1 book-crafter.json schema and initialization ✅
  - [x] Create TypeScript schema definitions (WorkspaceConfig, AIProvider, EditorSettings)
  - [x] Default config generator (createDefaultWorkspaceConfig)
  - [x] Workspace loading/validation (validateWorkspaceConfig)
  - [x] Version checking and compatibility (isVersionCompatible, needsMigration)
  - [x] Config update utilities (updateModifiedTimestamp, updateEditorSettings, updateAIConfig)

- [x] 3.2 Directory structure manager ✅
  - [x] Auto-create .entities/, .assets/, .notes/, books/ (createWorkspaceStructure)
  - [x] Generate .gitignore (generateGitignore, createGitignore)
  - [x] Workspace integrity check (checkWorkspaceIntegrity)
  - [x] Repair functions (repairWorkspaceStructure)
  - [x] Path utilities for all workspace folders

- [x] 3.3 Book/Chapter file structure ✅
  - [x] Book JSON schema (Book type with metadata, chapters order, cover)
  - [x] Chapter folder structure (slug-based with chapter.json + content.md)
  - [x] Content.md auto-creation (saveChapter creates content.md automatically)
  - [x] Slug uniqueness validation (isSlugUnique, generateUniqueSlug)
  - [x] Slug renaming with update cascade (renameBookSlug, renameChapterSlug)
  - [x] CRUD operations (saveBook, loadBook, saveChapter, loadChapter, delete operations)
  - [x] Word count utilities (countWords, updateWordCount)

---

## Phase 4: Monaco Editor Integration ✅ COMPLETE

- [x] 4.1 Monaco React integration ✅
  - [x] Install @monaco-editor/react + monaco-editor
  - [x] Create MonacoEditor wrapper component (components/editor/MonacoEditor/)
  - [x] Configure editor options (fontSize, lineHeight, wordWrap, minimap, lineNumbers, tabSize)
  - [x] Theme integration (dark/light from store)
  - [x] Auto-save with debouncing (configurable delay)
  - [x] Created useDebounce hook (hooks/useDebounce.ts)

- [x] 4.2 Custom Markdown language extension ✅
  - [x] Register custom language mode (book-crafter-markdown)
  - [x] Syntax tokenization for @mentions (type highlighting)
  - [x] Syntax tokenization for comments (// and /* */)
  - [x] Bracket matching and auto-closing
  - [x] Code folding regions
  - [x] Full Markdown support (headers, bold, italic, code, lists, links, images, blockquotes)

- [x] 4.3 IntelliSense for @mentions ✅
  - [x] Register completion item provider (EntityCompletionProvider)
  - [x] Entity suggestions on @ trigger
  - [x] Fuzzy filtering while typing
  - [x] Property/field suggestions on . (dot) trigger
  - [x] Tab completion (built-in Monaco support)
  - [x] Rich documentation in suggestions

- [x] 4.4 Hover provider ✅
  - [x] Detect @entity-slug on hover (EntityHoverProvider)
  - [x] Show entity details card (fields table, type, default value)
  - [x] Show field details on @entity.field hover
  - [x] Show relations, notes count, and usage statistics
  - [x] Undefined entity/field warnings

- [x] 4.5 Diagnostics (validation) ✅
  - [x] Real-time entity validation (EntityDiagnosticsProvider)
  - [x] Red underline for undefined entities
  - [x] Red underline for undefined entity fields
  - [x] Warning for unclosed comments
  - [x] Clear error messages with error codes

- [ ] 4.6 Custom actions (Future enhancement)
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

  ## Phase 5: rc-dock Layout System ✅ COMPLETE (Moved from Phase 9)

  - [x] 5.1 rc-dock installation and setup ✅
    - [x] Install rc-dock package
    - [x] Create DockLayout wrapper component (components/layout/DockLayout/)
    - [x] Configure default layout (3-column: files, editor, preview)
    - [x] Layout state persistence (localStorage)
    - [x] Custom CSS styling with theme variables

  - [x] 5.2 Basic layout components ✅
    - [x] Titlebar component (app icon, project name, window controls)
    - [x] Sidebar component (panel visibility toggles, collapsible)
    - [x] StatusBar component (save status, word count, document info)
    - [x] MainLayout component (combines all layout parts)

  - [x] 5.3 Panel registration system ✅
    - [x] Panel registry (Map-based storage)
    - [x] registerPanel() function
    - [x] getRegisteredPanels() function
    - [x] Default panels registered (7 panels with placeholders)
    - [x] Panel configuration (id, title, content, group, dimensions)

  - [x] 5.4 Define panels (placeholders) ✅
    - [x] File Explorer panel
    - [x] Monaco Editor panel (main)
    - [x] Markdown Preview panel
    - [x] Entity Browser panel
    - [x] Image Gallery panel
    - [x] Notes & Checklist panel
    - [x] AI Chat panel
    - [x] Timeline panel

  - [x] 5.5 Panel management ✅
    - [x] Panel visibility toggles (via Sidebar)
    - [x] Integrated with UI store
    - [x] Active panel indicators

  - [ ] 5.6 Advanced features (Future)
    - [ ] Panel shortcuts (Ctrl+B for explorer, etc.)
    - [ ] Reset layout option
    - [ ] Save custom layouts
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
