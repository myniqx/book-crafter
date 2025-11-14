import { useStore } from './store'
import { WelcomeScreen } from './components/workspace/WelcomeScreen'
import { MainLayout } from './components/layout/MainLayout'

function App(): React.JSX.Element {
  const workspaceConfig = useStore((state) => state.workspaceConfig)

  // Show welcome screen if no workspace is configured
  if (!workspaceConfig) {
    return <WelcomeScreen />
  }

  // Show main layout when workspace exists
  return <MainLayout />
}

export default App
