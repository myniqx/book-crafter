/**
 * Stream handling utilities for AI providers
 */

import type { StreamCallbackExtended, ToolCall } from '../types'

/**
 * Parsed stream event from provider response
 */
export interface ParsedStreamEvent {
  type: 'text' | 'tool_call_start' | 'tool_call_delta' | 'tool_call_end' | 'done' | 'error'
  content?: string
  toolCall?: Partial<ToolCall>
  id?: string
  arguments?: string
  finishReason?: 'stop' | 'length' | 'error' | 'tool_use'
  error?: string
  done?: boolean
}

/**
 * Stream chunk parser function type
 */
export type StreamChunkParser = (chunk: string) => ParsedStreamEvent[]

/**
 * Create stream handler with common error handling
 */
export function createStreamHandler(
  parser: StreamChunkParser,
  callback: StreamCallbackExtended
): {
  onChunk: (chunk: string) => void
  onError: (error: Error) => void
  onComplete: () => void
} {
  return {
    onChunk: (chunk: string) => {
      try {
        const events = parser(chunk)
        events.forEach((event) => {
          callback(event as Parameters<StreamCallbackExtended>[0])
        })
      } catch (error) {
        console.error('Failed to parse stream chunk:', error)
        callback({
          type: 'error',
          error: error instanceof Error ? error.message : 'Parse error'
        })
      }
    },
    onError: (error: Error) => {
      console.error('Stream error:', error)
      callback({ type: 'error', error: error.message })
    },
    onComplete: () => {
      // Stream completed - no action needed
    }
  }
}

/**
 * Parse Ollama stream chunks (newline-delimited JSON)
 */
export function parseOllamaStream(chunk: string, hasTools: boolean = false): ParsedStreamEvent[] {
  const events: ParsedStreamEvent[] = []
  const lines = chunk.split('\n').filter((line) => line.trim())

  for (const line of lines) {
    try {
      const data = JSON.parse(line)

      // Handle chat response format (with tools)
      if (hasTools && data.message) {
        if (data.message.content) {
          events.push({ type: 'text', content: data.message.content, done: false })
        }

        // Handle tool calls in streaming (if supported)
        if (data.message.tool_calls && data.done) {
          for (const tc of data.message.tool_calls) {
            const toolCall: ToolCall = {
              id: `ollama-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              name: tc.function.name,
              arguments: tc.function.arguments || {}
            }
            events.push({
              type: 'tool_call_start',
              toolCall: { id: toolCall.id, name: toolCall.name }
            })
            events.push({ type: 'tool_call_end', toolCall })
          }
          events.push({ type: 'done', finishReason: 'tool_use' })
        } else if (data.done) {
          events.push({ type: 'done', finishReason: 'stop' })
        }
      } else {
        // Handle generate response format (no tools)
        if (data.response) {
          events.push({ type: 'text', content: data.response, done: false })
        }
        if (data.done) {
          events.push({ type: 'done', finishReason: 'stop' })
        }
      }
    } catch (error) {
      console.error('Failed to parse Ollama chunk:', error)
    }
  }

  return events
}

/**
 * Parse OpenAI stream chunks (Server-Sent Events)
 */
export function parseOpenAIStream(
  chunk: string,
  toolCallsInProgress: Map<number, { id: string; name: string; arguments: string }>
): ParsedStreamEvent[] {
  const events: ParsedStreamEvent[] = []
  const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data:'))

  lines.forEach((line) => {
    const data = line.replace(/^data:\s*/, '').trim()

    if (data === '[DONE]') {
      events.push({ type: 'done', finishReason: 'stop' })
      return
    }

    try {
      const parsed = JSON.parse(data)
      const choice = parsed.choices?.[0]
      const delta = choice?.delta

      // Text content
      if (delta?.content) {
        events.push({ type: 'text', content: delta.content, done: false })
      }

      // Tool calls
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const index = tc.index

          if (tc.id) {
            // New tool call
            toolCallsInProgress.set(index, {
              id: tc.id,
              name: tc.function?.name || '',
              arguments: tc.function?.arguments || ''
            })
            events.push({
              type: 'tool_call_start',
              toolCall: {
                id: tc.id,
                name: tc.function?.name
              }
            })
          } else if (toolCallsInProgress.has(index)) {
            // Continue building tool call
            const existing = toolCallsInProgress.get(index)!
            if (tc.function?.name) {
              existing.name += tc.function.name
            }
            if (tc.function?.arguments) {
              existing.arguments += tc.function.arguments
              events.push({
                type: 'tool_call_delta',
                id: existing.id,
                arguments: tc.function.arguments
              })
            }
          }
        }
      }

      // Finish reason
      if (choice?.finish_reason) {
        // Emit completed tool calls
        for (const [, tc] of toolCallsInProgress) {
          let parsedArgs: Record<string, unknown> = {}
          try {
            parsedArgs = JSON.parse(tc.arguments || '{}')
          } catch {
            // Invalid JSON
          }
          events.push({
            type: 'tool_call_end',
            toolCall: {
              id: tc.id,
              name: tc.name,
              arguments: parsedArgs
            }
          })
        }

        events.push({
          type: 'done',
          finishReason: choice.finish_reason === 'tool_calls' ? 'tool_use' : 'stop'
        })
      }
    } catch (error) {
      console.error('Failed to parse OpenAI chunk:', error)
    }
  })

  return events
}

/**
 * Parse Anthropic stream chunks (Server-Sent Events)
 */
export function parseAnthropicStream(
  chunk: string,
  currentTool: { id: string; name: string; input: string }
): ParsedStreamEvent[] {
  const events: ParsedStreamEvent[] = []
  const lines = chunk.split('\n')

  lines.forEach((line) => {
    if (line.startsWith('data:')) {
      const data = line.replace(/^data:\s*/, '').trim()

      try {
        const parsed = JSON.parse(data)

        // Content block start
        if (parsed.type === 'content_block_start') {
          if (parsed.content_block?.type === 'tool_use') {
            currentTool.id = parsed.content_block.id
            currentTool.name = parsed.content_block.name
            currentTool.input = ''
            events.push({
              type: 'tool_call_start',
              toolCall: {
                id: currentTool.id,
                name: currentTool.name
              }
            })
          }
        }

        // Content block delta
        if (parsed.type === 'content_block_delta') {
          if (parsed.delta?.type === 'text_delta' && parsed.delta?.text) {
            events.push({ type: 'text', content: parsed.delta.text, done: false })
          } else if (parsed.delta?.type === 'input_json_delta' && parsed.delta?.partial_json) {
            currentTool.input += parsed.delta.partial_json
            events.push({
              type: 'tool_call_delta',
              id: currentTool.id,
              arguments: parsed.delta.partial_json
            })
          }
        }

        // Content block stop
        if (parsed.type === 'content_block_stop') {
          if (currentTool.id && currentTool.name) {
            let parsedArgs: Record<string, unknown> = {}
            try {
              parsedArgs = JSON.parse(currentTool.input || '{}')
            } catch {
              // Invalid JSON, use empty object
            }
            const toolCall: ToolCall = {
              id: currentTool.id,
              name: currentTool.name,
              arguments: parsedArgs
            }
            events.push({ type: 'tool_call_end', toolCall })
            currentTool.id = ''
            currentTool.name = ''
            currentTool.input = ''
          }
        }

        // Message complete
        if (parsed.type === 'message_stop') {
          events.push({ type: 'done', finishReason: 'stop' })
        }

        // Message delta (for stop reason)
        if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
          events.push({
            type: 'done',
            finishReason: parsed.delta.stop_reason === 'tool_use' ? 'tool_use' : 'stop'
          })
        }
      } catch (error) {
        console.error('Failed to parse Anthropic chunk:', error)
      }
    }
  })

  return events
}
