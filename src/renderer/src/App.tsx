import { useStore } from './store'
import { WelcomeScreen } from './components/workspace/WelcomeScreen'
import { MainLayout } from './components/layout/MainLayout'
import { Toaster } from './components/ui/sonner'
import { CommandPalette } from './components/command/CommandPalette'

function App(): React.JSX.Element {
  const workspaceConfig = useStore((state) => state.workspaceConfig)

  return (
    <>
      {/* Show welcome screen if no workspace is configured */}
      {!workspaceConfig ? <WelcomeScreen /> : <MainLayout />}

      {/* Command Palette (Ctrl+Shift+P) - only when workspace is active */}
      {workspaceConfig && <CommandPalette />}

      {/* Toast notifications */}
      <Toaster />
    </>
  )
}

export default App
