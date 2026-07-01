import type { AIRequestOptions, ToolDefinition } from '../types'

/**
 * Normalized message format — provider-agnostic internal representation
 */
export interface NormalizedMessage {
  role: 'system' | 'user' | 'assistant' | 'tool_result'
  content: string
  toolCalls?: Array<{ id: string; name: string; arguments: Record<string, unknown> }>
  toolResult?: { toolCallId: string; content: string; isError?: boolean }
}

/**
 * Shared history + prompt builder. All providers call this, then map to their own format.
 */
export function buildNormalizedHistory(options: AIRequestOptions): NormalizedMessage[] {
  const messages: NormalizedMessage[] = []

  if (options.context?.conversationHistory) {
    for (const msg of options.context.conversationHistory) {
      if (msg.role === 'system') continue

      if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: msg.content || '',
          toolCalls: msg.toolCalls
        })
      } else if (msg.role === 'tool_result' && msg.toolResult) {
        messages.push({
          role: 'tool_result',
          content: msg.toolResult.content,
          toolResult: msg.toolResult
        })
      } else {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })
      }
    }
  }

  messages.push({ role: 'user', content: options.prompt })

  return messages
}

/**
 * OpenAI-compatible tool format — used by OpenAI and Ollama
 */
export interface OpenAITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, unknown>
      required?: string[]
    }
  }
}

export function toOpenAITools(tools: ToolDefinition[]): OpenAITool[] {
  return tools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.properties,
        required: tool.parameters.required
      }
    }
  }))
}
