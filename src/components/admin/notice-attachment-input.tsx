'use client'

import { useState } from 'react'

type UploadedAttachment = {
  displayName: string
  objectKey: string
  publicUrl: string
  mimeType: string
  size: number
}

type NoticeAttachmentInputProps = {
  slug: string
}

export function NoticeAttachmentInput({ slug }: NoticeAttachmentInputProps) {
  const [uploaded, setUploaded] = useState<UploadedAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return
    setIsUploading(true)
    setError(null)
    setProgress(0)

    try {
      const nextUploaded: UploadedAttachment[] = []
      const fileList = Array.from(files)
      for (let index = 0; index < fileList.length; index += 1) {
        const file = fileList[index]
        const presignResponse = await fetch(`/api/admin/${slug}/uploads/presign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
          }),
        })

        if (!presignResponse.ok) throw new Error(await readError(presignResponse))
        const presigned = (await presignResponse.json()) as UploadedAttachment & { uploadUrl: string }

        await uploadToR2(presigned.uploadUrl, file, (fileProgress) => {
          setProgress(Math.round(((index + fileProgress / 100) / fileList.length) * 100))
        })

        nextUploaded.push({
          displayName: presigned.displayName,
          objectKey: presigned.objectKey,
          publicUrl: presigned.publicUrl,
          mimeType: presigned.mimeType,
          size: presigned.size,
        })
      }

      setUploaded((current) => [...current, ...nextUploaded])
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">이미지/첨부</span>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          disabled={isUploading}
          multiple
          onChange={(event) => uploadFiles(event.target.files)}
          type="file"
        />
      </label>
      <p className="text-xs text-slate-500">허용: jpg, png, webp, gif, pdf, docx, xlsx, pptx, hwp, hwpx, mp4, webm, mov</p>
      {isUploading ? (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded bg-slate-200">
            <div className="h-full bg-blue-700" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-slate-500">업로드 중... {progress}%</p>
        </div>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {uploaded.length > 0 ? (
        <ul className="space-y-1 text-sm text-slate-600">
          {uploaded.map((attachment) => (
            <li key={attachment.objectKey}>{attachment.displayName}</li>
          ))}
        </ul>
      ) : null}
      {uploaded.map((attachment) => (
        <div key={attachment.objectKey}>
          <input name="uploadedDisplayName" type="hidden" value={attachment.displayName} />
          <input name="uploadedObjectKey" type="hidden" value={attachment.objectKey} />
          <input name="uploadedPublicUrl" type="hidden" value={attachment.publicUrl} />
          <input name="uploadedMimeType" type="hidden" value={attachment.mimeType} />
          <input name="uploadedSize" type="hidden" value={attachment.size} />
        </div>
      ))}
    </div>
  )
}

async function readError(response: Response) {
  const body = await response.json().catch(() => null)
  return body?.error ?? 'Upload failed'
}

function uploadToR2(uploadUrl: string, file: File, onProgress: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', uploadUrl)
    request.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress((event.loaded / event.total) * 100)
      }
    }
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100)
        resolve()
      } else {
        reject(new Error('R2 upload failed'))
      }
    }
    request.onerror = () => reject(new Error('R2 upload failed'))
    request.send(file)
  })
}
