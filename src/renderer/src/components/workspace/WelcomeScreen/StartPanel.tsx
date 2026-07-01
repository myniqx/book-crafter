import React, { useState } from 'react'
import { FilePlus, FolderOpen, BookOpen, HelpCircle, Keyboard } from 'lucide-react'
import { toast } from '@renderer/lib/toast'
import { CreateProjectDialog } from '../CreateProjectDialog'
import { OpenProjectDialog } from '../OpenProjectDialog'

interface StartActionProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  onClick: () => void
}

const StartAction: React.FC<StartActionProps> = ({ icon: Icon, label, description, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg transition-colors duration-150 hover:bg-surface-container-high flex items-center gap-3"
    >
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <div>
        <p className="text-sm font-medium text-on-surface">{label}</p>
        <p className="text-xs text-on-surface-variant">{description}</p>
      </div>
    </button>
  )
}

export const StartPanel: React.FC = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [openDialogOpen, setOpenDialogOpen] = useState(false)

  const handleDocs = () => {
    toast.info('Documentation', 'Opening documentation...')
    // TODO: Open documentation
  }

  const handleShortcuts = () => {
    toast.info('Keyboard Shortcuts', 'Ctrl+Shift+P - Command Palette\nCtrl+B - Toggle Sidebar')
  }

  return (
    <>
      <div className="flex flex-col h-full p-6 space-y-6">
        {/* Start Section */}
        <div>
          <h2 className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wide">Start</h2>
          <div className="space-y-1">
            <StartAction
              icon={FilePlus}
              label="New Project"
              description="Create a new Book Crafter workspace"
              onClick={() => setCreateDialogOpen(true)}
            />
            <StartAction
              icon={FolderOpen}
              label="Open Folder"
              description="Open an existing workspace"
              onClick={() => setOpenDialogOpen(true)}
            />
          </div>
        </div>

        {/* Help Section */}
        <div>
          <h2 className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wide">Help</h2>
          <div className="space-y-1">
            <StartAction
              icon={HelpCircle}
              label="Documentation"
              description="Learn how to use Book Crafter"
              onClick={handleDocs}
            />
            <StartAction
              icon={Keyboard}
              label="Keyboard Shortcuts"
              description="View all keyboard shortcuts"
              onClick={handleShortcuts}
            />
          </div>
        </div>

        {/* Branding */}
        <div className="flex-1 flex items-end">
          <div className="text-center w-full">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-primary opacity-40" />
            <h1 className="text-2xl font-bold mb-2 text-on-surface">Book Crafter</h1>
            <p className="text-xs text-on-surface-variant">Professional book writing tool</p>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <OpenProjectDialog open={openDialogOpen} onOpenChange={setOpenDialogOpen} />
    </>
  )
}
