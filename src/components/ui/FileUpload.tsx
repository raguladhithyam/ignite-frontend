import { useState, useRef } from 'react'
import { Button } from './button'
import { Upload, File, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
}

export default function FileUpload({ 
  onFileSelect, 
  accept = '.xlsx,.xls', 
  maxSize = 5,
  className,
  disabled = false
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelection(files[0])
    }
  }

  const handleFileSelection = (file: File) => {
    // Validate file type
    const allowedTypes = accept.split(',').map(type => type.trim())
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      alert(`Please select a valid file type: ${accept}`)
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`)
      return
    }

    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0])
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const openFileDialog = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
      
      {selectedFile ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
            dragActive 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-300 hover:border-gray-400",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              Drop your Excel file here
            </p>
            <p className="text-sm text-gray-500">
              or{' '}
              <button
                type="button"
                onClick={openFileDialog}
                disabled={disabled}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                browse to upload
              </button>
            </p>
            <p className="text-xs text-gray-400">
              Supports: {accept} • Max size: {maxSize}MB
            </p>
          </div>
        </div>
      )}
    </div>
  )
}