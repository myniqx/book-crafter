# Book Crafter - Development Guidelines for Claude

## Architecture Principles

### 1. Component Design - Self-Contained Components

**RULE: No Prop Drilling for Actions**

Components should be self-contained and manage their own state/actions. Do NOT pass store actions or callbacks as props.

#### ❌ WRONG - Prop Drilling:

```tsx
// Parent passes store action
function FileExplorer() {
  const createBook = useStore((state) => state.addBook)
  return <CreateBookButton onCreate={createBook} />
}

// Child receives callback
function CreateBookButton({ onCreate }: { onCreate: (book) => void }) {
  // ...
}

// never use 'any' as type!
```

#### ✅ CORRECT - Self-Contained:

```tsx
// in /components/{section}/CreateBookButton/CreateBookButton.tsx
import React from 'react'
import type { CreateBookButtonProps } from './types'

// Component manages its own store connection
export const CreateBookButton: React.FC<CreateBookButtonProps> = ({
  // if any props must needed (defined in types.ts)
  ...rest
}) => {
  const addBook = useStore((state) => state.addBook) // Hook here

  const handleCreate = (formData) => {
    const book = { slug: slugify(formData.title), ...formData }
    addBook(book) // Action executed here
  }

  return (
    <Button onClick={handleCreate} {...rest}>
      Create Book
    </Button>
  )
}

// in /components/{section}/CreateBookButton/index.ts
export * from './CreateBookButton' // only export main components NOT child components for main component.
```

### 2. Dialog/Modal Components

**RULE: Use Shadcn Dialog's built-in state management**

Do NOT manually manage `open`/`onOpenChange` state. Use `DialogTrigger` and built-in close mechanisms.

#### ❌ WRONG - Manual State:

```tsx
function CreateBookDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Book</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>...</DialogContent>
      </Dialog>
    </>
  )
}
```

#### ✅ CORRECT - Built-in State:

```tsx
// in /components/{section}/CreateBookDialog/CreateBookDialog.tsx
import React from 'react'

export const CreateBookDialog: React.FC = () => {
  const addBook = useStore((state) => state.addBook)

  const handleSubmit = (formData) => {
    addBook(createBookFromFormData(formData))
    // Dialog closes automatically via DialogClose
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New Book</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Book</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {/* form fields */}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button type="submit">Create</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 3. Zustand Store Usage

**RULE: Each component calls its own hooks**

```tsx
// ✅ CORRECT
export const EntityBrowser = () => {
  const entities = useStore((state) => state.entities)
  const selectedSlug = useStore((state) => state.selectedEntitySlug)
  const selectEntity = useStore((state) => state.selectEntity)

  // Component handles its own logic
}

// ❌ WRONG
function EntityBrowser({ entities, onSelect }) {
  // Props from parent
}
```

### 4. Props Guidelines

**What to pass as props:**

- ✅ Presentation data (IDs, slugs, display values)
- ✅ UI state (variant, size, disabled)
- ✅ Configuration (options, settings)
- ✅ Event callbacks
- ✅ if component can usable multiple times with some props

**What NOT to pass as props:**

- ❌ Store actions/mutations
- ❌ Event callbacks that modify store
- ❌ Complex business logic

#### Example:

```tsx
// ✅ CORRECT
;<EntityCard entitySlug="john-doe" variant="compact" />

// Inside EntityCard:
export const EntityCard: React.FC<EntityCardProps> = ({
  entitySlug,
  variant = 'default' // always give default value when its possible
}) => {
  const entity = useStore((state) => state.entities[entitySlug])
  const deleteEntity = useStore((state) => state.deleteEntity)

  const handleDelete = () => {
    if (confirm('Delete entity?')) {
      deleteEntity(entitySlug)
    }
  }

  return <Card>...</Card>
}

// ❌ WRONG
;<EntityCard entity={entity} onDelete={handleDelete} />
```

### 5. Form Handling

Forms should be self-contained with validation and submission logic inside the component.

```tsx
const CreateChapterForm: React.FC<CreateChapterFormProps> = ({ bookSlug }) => {
  const addChapter = useStore((state) => state.addChapter)
  const [title, setTitle] = useState('')
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors = validateChapter({ title })
    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    // Create chapter
    const chapter = {
      slug: slugify(title),
      title,
      content: ''
      // ... other fields
    }

    addChapter(bookSlug, chapter)

    // Reset form
    setTitle('')
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### 6. File Structure

**Folder-based Component Organization:**

Each component gets its own folder with:

- `ComponentName.tsx` - Main component file
- `types.ts` - TypeScript interfaces (optional, if props needed)
- `index.ts` - Re-exports (ONLY main component, not child components)

```
src/renderer/src/
├── components/
│   ├── ui/                              # Shadcn base components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── workspace/                       # Workspace-related
│   │   ├── CreateWorkspaceDialog/
│   │   │   ├── CreateWorkspaceDialog.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── WorkspaceSettings/
│   │   │   ├── WorkspaceSettings.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   └── WorkspaceSwitcher/
│   │       ├── WorkspaceSwitcher.tsx
│   │       └── index.ts
│   │
│   ├── books/                           # Book/Chapter management
│   │   ├── BookCard/
│   │   │   ├── BookCard.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── CreateBookDialog/
│   │   │   ├── CreateBookDialog.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── ChapterList/
│   │   │   ├── ChapterList.tsx
│   │   │   ├── ChapterItem.tsx          # Internal child component
│   │   │   ├── types.ts
│   │   │   └── index.ts                 # Only exports ChapterList
│   │   ├── CreateChapterDialog/
│   │   └── BookExplorer/
│   │
│   ├── entities/                        # Entity system
│   │   ├── EntityBrowser/
│   │   │   ├── EntityBrowser.tsx
│   │   │   ├── EntityTree.tsx           # Internal child
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── EntityCard/
│   │   │   ├── EntityCard.tsx
│   │   │   ├── EntityFieldList.tsx      # Internal child
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── CreateEntityDialog/
│   │   ├── EntityDetailPanel/
│   │   └── EntityUsagePanel/
│   │
│   ├── editor/                          # Monaco editor
│   │   ├── MonacoEditor/
│   │   │   ├── MonacoEditor.tsx
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── EditorTabs/
│   │   └── EditorStatusBar/
│   │
│   ├── preview/                         # Markdown preview
│   │   ├── MarkdownPreview/
│   │   └── PreviewPanel/
│   │
│   ├── images/                          # Image management
│   │   ├── ImageGallery/
│   │   ├── ImageUploader/
│   │   └── ImageCard/
│   │
│   ├── notes/                           # Notes & Checklist
│   │   ├── NotesList/
│   │   ├── NoteCard/
│   │   ├── CreateNoteDialog/
│   │   └── ChecklistPanel/
│   │
│   ├── ai/                              # AI features
│   │   ├── AIChatPanel/
│   │   ├── AISettingsDialog/
│   │   └── AIPromptInput/
│   │
│   └── layout/                          # Layout components
│       ├── DockLayout/
│       ├── Sidebar/
│       ├── Titlebar/
│       └── StatusBar/
│
├── store/
│   ├── index.ts                         # Combined store
│   └── slices/
│       ├── workspaceSlice.ts
│       ├── entitySlice.ts
│       ├── booksSlice.ts
│       └── uiSlice.ts
│
├── lib/
│   ├── utils.ts                         # cn() and general utilities
│   ├── ipc.ts                           # IPC client wrapper
│   ├── slugify.ts                       # Slug generation
│   ├── validation.ts                    # Form validation helpers
│   └── monaco/                          # Monaco editor utilities
│       ├── language.ts                  # Custom language definition
│       ├── completion.ts                # IntelliSense providers
│       └── diagnostics.ts               # Validation providers
│
├── hooks/                               # Custom React hooks
│   ├── useDebounce.ts
│   ├── useEntityValidation.ts
│   └── useAutoSave.ts
│
├── types/
│   └── index.ts                         # Shared TypeScript types
│
└── assets/
    ├── main.css                         # Tailwind imports
    └── fonts/                           # Custom fonts (if any)
```

**Import examples:**

```tsx
// ✅ CORRECT - Import from folder index
import { CreateBookDialog } from '@renderer/components/books/CreateBookDialog'
import { EntityCard } from '@renderer/components/entities/EntityCard'

// ❌ WRONG - Don't import child components directly
import { EntityFieldList } from '@renderer/components/entities/EntityCard/EntityFieldList'

// ❌ WRONG - Don't import from .tsx directly
import { EntityCard } from '@renderer/components/entities/EntityCard/EntityCard'
```

### 7. Naming Conventions

- **Components:** PascalCase (`CreateBookDialog.tsx`)
- **Hooks:** camelCase with `use` prefix (`useEntityValidation`)
- **Store slices:** camelCase with `Slice` suffix (`workspaceSlice.ts`)
- **Utilities:** camelCase (`slugify`, `validateEntity`)
- **Constants:** UPPER_SNAKE_CASE (`DEFAULT_FONT_SIZE`)

### 8. TypeScript Best Practices

- Always define interfaces for component props
- Use `type` for unions, `interface` for object shapes
- Avoid `any` - use `unknown` if type is truly unknown
- Export types in types.ts if needed

```tsx
// in types.ts
export interface EntityCardProps extends CardProps {
  entitySlug: string
}

// in EntityCard.tsx
import React from 'react'
import { EntityCardProps } from './types'

export const EntityCard: React.FC<EntityCardProps> = ({
  entitySlug,
  variant = 'default',
  className,
  ...props
}) => {
  // ...
}
```

### 9. UI/UX Design Guidelines

**Design Language: Modern Text Editor / Writing Tool**

Book Crafter should feel like a professional writing tool (Notion, Obsidian, Ulysses).

**Layout Principles:**

- **Clean workspace:** Minimal chrome, focus on content
- **Collapsible sidebars:** More space for writing
- **Dockable panels:** Flexible, customizable layout
- **Status bar:** Subtle, informative (word count, save status)
- **Tab system:** Clear, closable, reorderable

**Icons:**

- Use Lucide React (already installed)

**Animations:**

- Subtle, purposeful
- Fast transitions (150-200ms)
- Use Tailwind's `transition-*` utilities
- Prefer `ease-in-out` easing

**Reference Apps for Inspiration:**

- Notion (clean, minimal UI)
- Obsidian (writing-focused, customizable)
- VSCode (professional, efficient)
- Linear (modern, polished)
- Craft (beautiful typography)

---

## Tech Stack Reference

- **Framework:** Electron + Vite + React 19 + TypeScript
- **Styling:** Tailwind CSS 4 (with layer-based imports)
- **Components:** Shadcn/ui (self-contained, accessible)
- **State:** Zustand (with immer, persist, devtools)
- **Editor:** Monaco Editor (@monaco-editor/react)
- **Layout:** rc-dock (dockable panels)
- **Markdown:** react-markdown + remark/rehype

---

## IPC API Reference

**IMPORTANT:** When working with IPC operations (file system, HTTP requests, dialogs), always refer to `src/types/ipc.ts` for available APIs and their parameters.

### Available IPC APIs

All IPC APIs are available through `window.api` object (defined in preload script):

#### 1. File System API (`window.api.fs`)

```tsx
// Read file
const content = await window.api.fs.readFile('/path/to/file.md', { encoding: 'utf-8' })

// Write file
await window.api.fs.writeFile('/path/to/file.md', content, {
  encoding: 'utf-8',
  backup: true // Creates backup before writing
})

// Read directory
const files = await window.api.fs.readDir('/path/to/dir', {
  recursive: true,
  withFileTypes: true
})

// Create directory
await window.api.fs.mkdir('/path/to/new/dir', true) // recursive

// Delete file/directory
await window.api.fs.delete('/path/to/file')

// Move/rename
await window.api.fs.move('/old/path', '/new/path')

// Copy file
await window.api.fs.copyFile('/source', '/destination')

// Check if exists
const exists = await window.api.fs.exists('/path/to/file')

// Get file stats
const stats = await window.api.fs.stats('/path/to/file')
// Returns: { size, created, modified, isFile, isDirectory }

// Watch file/directory for changes
const unwatch = await window.api.fs.watch('/path', (event, filename) => {
  console.log(`${event} on ${filename}`)
})
// Later: unwatch() to stop watching
```

#### 2. Fetch/HTTP API (`window.api.fetch` or `window.api.http`)

```tsx
// Simple GET request
const response = await window.api.fetch.request<ResponseType>('https://api.example.com/data')

// POST with options
const response = await window.api.fetch.request<ResponseType>('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer token'
  },
  body: { key: 'value' }, // Auto-stringified if object
  timeout: 5000 // 5 seconds
})

// Stream response (for AI streaming)
await window.api.fetch.stream('https://api.example.com/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: { prompt: 'Hello' },
  onChunk: (chunk) => {
    console.log('Received chunk:', chunk)
  },
  onError: (error) => {
    console.error('Stream error:', error)
  },
  onComplete: () => {
    console.log('Stream completed')
  }
})
```

#### 3. Dialog API (`window.api.dialog`)

```tsx
// Open file dialog
const result = await window.api.dialog.openFile({
  title: 'Select Markdown File',
  filters: [
    { name: 'Markdown', extensions: ['md', 'markdown'] },
    { name: 'All Files', extensions: ['*'] }
  ],
  properties: ['openFile', 'multiSelections']
})

if (!result.canceled) {
  const filePath = result.filePath // Single file
  const filePaths = result.filePaths // Multiple files if multiSelections
}

// Open directory dialog
const dirResult = await window.api.dialog.openDirectory({
  title: 'Select Workspace',
  buttonLabel: 'Select Workspace'
})

// Save file dialog
const saveResult = await window.api.dialog.saveFile({
  title: 'Save Book',
  defaultPath: 'my-book.md',
  filters: [{ name: 'Markdown', extensions: ['md'] }]
})
```

#### 4. App API (`window.api.app`)

```tsx
// Get special paths
const userDataPath = await window.api.app.getPath('userData') // App data directory
const appDataPath = await window.api.app.getPath('appData') // OS app data
const tempPath = await window.api.app.getPath('temp') // Temp directory
const homePath = await window.api.app.getPath('home') // User home
```

### Error Handling

All IPC calls can throw `IPCError`. Always wrap in try-catch:

```tsx
import type { IPCError } from '@/types/ipc'

try {
  const content = await window.api.fs.readFile('/path/to/file.md')
} catch (error) {
  if ((error as IPCError).code === 'FILE_NOT_FOUND') {
    console.error('File does not exist')
  } else if ((error as IPCError).code === 'PERMISSION_DENIED') {
    console.error('Permission denied')
  } else {
    console.error('Unknown error:', error)
  }
}
```

**Reference:** For complete type definitions and all available options, always check `src/types/ipc.ts`.

## Important Notes

- **No prop drilling for store actions**
- **Use DialogTrigger, not manual open state**
- **Components are self-contained**
- **Each component manages its own Zustand hooks**
- **Business logic stays in components, not passed as props**

---

_This file is for Claude to reference during development. Update as architecture evolves._
