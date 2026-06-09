'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type TestResultForChart = {
  testedAt: Date
  score: string
  testName: string
  category: { id: string; name: string; color: string } | null
}

type TestCategoryTrendChartProps = {
  results: TestResultForChart[]
  studentName: string
}

function parseScorePercent(score: string): number | null {
  // "85/100" or "18/20" → percentage
  const fraction = score.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/)
  if (fraction) {
    const num = parseFloat(fraction[1])
    const denom = parseFloat(fraction[2])
    if (!denom) return null
    return Math.round((num / denom) * 1000) / 10
  }
  // "92" or "92점" → as-is (treat as out of 100)
  const simple = score.match(/(\d+(?:\.\d+)?)/)
  if (simple) {
    const n = parseFloat(simple[1])
    return isNaN(n) || n > 1000 ? null : n
  }
  return null
}

export function TestCategoryTrendChart({ results, studentName }: TestCategoryTrendChartProps) {
  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        {studentName}의 테스트 데이터가 없습니다.
      </div>
    )
  }

  const categoryMap = new Map<string, { name: string; color: string }>()
  for (const r of results) {
    const key = r.category?.id ?? '__none__'
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        name: r.category?.name ?? '미지정',
        color: r.category?.color ?? '#94a3b8',
      })
    }
  }

  const sorted = [...results].sort((a, b) => a.testedAt.getTime() - b.testedAt.getTime())

  const dataByDate = new Map<string, Record<string, number | string>>()
  const dateTimestamp = new Map<string, number>()
  for (const r of sorted) {
    const pct = parseScorePercent(r.score)
    if (pct === null) continue
    const dateKey = r.testedAt.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    const catKey = r.category?.id ?? '__none__'
    if (!dataByDate.has(dateKey)) {
      dataByDate.set(dateKey, { date: dateKey })
      dateTimestamp.set(dateKey, r.testedAt.getTime())
    }
    const pt = dataByDate.get(dateKey)!
    const prev = pt[catKey]
    pt[catKey] = typeof prev === 'number' ? Math.round((prev + pct) * 5) / 10 : pct
  }

  const chartData = Array.from(dataByDate.entries())
    .sort(([a], [b]) => (dateTimestamp.get(a) ?? 0) - (dateTimestamp.get(b) ?? 0))
    .map(([, data]) => data)
  const categories = Array.from(categoryMap.entries())

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-700">{studentName} — 구분별 점수 추이</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
            formatter={(value) => (value != null ? [`${value}%`] : ['-'])}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {categories.map(([catId, { name, color }]) => (
            <Line
              key={catId}
              connectNulls={false}
              dataKey={catId}
              dot={{ r: 4 }}
              name={name}
              stroke={color}
              strokeWidth={2}
              type="monotone"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
