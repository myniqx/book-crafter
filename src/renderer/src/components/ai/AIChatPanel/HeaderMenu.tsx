import React from 'react'
import type { HeaderMenuProps } from './types'
import { MoreHorizontal, FileText, Trash2, Sparkles, Settings } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Switch } from '@renderer/components/ui/switch'
import { Separator } from '@renderer/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { AISettingsDialog } from '@renderer/components/ai/AISettingsDialog'
import { CustomPromptsDialog } from '@renderer/components/ai/CustomPromptsDialog'

export const HeaderMenu: React.FC<HeaderMenuProps> = ({
  showContext,
  onShowContextChange,
  messagesCount,
  onClearMessages,
  className
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className={`h-7 w-7 p-0 ${className || ''}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        {/* Show Context Toggle */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Show context</span>
          </div>
          <Switch checked={showContext} onCheckedChange={onShowContextChange} />
        </div>

        <Separator className="my-2" />

        {/* Clear Messages */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8 text-sm"
          onClick={onClearMessages}
          disabled={messagesCount === 0}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear messages
        </Button>

        <Separator className="my-2" />

        {/* Custom Prompts */}
        <CustomPromptsDialog
          trigger={
            <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Custom prompts
            </Button>
          }
        />

        {/* AI Settings */}
        <AISettingsDialog
          trigger={
            <Button variant="ghost" size="sm" className="w-full justify-start h-8 text-sm">
              <Settings className="h-4 w-4 mr-2" />
              AI Settings
            </Button>
          }
        />
      </PopoverContent>
    </Popover>
  )
}
