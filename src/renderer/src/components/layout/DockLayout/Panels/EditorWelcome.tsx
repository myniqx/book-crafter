import React from 'react'

export const EditorWelcome: React.FC = () => (
  <div className="h-full w-full flex flex-col items-center justify-center text-on-surface-variant">
    <div className="text-center space-y-4 max-w-md">
      <h2 className="text-2xl font-semibold text-on-surface">Welcome to Book Crafter</h2>
      <p className="text-sm">Open a book from the File Explorer or create a new one to start writing.</p>
      <div className="pt-4 text-xs space-y-1">
        <p>Use <kbd className="px-2 py-1 bg-surface-container rounded">@</kbd> to reference entities</p>
        <p>Toggle panels from the sidebar</p>
        <p>Your work is auto-saved</p>
      </div>
    </div>
  </div>
)
