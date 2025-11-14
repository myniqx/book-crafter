import { useStore } from './store'
import { WelcomeScreen } from './components/workspace/WelcomeScreen'
import { MainLayout } from './components/layout/MainLayout'
import { Toaster } from './components/ui/sonner'

function App(): React.JSX.Element {
  const workspaceConfig = useStore((state) => state.workspaceConfig)

  return (
    <>
      {/* Show welcome screen if no workspace is configured */}
      {!workspaceConfig ? <WelcomeScreen /> : <MainLayout />}

      {/* Toast notifications */}
      <Toaster />
    </>
  )
}

export default App
