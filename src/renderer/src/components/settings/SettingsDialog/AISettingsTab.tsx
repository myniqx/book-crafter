import React from 'react'
import { useStore } from '@renderer/store'
import { useSettingsContext } from './SettingsContext'
import { FormField } from '@renderer/components/ui/field'
import { PasswordInput } from '@renderer/components/ui/password-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@renderer/components/ui/select'
import { Checkbox } from '@renderer/components/ui/checkbox'
import { Slider } from '@renderer/components/ui/slider'
import { Separator } from '@renderer/components/ui/separator'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import { Loader2 } from 'lucide-react'
import type { AIProvider } from '@renderer/lib/ai/types'

export const AISettingsTab: React.FC = () => {
  const { draft, updateDraft } = useSettingsContext()
  const listModels = useStore((state) => state.listModels)

  const { activeProvider, providerConfigs, aiPreferences } = draft
  const config = providerConfigs[activeProvider]

  const updateConfig = (updates: Partial<typeof config>): void =>
    updateDraft({ providerConfigs: { ...providerConfigs, [activeProvider]: { ...config, ...updates } } })

  const updatePrefs = (updates: Partial<typeof aiPreferences>): void =>
    updateDraft({ aiPreferences: { ...aiPreferences, ...updates } })

  const [availableModels, setAvailableModels] = React.useState<string[]>([])
  const [loadingModels, setLoadingModels] = React.useState(false)
  const [modelsError, setModelsError] = React.useState<string | null>(null)

  const fetchModels = React.useCallback(async (): Promise<void> => {
    setLoadingModels(true)
    setModelsError(null)
    try {
      const models = await listModels()
      setAvailableModels(models)
      if (models.length === 0) setModelsError('No models found')
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : 'Failed to fetch models')
      setAvailableModels([])
    } finally {
      setLoadingModels(false)
    }
  }, [listModels])

  React.useEffect(() => {
    setAvailableModels([])
    setModelsError(null)
    fetchModels()
  }, [activeProvider, fetchModels])

  const requiresApiKey = activeProvider !== 'ollama'
  const hasApiKey = !requiresApiKey || !!config.apiKey?.trim()

  const modelField = (
    <FormField
      htmlFor="model"
      label={
        <div className="flex items-center justify-between">
          <span>Model</span>
          <Button size="sm" variant="outline" onClick={fetchModels} disabled={!hasApiKey || loadingModels} className="h-7">
            {loadingModels ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Loading...</> : 'Refresh'}
          </Button>
        </div>
      }
      error={modelsError ?? undefined}
    >
      <Select
        value={config.model}
        onValueChange={(value) => updateConfig({ model: value })}
        disabled={!hasApiKey || availableModels.length === 0}
      >
        <SelectTrigger id="model">
          <SelectValue placeholder={loadingModels ? 'Loading models...' : 'Select a model'} />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )

  return (
    <div className="space-y-6">
      <FormField htmlFor="provider" label="AI Provider">
        <Select
          value={activeProvider}
          onValueChange={(value: AIProvider) => updateDraft({ activeProvider: value })}
        >
          <SelectTrigger id="provider"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ollama">Ollama (Local)</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
            <SelectItem value="gemini">Google Gemini</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <Separator />

      {activeProvider === 'ollama' && (
        <>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Ollama Configuration</h3>
            <FormField htmlFor="ollama-url" label="Endpoint URL">
              <PasswordInput id="ollama-url" value={config.endpoint || ''} onChange={(e) => updateConfig({ endpoint: e.target.value })} placeholder="http://localhost:11434" />
            </FormField>
            {modelField}
            <FormField htmlFor="keep-alive" label={<>Keep Alive: <span className="font-normal text-muted-foreground">{config.keepAlive}</span></>} hint="How long to keep model loaded (e.g., 5m, 1h, -1 for indefinite)">
              <PasswordInput id="keep-alive" value={config.keepAlive || ''} onChange={(e) => updateConfig({ keepAlive: e.target.value })} placeholder="5m" />
            </FormField>
          </div>
          <Separator />
        </>
      )}

      {activeProvider === 'openai' && (
        <>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">OpenAI Configuration</h3>
            <FormField htmlFor="openai-key" label="API Key">
              <PasswordInput id="openai-key" value={config.apiKey || ''} onChange={(e) => updateConfig({ apiKey: e.target.value })} placeholder="sk-..." />
            </FormField>
            <fieldset disabled={!hasApiKey} className="space-y-4 disabled:opacity-50">{modelField}</fieldset>
          </div>
          <Separator />
        </>
      )}

      {activeProvider === 'gemini' && (
        <>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Google Gemini Configuration</h3>
            <FormField htmlFor="gemini-key" label="API Key" hint="Get your API key from aistudio.google.com">
              <PasswordInput id="gemini-key" value={config.apiKey || ''} onChange={(e) => updateConfig({ apiKey: e.target.value })} placeholder="AIza..." />
            </FormField>
            <fieldset disabled={!hasApiKey} className="space-y-4 disabled:opacity-50">{modelField}</fieldset>
          </div>
          <Separator />
        </>
      )}

      {activeProvider === 'anthropic' && (
        <>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Anthropic Configuration</h3>
            <FormField htmlFor="anthropic-key" label="API Key">
              <PasswordInput id="anthropic-key" value={config.apiKey || ''} onChange={(e) => updateConfig({ apiKey: e.target.value })} placeholder="sk-ant-..." />
            </FormField>
            <fieldset disabled={!hasApiKey} className="space-y-4 disabled:opacity-50">
              {modelField}
              <p className="text-xs text-muted-foreground">Anthropic has no public models list endpoint — showing a static list of known models</p>
            </fieldset>
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Generation Settings</h3>
        <FormField htmlFor="temperature" label={<>Temperature: <span className="font-normal text-muted-foreground">{(config.temperature ?? 0.7).toFixed(1)}</span></>} hint="Lower is more focused, higher is more creative">
          <div className="py-1">
            <Slider id="temperature" min={0} max={2} step={0.1} value={[config.temperature ?? 0.7]} onValueChange={([v]) => updateConfig({ temperature: v })} />
          </div>
        </FormField>
        <FormField htmlFor="max-tokens" label={<>Max Tokens: <span className="font-normal text-muted-foreground">{config.maxTokens ?? 2000}</span></>}>
          <div className="py-1">
            <Slider id="max-tokens" min={100} max={4000} step={100} value={[config.maxTokens ?? 2000]} onValueChange={([v]) => updateConfig({ maxTokens: v })} />
          </div>
        </FormField>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-medium">AI Preferences</h3>
        <div className="flex items-center gap-2">
          <Checkbox id="auto-suggest" checked={aiPreferences.autoSuggest} onCheckedChange={(checked) => updatePrefs({ autoSuggest: checked as boolean })} />
          <Label htmlFor="auto-suggest" className="cursor-pointer">Enable auto-suggestions</Label>
        </div>
        {aiPreferences.autoSuggest && (
          <FormField htmlFor="suggestions-delay" label={<>Suggestions Delay: <span className="font-normal text-muted-foreground">{aiPreferences.suggestionsDelay}ms</span></>}>
            <div className="py-1">
              <Slider id="suggestions-delay" min={500} max={3000} step={100} value={[aiPreferences.suggestionsDelay]} onValueChange={([v]) => updatePrefs({ suggestionsDelay: v })} />
            </div>
          </FormField>
        )}
        <FormField htmlFor="max-suggestions" label={<>Max Suggestions History: <span className="font-normal text-muted-foreground">{aiPreferences.maxSuggestionsHistory}</span></>}>
          <div className="py-1">
            <Slider id="max-suggestions" min={10} max={200} step={10} value={[aiPreferences.maxSuggestionsHistory]} onValueChange={([v]) => updatePrefs({ maxSuggestionsHistory: v })} />
          </div>
        </FormField>
        <div className="flex items-center gap-2">
          <Checkbox id="show-context" checked={aiPreferences.showContextInPrompt} onCheckedChange={(checked) => updatePrefs({ showContextInPrompt: checked as boolean })} />
          <Label htmlFor="show-context" className="cursor-pointer">Show context in prompt input</Label>
        </div>
      </div>
    </div>
  )
}
