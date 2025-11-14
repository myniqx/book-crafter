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

**Phase 15.1:** Unified Settings System ✅
- SettingsDialog with 6 tabs (General, Editor, AI, Workspace, Keyboard, Advanced)
- Settings persistence in Zustand + localStorage
- Import/Export settings functionality
- Keyboard shortcuts customization
- Settings button in Titlebar (Ctrl+,)

---

## 🚀 CURRENT PHASE: Polish & UX (Phase 16)

### 16.1 Toast Notifications 🔄
- [ ] Install shadcn sonner component
- [ ] Create toast notification system
- [ ] Integrate toasts for file operations
- [ ] Integrate toasts for AI operations
- [ ] Integrate toasts for CRUD operations
- [ ] Success/error/info/warning variants
- [ ] Toast with action buttons (Undo, Retry)

**Integration Points:**
- File operations (save, delete, create)
- AI operations (success/failure, streaming)
- Entity/Book/Note/Image CRUD
- Settings changes
- Error handling

### 16.2 Loading States
- [ ] Skeleton loaders for entity lists
- [ ] Skeleton loaders for book/chapter lists
- [ ] Skeleton loaders for note lists
- [ ] Skeleton loaders for image gallery
- [ ] Loading spinners for async operations
- [ ] Progress indicators for long operations
- [ ] Optimistic UI updates

### 16.3 Keyboard Shortcuts Implementation
- [ ] Create useKeyboard hook for global shortcuts
- [ ] Implement Ctrl+S - Save current file
- [ ] Implement Ctrl+Shift+S - Save all
- [ ] Implement Ctrl+F - Find in file
- [ ] Implement Ctrl+Shift+F - Global search
- [ ] Implement Ctrl+B - Toggle sidebar
- [ ] Implement Ctrl+, - Open settings
- [ ] Implement Ctrl+Shift+P - Command palette
- [ ] Implement Ctrl+Shift+E - Create entity
- [ ] Implement Ctrl+Shift+N - Create note
- [ ] Implement Ctrl+Shift+A - Open AI chat
- [ ] Implement Alt+E - AI Expand selection
- [ ] Implement Alt+G - AI Grammar check
- [ ] Connect keyboard shortcuts to settings

### 16.4 Command Palette
- [ ] Create CommandPalette component
- [ ] Implement fuzzy search for commands
- [ ] Keyboard navigation (↑↓ arrows, Enter, Esc)
- [ ] Recent commands history
- [ ] Command categories (Create, AI, Search, General)
- [ ] Display keyboard shortcuts in palette
- [ ] Quick file switcher
- [ ] Quick entity switcher

**Command Structure:**
```typescript
interface Command {
  id: string
  label: string
  category: 'Create' | 'AI' | 'Search' | 'Navigation' | 'General'
  shortcut?: string
  action: () => void
  keywords?: string[]
}
```

**Default Commands:**
- New Book, New Chapter, New Entity, New Note
- Open AI Chat, AI Expand, AI Grammar Check
- Global Search, Find in File
- Open Settings, Toggle Sidebar
- Save, Save All

### 16.5 Accessibility Improvements
- [ ] Add ARIA labels to buttons and interactive elements
- [ ] Implement keyboard navigation (Tab, Shift+Tab)
- [ ] Focus management in dialogs
- [ ] Focus trap in modals
- [ ] Escape key to close modals/dialogs
- [ ] Enter to submit forms
- [ ] Visible focus indicators
- [ ] Screen reader announcements for important actions

### 16.6 Performance Optimization
- [ ] Implement virtual scrolling for entity list
- [ ] Implement virtual scrolling for note list
- [ ] Code splitting - lazy load Monaco editor
- [ ] Code splitting - lazy load image gallery
- [ ] Memoize expensive computations
- [ ] Debounce search inputs
- [ ] Debounce filter operations
- [ ] Bundle size analysis

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

**Phase 16: Polish & UX** (Current Focus)
1. **16.1** - Toast notifications (shadcn sonner)
2. **16.3** - Keyboard shortcuts implementation
3. **16.4** - Command palette
4. **16.2** - Loading states & skeleton loaders
5. **16.5** - Accessibility improvements
6. **16.6** - Performance optimization

**Priority Order:**
1. Toast notifications (essential for UX feedback)
2. Keyboard shortcuts (productivity boost)
3. Command palette (quick access to features)
4. Loading states (visual feedback)
5. Accessibility (inclusive design)
6. Performance (optional optimization)

---

## 📝 Notes

- Testing (Phase 17) is optional for MVP
- Timeline & History (Phase 14) is optional
- Focus on Phase 16 for production-ready UX
- Using shadcn/ui Sonner for toast notifications
- All keyboard shortcuts customizable via Settings

