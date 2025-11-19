import { useCoreStore } from './store'
import { WelcomeScreen } from './components/workspace/WelcomeScreen'
import { MainLayout } from './components/layout/MainLayout'
import { Toaster } from './components/ui/sonner'
import { TooltipProvider } from './components/ui/tooltip'
import { CommandPalette } from './components/command/CommandPalette'
import { SettingsPersistence } from './components/settings/SettingsPersistence'

function App(): React.JSX.Element {
  const workspaceConfig = useCoreStore((state) => state.workspaceConfig)

  return (
    <TooltipProvider>
      {/* Settings persistence - loads/saves settings from/to disk */}
      <SettingsPersistence />

      {/* Show welcome screen if no workspace is configured */}
      {!workspaceConfig ? <WelcomeScreen /> : <MainLayout />}

      {/* Command Palette (Ctrl+Shift+P) - only when workspace is active */}
      {workspaceConfig && <CommandPalette />}

      {/* Toast notifications */}
      <Toaster />
    </TooltipProvider>
  )
}

export default App
