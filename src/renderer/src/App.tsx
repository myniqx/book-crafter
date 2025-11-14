import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './components/ui/card'
import { useStore } from './store'
import { useState } from 'react'

function App(): React.JSX.Element {
  const [projectName, setProjectName] = useState('')
  const [author, setAuthor] = useState('')

  const workspaceConfig = useStore((state) => state.workspaceConfig)
  const createNewWorkspace = useStore((state) => state.createNewWorkspace)
  const theme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)

  const handleCreateWorkspace = () => {
    if (projectName && author) {
      createNewWorkspace(projectName, author)
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Book Crafter
          </CardTitle>
          <CardDescription>
            {workspaceConfig
              ? `Project: ${workspaceConfig.projectName}`
              : 'Create a new workspace to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!workspaceConfig ? (
            <>
              <div className="space-y-2">
                <Input
                  placeholder="Project name..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
                <Input
                  placeholder="Author name..."
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateWorkspace}
                disabled={!projectName || !author}
              >
                Create Workspace
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="text-sm">
                <p><strong>Author:</strong> {workspaceConfig.author}</p>
                <p><strong>Created:</strong> {new Date(workspaceConfig.created).toLocaleDateString()}</p>
                <p><strong>AI Provider:</strong> {workspaceConfig.aiConfig.provider}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </Button>
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                >
                  Light
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default App
