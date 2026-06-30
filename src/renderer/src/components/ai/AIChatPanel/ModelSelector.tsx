import React, { useState, useEffect } from 'react'
import { useToolsStore } from '@renderer/store'
import type { ModelSelectorProps, ProviderModels } from './types'
import type { AIProvider } from '@renderer/lib/ai/types'
import { ChevronDown } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'

// Predefined models for each provider
const PROVIDER_MODELS: ProviderModels = {
  ollama: [], // Will be fetched dynamically
  openai: ['gpt-4-turbo', 'gpt-4', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
  gemini: ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ className }) => {
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)

  // Tools store state
  const activeProvider = useToolsStore((state) => state.activeProvider)
  const setActiveProvider = useToolsStore((state) => state.setActiveProvider)
  const providerConfigs = useToolsStore((state) => state.providerConfigs)
  const setProviderConfig = useToolsStore((state) => state.setProviderConfig)

  const config = providerConfigs[activeProvider]

  // Fetch Ollama models when provider is ollama
  useEffect(() => {
    const fetchOllamaModels = async (): Promise<void> => {
      if (activeProvider === 'ollama') {
        try {
          const endpoint = config.endpoint || 'http://localhost:11434'
          const response = await fetch(`${endpoint}/api/tags`)
          if (response.ok) {
            const data = await response.json()
            if (data.models && Array.isArray(data.models)) {
              setOllamaModels(data.models.map((m: { name: string }) => m.name))
            }
          }
        } catch (error) {
          console.error('Failed to fetch Ollama models:', error)
        }
      }
    }
    fetchOllamaModels()
  }, [activeProvider, config.endpoint])

  // Get available models for current provider
  const getAvailableModels = (): string[] => {
    if (activeProvider === 'ollama') {
      return ollamaModels
    }
    return PROVIDER_MODELS[activeProvider] || []
  }

  const handleProviderChange = (provider: AIProvider): void => {
    setActiveProvider(provider)
    setModelSelectorOpen(false)
  }

  const handleModelChange = (model: string): void => {
    setProviderConfig(activeProvider, { model })
    setModelSelectorOpen(false)
  }

  return (
    <Popover open={modelSelectorOpen} onOpenChange={setModelSelectorOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 text-xs gap-1 ${className || ''}`}
        >
          <ChevronDown className="h-3 w-3" />
          <span className="line-clamp-1">{activeProvider} / {config.model}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground">Provider</p>
          <div className="flex gap-1 mt-1">
            {(['ollama', 'openai', 'anthropic', 'gemini'] as AIProvider[]).map((provider) => (
              <Button
                key={provider}
                size="sm"
                variant={activeProvider === provider ? 'default' : 'outline'}
                className="h-6 text-xs capitalize"
                onClick={() => handleProviderChange(provider)}
              >
                {provider}
              </Button>
            ))}
          </div>
        </div>
        <ScrollArea className="h-48">
          <div className="p-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Models</p>
            {getAvailableModels().length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {activeProvider === 'ollama'
                  ? 'No models found. Is Ollama running?'
                  : 'No models available'}
              </p>
            ) : (
              <div className="space-y-1">
                {getAvailableModels().map((model) => (
                  <Button
                    key={model}
                    size="sm"
                    variant={config.model === model ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-7 text-xs font-mono"
                    onClick={() => handleModelChange(model)}
                  >
                    {model}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
