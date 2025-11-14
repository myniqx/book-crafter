import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@renderer/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Button } from '@renderer/components/ui/button'
import { Settings } from 'lucide-react'
import { GeneralSettingsTab } from './GeneralSettingsTab'
import { EditorSettingsTab } from './EditorSettingsTab'
import { AISettingsTab } from './AISettingsTab'
import { WorkspaceSettingsTab } from './WorkspaceSettingsTab'
import { KeyboardShortcutsTab } from './KeyboardShortcutsTab'
import { AdvancedSettingsTab } from './AdvancedSettingsTab'

export const SettingsDialog: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Settings (Ctrl+,)">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="general"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="editor"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
            >
              Editor
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
            >
              AI
            </TabsTrigger>
            <TabsTrigger
              value="workspace"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
            >
              Workspace
            </TabsTrigger>
            <TabsTrigger
              value="keyboard"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
            >
              Keyboard
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
            >
              Advanced
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="general" className="mt-0">
              <GeneralSettingsTab />
            </TabsContent>

            <TabsContent value="editor" className="mt-0">
              <EditorSettingsTab />
            </TabsContent>

            <TabsContent value="ai" className="mt-0">
              <AISettingsTab />
            </TabsContent>

            <TabsContent value="workspace" className="mt-0">
              <WorkspaceSettingsTab />
            </TabsContent>

            <TabsContent value="keyboard" className="mt-0">
              <KeyboardShortcutsTab />
            </TabsContent>

            <TabsContent value="advanced" className="mt-0">
              <AdvancedSettingsTab />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
