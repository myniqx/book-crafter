import type { AIRequestOptions, ToolCall, ToolDefinition } from '../types'

/**
 * Normalized message format — provider-agnostic internal representation
 */
export interface NormalizedMessage {
  role: 'system' | 'user' | 'assistant' | 'tool_result'
  content: string
  toolCalls?: ToolCall[]
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

  // In agentic follow-up iterations the prompt is empty — the model continues
  // from tool results already in the history. An empty trailing user message
  // is malformed for Anthropic and noise for other providers.
  if (options.prompt) {
    messages.push({ role: 'user', content: options.prompt })
  }

  return messages
}

/**
 * Take the most recent `count` messages without splitting a tool_use/tool_result
 * pair. A truncation window that starts with a tool_result would reference a
 * tool_use the model can no longer see — a hard API error on Anthropic.
 * The window start is extended backwards until it no longer lands on a tool_result.
 */
export function takeRecentMessages<T extends { role: string }>(messages: T[], count: number): T[] {
  if (messages.length <= count) return messages

  let start = messages.length - count
  while (start > 0 && messages[start].role === 'tool_result') {
    start--
  }

  return messages.slice(start)
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
