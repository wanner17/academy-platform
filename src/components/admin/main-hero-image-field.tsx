'use client'

import { useState } from 'react'
import { FileDropZone } from '@/components/admin/file-drop-zone'

type UploadedImage = {
  publicUrl: string
  uploadUrl: string
}

type MainHeroImageFieldProps = {
  imageUrl?: string | null
  slug: string
}

export function MainHeroImageField({ imageUrl = '', slug }: MainHeroImageFieldProps) {
  const [heroImageUrl, setHeroImageUrl] = useState(imageUrl ?? '')
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  return (
    <div className="rounded border bg-slate-50 p-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">메인 대표 사진 URL</span>
        <input
          className="w-full rounded border px-3 py-2"
          name="heroImageUrl"
          onChange={(event) => setHeroImageUrl(event.target.value)}
          placeholder="https://..."
          type="url"
          value={heroImageUrl}
        />
      </label>
      <FileDropZone
        className="mt-3"
        disabled={isUploading}
        onFiles={(files) => {
          const file = files[0]
          if (!file) return
          uploadHeroImage({ file, setHeroImageUrl, setIsUploading, setMessage, slug })
        }}
      >
        <label className="block cursor-pointer text-center text-sm font-medium text-slate-700">
          {isUploading ? '업로드 중' : '사진 드래그 또는 클릭 업로드'}
          <input
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (!file) return
              uploadHeroImage({ file, setHeroImageUrl, setIsUploading, setMessage, slug })
            }}
            type="file"
          />
        </label>
      </FileDropZone>
      {message ? <p className="mt-2 text-xs text-slate-500">{message}</p> : null}
      {heroImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="메인 대표 사진 미리보기" className="mt-4 h-72 w-full rounded object-cover" src={heroImageUrl} />
      ) : (
        <div className="mt-4 flex h-72 items-center justify-center rounded border border-dashed bg-white text-sm text-slate-400">
          메인 대표 사진 미리보기
        </div>
      )}
    </div>
  )
}

async function uploadHeroImage({
  file,
  setHeroImageUrl,
  setIsUploading,
  setMessage,
  slug,
}: {
  file: File
  setHeroImageUrl: (value: string) => void
  setIsUploading: (value: boolean) => void
  setMessage: (value: string) => void
  slug: string
}) {
  if (!file.type.startsWith('image/')) {
    setMessage('이미지 파일만 업로드 가능')
    return
  }

  setIsUploading(true)
  setMessage('')

  try {
    const presignResponse = await fetch(`/api/admin/${slug}/uploads/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        folder: 'main',
        size: file.size,
      }),
    })
    if (!presignResponse.ok) throw new Error(await readUploadError(presignResponse))
    const presigned = (await presignResponse.json()) as UploadedImage
    await uploadToStorage(presigned.uploadUrl, file)
    setHeroImageUrl(presigned.publicUrl)
    setMessage('사진 업로드 완료')
  } catch (error) {
    setMessage(error instanceof Error ? error.message : '사진 업로드 실패')
  } finally {
    setIsUploading(false)
  }
}

async function readUploadError(response: Response) {
  const body = await response.json().catch(() => null)
  return body?.error ?? '사진 업로드 실패'
}

function uploadToStorage(uploadUrl: string, file: File) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', uploadUrl)
    request.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve()
      else reject(new Error('사진 업로드 실패'))
    }
    request.onerror = () => reject(new Error('사진 업로드 실패'))
    request.send(file)
  })
}
