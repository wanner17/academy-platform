'use client'

import { useState } from 'react'
import { TestCategoryTrendChart } from './test-category-trend-chart'

type ChartResult = {
  studentId: string
  testedAt: string
  score: string
  testName: string
  category: { id: string; name: string; color: string } | null
}

type Props = {
  students: { id: string; name: string }[]
  categories: { id: string; name: string; color: string }[]
  results: ChartResult[]
}

export function TestChartSection({ students, categories, results }: Props) {
  const [studentId, setStudentId] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const student = students.find((s) => s.id === studentId)

  const filtered = results.filter((r) => {
    if (!studentId || r.studentId !== studentId) return false
    if (categoryId && r.category?.id !== categoryId) return false
    return true
  })

  const chartResults = filtered.map((r) => ({
    testedAt: new Date(r.testedAt),
    score: r.score,
    testName: r.testName,
    category: r.category,
  }))

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-base font-semibold text-slate-700">점수 추이 그래프</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          className="rounded border px-3 py-2 text-sm"
          onChange={(e) => { setStudentId(e.target.value); setCategoryId('') }}
          value={studentId}
        >
          <option value="">학생 선택</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          className="rounded border px-3 py-2 text-sm"
          disabled={!studentId}
          onChange={(e) => setCategoryId(e.target.value)}
          value={categoryId}
        >
          <option value="">전체 구분</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      {student ? (
        <TestCategoryTrendChart results={chartResults} studentName={student.name} />
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
          학생을 선택하면 점수 추이를 볼 수 있습니다.
        </div>
      )}
    </div>
  )
}
