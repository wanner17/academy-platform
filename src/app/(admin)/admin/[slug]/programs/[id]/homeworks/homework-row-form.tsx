'use client'

import { useState, useTransition } from 'react'
import { bulkCreateHomeworksAction } from '../actions'

type Row = {
  id: number
  content: string
  isCompleted: boolean
}

type Props = {
  slug: string
  programId: string
  enrolledStudents: { id: string; name: string }[]
  today: string
}

export function HomeworkRowForm({ slug, programId, enrolledStudents, today }: Props) {
  const [rows, setRows] = useState<Row[]>([{ id: 1, content: '', isCompleted: false }])
  const [title, setTitle] = useState('')
  const [studentId, setStudentId] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [dueDate, setDueDate] = useState('')
  const [isVisible, setIsVisible] = useState(true)
  const [isPending, startTransition] = useTransition()

  function addRow() {
    setRows((prev) => [...prev, { id: Date.now(), content: '', isCompleted: false }])
  }

  function removeRow(id: number) {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  function updateRow(id: number, field: keyof Omit<Row, 'id'>, value: string | boolean) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }
    if (rows.some((r) => !r.content.trim())) {
      alert('모든 행에 내용을 입력해주세요.')
      return
    }
    if (!window.confirm('숙제를 저장할까요?')) return

    const bulkRows = rows.map((r) => ({
      studentId: studentId || undefined,
      title,
      content: r.content,
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      isCompleted: r.isCompleted,
      isVisible,
    }))

    startTransition(async () => {
      const fd = new FormData()
      fd.append('slug', slug)
      fd.append('programId', programId)
      fd.append('rows', JSON.stringify(bulkRows))
      await bulkCreateHomeworksAction(fd)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">대상 학생</span>
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          <option value="">전체 학생</option>
          {enrolledStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">제목</span>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">시작일</span>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">마감일</span>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isVisible}
          onChange={(e) => setIsVisible(e.target.checked)}
        />
        학생에게 공개
      </label>

      <div className="space-y-2">
        <span className="text-sm font-medium">내용 목록</span>
        {rows.map((row) => (
          <div key={row.id} className="space-y-1 rounded border bg-slate-50 p-3">
            <div className="flex items-center justify-end gap-3">
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={row.isCompleted}
                  onChange={(e) => updateRow(row.id, 'isCompleted', e.target.checked)}
                />
                완료
              </label>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              )}
            </div>
            <textarea
              className="min-h-16 w-full rounded border px-2 py-1.5 text-sm"
              placeholder="내용"
              value={row.content}
              onChange={(e) => updateRow(row.id, 'content', e.target.value)}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="w-full rounded border-2 border-dashed border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          style={{ color: '#1d4ed8', WebkitTextFillColor: '#1d4ed8' }}
        >
          + 행 추가
        </button>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {isPending ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
