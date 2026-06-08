'use client'

import { useRef, useState, useTransition } from 'react'
import * as XLSX from 'xlsx'
import { bulkCreateTestResultsAction } from './actions'

type Category = { id: string; name: string; color: string }

type ParsedRow = {
  studentName: string
  testName: string
  score: string
  categoryName: string
  categoryId: string | null
  isPassed: boolean | null
  testedAt: string
  memo?: string
  isVisible: boolean
  error?: string
}

type Props = {
  slug: string
  programId: string
  enrolledStudentNames: string[]
  categories: Category[]
}

function normalizeScore(raw: string): string {
  if (!raw) return ''
  const numbers = raw.match(/\d+(?:\.\d+)?/g)
  if (!numbers || numbers.length === 0) return '0/0'
  if (numbers.length === 1) return numbers[0]
  return `${numbers[0]}/${numbers[1]}`
}

function parseIsPassed(val: string): boolean | null {
  const v = val.trim().toUpperCase()
  if (['PASS', 'P', '통과', 'Y'].includes(v)) return true
  if (['FAIL', 'F', '미통과', 'N'].includes(v)) return false
  return null
}

export function TestExcelUpload({ slug, programId, enrolledStudentNames, categories }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function processFile(file: File) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array', cellDates: true })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

      const parsed: ParsedRow[] = raw.map((r) => {
        const studentName = String(r['학생'] ?? '').trim()
        const testName = String(r['테스트명'] ?? '').trim()
        const rawScore = String(r['점수'] ?? '').trim()
        const score = normalizeScore(rawScore)
        const categoryName = String(r['구분'] ?? '').trim()
        const categoryId = categoryName
          ? (categories.find((c) => c.name === categoryName)?.id ?? null)
          : null
        const isPassed = parseIsPassed(String(r['P/F'] ?? ''))
        const testedAt = parseExcelDateTime(r['일시'])
        const memo = String(r['메모'] ?? '').trim() || undefined
        const isVisible = String(r['공개'] ?? '').trim().toUpperCase() !== 'N'

        let error: string | undefined
        if (!studentName) error = '학생 필수'
        else if (!enrolledStudentNames.includes(studentName)) error = `학생 없음: ${studentName}`
        else if (!testName) error = '테스트명 필수'
        else if (!score) error = '점수 필수'
        else if (!testedAt) error = '일시 필수'
        else if (categoryName && !categoryId) error = `구분 없음: ${categoryName}`

        return { studentName, testName, score, categoryName, categoryId, isPassed, testedAt: testedAt ?? '', memo, isVisible, error }
      })

      setRows(parsed)
    }
    reader.readAsArrayBuffer(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) processFile(file)
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragging(true) }
  function handleDragLeave(e: React.DragEvent) { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false) }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const hasErrors = rows.some((r) => r.error)
  const validRows = rows.filter((r) => !r.error)

  function handleSubmit() {
    if (validRows.length === 0) return
    startTransition(async () => {
      const fd = new FormData()
      fd.append('slug', slug)
      fd.append('programId', programId)
      fd.append('rows', JSON.stringify(validRows))
      await bulkCreateTestResultsAction(fd)
    })
  }

  function handleDownloadTemplate() {
    const catExample = categories[0]?.name ?? '단어 테스트'
    const ws = XLSX.utils.aoa_to_sheet([
      ['학생', '테스트명', '점수', '구분', 'P/F', '일시', '메모', '공개'],
      ['홍길동', '5월 문법 테스트', '85/100', catExample, 'pass', '2024-05-10 14:00', '', 'Y'],
      ['김철수', '5월 단어 시험', '18/20', catExample, 'fail', '2024-05-10 14:00', '재시험 예정', 'Y'],
    ])
    ws['!cols'] = [12, 18, 10, 14, 8, 18, 16, 6].map((w) => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '테스트')
    XLSX.writeFile(wb, '테스트_일괄등록_양식.xlsx')
  }

  return (
    <div className="rounded-lg border bg-white p-5">
      <h2 className="mb-3 font-semibold">엑셀 일괄 등록</h2>
      <div className="mb-4">
        <button className="mb-3 rounded border px-3 py-1.5 text-sm text-blue-700" onClick={handleDownloadTemplate} type="button">
          양식 다운로드
        </button>
        <p className="mb-2 text-xs text-slate-400">점수: 획득/만점 형식 (예: 85/100) · 구분: 등록된 구분명 · P/F: pass/fail</p>
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors ${
            isDragging ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-slate-300 bg-slate-50 text-slate-500 hover:border-slate-400'
          }`}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <span className="mb-1 text-base">{isDragging ? '여기에 놓으세요' : '파일을 드래그하거나 클릭해서 선택'}</span>
          <span className="text-xs text-slate-400">.xlsx, .xls 파일 지원</span>
          <input accept=".xlsx,.xls" className="hidden" onChange={handleInputChange} ref={fileRef} type="file" />
        </label>
      </div>

      {rows.length > 0 && (
        <>
          <p className="mb-2 text-sm text-slate-500">
            총 {rows.length}행 — 정상 {validRows.length}건
            {hasErrors ? `, 오류 ${rows.length - validRows.length}건` : ''}
          </p>
          <div className="mb-4 overflow-x-auto rounded border text-sm">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">학생</th>
                  <th className="px-3 py-2 text-left">테스트명</th>
                  <th className="px-3 py-2 text-left">점수</th>
                  <th className="px-3 py-2 text-left">구분</th>
                  <th className="px-3 py-2 text-left">P/F</th>
                  <th className="px-3 py-2 text-left">일시</th>
                  <th className="px-3 py-2 text-left">공개</th>
                  <th className="px-3 py-2 text-left">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row, i) => (
                  <tr className={row.error ? 'bg-red-50' : ''} key={i}>
                    <td className="px-3 py-2">{row.studentName || <span className="text-red-500">-</span>}</td>
                    <td className="px-3 py-2">{row.testName || <span className="text-red-500">-</span>}</td>
                    <td className="px-3 py-2">{row.score || <span className="text-red-500">-</span>}</td>
                    <td className="px-3 py-2">
                      {row.categoryName ? (
                        <span className="inline-flex items-center gap-1">
                          {row.categoryId ? (
                            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categories.find((c) => c.id === row.categoryId)?.color }} />
                          ) : null}
                          {row.categoryName}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {row.isPassed === true ? <span className="text-green-600">통과</span>
                        : row.isPassed === false ? <span className="text-red-600">미통과</span>
                        : '-'}
                    </td>
                    <td className="px-3 py-2">{row.testedAt || <span className="text-red-500">-</span>}</td>
                    <td className="px-3 py-2">{row.isVisible ? 'Y' : 'N'}</td>
                    <td className="px-3 py-2">
                      {row.error ? <span className="text-red-600">{row.error}</span> : <span className="text-green-600">정상</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={validRows.length === 0 || isPending}
            onClick={handleSubmit}
            type="button"
          >
            {isPending ? '등록 중...' : `${validRows.length}건 등록`}
          </button>
        </>
      )}
    </div>
  )
}

function parseExcelDateTime(val: unknown): string | undefined {
  if (!val) return undefined
  if (val instanceof Date) {
    const y = val.getFullYear()
    const mo = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    const h = String(val.getHours()).padStart(2, '0')
    const mi = String(val.getMinutes()).padStart(2, '0')
    return `${y}-${mo}-${d}T${h}:${mi}`
  }
  const s = String(val).trim().replace(/\//g, '-')
  if (/^\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}/.test(s)) return s.replace(' ', 'T').slice(0, 16)
  return undefined
}
