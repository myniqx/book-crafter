import React from 'react'
import { useToolsStore } from '@renderer/store'
import { FormField } from '@renderer/components/ui/field'
import { Input } from '@renderer/components/ui/input'
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
import { Badge } from '@renderer/components/ui/badge'
import { Label } from '@renderer/components/ui/label'
import { Loader2 } from 'lucide-react'
import type { AIProvider, AIConfig } from '@renderer/lib/ai/types'

export const AISettingsTab: React.FC = () => {
  const activeProvider = useToolsStore((state) => state.activeProvider)
  const setActiveProvider = useToolsStore((state) => state.setActiveProvider)
  const providerConfigs = useToolsStore((state) => state.providerConfigs)
  const setProviderConfig = useToolsStore((state) => state.setProviderConfig)
  const listModels = useToolsStore((state) => state.listModels)
  const aiPreferences = useToolsStore((state) => state.aiPreferences)
  const updateAIPreferences = useToolsStore((state) => state.updateAIPreferences)

  const [draft, setDraft] = React.useState<AIConfig>(() => providerConfigs[activeProvider])
  const [isDirty, setIsDirty] = React.useState(false)

  const updateDraft = (updates: Partial<AIConfig>): void => {
    setDraft((prev) => ({ ...prev, ...updates }))
    setIsDirty(true)
  }

  React.useEffect(() => {
    setDraft(providerConfigs[activeProvider])
    setIsDirty(false)
  }, [activeProvider, providerConfigs])

  const handleSave = (): void => {
    setProviderConfig(activeProvider, draft)
    setIsDirty(false)
  }

  const handleCancel = (): void => {
    setDraft(providerConfigs[activeProvider])
    setIsDirty(false)
  }

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

  const [testing, setTesting] = React.useState(false)
  const [testResult, setTestResult] = React.useState<'success' | 'error' | null>(null)

  const handleTestConnection = async (): Promise<void> => {
    setTesting(true)
    setTestResult(null)
    try {
      if (activeProvider === 'ollama') {
        const response = await fetch(`${draft.endpoint || 'http://localhost:11434'}/api/tags`)
        setTestResult(response.ok ? 'success' : 'error')
      } else {
        setTestResult('success')
      }
    } catch {
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  const requiresApiKey = activeProvider !== 'ollama'
  const hasApiKey = !requiresApiKey || !!draft.apiKey?.trim()

  const modelFormField = (
    <FormField
      htmlFor="model"
      label={
        <div className="flex items-center justify-between">
          <span>Model</span>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchModels}
            disabled={!hasApiKey || loadingModels}
            className="h-7"
          >
            {loadingModels ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Loading...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
        </div>
      }
      error={modelsError ?? undefined}
    >
      <Select
        value={draft.model}
        onValueChange={(value) => updateDraft({ model: value })}
        disabled={!hasApiKey || availableModels.length === 0}
      >
        <SelectTrigger id="model">
          <SelectValue placeholder={loadingModels ? 'Loading models...' : 'Select a model'} />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  )

  return (
    <div className="space-y-6">

      {/* Provider Selection */}
      <FormField htmlFor="provider" label="AI Provider">
        <Select
          value={activeProvider}
          onValueChange={(value: AIProvider) => setActiveProvider(value)}
        >
          <SelectTrigger id="provider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ollama">Ollama (Local)</SelectItem>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
            <SelectItem value="gemini">Google Gemini</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <Separator />

      {/* Ollama */}
      {activeProvider === 'ollama' && (
        <>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Ollama Configuration</h3>
            <FormField htmlFor="ollama-url" label="Endpoint URL">
              <Input
                id="ollama-url"
                value={draft.endpoint || ''}
                onChange={(e) => updateDraft({ endpoint: e.target.value })}
                placeholder="http://localhost:11434"
              />
            </FormField>
            {modelFormField}
            <FormField
              htmlFor="keep-alive"
              label={<>Keep Alive: <span className="font-normal text-muted-foreground">{draft.keepAlive}</span></>}
              hint="How long to keep model loaded (e.g., 5m, 1h, -1 for indefinite)"
            >
              <Input
                id="keep-alive"
                value={draft.keepAlive || ''}
                onChange={(e) => updateDraft({ keepAlive: e.target.value })}
                placeholder="5m"
              />
            </FormField>
          </div>
          <Separator />
        </>
      )}

      {/* OpenAI */}
      {activeProvider === 'openai' && (
        <>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">OpenAI Configuration</h3>
            <FormField htmlFor="openai-key" label="API Key">
              <PasswordInput
                id="openai-key"
                value={draft.apiKey || ''}
                onChange={(e) => updateDraft({ apiKey: e.target.value })}
                placeholder="sk-..."
              />
            </FormField>
            <fieldset disabled={!hasApiKey} className="space-y-4 disabled:opacity-50">
              {modelFormField}
            </fieldset>
          </div>
          <Separator />
        </>
      )}

      {/* Gemini */}
      {activeProvider === 'gemini' && (
        <>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Google Gemini Configuration</h3>
            <FormField htmlFor="gemini-key" label="API Key" hint="Get your API key from aistudio.google.com">
              <PasswordInput
                id="gemini-key"
                value={draft.apiKey || ''}
                onChange={(e) => updateDraft({ apiKey: e.target.value })}
                placeholder="AIza..."
              />
            </FormField>
            <fieldset disabled={!hasApiKey} className="space-y-4 disabled:opacity-50">
              {modelFormField}
            </fieldset>
          </div>
          <Separator />
        </>
      )}

      {/* Anthropic */}
      {activeProvider === 'anthropic' && (
        <>
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Anthropic Configuration</h3>
            <FormField htmlFor="anthropic-key" label="API Key">
              <PasswordInput
                id="anthropic-key"
                value={draft.apiKey || ''}
                onChange={(e) => updateDraft({ apiKey: e.target.value })}
                placeholder="sk-ant-..."
              />
            </FormField>
            <fieldset disabled={!hasApiKey} className="space-y-4 disabled:opacity-50">
              {modelFormField}
              <p className="text-xs text-muted-foreground">
                Anthropic has no public models list endpoint — showing a static list of known models
              </p>
            </fieldset>
          </div>
          <Separator />
        </>
      )}

      {/* Generation Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Generation Settings</h3>
        <FormField
          htmlFor="temperature"
          label={<>Temperature: <span className="font-normal text-muted-foreground">{(draft.temperature ?? 0.7).toFixed(1)}</span></>}
          hint="Lower is more focused, higher is more creative"
        >
          <div className="py-1">
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[draft.temperature ?? 0.7]}
              onValueChange={([value]) => updateDraft({ temperature: value })}
            />
          </div>
        </FormField>
        <FormField
          htmlFor="max-tokens"
          label={<>Max Tokens: <span className="font-normal text-muted-foreground">{draft.maxTokens ?? 2000}</span></>}
        >
          <div className="py-1">
            <Slider
              id="max-tokens"
              min={100}
              max={4000}
              step={100}
              value={[draft.maxTokens ?? 2000]}
              onValueChange={([value]) => updateDraft({ maxTokens: value })}
            />
          </div>
        </FormField>
      </div>

      <Separator />

      {/* AI Preferences */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">AI Preferences</h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="auto-suggest"
            checked={aiPreferences.autoSuggest}
            onCheckedChange={(checked) => updateAIPreferences({ autoSuggest: checked as boolean })}
          />
          <Label htmlFor="auto-suggest" className="cursor-pointer">Enable auto-suggestions</Label>
        </div>

        {aiPreferences.autoSuggest && (
          <FormField
            htmlFor="suggestions-delay"
            label={<>Suggestions Delay: <span className="font-normal text-muted-foreground">{aiPreferences.suggestionsDelay}ms</span></>}
          >
            <div className="py-1">
              <Slider
                id="suggestions-delay"
                min={500}
                max={3000}
                step={100}
                value={[aiPreferences.suggestionsDelay]}
                onValueChange={([value]) => updateAIPreferences({ suggestionsDelay: value })}
              />
            </div>
          </FormField>
        )}

        <FormField
          htmlFor="max-suggestions"
          label={<>Max Suggestions History: <span className="font-normal text-muted-foreground">{aiPreferences.maxSuggestionsHistory}</span></>}
        >
          <div className="py-1">
            <Slider
              id="max-suggestions"
              min={10}
              max={200}
              step={10}
              value={[aiPreferences.maxSuggestionsHistory]}
              onValueChange={([value]) => updateAIPreferences({ maxSuggestionsHistory: value })}
            />
          </div>
        </FormField>

        <div className="flex items-center gap-2">
          <Checkbox
            id="show-context"
            checked={aiPreferences.showContextInPrompt}
            onCheckedChange={(checked) => updateAIPreferences({ showContextInPrompt: checked as boolean })}
          />
          <Label htmlFor="show-context" className="cursor-pointer">Show context in prompt input</Label>
        </div>
      </div>

      <Separator />

      {/* Connection Test */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Connection Test</h3>
        <div className="flex items-center gap-3">
          <Button onClick={handleTestConnection} disabled={testing || !hasApiKey} size="sm">
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          {testResult === 'success' && <Badge variant="outline">Connected ✓</Badge>}
          {testResult === 'error' && <Badge variant="destructive" className="text-xs">Connection Failed</Badge>}
        </div>
      </div>

      <Separator />

      {/* Save / Cancel */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleCancel} disabled={!isDirty}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!isDirty}>
          Save
        </Button>
      </div>
    </div>
  )
}
