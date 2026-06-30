import { BaseAIProvider } from './base'
import type {
  AIConfig,
  AIRequestOptions,
  AIResponse,
  StreamCallbackExtended,
  ToolDefinition,
  ToolCall
} from './types'
import { parseResponseData, createStreamHandler, parseGeminiStream, buildNormalizedHistory } from './utils'

interface GeminiTextPart { text: string }
interface GeminiFunctionCallPart { functionCall: { name: string; args: Record<string, unknown> } }
interface GeminiFunctionResponsePart {
  functionResponse: { name: string; response: { content: string; isError?: boolean } }
}
type GeminiPart = GeminiTextPart | GeminiFunctionCallPart | GeminiFunctionResponsePart

interface GeminiContent {
  role: 'user' | 'model'
  parts: GeminiPart[]
}

interface GeminiTool {
  functionDeclarations: Array<{
    name: string
    description: string
    parameters: { type: 'object'; properties: Record<string, unknown>; required?: string[] }
  }>
}

export class GeminiProvider extends BaseAIProvider {
  constructor(config: AIConfig) {
    super(config, 'Google Gemini', 'gemini')
  }

  protected getApiUrl(): string {
    const model = this.config.model || 'gemini-1.5-flash'
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`
  }

  private getStreamApiUrl(): string {
    const model = this.config.model || 'gemini-1.5-flash'
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${this.config.apiKey}`
  }

  protected getHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json' }
  }

  // Gemini uses 'model' role instead of 'assistant', and parts[] instead of content string
  protected buildMessages(options: AIRequestOptions): GeminiContent[] {
    const history = buildNormalizedHistory(options)
    const contents: GeminiContent[] = []

    for (const msg of history) {
      if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
        const parts: GeminiPart[] = []
        if (msg.content) parts.push({ text: msg.content })
        msg.toolCalls.forEach((tc) =>
          parts.push({ functionCall: { name: tc.name, args: tc.arguments } })
        )
        contents.push({ role: 'model', parts })
      } else if (msg.role === 'tool_result' && msg.toolResult) {
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: msg.toolResult.toolCallId,
              response: { content: msg.toolResult.content, isError: msg.toolResult.isError }
            }
          }]
        })
      } else {
        const role = msg.role === 'assistant' ? 'model' : 'user'
        contents.push({ role, parts: [{ text: msg.content }] })
      }
    }

    return contents
  }

  // Gemini wraps tools in functionDeclarations array
  protected convertTools(tools: ToolDefinition[]): GeminiTool[] {
    return [{
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters.properties,
          required: tool.parameters.required
        }
      }))
    }]
  }

  protected parseToolCalls(responseData: unknown): ToolCall[] {
    const data = responseData as Record<string, unknown>
    const parts = (data.candidates as Array<{ content?: { parts?: GeminiPart[] } }>)?.[0]?.content?.parts
    if (!parts) return []

    return parts
      .filter((p): p is GeminiFunctionCallPart => 'functionCall' in p)
      .map((p) => ({
        id: `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: p.functionCall.name,
        arguments: p.functionCall.args
      }))
  }

  private buildRequestBody(options: AIRequestOptions): Record<string, unknown> {
    const systemPrompt = this.buildSystemPrompt(options)
    return {
      contents: this.buildMessages(options),
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens
      },
      ...(options.tools && options.tools.length > 0 ? { tools: this.convertTools(options.tools) } : {})
    }
  }

  async complete(options: AIRequestOptions): Promise<AIResponse> {
    try {
      this.validateCredentials()
      this.validateFetchAPI()

      const fetchResponse = await window.api.fetch.request(this.getApiUrl(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.buildRequestBody(options))
      })

      if (!fetchResponse.ok) {
        const errorData = parseResponseData(fetchResponse.data)
        const errMsg = (errorData as Record<string, unknown>)?.error as Record<string, unknown>
        throw new Error(
          (errMsg?.message as string) || `HTTP ${fetchResponse.status}: ${fetchResponse.statusText}`
        )
      }

      const data = parseResponseData(fetchResponse.data)
      const candidates = (data as Record<string, unknown>).candidates as Array<{
        content?: { parts?: GeminiPart[] }
        finishReason?: string
      }>

      const candidate = candidates?.[0]
      if (!candidate) throw new Error('No response from Gemini')

      let textContent = ''
      const toolCalls = this.parseToolCalls(data)

      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if ('text' in part) textContent += (part as GeminiTextPart).text
        }
      }

      const usage = (data as Record<string, unknown>).usageMetadata as Record<string, number>

      let finishReason: 'stop' | 'length' | 'error' | 'tool_use' = 'stop'
      if (candidate.finishReason === 'MAX_TOKENS') finishReason = 'length'
      else if (toolCalls.length > 0) finishReason = 'tool_use'

      return {
        content: textContent,
        finishReason,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          promptTokens: usage?.promptTokenCount || 0,
          completionTokens: usage?.candidatesTokenCount || 0,
          totalTokens: usage?.totalTokenCount || 0
        }
      }
    } catch (error) {
      throw this.wrapError(error, 'completion')
    }
  }

  async streamCompleteExtended(
    options: AIRequestOptions,
    callback: StreamCallbackExtended
  ): Promise<void> {
    try {
      this.validateCredentials()
      this.validateFetchAPI(true)

      const streamHandler = createStreamHandler(
        (chunk) => parseGeminiStream(chunk),
        callback
      )

      await window.api.fetch.stream(this.getStreamApiUrl(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(this.buildRequestBody(options)),
        ...streamHandler
      })
    } catch (error) {
      callback({ type: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
      throw this.wrapError(error, 'streaming')
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config.apiKey) return false
    try {
      const result = await this.complete({ prompt: 'Hi', context: undefined })
      return !!result.content
    } catch {
      return false
    }
  }

  protected async fetchModels(): Promise<string[]> {
    if (!this.config.apiKey) return []
    try {
      this.validateFetchAPI()
      const fetchResponse = await window.api.fetch.request(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.apiKey}`,
        { method: 'GET', headers: this.getHeaders() }
      )
      if (!fetchResponse.ok) return []
      const data = parseResponseData(fetchResponse.data)
      const models = (data as Record<string, unknown>).models as Array<{
        name: string
        supportedGenerationMethods?: string[]
      }>
      return Array.isArray(models)
        ? models
            .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m) => m.name.replace('models/', ''))
            .sort()
        : []
    } catch {
      return []
    }
  }
}
