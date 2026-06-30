import React from 'react'
import { useToolsStore } from '@renderer/store'
import { FormField } from '@renderer/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Label } from '@renderer/components/ui/label'
import { Slider } from '@renderer/components/ui/slider'
import { Separator } from '@renderer/components/ui/separator'

export const EditorSettingsTab: React.FC = () => {
  const editorSettings = useToolsStore((state) => state.extendedEditorSettings)
  const updateEditorSettings = useToolsStore((state) => state.updateExtendedEditorSettings)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Font</h3>
        <FormField htmlFor="font-family" label="Font Family">
          <Select
            value={editorSettings.fontFamily}
            onValueChange={(value) => updateEditorSettings({ fontFamily: value })}
          >
            <SelectTrigger id="font-family"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Monaco">Monaco</SelectItem>
              <SelectItem value="Consolas">Consolas</SelectItem>
              <SelectItem value="'SF Mono', monospace">SF Mono</SelectItem>
              <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
              <SelectItem value="'JetBrains Mono', monospace">JetBrains Mono</SelectItem>
              <SelectItem value="'Fira Code', monospace">Fira Code</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField
          htmlFor="font-size"
          label={<>Font Size: <span className="font-normal text-muted-foreground">{editorSettings.fontSize}px</span></>}
        >
          <div className="py-1">
            <Slider
              id="font-size"
              min={10} max={24} step={1}
              value={[editorSettings.fontSize]}
              onValueChange={([value]) => updateEditorSettings({ fontSize: value })}
            />
          </div>
        </FormField>
        <FormField
          htmlFor="line-height"
          label={<>Line Height: <span className="font-normal text-muted-foreground">{editorSettings.lineHeight.toFixed(1)}</span></>}
        >
          <div className="py-1">
            <Slider
              id="line-height"
              min={1.0} max={2.0} step={0.1}
              value={[editorSettings.lineHeight]}
              onValueChange={([value]) => updateEditorSettings({ lineHeight: value })}
            />
          </div>
        </FormField>
        <FormField
          htmlFor="tab-size"
          label={<>Tab Size: <span className="font-normal text-muted-foreground">{editorSettings.tabSize}</span></>}
        >
          <div className="py-1">
            <Slider
              id="tab-size"
              min={2} max={8} step={1}
              value={[editorSettings.tabSize]}
              onValueChange={([value]) => updateEditorSettings({ tabSize: value })}
            />
          </div>
        </FormField>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Cursor</h3>
        <FormField htmlFor="cursor-style" label="Cursor Style">
          <Select
            value={editorSettings.cursorStyle}
            onValueChange={(value: 'line' | 'block' | 'underline') =>
              updateEditorSettings({ cursorStyle: value })
            }
          >
            <SelectTrigger id="cursor-style"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="block">Block</SelectItem>
              <SelectItem value="underline">Underline</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField htmlFor="cursor-blinking" label="Cursor Blinking">
          <Select
            value={editorSettings.cursorBlinking}
            onValueChange={(value: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid') =>
              updateEditorSettings({ cursorBlinking: value })
            }
          >
            <SelectTrigger id="cursor-blinking"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="blink">Blink</SelectItem>
              <SelectItem value="smooth">Smooth</SelectItem>
              <SelectItem value="phase">Phase</SelectItem>
              <SelectItem value="expand">Expand</SelectItem>
              <SelectItem value="solid">Solid (No Blink)</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Display</h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="line-numbers"
            checked={editorSettings.lineNumbers}
            onCheckedChange={(checked) => updateEditorSettings({ lineNumbers: checked as boolean })}
          />
          <Label htmlFor="line-numbers" className="cursor-pointer">Show line numbers</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="minimap"
            checked={editorSettings.minimap}
            onCheckedChange={(checked) => updateEditorSettings({ minimap: checked as boolean })}
          />
          <Label htmlFor="minimap" className="cursor-pointer">Show minimap</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="word-wrap"
            checked={editorSettings.wordWrap}
            onCheckedChange={(checked) => updateEditorSettings({ wordWrap: checked as boolean })}
          />
          <Label htmlFor="word-wrap" className="cursor-pointer">Word wrap</Label>
        </div>
        <FormField htmlFor="render-whitespace" label="Render Whitespace">
          <Select
            value={editorSettings.renderWhitespace}
            onValueChange={(value: 'none' | 'boundary' | 'selection' | 'all') =>
              updateEditorSettings({ renderWhitespace: value })
            }
          >
            <SelectTrigger id="render-whitespace"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="boundary">Boundary</SelectItem>
              <SelectItem value="selection">Selection</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Code Features</h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="bracket-colorization"
            checked={editorSettings.bracketPairColorization}
            onCheckedChange={(checked) =>
              updateEditorSettings({ bracketPairColorization: checked as boolean })
            }
          />
          <Label htmlFor="bracket-colorization" className="cursor-pointer">Bracket pair colorization</Label>
        </div>
        <FormField htmlFor="auto-closing-brackets" label="Auto Closing Brackets">
          <Select
            value={editorSettings.autoClosingBrackets}
            onValueChange={(value: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never') =>
              updateEditorSettings({ autoClosingBrackets: value })
            }
          >
            <SelectTrigger id="auto-closing-brackets"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="always">Always</SelectItem>
              <SelectItem value="languageDefined">Language Defined</SelectItem>
              <SelectItem value="beforeWhitespace">Before Whitespace</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Formatting</h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="format-on-save"
            checked={editorSettings.formatOnSave}
            onCheckedChange={(checked) => updateEditorSettings({ formatOnSave: checked as boolean })}
          />
          <Label htmlFor="format-on-save" className="cursor-pointer">Format on save</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="format-on-paste"
            checked={editorSettings.formatOnPaste}
            onCheckedChange={(checked) => updateEditorSettings({ formatOnPaste: checked as boolean })}
          />
          <Label htmlFor="format-on-paste" className="cursor-pointer">Format on paste</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="trim-whitespace"
            checked={editorSettings.trimAutoWhitespace}
            onCheckedChange={(checked) =>
              updateEditorSettings({ trimAutoWhitespace: checked as boolean })
            }
          />
          <Label htmlFor="trim-whitespace" className="cursor-pointer">Trim trailing whitespace</Label>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Auto-Save</h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="auto-save"
            checked={editorSettings.autoSave}
            onCheckedChange={(checked) => updateEditorSettings({ autoSave: checked as boolean })}
          />
          <Label htmlFor="auto-save" className="cursor-pointer">Enable auto-save</Label>
        </div>
        {editorSettings.autoSave && (
          <FormField
            htmlFor="auto-save-delay"
            label={<>Auto-Save Delay: <span className="font-normal text-muted-foreground">{editorSettings.autoSaveDelay}ms</span></>}
          >
            <div className="py-1">
              <Slider
                id="auto-save-delay"
                min={500} max={5000} step={100}
                value={[editorSettings.autoSaveDelay]}
                onValueChange={([value]) => updateEditorSettings({ autoSaveDelay: value })}
              />
            </div>
          </FormField>
        )}
      </div>
    </div>
  )
}
