export type AtRiskStudent = {
  id: string
  name: string
  schoolName: string | null
  attendanceRate: number | null
  hasScoreDrop: boolean
  recentScores: number[]
}

export function AtRiskTable({ students }: { students: AtRiskStudent[] }) {
  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        관리 필요 학생 없음
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[620px] text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left font-medium">학생</th>
            <th className="px-4 py-3 text-center font-medium">출석률 (30일)</th>
            <th className="px-4 py-3 text-center font-medium">최근 3회 성적</th>
            <th className="px-4 py-3 text-center font-medium">위험 요인</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {students.map((student) => {
            const attPct = student.attendanceRate !== null ? Math.round(student.attendanceRate * 100) : null
            const attRisk = attPct !== null && attPct < 70

            return (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{student.name}</p>
                  {student.schoolName && (
                    <p className="text-xs text-slate-400">{student.schoolName}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {attPct !== null ? (
                    <span className={`font-semibold ${attRisk ? 'text-rose-600' : 'text-slate-700'}`}>
                      {attPct}%
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center font-mono text-xs">
                  {student.recentScores.length > 0 ? (
                    <span className={student.hasScoreDrop ? 'text-rose-600' : 'text-slate-700'}>
                      {student.recentScores.join(' → ')}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex flex-wrap justify-center gap-1">
                    {attRisk && (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                        출석 저조
                      </span>
                    )}
                    {student.hasScoreDrop && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        성적 하락
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
