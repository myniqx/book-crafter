/**
 * AI Provider utility functions
 */

export {
  handleAPIError,
  parseErrorResponse,
  parseResponseData,
  extractErrorMessage
} from './errorHandler'

export {
  createStreamHandler,
  parseOllamaStream,
  parseOpenAIStream,
  parseAnthropicStream,
  parseGeminiStream,
  type ParsedStreamEvent,
  type StreamChunkParser
} from './streamHandler'

export {
  validateAPIKey,
  validateFetchAPI,
  validateEndpoint,
  validateModel,
  type AIProviderType,
  type ValidationResult
} from './validation'

export {
  getDefaultSystemPrompt,
  buildContextAwareSystemPrompt,
  buildContextPrompt,
  getProviderSpecificPrompt
} from './promptBuilder'

export {
  buildNormalizedHistory,
  takeRecentMessages,
  toOpenAITools,
  type NormalizedMessage,
  type OpenAITool
} from './messageBuilder'
