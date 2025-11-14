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

  ## Phase 5: Entity System ✅ COMPLETE
  - [x] 5.1 Entity data model ✅
    - [x] Entity TypeScript schema (extensible)
    - [x] Slug generation and validation
    - [x] Default templates (person, place, custom)
    - [x] Field management (add, edit, remove, reorder)
    - [x] Default field selection logic
  - [x] 5.2 Entity CRUD operations ✅
    - [x] Create entity (with template)
    - [x] Read/load entities from .entities/
    - [x] Update entity (with validation)
    - [x] Delete entity (with dependency check)
    - [x] Rename entity slug (update all references)
    - [x] Export/import operations (backup)
  - [x] 5.3 Entity relations ✅
    - [x] Relation schema (type, target, description)
    - [x] Add/remove relations (via EntitySlice)
    - [x] Display relations in EntityCard
    - [ ] Bidirectional relation management (Future)
    - [ ] Relation visualization (graph view - Future)
  - [x] 5.4 Entity notes ✅
    - [x] Note schema (id, content, type, checklist)
    - [x] Add/edit/delete notes (via EntitySlice)
    - [x] Checklist items management
    - [x] Display in EntityCard
    - [ ] Note-to-chapter linking (Future)
  - [ ] 5.5 Entity usage tracking (Partial)
    - [x] Usage metadata in Entity schema
    - [x] Monaco editor integration (completion, hover, diagnostics)
    - [ ] Scan all markdown files (debounced) (Future)
    - [ ] Count usages per book/chapter (Future)
    - [ ] Track line numbers and context (Future)
    - [ ] Update usage stats in entity metadata (Future)
    - [ ] "Where used" panel (Future)

  ***

  ## Phase 6: Entity Browser Panel ✅ COMPLETE
  - [x] 6.1 Entity list view ✅
    - [x] Tree/list view component (EntityBrowser)
    - [x] Group by type (persons, places, custom)
    - [x] Search and filter
    - [x] Sort options (name, usage count, date, created, modified)
    - [x] Entity count badges
  - [x] 6.2 Entity detail view ✅
    - [x] Split panel (EntityCard in DockLayout)
    - [x] Show all fields (editable)
    - [x] Show notes and checklists
    - [x] Show relations
    - [x] Show usage statistics
    - [ ] Quick navigation to usage locations (Future)
  - [x] 6.3 Entity creation/edit UI ✅
    - [x] Entity form with dynamic fields (CreateEntityDialog)
    - [x] Template selection
    - [x] Field type selector (text, number, date, textarea)
    - [x] Add/remove fields in EntityCard
    - [x] Slug editor (auto-generated or custom)
    - [x] Delete confirmation

  ***

  ## Phase 7: Book/Chapter Management ✅ COMPLETE
  - [x] 7.1 File Explorer panel ✅
    - [x] Tree view component (BookExplorer)
    - [x] Book and chapter icons
    - [x] Expand/collapse state (expandedBooks)
    - [x] Active file highlighting
    - [ ] Lazy loading for large workspaces (Future)
  - [x] 7.2 Context menu actions ✅
    - [x] New book (CreateBookDialog)
    - [x] New chapter (CreateChapterDialog)
    - [x] Delete book (with confirmation)
    - [x] Delete chapter (with confirmation)
    - [ ] Rename (with slug update) (Future)
    - [ ] Duplicate (Future)
    - [ ] Move chapter to another book (Future)
  - [ ] 7.3 Drag & drop (Future)
    - [ ] Chapter reordering within book
    - [ ] Move chapter to different book
    - [ ] Update book.json on drop
    - [ ] Visual feedback during drag
  - [x] 7.4 Book management UI ✅
    - [x] Book statistics (word count, chapter count displayed)
    - [x] Chapter ordering (automatic, based on order field)
    - [x] Book/chapter file operations (save, load, delete)
    - [ ] Book metadata editor (Future)
    - [ ] Chapter list with reorder controls (Future)
    - [ ] Cover image selector (Future)

  ***

  ## Phase 8: Markdown Preview ✅ COMPLETE
  - [x] 8.1 Preview panel setup ✅
    - [x] Install react-markdown + remark/rehype plugins
    - [x] Separate panel in DockLayout (dockable, closable)
    - [x] Responsive layout with header and scrollable content
  - [x] 8.2 Custom renderers ✅
    - [x] @mention renderer (replace with entity default field value)
    - [x] @entity.field renderer (replace with specific field value)
    - [x] Comment remover (// and /\* \*/)
    - [ ] Image renderer (support @image-slug) (Future - Phase 10)
    - [x] Custom styling with Tailwind prose (dark theme optimized)
  - [x] 8.3 Live sync ✅
    - [x] Debounced update on editor change (300ms)
    - [ ] Scroll sync (optional) (Future enhancement)
    - [x] Performance optimization with useMemo and debouncing
  - [x] 8.4 Preview features ✅
    - [x] Toggle preview on/off (via Sidebar)
    - [x] Word count display
    - [x] Reading time estimate
    - [x] Book/Chapter context display in header
    - [ ] Copy rendered HTML (Future enhancement)
    - [ ] Export to PDF/HTML (Future enhancement)

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

  ## Phase 10: Image Management ✅ COMPLETE
  - [x] 10.1 Image data model ✅
    - [x] Image schema (slug, path, metadata, dimensions, tags, linked items)
    - [x] Image JSON storage in .assets/images/
    - [ ] Thumbnail generation (Future enhancement)
    - [x] Tag system (add, remove, filter by tags)
  - [x] 10.2 Image upload ✅
    - [x] Drag & drop upload
    - [x] File picker dialog
    - [x] File validation (size, format)
    - [ ] Image optimization (resize, compress) (Future enhancement)
    - [ ] Duplicate detection (Future enhancement)
  - [x] 10.3 Image Gallery panel ✅
    - [x] Grid view with thumbnails
    - [x] Search by slug/filename/description
    - [x] Filter by tags
    - [x] Sort (by name, size, date, usage)
    - [x] Empty state with upload button
    - [x] Image detail panel with full metadata
  - [x] 10.4 Image linking ✅
    - [x] Link image to entity
    - [x] Link image to book (for covers)
    - [x] Link image to note
    - [x] Insert image in markdown (@image-slug)
    - [x] @image-slug replacement in preview
    - [x] Auto-load images on workspace load

  ***

  ## Phase 11: Notes & Checklist System ✅ COMPLETE
  - [x] 11.1 Note data model ✅
    - [x] Note schema (id, slug, title, content, type, tags, linked items)
    - [x] ChecklistItem schema (id, content, status, location)
    - [x] Note JSON storage in .notes/
    - [x] 6 note types (general, character, plot, worldbuilding, research, todo)
    - [x] UUID generation for notes and checklist items
  - [x] 11.2 Note CRUD ✅
    - [x] Create note (with type selector via CreateNoteDialog)
    - [x] Update note (title, content, tags)
    - [x] Delete note (with confirmation)
    - [x] Link note to entity/image/chapter (LinkedItem system)
    - [x] Pin/unpin notes
  - [x] 11.3 Checklist features ✅
    - [x] Add/remove checklist items
    - [x] Mark as complete/incomplete (toggle)
    - [x] Track completion location (book/chapter/line)
    - [x] Checklist progress calculation
    - [x] Reorder checklist items
    - [ ] #check() comment parser (Future enhancement)
  - [x] 11.4 Notes panel ✅
    - [x] List/card view (NotesList component)
    - [x] Filter by type (6 types + all)
    - [x] Sort (modified, created, title, type)
    - [x] Checklist progress bars
    - [x] Search notes (title, content, tags)
    - [x] Tag management (add/remove inline)
    - [x] Empty state with create CTA
    - [x] Pin/delete actions
  - [ ] 11.5 #check() integration (Future - Phase 12+)
    - [ ] Parse #check(entity-slug, note-id) in markdown
    - [ ] Auto-complete checklist on compile/preview
    - [ ] Show check locations in note detail
    - [ ] Validation for invalid check references

  ***

  ## Phase 12: Search & Replace ✅ COMPLETE
  - [x] 12.1 Global search ✅
    - [x] Search panel UI (SearchPanel component)
    - [x] Search in markdown content (chapters)
    - [x] Search in entity fields
    - [x] Search in notes
    - [x] Regex support (toggle)
    - [x] Case-sensitive toggle
  - [x] 12.2 Search results ✅
    - [x] Result list with context (line numbers, snippets)
    - [x] Group by type (chapters, entities, notes)
    - [x] Match count display
    - [x] Total results and matches
    - [ ] Click to jump to location (Future enhancement)
  - [x] 12.3 Find & Replace ✅
    - [x] Replace all in chapters
    - [x] Regex support in replace
    - [ ] Replace single occurrence (Future enhancement)
    - [ ] Preview changes before replace (Future enhancement)
    - [ ] Undo/redo support (Future enhancement)
  - [x] 12.4 Entity usage search ✅
    - [x] Find all usages of entity (findEntityUsage utility)
    - [x] Usage count per chapter
    - [x] Line number tracking
    - [ ] Highlight in editor (Future enhancement)

  ***

  ## Phase 13: AI Integration ✅ COMPLETE
  - [x] 13.1 AI provider abstraction ✅
    - [x] AI types and interfaces (AIConfig, AIContext, AIMessage, StreamCallback)
    - [x] AIProviderInterface with complete, streamComplete, testConnection, listModels
    - [x] Default configuration with all providers
    - [x] Preset prompts (expand scene, check grammar, make dramatic, etc.)
  - [x] 13.2 AI service layer ✅
    - [x] Ollama client with keep_alive support (via IPC fetch)
    - [x] OpenAI client with streaming
    - [x] Anthropic client with streaming
    - [x] Streaming response handler (callback-based)
    - [x] Provider factory (createAIProvider)
    - [x] Error handling and retry logic
  - [x] 13.3 AISlice in store ✅
    - [x] AI configuration state (provider, model, API keys, temperature, maxTokens, keepAlive)
    - [x] Message history management
    - [x] sendMessage action with streaming support
    - [x] clearMessages, updateConfig, testConnection, listModels actions
    - [x] buildContext utility (smart context injection)
    - [x] Provider instance management
    - [x] Config persistence
  - [x] 13.4 AI Chat panel ✅
    - [x] Chat UI component with message bubbles
    - [x] Message history display
    - [x] Context injection display (chapter, selection, entities)
    - [x] Streaming responses with real-time display
    - [x] Preset prompts dropdown (8 quick actions)
    - [x] Context toggle and clear conversation
    - [x] Integrated into DockLayout
  - [x] 13.5 AI features (Advanced) ✅
    - [x] Monaco context menu integration (5 AI actions: Expand Scene, Check Grammar, Make Dramatic, Summarize, Suggest Improvements)
    - [x] Copy mechanism with hover button (assistant messages only)
    - [x] AI Settings Dialog (provider switcher, model selector, API keys, temperature, keep_alive)
    - [x] Connection test and model listing (Ollama)
    - [ ] Full diff viewer with side-by-side comparison (Future enhancement)
    - [ ] Direct text replacement in editor from chat (Future enhancement)
    - [ ] Custom prompts management (Future enhancement)
  - [x] 13.6 AI context awareness ✅
    - [x] Send current chapter content as context
    - [x] Send selection if any
    - [x] Send entity definitions (all entities or mentioned ones)
    - [x] Conversation history (last 10 messages)
    - [x] Smart context building based on active content

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
