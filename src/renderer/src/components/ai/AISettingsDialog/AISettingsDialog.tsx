import React, { useState, useEffect } from 'react'
import { useToolsStore } from '@renderer/store'
import type { AIProvider, AIConfig } from '@renderer/lib/ai/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@renderer/components/ui/select'
import { Badge } from '@renderer/components/ui/badge'
import { Settings, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export const AISettingsDialog: React.FC = () => {
  const config = useToolsStore((state) => state.config)
  const updateConfig = useToolsStore((state) => state.updateConfig)
  const testConnection = useToolsStore((state) => state.testConnection)
  const listModels = useToolsStore((state) => state.listModels)

  // Local state for form
  const [provider, setProvider] = useState<AIProvider>(config.provider)
  const [model, setModel] = useState(config.model)
  const [endpoint, setEndpoint] = useState(config.endpoint || '')
  const [apiKey, setApiKey] = useState(config.apiKey || '')
  const [temperature, setTemperature] = useState(config.temperature)
  const [maxTokens, setMaxTokens] = useState(config.maxTokens)
  const [keepAlive, setKeepAlive] = useState(config.keepAlive || '5m')

  // Connection test state
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  // Available models state
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  // Reset form when config changes
  useEffect(() => {
    setProvider(config.provider)
    setModel(config.model)
    setEndpoint(config.endpoint || '')
    setApiKey(config.apiKey || '')
    setTemperature(config.temperature)
    setMaxTokens(config.maxTokens)
    setKeepAlive(config.keepAlive || '5m')
  }, [config])

  const handleSave = (): void => {
    const newConfig: Partial<AIConfig> = {
      provider,
      model,
      endpoint: endpoint || undefined,
      apiKey: apiKey || undefined,
      temperature,
      maxTokens,
      keepAlive: provider === 'ollama' ? keepAlive : undefined
    }

    updateConfig(newConfig)
  }

  const handleTestConnection = async (): Promise<void> => {
    setTesting(true)
    setTestResult(null)

    // Temporarily update config for testing
    const tempConfig: Partial<AIConfig> = {
      provider,
      model,
      endpoint: endpoint || undefined,
      apiKey: apiKey || undefined,
      temperature,
      maxTokens,
      keepAlive: provider === 'ollama' ? keepAlive : undefined
    }

    updateConfig(tempConfig)

    try {
      const result = await testConnection()
      setTestResult(result ? 'success' : 'error')
    } catch (error) {
      console.error('Connection test failed:', error)
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  const handleListModels = async (): Promise<void> => {
    setLoadingModels(true)

    // Temporarily update config for listing models
    const tempConfig: Partial<AIConfig> = {
      provider,
      endpoint: endpoint || undefined,
      apiKey: apiKey || undefined
    }

    updateConfig(tempConfig)

    try {
      const models = await listModels()
      setAvailableModels(models)
    } catch (error) {
      console.error('Failed to list models:', error)
      setAvailableModels([])
    } finally {
      setLoadingModels(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select value={provider} onValueChange={(value) => setProvider(value as AIProvider)}>
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ollama">Ollama (Local)</SelectItem>
                <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              {provider === 'ollama' && 'Run AI models locally with Ollama'}
              {provider === 'openai' && 'Use OpenAI\'s GPT models (requires API key)'}
              {provider === 'anthropic' && 'Use Anthropic\'s Claude models (requires API key)'}
            </p>
          </div>

          {/* Endpoint (for Ollama) */}
          {provider === 'ollama' && (
            <div className="space-y-2">
              <Label htmlFor="endpoint">Ollama Endpoint</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://localhost:11434"
              />
              <p className="text-xs text-slate-500">
                Default: http://localhost:11434
              </p>
            </div>
          )}

          {/* API Key (for OpenAI and Anthropic) */}
          {(provider === 'openai' || provider === 'anthropic') && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
              />
              <p className="text-xs text-slate-500">
                {provider === 'openai' && 'Get your API key from platform.openai.com'}
                {provider === 'anthropic' && 'Get your API key from console.anthropic.com'}
              </p>
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="model">Model</Label>
              {provider === 'ollama' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleListModels}
                  disabled={loadingModels}
                  className="h-7"
                >
                  {loadingModels ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'List Models'
                  )}
                </Button>
              )}
            </div>

            {availableModels.length > 0 ? (
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={
                  provider === 'ollama'
                    ? 'llama2, mistral, codellama...'
                    : provider === 'openai'
                      ? 'gpt-4, gpt-3.5-turbo...'
                      : 'claude-3-5-sonnet-20241022...'
                }
              />
            )}

            <p className="text-xs text-slate-500">
              {provider === 'ollama' && 'Run "ollama list" to see available models'}
              {provider === 'openai' && 'e.g., gpt-4, gpt-4-turbo, gpt-3.5-turbo'}
              {provider === 'anthropic' && 'e.g., claude-3-5-sonnet-20241022, claude-3-opus-20240229'}
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-sm text-slate-400">{temperature}</span>
            </div>
            <input
              id="temperature"
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-500">
              Lower = more focused, Higher = more creative
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
              min={1}
              max={100000}
            />
            <p className="text-xs text-slate-500">
              Maximum length of generated response
            </p>
          </div>

          {/* Keep Alive (Ollama only) */}
          {provider === 'ollama' && (
            <div className="space-y-2">
              <Label htmlFor="keepAlive">Keep Alive</Label>
              <Input
                id="keepAlive"
                value={keepAlive}
                onChange={(e) => setKeepAlive(e.target.value)}
                placeholder="5m"
              />
              <p className="text-xs text-slate-500">
                How long to keep model in memory (e.g., 5m, 1h, 30s)
              </p>
            </div>
          )}

          {/* Connection Test */}
          <div className="space-y-2">
            <Button
              onClick={handleTestConnection}
              disabled={testing}
              variant="outline"
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>

            {testResult && (
              <div className="flex items-center gap-2">
                {testResult === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">Connection successful!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-500">Connection failed. Check your settings.</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={handleSave}>Save Settings</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
