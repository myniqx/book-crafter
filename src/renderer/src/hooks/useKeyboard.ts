import { useEffect, useCallback } from 'react'
import { useStore } from '@renderer/store'

/**
 * Type for keyboard shortcut actions
 */
export type ShortcutAction = {
  id: string
  handler: () => void
  preventDefault?: boolean
  allowInInput?: boolean // Allow in input/textarea elements
}

/**
 * Check if element is an input field
 */
const isInputElement = (element: Element | null): boolean => {
  if (!element) return false
  const tagName = element.tagName.toLowerCase()
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    element.hasAttribute('contenteditable')
  )
}

/**
 * Parse keyboard event to shortcut string (e.g., "Ctrl+S")
 */
const eventToShortcut = (event: KeyboardEvent): string => {
  const parts: string[] = []

  if (event.ctrlKey || event.metaKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')

  // Don't add modifier keys themselves
  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
    parts.push(event.key.toUpperCase())
  }

  return parts.join('+')
}

/**
 * Global keyboard shortcuts hook
 * Handles all keyboard shortcuts defined in settings
 *
 * @param actions - Map of shortcut IDs to their handler functions
 *
 * @example
 * useKeyboard({
 *   save: {
 *     id: 'save',
 *     handler: () => console.log('Save'),
 *     allowInInput: false
 *   },
 *   toggleSidebar: {
 *     id: 'toggleSidebar',
 *     handler: () => toggleSidebar(),
 *     allowInInput: true
 *   }
 * })
 */
export const useKeyboard = (actions: Record<string, ShortcutAction>): void => {
  const keyboardShortcuts = useStore((state) => state.keyboardShortcuts)

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const shortcutPressed = eventToShortcut(event)
      const target = event.target as Element

      // Find matching shortcut from settings
      const matchedShortcut = keyboardShortcuts.find(
        (shortcut) => shortcut.currentBinding === shortcutPressed
      )

      if (!matchedShortcut) return

      // Find action handler
      const action = actions[matchedShortcut.id]
      if (!action) return

      // Check if we should skip this shortcut in input fields
      if (isInputElement(target) && !action.allowInInput) {
        return
      }

      // Prevent default behavior
      if (action.preventDefault !== false) {
        event.preventDefault()
        event.stopPropagation()
      }

      // Execute handler
      action.handler()
    },
    [keyboardShortcuts, actions]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * Hook for single keyboard shortcut
 *
 * @param shortcutId - The ID of the shortcut (from settings)
 * @param handler - The function to call when shortcut is pressed
 * @param options - Additional options
 *
 * @example
 * useShortcut('save', () => saveFile(), { allowInInput: false })
 */
export const useShortcut = (
  shortcutId: string,
  handler: () => void,
  options?: {
    allowInInput?: boolean
    preventDefault?: boolean
  }
): void => {
  useKeyboard({
    [shortcutId]: {
      id: shortcutId,
      handler,
      ...options
    }
  })
}
