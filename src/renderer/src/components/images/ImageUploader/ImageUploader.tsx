import React, { useRef, useState, DragEvent, ChangeEvent } from 'react'
import { useStore } from '@renderer/store'
import { validateImageFile, SUPPORTED_IMAGE_EXTENSIONS } from '@renderer/lib/image'
import { cn } from '@renderer/lib/utils'
import { Upload, FileImage, AlertCircle, CheckCircle } from 'lucide-react'
import type { ImageUploaderProps } from './types'
import { Button } from '@renderer/components/ui/button'
import { Alert, AlertDescription } from '@renderer/components/ui/alert'

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadComplete,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const workspacePath = useStore((state) => state.workspacePath)
  const uploadImage = useStore((state) => state.uploadImage)
  const uploadProgress = useStore((state) => state.uploadProgress)

  const handleFile = async (file: File): Promise<void> => {
    if (!workspacePath) {
      setError('No workspace selected')
      return
    }

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const slug = await uploadImage(workspacePath, file)
      setSuccess(`Image "${file.name}" uploaded successfully!`)
      onUploadComplete?.(slug)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>): Promise<void> => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await handleFile(files[0])
    }
  }

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files
    if (files && files.length > 0) {
      await handleFile(files[0])
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = (): void => {
    fileInputRef.current?.click()
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'border-2 border-dashed rounded-lg p-8 cursor-pointer',
          'transition-colors duration-200',
          isDragActive
            ? 'border-primary bg-primary/10'
            : 'border-outline-variant hover:border-outline hover:bg-surface-container/50'
        )}
      >
        {uploadProgress !== null ? (
          <div className="flex flex-col items-center gap-3">
            <FileImage className="h-12 w-12 text-primary animate-pulse" />
            <div className="w-48 h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-on-surface-variant">Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="h-12 w-12 text-outline" />
            <div className="text-center">
              <p className="text-sm font-medium text-on-surface">
                Drop image here or click to browse
              </p>
              <p className="text-xs text-outline mt-1">
                Supported: {SUPPORTED_IMAGE_EXTENSIONS.join(', ')} (Max 10MB)
              </p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_IMAGE_EXTENSIONS.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {success && (
        <Alert className="border-green-500 text-green-500">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
