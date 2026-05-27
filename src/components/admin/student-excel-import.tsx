'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = { slug: string }

type ImportResult = {
  success: number
  failed: number
  errors: string[]
}

export function StudentExcelImport({ slug }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function selectFile(file: File) {
    setSelectedFile(file)
    setFileName(file.name)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) selectFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = selectedFile ?? fileRef.current?.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`/api/admin/${slug}/students/import`, { method: 'POST', body: formData })
    const data: ImportResult = await res.json()
    setResult(data)
    setLoading(false)

    if (data.success > 0) router.refresh()
  }

  function handleClose() {
    setOpen(false)
    setResult(null)
    setFileName(null)
    setSelectedFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <button className="rounded border px-4 py-2 text-sm font-medium" onClick={() => setOpen(true)} type="button">
        엑셀 일괄 등록
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">엑셀 일괄 등록</h2>

            <div className="mb-4 rounded border bg-slate-50 p-3 text-sm text-slate-600">
              <p className="mb-1 font-medium">엑셀 파일 형식</p>
              <p className="mb-1">열 순서: 이름(필수) / 학교 / 학년 / 학생연락처 / 학부모연락처 / 메모 / 로그인이메일(필수) / 임시비밀번호</p>
              <p className="mb-2 text-slate-500">이메일이 기존 학생과 일치하면 수정, 없으면 신규 등록 (신규는 비밀번호 필수)</p>
              <a
                className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                download
                href={`/api/admin/${slug}/students/excel-sample`}
              >
                양식 다운로드
              </a>
            </div>

            <form onSubmit={handleSubmit}>
              <label
                className={`mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-sm transition-colors ${
                  isDragging ? 'border-blue-400 bg-blue-100' : fileName ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <svg className={`h-8 w-8 ${fileName || isDragging ? 'text-blue-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className={`font-medium ${fileName || isDragging ? 'text-blue-700' : 'text-slate-700'}`}>
                  {isDragging ? '여기에 놓으세요' : (fileName ?? '파일을 드래그하거나 클릭해서 선택')}
                </span>
                {!fileName && !isDragging && <span className="text-slate-400">.xlsx, .xls 파일만 가능</span>}
                <input
                  accept=".xlsx,.xls"
                  className="hidden"
                  ref={fileRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0]
                    if (file) selectFile(file)
                    e.currentTarget.value = ''
                  }}
                />
              </label>

              {result && (
                <div className="mb-4 rounded border p-3 text-sm">
                  <p className="font-medium">
                    등록 완료: {result.success}명 / 실패: {result.failed}명
                  </p>
                  {result.errors.length > 0 && (
                    <ul className="mt-2 list-inside list-disc text-red-600">
                      {result.errors.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button className="rounded border px-4 py-2 text-sm" onClick={handleClose} type="button">
                  닫기
                </button>
                <button
                  className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? '업로드 중...' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
