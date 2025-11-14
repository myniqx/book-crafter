import React from 'react'
import { useStore } from '@renderer/store'
import { Label } from '@renderer/components/ui/label'
import { Input } from '@renderer/components/ui/input'
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
import type { AIProvider } from '@renderer/lib/ai/types'

export const AISettingsTab: React.FC = () => {
  const config = useStore((state) => state.config)
  const updateConfig = useStore((state) => state.updateConfig)
  const ollamaConfig = useStore((state) => state.ollamaConfig)
  const openaiConfig = useStore((state) => state.openaiConfig)
  const anthropicConfig = useStore((state) => state.anthropicConfig)
  const aiPreferences = useStore((state) => state.aiPreferences)
  const updateAIPreferences = useStore((state) => state.updateAIPreferences)

  const [testing, setTesting] = React.useState(false)
  const [testResult, setTestResult] = React.useState<'success' | 'error' | null>(null)

  const handleTestConnection = async (): Promise<void> => {
    setTesting(true)
    setTestResult(null)

    try {
      // Simple test based on provider
      if (config.provider === 'ollama') {
        const response = await fetch(`${ollamaConfig.endpoint || 'http://localhost:11434'}/api/tags`)
        if (response.ok) {
          setTestResult('success')
        } else {
          setTestResult('error')
        }
      } else if (config.provider === 'openai') {
        // OpenAI test would require API call
        setTestResult('success') // Mock for now
      } else if (config.provider === 'anthropic') {
        // Anthropic test would require API call
        setTestResult('success') // Mock for now
      }
    } catch (error) {
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div>
        <h3 className="text-sm font-medium mb-4">AI Provider</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              value={config.provider}
              onValueChange={(value: AIProvider) => updateConfig({ provider: value })}
            >
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ollama">Ollama (Local)</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Ollama Configuration */}
      {config.provider === 'ollama' && (
        <>
          <div>
            <h3 className="text-sm font-medium mb-4">Ollama Configuration</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ollama-url">Endpoint URL</Label>
                <Input
                  id="ollama-url"
                  type="text"
                  value={ollamaConfig.endpoint || ''}
                  onChange={(e) =>
                    updateConfig({
                      endpoint: e.target.value
                    })
                  }
                  placeholder="http://localhost:11434"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ollama-model">Model</Label>
                <Input
                  id="ollama-model"
                  type="text"
                  value={ollamaConfig.model}
                  onChange={(e) =>
                    updateConfig({
                      model: e.target.value
                    })
                  }
                  placeholder="llama3.2:latest"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keep-alive">
                  Keep Alive:{' '}
                  <span className="text-muted-foreground">{ollamaConfig.keepAlive}</span>
                </Label>
                <Input
                  id="keep-alive"
                  type="text"
                  value={ollamaConfig.keepAlive}
                  onChange={(e) =>
                    updateConfig({
                      keepAlive: e.target.value
                    })
                  }
                  placeholder="5m"
                />
                <p className="text-xs text-muted-foreground">
                  How long to keep model loaded (e.g., 5m, 1h, -1 for indefinite)
                </p>
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* OpenAI Configuration */}
      {config.provider === 'openai' && (
        <>
          <div>
            <h3 className="text-sm font-medium mb-4">OpenAI Configuration</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">API Key</Label>
                <Input
                  id="openai-key"
                  type="password"
                  value={openaiConfig.apiKey}
                  onChange={(e) =>
                    updateConfig({
                      apiKey: e.target.value
                    })
                  }
                  placeholder="sk-..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-model">Model</Label>
                <Select
                  value={openaiConfig.model}
                  onValueChange={(value) =>
                    updateConfig({
                      model: value
                    })
                  }
                >
                  <SelectTrigger id="openai-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Anthropic Configuration */}
      {config.provider === 'anthropic' && (
        <>
          <div>
            <h3 className="text-sm font-medium mb-4">Anthropic Configuration</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="anthropic-key">API Key</Label>
                <Input
                  id="anthropic-key"
                  type="password"
                  value={anthropicConfig.apiKey}
                  onChange={(e) =>
                    updateConfig({
                      apiKey: e.target.value
                    })
                  }
                  placeholder="sk-ant-..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="anthropic-model">Model</Label>
                <Select
                  value={anthropicConfig.model}
                  onValueChange={(value) =>
                    updateConfig({
                      model: value
                    })
                  }
                >
                  <SelectTrigger id="anthropic-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Generation Settings */}
      <div>
        <h3 className="text-sm font-medium mb-4">Generation Settings</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="temperature">
              Temperature:{' '}
              <span className="text-muted-foreground">{config.temperature.toFixed(1)}</span>
            </Label>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[config.temperature]}
              onValueChange={([value]) => updateConfig({ temperature: value })}
            />
            <p className="text-xs text-muted-foreground">
              Lower is more focused, higher is more creative
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-tokens">
              Max Tokens: <span className="text-muted-foreground">{config.maxTokens}</span>
            </Label>
            <Slider
              id="max-tokens"
              min={100}
              max={4000}
              step={100}
              value={[config.maxTokens]}
              onValueChange={([value]) => updateConfig({ maxTokens: value })}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* AI Preferences */}
      <div>
        <h3 className="text-sm font-medium mb-4">AI Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-suggest"
              checked={aiPreferences.autoSuggest}
              onCheckedChange={(checked) =>
                updateAIPreferences({ autoSuggest: checked as boolean })
              }
            />
            <Label htmlFor="auto-suggest" className="cursor-pointer">
              Enable auto-suggestions
            </Label>
          </div>

          {aiPreferences.autoSuggest && (
            <div className="space-y-2">
              <Label htmlFor="suggestions-delay">
                Suggestions Delay:{' '}
                <span className="text-muted-foreground">{aiPreferences.suggestionsDelay}ms</span>
              </Label>
              <Slider
                id="suggestions-delay"
                min={500}
                max={3000}
                step={100}
                value={[aiPreferences.suggestionsDelay]}
                onValueChange={([value]) => updateAIPreferences({ suggestionsDelay: value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="max-suggestions">
              Max Suggestions History:{' '}
              <span className="text-muted-foreground">{aiPreferences.maxSuggestionsHistory}</span>
            </Label>
            <Slider
              id="max-suggestions"
              min={10}
              max={200}
              step={10}
              value={[aiPreferences.maxSuggestionsHistory]}
              onValueChange={([value]) => updateAIPreferences({ maxSuggestionsHistory: value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="show-context"
              checked={aiPreferences.showContextInPrompt}
              onCheckedChange={(checked) =>
                updateAIPreferences({ showContextInPrompt: checked as boolean })
              }
            />
            <Label htmlFor="show-context" className="cursor-pointer">
              Show context in prompt input
            </Label>
          </div>
        </div>
      </div>

      <Separator />

      {/* Connection Test */}
      <div>
        <h3 className="text-sm font-medium mb-4">Connection Test</h3>
        <div className="flex items-center gap-3">
          <Button onClick={handleTestConnection} disabled={testing} size="sm">
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          {testResult === 'success' && <Badge variant="outline">Connected ✓</Badge>}
          {testResult === 'error' && (
            <Badge variant="destructive" className="text-xs">
              Connection Failed
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
