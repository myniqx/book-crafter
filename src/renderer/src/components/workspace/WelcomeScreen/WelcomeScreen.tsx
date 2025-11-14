import React, { useState } from 'react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@renderer/components/ui/card'
import { Label } from '@renderer/components/ui/label'
import { useStore } from '@renderer/store'

export const WelcomeScreen: React.FC = () => {
  const [projectName, setProjectName] = useState('')
  const [author, setAuthor] = useState('')

  const createNewWorkspace = useStore((state) => state.createNewWorkspace)

  const handleCreateWorkspace = (): void => {
    if (projectName && author) {
      createNewWorkspace(projectName, author)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && projectName && author) {
      handleCreateWorkspace()
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-[hsl(var(--background))] p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Welcome to Book Crafter
          </CardTitle>
          <CardDescription>
            Create a new workspace to start writing your book
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              placeholder="My Awesome Book"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="author">Author Name</Label>
            <Input
              id="author"
              placeholder="John Doe"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleCreateWorkspace}
            disabled={!projectName || !author}
          >
            Create Workspace
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
