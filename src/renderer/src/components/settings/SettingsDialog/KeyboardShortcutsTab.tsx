import React, { useState } from 'react'
import { useToolsStore, useCoreStore } from '@renderer/store'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Separator } from '@renderer/components/ui/separator'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { RotateCcw, Edit2, Check, X } from 'lucide-react'
import type { KeyboardShortcut } from '@renderer/store/slices/settingsSlice'

export const KeyboardShortcutsTab: React.FC = () => {
  const keyboardShortcuts = useToolsStore((state) => state.keyboardShortcuts)
  const updateKeyboardShortcut = useToolsStore((state) => state.updateKeyboardShortcut)
  const resetKeyboardShortcut = useToolsStore((state) => state.resetKeyboardShortcut)
  const resetAllKeyboardShortcuts = useToolsStore((state) => state.resetAllKeyboardShortcuts)

  const [filter, setFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingBinding, setEditingBinding] = useState('')
  const [recordMode, setRecordMode] = useState(false)

  const handleStartEdit = (shortcut: KeyboardShortcut): void => {
    setEditingId(shortcut.id)
    setEditingBinding(shortcut.currentBinding)
    setRecordMode(false)
  }

  const handleSaveEdit = (): void => {
    if (editingId && editingBinding) {
      // Check for conflicts
      const conflict = keyboardShortcuts.find(
        (s) => s.currentBinding === editingBinding && s.id !== editingId
      )

      if (conflict) {
        if (
          !confirm(
            `This binding is already used by "${conflict.action}". Do you want to reassign it?`
          )
        ) {
          return
        }
      }

      updateKeyboardShortcut(editingId, editingBinding)
      setEditingId(null)
      setEditingBinding('')
    }
  }

  const handleCancelEdit = (): void => {
    setEditingId(null)
    setEditingBinding('')
    setRecordMode(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (!recordMode) return

    e.preventDefault()
    e.stopPropagation()

    const parts: string[] = []

    if (e.ctrlKey) parts.push('Ctrl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    if (e.metaKey) parts.push('Meta')

    // Add the key if it's not a modifier
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      parts.push(e.key.toUpperCase())
    }

    if (parts.length > 0) {
      setEditingBinding(parts.join('+'))
    }
  }

  const handleResetAll = (): void => {
    if (confirm('Are you sure you want to reset all keyboard shortcuts to their defaults?')) {
      resetAllKeyboardShortcuts()
    }
  }

  const filteredShortcuts = keyboardShortcuts.filter((shortcut) => {
    const matchesSearch =
      filter === '' ||
      shortcut.action.toLowerCase().includes(filter.toLowerCase()) ||
      shortcut.currentBinding.toLowerCase().includes(filter.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || shortcut.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category: string): string => {
    const colors = {
      editor: 'bg-blue-900 text-blue-300',
      navigation: 'bg-purple-900 text-purple-300',
      ai: 'bg-green-900 text-green-300',
      general: 'bg-slate-700 text-slate-300'
    }
    return colors[category as keyof typeof colors] || colors.general
  }

  return (
    <div className="space-y-4 flex flex-col h-full">
      {/* Header Controls */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search shortcuts..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="navigation">Navigation</SelectItem>
              <SelectItem value="ai">AI</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleResetAll}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Click the edit button to change a shortcut. Click "Record" to capture key combinations.
        </p>
      </div>

      <Separator />

      {/* Shortcuts List */}
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-2">
          {filteredShortcuts.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No shortcuts found matching your search.
            </div>
          )}

          {filteredShortcuts.map((shortcut) => (
            <div
              key={shortcut.id}
              className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-700 bg-slate-800/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{shortcut.action}</span>
                  <Badge className={getCategoryColor(shortcut.category)} variant="outline">
                    {shortcut.category}
                  </Badge>
                </div>

                {editingId === shortcut.id ? (
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="text"
                      value={editingBinding}
                      onChange={(e) => setEditingBinding(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Press keys or type binding..."
                      className="h-8 text-xs flex-1"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant={recordMode ? 'default' : 'outline'}
                      onClick={() => setRecordMode(!recordMode)}
                      className="h-8 text-xs"
                    >
                      {recordMode ? 'Recording...' : 'Record'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveEdit}
                      className="h-8 w-8 p-0"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-slate-900 px-2 py-1 rounded">
                      {shortcut.currentBinding}
                    </code>
                    {shortcut.currentBinding !== shortcut.defaultBinding && (
                      <Badge variant="outline" className="text-xs bg-yellow-900/20 text-yellow-400">
                        Modified
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {editingId !== shortcut.id && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEdit(shortcut)}
                    className="h-8"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  {shortcut.currentBinding !== shortcut.defaultBinding && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => resetKeyboardShortcut(shortcut.id)}
                      className="h-8"
                      title="Reset to default"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
