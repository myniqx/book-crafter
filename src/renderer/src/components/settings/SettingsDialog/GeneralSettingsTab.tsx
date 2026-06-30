import React from 'react'
import { useToolsStore } from '@renderer/store'
import { FormField } from '@renderer/components/ui/field'
import { Input } from '@renderer/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Label } from '@renderer/components/ui/label'
import { Separator } from '@renderer/components/ui/separator'

export const GeneralSettingsTab: React.FC = () => {
  const generalSettings = useToolsStore((state) => state.generalSettings)
  const updateGeneralSettings = useToolsStore((state) => state.updateGeneralSettings)

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Author Information</h3>
        <FormField htmlFor="author-name" label="Author Name">
          <Input
            id="author-name"
            value={generalSettings.authorName}
            onChange={(e) => updateGeneralSettings({ authorName: e.target.value })}
            placeholder="Your name"
          />
        </FormField>
        <FormField htmlFor="author-email" label="Author Email (Optional)">
          <Input
            id="author-email"
            type="email"
            value={generalSettings.authorEmail || ''}
            onChange={(e) => updateGeneralSettings({ authorEmail: e.target.value })}
            placeholder="your.email@example.com"
          />
        </FormField>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Language & Localization</h3>
        <FormField htmlFor="language" label="Default Language">
          <Select
            value={generalSettings.defaultLanguage}
            onValueChange={(value: 'en' | 'tr') => updateGeneralSettings({ defaultLanguage: value })}
          >
            <SelectTrigger id="language"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="tr">Türkçe</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField htmlFor="date-format" label="Date Format">
          <Select
            value={generalSettings.dateFormat}
            onValueChange={(value: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD') =>
              updateGeneralSettings({ dateFormat: value })
            }
          >
            <SelectTrigger id="date-format"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</SelectItem>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField htmlFor="time-format" label="Time Format">
          <Select
            value={generalSettings.timeFormat}
            onValueChange={(value: '12h' | '24h') => updateGeneralSettings({ timeFormat: value })}
          >
            <SelectTrigger id="time-format"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12-hour (3:30 PM)</SelectItem>
              <SelectItem value="24h">24-hour (15:30)</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Confirmation Dialogs</h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="confirm-delete"
            checked={generalSettings.confirmOnDelete}
            onCheckedChange={(checked) => updateGeneralSettings({ confirmOnDelete: checked as boolean })}
          />
          <Label htmlFor="confirm-delete" className="cursor-pointer">
            Ask for confirmation before deleting items
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="confirm-close"
            checked={generalSettings.confirmOnClose}
            onCheckedChange={(checked) => updateGeneralSettings({ confirmOnClose: checked as boolean })}
          />
          <Label htmlFor="confirm-close" className="cursor-pointer">
            Ask for confirmation before closing unsaved files
          </Label>
        </div>
      </div>
    </div>
  )
}
