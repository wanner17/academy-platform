'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899']

type ChartDataPoint = Record<string, string | number>

type ScoreTrendChartProps = {
  data: ChartDataPoint[]
  programs: string[]
}

export function ScoreTrendChart({ data, programs }: ScoreTrendChartProps) {
  if (programs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        시험 성적 데이터가 없습니다
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          {programs.map((program, i) => (
            <Line
              key={program}
              type="monotone"
              dataKey={program}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
