'use client'

import { useState } from 'react'
import { FileDropZone } from '@/components/admin/file-drop-zone'

type GalleryItem = {
  imageUrl: string
  isActive: boolean
  order: number
}

type UploadedImage = {
  publicUrl: string
  uploadUrl: string
}

type AcademyGalleryFieldsProps = {
  images: GalleryItem[]
  slug: string
}

export function AcademyGalleryFields({ images, slug }: AcademyGalleryFieldsProps) {
  const [items, setItems] = useState<GalleryItem[]>(images.map((image, index) => ({ ...image, order: index })))
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  return (
    <section className="rounded-lg border bg-white p-5">
      <div className="mb-4">
        <h2 className="text-xl font-bold">학원 소개 사진</h2>
        <p className="mt-1 text-sm text-slate-500">여러 장을 한 번에 드래그하거나 선택해 업로드하세요. 사진만 등록됩니다.</p>
      </div>

      <input name="galleryImages" type="hidden" value={JSON.stringify(items.map((item, index) => ({ imageUrl: item.imageUrl, isActive: true, order: index })))} />

      <FileDropZone
        className="mb-4"
        disabled={isUploading}
        multiple
        onFiles={(files) => uploadGalleryImages({ files, setIsUploading, setItems, setMessage, slug })}
      >
        <label className="block cursor-pointer text-center">
          <span className="block text-sm font-medium text-slate-700">
            {isUploading ? '업로드 중' : '사진 여러 장 드래그 또는 클릭 업로드'}
          </span>
          <span className="mt-1 block text-xs text-slate-500">jpg, png, webp, gif</span>
          <input
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={isUploading}
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? [])
              event.target.value = ''
              uploadGalleryImages({ files, setIsUploading, setItems, setMessage, slug })
            }}
            type="file"
          />
        </label>
      </FileDropZone>

      {message ? <p className="mb-3 rounded bg-slate-50 p-3 text-sm text-slate-600">{message}</p> : null}

      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <div className="rounded border bg-slate-50 p-3" key={`${item.imageUrl}-${index}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="학원 소개 사진" className="h-44 w-full rounded object-cover" src={item.imageUrl} />
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded border bg-white px-3 py-2 text-sm" disabled={index === 0} onClick={() => moveItem(setItems, index, -1)} type="button">
                  위로
                </button>
                <button className="rounded border bg-white px-3 py-2 text-sm" disabled={index === items.length - 1} onClick={() => moveItem(setItems, index, 1)} type="button">
                  아래로
                </button>
                <button className="rounded border border-red-200 bg-white px-3 py-2 text-sm text-red-700" onClick={() => removeItem(setItems, index)} type="button">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-44 items-center justify-center rounded border border-dashed bg-slate-50 text-sm text-slate-400">
          등록된 사진 없음
        </div>
      )}
    </section>
  )
}

function moveItem(setItems: (updater: (items: GalleryItem[]) => GalleryItem[]) => void, index: number, direction: -1 | 1) {
  setItems((items) => {
    const next = [...items]
    const target = index + direction
    if (target < 0 || target >= next.length) return items
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })
}

function removeItem(setItems: (updater: (items: GalleryItem[]) => GalleryItem[]) => void, index: number) {
  setItems((items) => items.filter((_, itemIndex) => itemIndex !== index))
}

async function uploadGalleryImages({
  files,
  setIsUploading,
  setItems,
  setMessage,
  slug,
}: {
  files: File[]
  setIsUploading: (value: boolean) => void
  setItems: (updater: (items: GalleryItem[]) => GalleryItem[]) => void
  setMessage: (value: string) => void
  slug: string
}) {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))
  if (imageFiles.length === 0) {
    setMessage('이미지 파일만 업로드 가능')
    return
  }

  setIsUploading(true)
  setMessage('')

  try {
    const uploaded: GalleryItem[] = []
    for (const file of imageFiles) {
      const presigned = await createPresignedUpload(slug, file)
      await uploadToStorage(presigned.uploadUrl, file)
      uploaded.push({ imageUrl: presigned.publicUrl, isActive: true, order: 0 })
    }
    setItems((current) => [...current, ...uploaded].map((item, index) => ({ ...item, order: index })))
    setMessage(`${uploaded.length}장 업로드 완료`)
  } catch (error) {
    setMessage(error instanceof Error ? error.message : '사진 업로드 실패')
  } finally {
    setIsUploading(false)
  }
}

async function createPresignedUpload(slug: string, file: File) {
  const presignResponse = await fetch(`/api/admin/${slug}/uploads/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/octet-stream',
      folder: 'gallery',
      size: file.size,
    }),
  })
  if (!presignResponse.ok) throw new Error(await readUploadError(presignResponse))
  return (await presignResponse.json()) as UploadedImage
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
