'use client'

import { type DragEvent, type ReactNode, useState } from 'react'

type FileDropZoneProps = {
  acceptLabel?: string
  children?: ReactNode
  className?: string
  disabled?: boolean
  multiple?: boolean
  onFiles: (files: File[]) => void
}

export function FileDropZone({ acceptLabel = '파일을 드래그하거나 클릭해서 업로드', children, className = '', disabled = false, multiple = false, onFiles }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    if (disabled) return
    const files = Array.from(event.dataTransfer.files)
    if (files.length === 0) return
    onFiles(multiple ? files : files.slice(0, 1))
  }

  return (
    <div
      className={[
        'rounded border border-dashed p-4 transition',
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      ].join(' ')}
      onDragEnter={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={(event) => {
        event.preventDefault()
        event.stopPropagation()
        setIsDragging(false)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onDrop={handleDrop}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      {children ?? <p className="text-center text-sm text-slate-500">{acceptLabel}</p>}
    </div>
  )
}
