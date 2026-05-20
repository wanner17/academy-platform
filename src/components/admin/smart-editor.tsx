'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

type SmartEditorProps = {
  defaultValue?: string | null
  minHeight?: number
  name: string
  required?: boolean
  slug: string
}

type NaverEditor = {
  exec(command: string, args?: unknown[]): void
}

type NaverEditorMap = NaverEditor[] & {
  getById?: Record<string, NaverEditor>
}

declare global {
  interface Window {
    nhn?: {
      husky?: {
        EZCreator?: {
          createInIFrame(options: {
            elPlaceHolder: string
            fCreator: string
            fOnAppLoad?: () => void
            htParams?: Record<string, unknown>
            oAppRef: NaverEditorMap
            sSkinURI: string
          }): void
        }
      }
    }
  }
}

let smartEditorScriptPromise: Promise<void> | null = null

type UploadedImage = {
  displayName: string
  mimeType: string
  objectKey: string
  publicUrl: string
  size: number
  uploadUrl: string
}

export function SmartEditor({ defaultValue = '', minHeight = 220, name, required = false, slug }: SmartEditorProps) {
  const reactId = useId()
  const textareaId = useMemo(() => `smarteditor-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`, [reactId])
  const editorsRef = useRef<NaverEditorMap>([] as NaverEditorMap)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isUploadingRef = useRef(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMessage, setUploadMessage] = useState('')

  const insertImageFile = useCallback(
    (file: File) => {
      uploadAndInsertImage({
        file,
        setIsUploading,
        setUploadMessage,
        slug,
        insertHtml: (html) => editorsRef.current.getById?.[textareaId]?.exec('PASTE_HTML', [html]),
      })
    },
    [slug, textareaId],
  )

  const openFilePicker = useCallback(() => {
    if (isUploadingRef.current) return
    fileInputRef.current?.click()
  }, [])

  useEffect(() => {
    isUploadingRef.current = isUploading
  }, [isUploading])

  useEffect(() => {
    let mounted = true
    loadSmartEditorScript().then(() => {
      if (!mounted || !window.nhn?.husky?.EZCreator) return
      window.nhn.husky.EZCreator.createInIFrame({
        oAppRef: editorsRef.current,
        elPlaceHolder: textareaId,
        sSkinURI: '/smarteditor2/SmartEditor2Skin.html',
        htParams: {
          bUseToolbar: true,
          bUseVerticalResizer: true,
          bUseModeChanger: true,
          fOnBeforeUnload: () => undefined,
          I18N_LOCALE: 'ko_KR',
        },
        fOnAppLoad: () => {
          editorsRef.current.getById?.[textareaId]?.exec('SET_IR', [defaultValue ?? ''])
          bindPhotoUploadButton(textareaId, openFilePicker)
        },
        fCreator: 'createSEditor2',
      })
    })

    return () => {
      mounted = false
    }
  }, [defaultValue, openFilePicker, textareaId])

  useEffect(() => {
    const textarea = document.getElementById(textareaId)
    const form = textarea?.closest('form')
    if (!form) return
    const sync = () => {
      editorsRef.current.getById?.[textareaId]?.exec('UPDATE_CONTENTS_FIELD', [])
    }
    form.addEventListener('submit', sync, true)
    return () => form.removeEventListener('submit', sync, true)
  }, [textareaId])

  return (
    <div
      className="smart-editor naver-smart-editor"
      onDragOver={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onDrop={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (isUploadingRef.current) return
        const file = Array.from(event.dataTransfer.files).find((item) => item.type.startsWith('image/'))
        if (!file) {
          setUploadMessage('이미지 파일만 삽입할 수 있습니다.')
          return
        }
        insertImageFile(file)
      }}
      style={{ minHeight }}
    >
      <input
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          insertImageFile(file)
        }}
        ref={fileInputRef}
        type="file"
      />
      <textarea
        defaultValue={defaultValue ?? ''}
        id={textareaId}
        name={name}
        required={required}
        style={{ minHeight, width: '100%' }}
      />
      {isUploading || uploadMessage ? (
        <p className="naver-smart-editor-status">{isUploading ? '사진 업로드 중' : uploadMessage}</p>
      ) : null}
    </div>
  )
}

function bindPhotoUploadButton(textareaId: string, onClick: () => void) {
  let attempts = 0
  const bind = () => {
    attempts += 1
    for (const iframe of Array.from(document.querySelectorAll('iframe'))) {
      const iframeDocument = iframe.contentDocument
      const button = iframeDocument?.querySelector<HTMLButtonElement>('.academy_smarteditor_photo')
      if (!button) continue
      if (button.dataset.academyUploadBound) return
      button.dataset.academyUploadBound = textareaId
      button.addEventListener('click', (event) => {
        event.preventDefault()
        onClick()
      })
      return
    }
    if (attempts < 20) window.setTimeout(bind, 100)
  }

  bind()
}

function loadSmartEditorScript() {
  if (window.nhn?.husky?.EZCreator) return Promise.resolve()
  if (smartEditorScriptPromise) return smartEditorScriptPromise

  smartEditorScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-smarteditor2="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('SmartEditor2 script load failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = '/smarteditor2/js/service/HuskyEZCreator.js'
    script.charset = 'utf-8'
    script.dataset.smarteditor2 = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('SmartEditor2 script load failed'))
    document.head.appendChild(script)
  })

  return smartEditorScriptPromise
}

async function uploadAndInsertImage({
  file,
  insertHtml,
  setIsUploading,
  setUploadMessage,
  slug,
}: {
  file: File
  insertHtml: (html: string) => void
  setIsUploading: (value: boolean) => void
  setUploadMessage: (value: string) => void
  slug: string
}) {
  if (!file.type.startsWith('image/')) {
    setUploadMessage('이미지 파일만 삽입할 수 있습니다.')
    return
  }

  setIsUploading(true)
  setUploadMessage('')

  try {
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
    const presigned = (await presignResponse.json()) as UploadedImage
    await uploadToStorage(presigned.uploadUrl, file)
    insertHtml(`<p><img src="${escapeHtmlAttribute(presigned.publicUrl)}" alt="${escapeHtmlAttribute(presigned.displayName)}" style="max-width:100%;height:auto;" /></p>`)
    setUploadMessage('사진 삽입 완료')
  } catch (error) {
    setUploadMessage(error instanceof Error ? error.message : '사진 업로드 실패')
  } finally {
    setIsUploading(false)
  }
}

async function readError(response: Response) {
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

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
