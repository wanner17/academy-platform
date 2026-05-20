'use client'

import { useState } from 'react'
import { FileDropZone } from '@/components/admin/file-drop-zone'
import { getVideoPreview, parseVideoUrls } from '@/lib/utils/video'

type UploadedMedia = {
  displayName: string
  publicUrl: string
  uploadUrl: string
}

type TeacherMediaFieldsProps = {
  imageUrl?: string | null
  videoUrls?: string | null
  slug: string
}

export function TeacherMediaFields({ imageUrl = '', videoUrls = '', slug }: TeacherMediaFieldsProps) {
  const [profileImageUrl, setProfileImageUrl] = useState(imageUrl ?? '')
  const [introVideoUrlItems, setIntroVideoUrlItems] = useState(() => {
    const parsed = parseVideoUrls(videoUrls)
    return parsed.length > 0 ? parsed : ['']
  })
  const [imageMessage, setImageMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const normalizedVideoUrls = introVideoUrlItems.map((url) => url.trim()).filter(Boolean)

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded border bg-slate-50 p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">프로필 사진 URL</span>
          <input
            className="w-full rounded border px-3 py-2"
            name="profileImageUrl"
            onChange={(event) => setProfileImageUrl(event.target.value)}
            placeholder="https://..."
            type="url"
            value={profileImageUrl}
          />
        </label>
        <FileDropZone
          className="mt-3"
          disabled={isUploading}
          onFiles={(files) => {
            const file = files[0]
            if (!file) return
            uploadProfileImage({ file, setIsUploading, setMessage: setImageMessage, setProfileImageUrl, slug })
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
                uploadProfileImage({ file, setIsUploading, setMessage: setImageMessage, setProfileImageUrl, slug })
              }}
              type="file"
            />
          </label>
        </FileDropZone>
        {imageMessage ? <p className="mt-2 text-xs text-slate-500">{imageMessage}</p> : null}
        {profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="프로필 사진 미리보기" className="mt-4 h-56 w-full rounded object-cover" src={profileImageUrl} />
        ) : (
          <div className="mt-4 flex h-56 items-center justify-center rounded border border-dashed bg-white text-sm text-slate-400">
            사진 미리보기
          </div>
        )}
      </div>

      <div className="rounded border bg-slate-50 p-4">
        <input name="introVideoUrls" type="hidden" value={normalizedVideoUrls.join('\n')} />
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium">강의 영상 URL</p>
          <button
            className="rounded border bg-white px-3 py-1 text-xs font-medium"
            onClick={() => setIntroVideoUrlItems((items) => [...items, ''])}
            type="button"
          >
            영상 추가
          </button>
        </div>
        <div className="grid gap-3">
          {introVideoUrlItems.map((url, index) => {
            const videoPreview = getVideoPreview(url)
            return (
              <div className="rounded border bg-white p-3" key={index}>
                <div className="flex gap-2">
                  <input
                    className="w-full rounded border px-3 py-2"
                    onChange={(event) => {
                      const next = [...introVideoUrlItems]
                      next[index] = event.target.value
                      setIntroVideoUrlItems(next)
                    }}
                    placeholder="YouTube, Vimeo, mp4 URL"
                    type="url"
                    value={url}
                  />
                  <button
                    className="rounded border px-3 text-sm"
                    onClick={() => setIntroVideoUrlItems((items) => (items.length === 1 ? [''] : items.filter((_, itemIndex) => itemIndex !== index)))}
                    type="button"
                  >
                    삭제
                  </button>
                </div>
                <div className="mt-3">
                  {videoPreview?.kind === 'embed' ? (
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="aspect-video w-full rounded border bg-black"
                      src={videoPreview.src}
                      title={`강의 영상 미리보기 ${index + 1}`}
                    />
                  ) : videoPreview?.kind === 'file' ? (
                    <video className="aspect-video w-full rounded border bg-black" controls src={videoPreview.src} />
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded border border-dashed bg-white text-sm text-slate-400">
                      영상 미리보기
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

async function uploadProfileImage({
  file,
  setIsUploading,
  setMessage,
  setProfileImageUrl,
  slug,
}: {
  file: File
  setIsUploading: (value: boolean) => void
  setMessage: (value: string) => void
  setProfileImageUrl: (value: string) => void
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
        folder: 'teachers',
        size: file.size,
      }),
    })
    if (!presignResponse.ok) throw new Error(await readUploadError(presignResponse))
    const presigned = (await presignResponse.json()) as UploadedMedia
    await uploadToStorage(presigned.uploadUrl, file)
    setProfileImageUrl(presigned.publicUrl)
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
