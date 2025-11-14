# Book Crafter - Development TODO

## ✅ COMPLETED PHASES (MVP Ready!)

**Phase 1-13:** All core features complete! ✅
- Project Setup & Foundation
- Electron IPC Bridge
- Workspace & File Structure
- Monaco Editor Integration
- Entity System & Browser
- Book/Chapter Management
- Markdown Preview
- rc-dock Layout System
- Image Management
- Notes & Checklist System
- Search & Replace
- **AI Integration (Full)**

---

## 🚀 CURRENT PHASE: Settings & UX

## Phase 15: Settings & Preferences

### 15.1 Unified Settings Dialog ✅
- [ ] Create SettingsDialog component with tabs
- [ ] Integrate with existing AI Settings Dialog
- [ ] Settings persistence in store
- [ ] Import/Export settings functionality

### 15.1.1 General Settings Tab
- [ ] Author information (name, email)
- [ ] Language selection (en/tr)
- [ ] Date/time format preferences
- [ ] Confirmation dialogs (delete, close)
- [ ] Privacy settings

**Data Model:**
```typescript
interface GeneralSettings {
  authorName: string
  authorEmail?: string
  defaultLanguage: 'en' | 'tr'
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h'
  confirmOnDelete: boolean
  confirmOnClose: boolean
}
```

### 15.1.2 Editor Settings Tab
- [ ] Font family selector (Monaco, Consolas, SF Mono, etc.)
- [ ] Font size slider (10-24)
- [ ] Line height slider (1.0-2.0)
- [ ] Cursor style/blinking preferences
- [ ] Whitespace rendering options
- [ ] Bracket pair colorization
- [ ] Auto-closing brackets
- [ ] Format on save/paste
- [ ] Live preview pane

**Extended EditorSettings:**
```typescript
interface EditorSettings {
  // Existing
  fontSize: number
  lineHeight: number
  wordWrap: boolean
  minimap: boolean
  lineNumbers: boolean
  tabSize: number

  // New
  fontFamily: string
  cursorStyle: 'line' | 'block' | 'underline'
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid'
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'all'
  bracketPairColorization: boolean
  autoClosingBrackets: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never'
  formatOnSave: boolean
  formatOnPaste: boolean
  trimAutoWhitespace: boolean
}
```

### 15.1.3 AI Settings Tab
- [x] Provider selection (Ollama, OpenAI, Anthropic) - Already done
- [x] Model configuration - Already done
- [x] API keys management - Already done
- [x] Temperature, max tokens - Already done
- [x] Keep alive (Ollama) - Already done
- [x] Connection test - Already done
- [ ] Move existing AI Settings into unified dialog
- [ ] Add AI preferences (auto-suggest, delays, history limits)

**AI Preferences:**
```typescript
interface AIPreferences {
  defaultProvider: AIProvider
  autoSuggest: boolean
  suggestionsDelay: number
  maxSuggestionsHistory: number
  showContextInPrompt: boolean
  enabledActions: string[]
}
```

### 15.1.4 Workspace Settings Tab
- [ ] Auto-save toggle and delay slider
- [ ] Backup settings (enabled, interval, max count, path)
- [ ] File watcher preferences (external changes)
- [ ] Performance tuning (indexing, max file size)

**Workspace Preferences:**
```typescript
interface WorkspacePreferences {
  autoSave: boolean
  autoSaveDelay: number
  autoBackup: boolean
  backupInterval: number
  maxBackups: number
  backupPath?: string
  watchExternalChanges: boolean
  reloadOnExternalChange: 'auto' | 'ask' | 'never'
  indexingEnabled: boolean
  maxFileSize: number
}
```

### 15.1.5 Keyboard Shortcuts Tab
- [ ] Searchable shortcut list
- [ ] Category filter (editor, navigation, ai, general)
- [ ] Click to edit shortcuts (record mode)
- [ ] Conflict detection
- [ ] Reset to defaults button
- [ ] Export/Import keybindings

**Default Shortcuts:**
```typescript
const shortcuts = [
  // Editor
  { id: 'save', action: 'Save', binding: 'Ctrl+S', category: 'editor' },
  { id: 'saveAll', action: 'Save All', binding: 'Ctrl+Shift+S', category: 'editor' },

  // Search
  { id: 'find', action: 'Find in File', binding: 'Ctrl+F', category: 'editor' },
  { id: 'globalFind', action: 'Global Search', binding: 'Ctrl+Shift+F', category: 'navigation' },

  // Navigation
  { id: 'toggleSidebar', action: 'Toggle Sidebar', binding: 'Ctrl+B', category: 'navigation' },
  { id: 'commandPalette', action: 'Command Palette', binding: 'Ctrl+Shift+P', category: 'general' },

  // Entity
  { id: 'createEntity', action: 'Create Entity', binding: 'Ctrl+Shift+E', category: 'general' },

  // AI
  { id: 'aiChat', action: 'Open AI Chat', binding: 'Ctrl+Shift+A', category: 'ai' },
]
```

### 15.1.6 Advanced Settings Tab
- [ ] Developer tools toggle
- [ ] Verbose logging
- [ ] Show hidden files
- [ ] GPU acceleration
- [ ] Memory/cache limits
- [ ] Experimental features toggle

---

## Phase 16: Polish & UX

### 16.1 Error Handling & Notifications
- [ ] Install shadcn toast/sonner component
- [ ] Create ToastSlice in store
- [ ] Integrate toast notifications system-wide
- [ ] User-friendly error messages mapping
- [ ] Success/error/info/warning toast variants
- [ ] Toast with actions (Retry, Undo, etc.)

**Integration Points:**
- File operations (save, delete, create)
- AI operations (request success/failure)
- Entity/Book/Note CRUD operations
- Image upload (progress + success/error)
- Settings changes

### 16.2 Loading States
- [ ] Skeleton loaders for lists (entities, books, notes, images)
- [ ] Progress bars (image upload, AI streaming)
- [ ] Loading spinners for async operations
- [ ] Optimistic UI updates (create entity, note, etc.)
- [ ] Suspense boundaries for lazy-loaded components

### 16.3 Keyboard Shortcuts Implementation
- [ ] Global keyboard event handler hook
- [ ] Ctrl+S - Save current file
- [ ] Ctrl+Shift+S - Save all
- [ ] Ctrl+F - Find in file
- [ ] Ctrl+Shift+F - Global search
- [ ] Ctrl+B - Toggle sidebar
- [ ] Ctrl+Shift+P - Command palette
- [ ] Ctrl+Shift+E - Create entity
- [ ] Ctrl+Shift+N - Create note
- [ ] Ctrl+Shift+A - Open AI chat
- [ ] Alt+E - AI Expand selection
- [ ] Alt+G - AI Grammar check

### 16.4 Command Palette
- [ ] Create CommandPalette component
- [ ] Fuzzy search for commands
- [ ] Keyboard navigation (↑↓ arrows, Enter)
- [ ] Recent commands
- [ ] Command categories
- [ ] Keyboard shortcut display in palette

**Commands:**
```typescript
const commands = [
  { id: 'new-book', label: 'New Book', category: 'Create' },
  { id: 'new-chapter', label: 'New Chapter', category: 'Create' },
  { id: 'new-entity', label: 'New Entity', category: 'Create' },
  { id: 'new-note', label: 'New Note', category: 'Create' },
  { id: 'ai-chat', label: 'Open AI Chat', category: 'AI' },
  { id: 'global-search', label: 'Global Search', category: 'Search' },
  { id: 'settings', label: 'Open Settings', category: 'General' },
  // ... more
]
```

### 16.5 Accessibility
- [ ] Add ARIA labels to all interactive elements
- [ ] Keyboard navigation (Tab, Shift+Tab)
- [ ] Focus management in modals
- [ ] Focus trap in dialogs
- [ ] Escape key to close modals
- [ ] Enter to submit forms
- [ ] Focus ring visibility
- [ ] Skip links for main content

### 16.6 Performance Optimization
- [ ] Virtual scrolling for large lists (entities, notes, suggestions)
- [ ] Code splitting (lazy load Monaco, ImageGallery)
- [ ] Memoization for expensive computations
- [ ] Debounce search/filter operations
- [ ] Bundle size analysis and optimization

---

## 📋 Optional/Future Phases

### Phase 14: Timeline & History (Optional)
- Activity timeline for recent changes
- Version history with snapshots
- Diff viewer for history (reuse existing DiffViewer)
- Restore from snapshot

### Phase 17: Testing (Optional)
- Unit tests for lib utilities
- Integration tests for IPC operations
- E2E tests for critical user flows

### Phase 18: Build & Distribution (Production)
- Production build optimization
- Electron packaging (Windows, macOS, Linux)
- Auto-update system
- Release notes

---

## 🎯 Current Priority

**Phase 15: Settings & Preferences** (Full implementation)
1. Unified Settings Dialog with tabs
2. General, Editor, AI, Workspace, Keyboard, Advanced settings
3. Persistence and import/export

**Phase 16: Polish & UX** (After Phase 15)
1. Toast notifications (shadcn sonner)
2. Keyboard shortcuts implementation
3. Command palette
4. Loading states
5. Accessibility improvements

---

## 📝 Notes

- Testing (Phase 17) is optional for MVP
- Timeline & History (Phase 14) is optional
- Focus on Settings and UX polish for production-ready app
- shadcn toast/sonner will be used for notifications
