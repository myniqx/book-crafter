import type { ToolCategory, ToolDefinition } from '../../types'
import { fileTools } from './file-tools'
import { analysisTools } from './analysis-tools'
import { generationTools } from './generation-tools'
import { editingTools } from './editing-tools'

/**
 * All available tools
 */
export const allTools: ToolDefinition[] = [
  ...fileTools,
  ...analysisTools,
  ...generationTools,
  ...editingTools
]

/**
 * Tools grouped by category
 */
export const toolsByCategory: Record<ToolCategory, ToolDefinition[]> = {
  file: fileTools,
  analysis: analysisTools,
  generation: generationTools,
  editing: editingTools
}

/**
 * Get tool by name
 */
export function getToolByName(name: string): ToolDefinition | undefined {
  return allTools.find((tool) => tool.name === name)
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return toolsByCategory[category]
}

/**
 * Get tools that require approval
 */
export function getToolsRequiringApproval(): ToolDefinition[] {
  return allTools.filter((tool) => tool.requiresApproval)
}

/**
 * Get read-only tools (don't require approval)
 */
export function getReadOnlyTools(): ToolDefinition[] {
  return allTools.filter((tool) => !tool.requiresApproval)
}

/**
 * Filter tools by enabled list
 */
export function filterEnabledTools(enabledToolNames: string[]): ToolDefinition[] {
  if (enabledToolNames.length === 0) {
    return allTools // If empty, all tools are enabled
  }
  return allTools.filter((tool) => enabledToolNames.includes(tool.name))
}

/**
 * Get tool names grouped by category for UI
 */
export function getToolNamesGrouped(): Record<ToolCategory, string[]> {
  return {
    file: fileTools.map((t) => t.name),
    analysis: analysisTools.map((t) => t.name),
    generation: generationTools.map((t) => t.name),
    editing: editingTools.map((t) => t.name)
  }
}

// Re-export individual tool arrays
export { fileTools, analysisTools, generationTools, editingTools }
