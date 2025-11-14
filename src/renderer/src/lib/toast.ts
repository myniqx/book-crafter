import { toast as sonnerToast } from 'sonner'

/**
 * Toast notification utilities
 * Wrapper around sonner toast with consistent styling and behavior
 */

export const toast = {
  /**
   * Show a success toast
   */
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 3000
    })
  },

  /**
   * Show an error toast
   */
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 5000
    })
  },

  /**
   * Show an info toast
   */
  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 4000
    })
  },

  /**
   * Show a warning toast
   */
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 4000
    })
  },

  /**
   * Show a loading toast
   */
  loading: (message: string, description?: string) => {
    return sonnerToast.loading(message, {
      description
    })
  },

  /**
   * Show a promise toast (handles loading, success, error automatically)
   */
  promise: <T>(
    promise: Promise<T>,
    options: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, options)
  },

  /**
   * Show a toast with custom action button
   */
  action: (message: string, actionLabel: string, onClick: () => void, description?: string) => {
    sonnerToast(message, {
      description,
      action: {
        label: actionLabel,
        onClick
      },
      duration: 5000
    })
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  }
}

/**
 * Specific toast helpers for common operations
 */

export const fileToast = {
  saved: (fileName: string) => {
    toast.success('File saved', `${fileName} has been saved successfully`)
  },

  deleted: (fileName: string) => {
    toast.success('File deleted', `${fileName} has been deleted`)
  },

  created: (fileName: string) => {
    toast.success('File created', `${fileName} has been created`)
  },

  error: (fileName: string, error: string) => {
    toast.error('File operation failed', `${fileName}: ${error}`)
  }
}

export const entityToast = {
  created: (entityName: string) => {
    toast.success('Entity created', `"${entityName}" has been created`)
  },

  updated: (entityName: string) => {
    toast.success('Entity updated', `"${entityName}" has been updated`)
  },

  deleted: (entityName: string) => {
    toast.success('Entity deleted', `"${entityName}" has been removed`)
  },

  error: (operation: string, error: string) => {
    toast.error(`Entity ${operation} failed`, error)
  }
}

export const bookToast = {
  created: (bookTitle: string) => {
    toast.success('Book created', `"${bookTitle}" has been created`)
  },

  updated: (bookTitle: string) => {
    toast.success('Book updated', `"${bookTitle}" has been updated`)
  },

  deleted: (bookTitle: string) => {
    toast.success('Book deleted', `"${bookTitle}" has been removed`)
  },

  chapterCreated: (chapterTitle: string) => {
    toast.success('Chapter created', `"${chapterTitle}" has been added`)
  },

  chapterDeleted: (chapterTitle: string) => {
    toast.success('Chapter deleted', `"${chapterTitle}" has been removed`)
  },

  error: (operation: string, error: string) => {
    toast.error(`Book ${operation} failed`, error)
  }
}

export const noteToast = {
  created: () => {
    toast.success('Note created', 'New note has been created')
  },

  updated: () => {
    toast.success('Note updated', 'Note has been updated')
  },

  deleted: () => {
    toast.success('Note deleted', 'Note has been removed')
  },

  error: (operation: string, error: string) => {
    toast.error(`Note ${operation} failed`, error)
  }
}

export const imageToast = {
  uploaded: (fileName: string) => {
    toast.success('Image uploaded', `${fileName} has been uploaded`)
  },

  deleted: (fileName: string) => {
    toast.success('Image deleted', `${fileName} has been removed`)
  },

  error: (operation: string, error: string) => {
    toast.error(`Image ${operation} failed`, error)
  }
}

export const aiToast = {
  processing: () => {
    return toast.loading('AI is processing...', 'Please wait while we generate a response')
  },

  success: (action: string) => {
    toast.success('AI completed', `${action} completed successfully`)
  },

  error: (error: string) => {
    toast.error('AI request failed', error)
  },

  copied: () => {
    toast.success('Copied to clipboard', 'AI suggestion has been copied')
  }
}

export const settingsToast = {
  saved: () => {
    toast.success('Settings saved', 'Your preferences have been updated')
  },

  reset: () => {
    toast.success('Settings reset', 'All settings have been reset to defaults')
  },

  imported: () => {
    toast.success('Settings imported', 'Settings have been imported successfully')
  },

  exported: () => {
    toast.success('Settings exported', 'Settings have been exported to file')
  },

  error: (error: string) => {
    toast.error('Settings operation failed', error)
  }
}
