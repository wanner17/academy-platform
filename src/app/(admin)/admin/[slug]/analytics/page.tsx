import { prisma } from '@/lib/db/prisma'
import { requireMemberPage } from '@/lib/auth/server'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { schoolExamService } from '@/lib/services/school-exam.service'
import { KpiCards } from '@/components/admin/analytics/kpi-cards'
import { AtRiskTable, type AtRiskStudent } from '@/components/admin/analytics/at-risk-table'
import { ScoreTrendChart } from '@/components/admin/analytics/score-trend-chart'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ schoolName?: string; grade?: string }>
}
type ChartDataPoint = Record<string, string | number>

function periodLabel(year: number, semester: number) {
  return `${year}-${semester}학기`
}

export default async function AnalyticsPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { schoolName: filterSchool, grade: filterGrade } = await searchParams
  await requireMemberPage(slug)
  const academy = await getAcademyBySlug(slug)
  const academyId = academy.id

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // KPI
  const [totalStudents, newStudents, activeEnrollments, newEnrollments, endedEnrollments] =
    await Promise.all([
      prisma.student.count({ where: { academyId, isActive: true } }),
      prisma.student.count({ where: { academyId, createdAt: { gte: monthStart } } }),
      prisma.enrollment.count({ where: { academyId, status: 'ACTIVE' } }),
      prisma.enrollment.count({ where: { academyId, createdAt: { gte: monthStart } } }),
      prisma.enrollment.count({
        where: { academyId, status: 'ENDED', updatedAt: { gte: monthStart } },
      }),
    ])

  // At-risk: attendance (last 30 days)
  const recentAttendance = await prisma.attendanceRecord.findMany({
    where: { academyId, attendanceDate: { gte: thirtyDaysAgo } },
    select: { studentId: true, status: true },
  })

  const attendanceMap = new Map<string, { present: number; total: number }>()
  for (const r of recentAttendance) {
    const entry = attendanceMap.get(r.studentId) ?? { present: 0, total: 0 }
    entry.total++
    if (r.status === 'PRESENT' || r.status === 'LATE') entry.present++
    attendanceMap.set(r.studentId, entry)
  }

  // At-risk: school exam score drops (per subject, any subject with 3 consecutive drops)
  const allExamScores = await schoolExamService.getForAtRisk(academyId)

  // Group by studentId → subject → sorted scores (asc by year/semester)
  type ScoreEntry = { studentId: string; subject: string; score: number; examYear: number; semester: number }
  const examsByStudentSubject = new Map<string, Map<string, ScoreEntry[]>>()
  for (const e of allExamScores) {
    if (e.score == null) continue
    if (!examsByStudentSubject.has(e.studentId)) examsByStudentSubject.set(e.studentId, new Map())
    const subjectMap = examsByStudentSubject.get(e.studentId)!
    if (!subjectMap.has(e.subject)) subjectMap.set(e.subject, [])
    subjectMap.get(e.subject)!.push({ ...e, score: e.score })
  }

  const studentsWithScoreDrop = new Set<string>()
  for (const [studentId, subjectMap] of examsByStudentSubject) {
    for (const scores of subjectMap.values()) {
      const sorted = scores.sort((a, b) => a.examYear - b.examYear || a.semester - b.semester)
      if (sorted.length >= 3) {
        const last3 = sorted.slice(-3)
        if (last3[2].score < last3[1].score && last3[1].score < last3[0].score) {
          studentsWithScoreDrop.add(studentId)
        }
      }
    }
  }

  // Active students for at-risk list
  const students = await prisma.student.findMany({
    where: { academyId, isActive: true },
    select: { id: true, name: true, schoolName: true },
  })

  const atRiskStudents: AtRiskStudent[] = students
    .map((student) => {
      const att = attendanceMap.get(student.id)
      const attendanceRate = att && att.total >= 3 ? att.present / att.total : null
      const hasScoreDrop = studentsWithScoreDrop.has(student.id)

      // Collect recent scores across subjects for display
      const subjectMap = examsByStudentSubject.get(student.id)
      const recentScores: number[] = []
      if (subjectMap) {
        for (const scores of subjectMap.values()) {
          const sorted = scores.sort((a, b) => a.examYear - b.examYear || a.semester - b.semester)
          const last3 = sorted.slice(-3).map((s) => s.score)
          if (last3.length >= 3 && last3[2] < last3[1] && last3[1] < last3[0]) {
            recentScores.push(...last3)
            break
          }
        }
      }

      return {
        id: student.id,
        name: student.name,
        schoolName: student.schoolName ?? null,
        attendanceRate,
        hasScoreDrop,
        recentScores: recentScores.slice(0, 3),
      }
    })
    .filter((s) => (s.attendanceRate !== null && s.attendanceRate < 0.7) || s.hasScoreDrop)
    .sort((a, b) => (a.attendanceRate ?? 1) - (b.attendanceRate ?? 1))

  // School exam trend: average score per subject per semester
  const trendExams = await schoolExamService.getForTrend(academyId, sixMonthsAgo)

  // Unique schools + grades for filter UI
  const allSchools = [...new Set(trendExams.map((e) => e.student.schoolName).filter(Boolean))].sort() as string[]
  const allGrades = [...new Set(trendExams.map((e) => e.student.grade).filter(Boolean))].sort() as string[]

  // Apply filters
  const filtered = trendExams.filter((e) => {
    if (filterSchool && e.student.schoolName !== filterSchool) return false
    if (filterGrade && e.student.grade !== filterGrade) return false
    return true
  })

  const trendMap = new Map<string, Map<string, { sum: number; count: number }>>()
  const subjectCounts = new Map<string, number>()

  for (const exam of filtered) {
    if (exam.score == null) continue
    const period = periodLabel(exam.examYear, exam.semester)
    const subject = exam.subject
    subjectCounts.set(subject, (subjectCounts.get(subject) ?? 0) + 1)
    if (!trendMap.has(period)) trendMap.set(period, new Map())
    const pMap = trendMap.get(period)!
    const entry = pMap.get(subject) ?? { sum: 0, count: 0 }
    entry.sum += exam.score
    entry.count++
    pMap.set(subject, entry)
  }

  const topSubjects = [...subjectCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([subject]) => subject)

  const periods = [...trendMap.keys()].sort()

  const chartData: ChartDataPoint[] = periods.map((period) => {
    const entry: ChartDataPoint = { month: period }
    const pMap = trendMap.get(period)
    for (const subject of topSubjects) {
      const d = pMap?.get(subject)
      if (d && d.count > 0) entry[subject] = Math.round((d.sum / d.count) * 10) / 10
    }
    return entry
  })

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-bold">{academy.name} 분석</h1>

      <section className="mb-10">
        <h2 className="mb-4 text-base font-semibold text-slate-700">이번 달 현황</h2>
        <KpiCards
          totalStudents={totalStudents}
          newStudents={newStudents}
          activeEnrollments={activeEnrollments}
          newEnrollments={newEnrollments}
          endedEnrollments={endedEnrollments}
        />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-base font-semibold text-slate-700">
          관리 필요 학생
          <span className="ml-2 text-sm font-normal text-slate-400">
            출석률 70% 미만 또는 학교 시험 3회 연속 하락
          </span>
        </h2>
        <AtRiskTable students={atRiskStudents} />
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-700">
          과목별 학교 시험 평균 점수 추이
          <span className="ml-2 text-sm font-normal text-slate-400">최근 데이터 기준</span>
        </h2>
        <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">학교</span>
            <select
              className="rounded border px-3 py-1.5 text-sm"
              defaultValue={filterSchool ?? ''}
              name="schoolName"
            >
              <option value="">전체</option>
              {allSchools.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600">학년</span>
            <select
              className="rounded border px-3 py-1.5 text-sm"
              defaultValue={filterGrade ?? ''}
              name="grade"
            >
              <option value="">전체</option>
              {allGrades.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
          <button className="rounded bg-slate-700 px-3 py-1.5 text-sm font-medium text-white" type="submit">
            적용
          </button>
          {(filterSchool || filterGrade) && (
            <a className="rounded border px-3 py-1.5 text-sm text-slate-500" href={`/admin/${slug}/analytics`}>
              초기화
            </a>
          )}
        </form>
        <ScoreTrendChart data={chartData} programs={topSubjects} />
      </section>
    </main>
  )
}
