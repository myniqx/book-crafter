import React from 'react'
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
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Separator } from '@renderer/components/ui/separator'

export const GeneralSettingsTab: React.FC = () => {
  const generalSettings = useToolsStore((state) => state.generalSettings)
  const updateGeneralSettings = useToolsStore((state) => state.updateGeneralSettings)

  return (
    <div className="space-y-6">
      {/* Author Information */}
      <div>
        <h3 className="text-sm font-medium mb-4">Author Information</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="author-name">Author Name</Label>
            <Input
              id="author-name"
              type="text"
              value={generalSettings.authorName}
              onChange={(e) => updateGeneralSettings({ authorName: e.target.value })}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author-email">Author Email (Optional)</Label>
            <Input
              id="author-email"
              type="email"
              value={generalSettings.authorEmail || ''}
              onChange={(e) => updateGeneralSettings({ authorEmail: e.target.value })}
              placeholder="your.email@example.com"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Language & Localization */}
      <div>
        <h3 className="text-sm font-medium mb-4">Language & Localization</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Default Language</Label>
            <Select
              value={generalSettings.defaultLanguage}
              onValueChange={(value: 'en' | 'tr') =>
                updateGeneralSettings({ defaultLanguage: value })
              }
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="tr">Türkçe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-format">Date Format</Label>
            <Select
              value={generalSettings.dateFormat}
              onValueChange={(value: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD') =>
                updateGeneralSettings({ dateFormat: value })
              }
            >
              <SelectTrigger id="date-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-format">Time Format</Label>
            <Select
              value={generalSettings.timeFormat}
              onValueChange={(value: '12h' | '24h') =>
                updateGeneralSettings({ timeFormat: value })
              }
            >
              <SelectTrigger id="time-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (3:30 PM)</SelectItem>
                <SelectItem value="24h">24-hour (15:30)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Confirmation Dialogs */}
      <div>
        <h3 className="text-sm font-medium mb-4">Confirmation Dialogs</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm-delete"
              checked={generalSettings.confirmOnDelete}
              onCheckedChange={(checked) =>
                updateGeneralSettings({ confirmOnDelete: checked as boolean })
              }
            />
            <Label htmlFor="confirm-delete" className="cursor-pointer">
              Ask for confirmation before deleting items
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm-close"
              checked={generalSettings.confirmOnClose}
              onCheckedChange={(checked) =>
                updateGeneralSettings({ confirmOnClose: checked as boolean })
              }
            />
            <Label htmlFor="confirm-close" className="cursor-pointer">
              Ask for confirmation before closing unsaved files
            </Label>
          </div>
        </div>
      </div>
    </div>
  )
}
