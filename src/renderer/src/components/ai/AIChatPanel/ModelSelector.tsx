import React, { useState, useEffect } from 'react'
import { useToolsStore } from '@renderer/store'
import type { ModelSelectorProps } from './types'
import type { AIProvider } from '@renderer/lib/ai/types'
import { ChevronDown, Loader2 } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'

export const ModelSelector: React.FC<ModelSelectorProps> = ({ className }) => {
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)

  // Tools store state
  const activeProvider = useToolsStore((state) => state.activeProvider)
  const setActiveProvider = useToolsStore((state) => state.setActiveProvider)
  const providerConfigs = useToolsStore((state) => state.providerConfigs)
  const setProviderConfig = useToolsStore((state) => state.setProviderConfig)
  const listModels = useToolsStore((state) => state.listModels)

  const config = providerConfigs[activeProvider]

  // Fetch models from the provider whenever provider/popover changes
  useEffect(() => {
    if (!modelSelectorOpen) return

    let cancelled = false
    const fetchModels = async (): Promise<void> => {
      setLoadingModels(true)
      try {
        const models = await listModels()
        if (!cancelled) setAvailableModels(models)
      } finally {
        if (!cancelled) setLoadingModels(false)
      }
    }
    fetchModels()

    return () => {
      cancelled = true
    }
  }, [activeProvider, modelSelectorOpen, listModels])

  const handleProviderChange = (provider: AIProvider): void => {
    setActiveProvider(provider)
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
            {loadingModels ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading models...
              </div>
            ) : availableModels.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No models available</p>
            ) : (
              <div className="space-y-1">
                {availableModels.map((model) => (
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
