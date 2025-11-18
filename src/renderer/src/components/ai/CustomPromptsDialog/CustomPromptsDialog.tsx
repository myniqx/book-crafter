import React, { useState } from 'react'
import { useToolsStore } from '@renderer/store'
import type { CustomPrompt } from '@renderer/lib/ai/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Card } from '@renderer/components/ui/card'
import { Sparkles, Plus, Pencil, Trash2, Save, X } from 'lucide-react'

export const CustomPromptsDialog: React.FC = () => {
  const customPrompts = useToolsStore((state) => state.customPrompts)
  const addCustomPrompt = useToolsStore((state) => state.addCustomPrompt)
  const updateCustomPrompt = useToolsStore((state) => state.updateCustomPrompt)
  const deleteCustomPrompt = useToolsStore((state) => state.deleteCustomPrompt)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
    category: 'custom' as CustomPrompt['category']
  })

  const handleCreate = (): void => {
    if (!formData.name.trim() || !formData.prompt.trim()) return

    addCustomPrompt(formData)
    setFormData({ name: '', prompt: '', category: 'custom' })
    setShowCreateForm(false)
  }

  const handleEdit = (prompt: CustomPrompt): void => {
    setEditingId(prompt.id)
    setFormData({
      name: prompt.name,
      prompt: prompt.prompt,
      category: prompt.category
    })
  }

  const handleUpdate = (): void => {
    if (!editingId || !formData.name.trim() || !formData.prompt.trim()) return

    updateCustomPrompt(editingId, formData)
    setEditingId(null)
    setFormData({ name: '', prompt: '', category: 'custom' })
  }

  const handleCancel = (): void => {
    setEditingId(null)
    setShowCreateForm(false)
    setFormData({ name: '', prompt: '', category: 'custom' })
  }

  const handleDelete = (id: string): void => {
    if (confirm('Are you sure you want to delete this prompt?')) {
      deleteCustomPrompt(id)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Sparkles className="h-4 w-4 mr-1" />
          Custom Prompts
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Custom AI Prompts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create Button */}
          {!showCreateForm && !editingId && (
            <Button onClick={() => setShowCreateForm(true)} className="w-full" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create New Prompt
            </Button>
          )}

          {/* Create/Edit Form */}
          {(showCreateForm || editingId) && (
            <Card className="p-4 border-slate-700 bg-slate-900">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="prompt-name">Name</Label>
                  <Input
                    id="prompt-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Dialogue Expert"
                  />
                </div>

                <div>
                  <Label htmlFor="prompt-category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value as CustomPrompt['category'] })
                    }
                  >
                    <SelectTrigger id="prompt-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="editing">Editing</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="prompt-text">Prompt</Label>
                  <textarea
                    id="prompt-text"
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    placeholder="Enter your custom prompt here..."
                    className="w-full h-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={editingId ? handleUpdate : handleCreate} size="sm">
                    <Save className="h-3 w-3 mr-1" />
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Prompts List */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {customPrompts.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No custom prompts yet.</p>
                  <p className="text-xs mt-1">Create your first prompt to get started!</p>
                </div>
              )}

              {customPrompts.map((prompt) => (
                <Card
                  key={prompt.id}
                  className="p-3 border-slate-700 bg-slate-800 hover:bg-slate-750 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-slate-200">{prompt.name}</h4>
                        <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                          {prompt.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{prompt.prompt}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Modified: {new Date(prompt.modified).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => handleEdit(prompt)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(prompt.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
