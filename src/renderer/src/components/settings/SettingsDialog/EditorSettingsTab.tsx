import React from 'react'
import { useStore } from '@renderer/store'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Slider } from '@renderer/components/ui/slider'
import { Separator } from '@renderer/components/ui/separator'

export const EditorSettingsTab: React.FC = () => {
  const editorSettings = useStore((state) => state.extendedEditorSettings)
  const updateEditorSettings = useStore((state) => state.updateExtendedEditorSettings)

  return (
    <div className="space-y-6">
      {/* Font Settings */}
      <div>
        <h3 className="text-sm font-medium mb-4">Font</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="font-family">Font Family</Label>
            <Select
              value={editorSettings.fontFamily}
              onValueChange={(value) => updateEditorSettings({ fontFamily: value })}
            >
              <SelectTrigger id="font-family">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monaco">Monaco</SelectItem>
                <SelectItem value="Consolas">Consolas</SelectItem>
                <SelectItem value="'SF Mono', monospace">SF Mono</SelectItem>
                <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                <SelectItem value="'JetBrains Mono', monospace">JetBrains Mono</SelectItem>
                <SelectItem value="'Fira Code', monospace">Fira Code</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-size">
              Font Size: <span className="text-muted-foreground">{editorSettings.fontSize}px</span>
            </Label>
            <Slider
              id="font-size"
              min={10}
              max={24}
              step={1}
              value={[editorSettings.fontSize]}
              onValueChange={([value]) => updateEditorSettings({ fontSize: value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="line-height">
              Line Height:{' '}
              <span className="text-muted-foreground">{editorSettings.lineHeight.toFixed(1)}</span>
            </Label>
            <Slider
              id="line-height"
              min={1.0}
              max={2.0}
              step={0.1}
              value={[editorSettings.lineHeight]}
              onValueChange={([value]) => updateEditorSettings({ lineHeight: value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tab-size">
              Tab Size: <span className="text-muted-foreground">{editorSettings.tabSize}</span>
            </Label>
            <Slider
              id="tab-size"
              min={2}
              max={8}
              step={1}
              value={[editorSettings.tabSize]}
              onValueChange={([value]) => updateEditorSettings({ tabSize: value })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Cursor Settings */}
      <div>
        <h3 className="text-sm font-medium mb-4">Cursor</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cursor-style">Cursor Style</Label>
            <Select
              value={editorSettings.cursorStyle}
              onValueChange={(value: 'line' | 'block' | 'underline') =>
                updateEditorSettings({ cursorStyle: value })
              }
            >
              <SelectTrigger id="cursor-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="block">Block</SelectItem>
                <SelectItem value="underline">Underline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cursor-blinking">Cursor Blinking</Label>
            <Select
              value={editorSettings.cursorBlinking}
              onValueChange={(value: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid') =>
                updateEditorSettings({ cursorBlinking: value })
              }
            >
              <SelectTrigger id="cursor-blinking">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blink">Blink</SelectItem>
                <SelectItem value="smooth">Smooth</SelectItem>
                <SelectItem value="phase">Phase</SelectItem>
                <SelectItem value="expand">Expand</SelectItem>
                <SelectItem value="solid">Solid (No Blink)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Display Options */}
      <div>
        <h3 className="text-sm font-medium mb-4">Display</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="line-numbers"
              checked={editorSettings.lineNumbers}
              onCheckedChange={(checked) =>
                updateEditorSettings({ lineNumbers: checked as boolean })
              }
            />
            <Label htmlFor="line-numbers" className="cursor-pointer">
              Show line numbers
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="minimap"
              checked={editorSettings.minimap}
              onCheckedChange={(checked) => updateEditorSettings({ minimap: checked as boolean })}
            />
            <Label htmlFor="minimap" className="cursor-pointer">
              Show minimap
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="word-wrap"
              checked={editorSettings.wordWrap}
              onCheckedChange={(checked) => updateEditorSettings({ wordWrap: checked as boolean })}
            />
            <Label htmlFor="word-wrap" className="cursor-pointer">
              Word wrap
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="render-whitespace">Render Whitespace</Label>
            <Select
              value={editorSettings.renderWhitespace}
              onValueChange={(value: 'none' | 'boundary' | 'selection' | 'all') =>
                updateEditorSettings({ renderWhitespace: value })
              }
            >
              <SelectTrigger id="render-whitespace">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="boundary">Boundary</SelectItem>
                <SelectItem value="selection">Selection</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Code Features */}
      <div>
        <h3 className="text-sm font-medium mb-4">Code Features</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bracket-colorization"
              checked={editorSettings.bracketPairColorization}
              onCheckedChange={(checked) =>
                updateEditorSettings({ bracketPairColorization: checked as boolean })
              }
            />
            <Label htmlFor="bracket-colorization" className="cursor-pointer">
              Bracket pair colorization
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto-closing-brackets">Auto Closing Brackets</Label>
            <Select
              value={editorSettings.autoClosingBrackets}
              onValueChange={(
                value: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never'
              ) => updateEditorSettings({ autoClosingBrackets: value })}
            >
              <SelectTrigger id="auto-closing-brackets">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Always</SelectItem>
                <SelectItem value="languageDefined">Language Defined</SelectItem>
                <SelectItem value="beforeWhitespace">Before Whitespace</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Formatting */}
      <div>
        <h3 className="text-sm font-medium mb-4">Formatting</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="format-on-save"
              checked={editorSettings.formatOnSave}
              onCheckedChange={(checked) =>
                updateEditorSettings({ formatOnSave: checked as boolean })
              }
            />
            <Label htmlFor="format-on-save" className="cursor-pointer">
              Format on save
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="format-on-paste"
              checked={editorSettings.formatOnPaste}
              onCheckedChange={(checked) =>
                updateEditorSettings({ formatOnPaste: checked as boolean })
              }
            />
            <Label htmlFor="format-on-paste" className="cursor-pointer">
              Format on paste
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="trim-whitespace"
              checked={editorSettings.trimAutoWhitespace}
              onCheckedChange={(checked) =>
                updateEditorSettings({ trimAutoWhitespace: checked as boolean })
              }
            />
            <Label htmlFor="trim-whitespace" className="cursor-pointer">
              Trim trailing whitespace
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Auto-Save */}
      <div>
        <h3 className="text-sm font-medium mb-4">Auto-Save</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-save"
              checked={editorSettings.autoSave}
              onCheckedChange={(checked) => updateEditorSettings({ autoSave: checked as boolean })}
            />
            <Label htmlFor="auto-save" className="cursor-pointer">
              Enable auto-save
            </Label>
          </div>

          {editorSettings.autoSave && (
            <div className="space-y-2">
              <Label htmlFor="auto-save-delay">
                Auto-Save Delay:{' '}
                <span className="text-muted-foreground">{editorSettings.autoSaveDelay}ms</span>
              </Label>
              <Slider
                id="auto-save-delay"
                min={500}
                max={5000}
                step={100}
                value={[editorSettings.autoSaveDelay]}
                onValueChange={([value]) => updateEditorSettings({ autoSaveDelay: value })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
