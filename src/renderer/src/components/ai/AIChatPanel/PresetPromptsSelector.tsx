import React from 'react'
import { useToolsStore } from '@renderer/store'
import { PRESET_PROMPTS } from '@renderer/lib/ai/types'
import type { PresetPromptsSelectorProps } from './types'
import { Sparkles, ChevronDown } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'

export const PresetPromptsSelector: React.FC<PresetPromptsSelectorProps> = ({
  onSelectPrompt,
  className
}) => {
  const customPrompts = useToolsStore((state) => state.customPrompts)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className={`h-7 ${className || ''}`}>
          <Sparkles className="h-3 w-3 mr-1" />
          Presets
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="w-64 p-2">
        <p className="text-xs font-medium text-muted-foreground px-2 py-1">Writing</p>
        <Separator className="my-1" />
        {Object.entries(PRESET_PROMPTS)
          .filter(([, preset]) => preset.category === 'writing')
          .map(([key, preset]) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 text-sm"
              onClick={() => onSelectPrompt(preset.prompt)}
            >
              {preset.label}
            </Button>
          ))}
        <Separator className="my-1" />
        <p className="text-xs font-medium text-muted-foreground px-2 py-1">Analysis</p>
        <Separator className="my-1" />
        {Object.entries(PRESET_PROMPTS)
          .filter(([, preset]) => preset.category === 'analysis')
          .map(([key, preset]) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 text-sm"
              onClick={() => onSelectPrompt(preset.prompt)}
            >
              {preset.label}
            </Button>
          ))}

        {/* Custom Prompts */}
        {customPrompts.length > 0 && (
          <>
            <Separator className="my-1" />
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">Custom</p>
            {customPrompts.map((cp) => (
              <Button
                key={cp.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8 text-sm"
                onClick={() => onSelectPrompt(cp.prompt)}
              >
                {cp.name}
              </Button>
            ))}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
