import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { requireMemberPage } from '@/lib/auth/server'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { programService } from '@/lib/services/program.service'
import { targetLevelLabels, programModeLabels } from '@/lib/program-labels'
import { StudentDetailModal, type StudentDetail } from './student-detail-modal'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function TeacherAnalyticsPage({ params }: PageProps) {
  const { slug } = await params
  const { academy, user } = await requireMemberPage(slug)

  if (isAcademyAdminRole(user.role)) redirect(`/admin/${slug}/analytics`)

  const programs = await programService.getTeacherPrograms(academy.id, user.id)
  const programIds = programs.map((p) => p.id)

  if (programIds.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-8 text-2xl font-bold">내 수업 분석</h1>
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-slate-500">
          배정된 수업이 없어 분석 데이터를 표시할 수 없습니다.
        </div>
      </main>
    )
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const mySubjects = [...new Set(programs.map((p) => p.subject).filter((s): s is string => !!s))]

  const enrollments = await prisma.enrollment.findMany({
    where: { programId: { in: programIds }, status: 'ACTIVE' },
    select: { programId: true, studentId: true, student: { select: { id: true, name: true, schoolName: true } } },
  })

  const studentIds = [...new Set(enrollments.map((e) => e.studentId))]

  const [attendanceRecords, testResults, homeworks, schoolExams] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { academyId: academy.id, studentId: { in: studentIds }, attendanceDate: { gte: thirtyDaysAgo } },
      select: { studentId: true, status: true },
    }),
    prisma.testResult.findMany({
      where: { academyId: academy.id, programId: { in: programIds } },
      select: { studentId: true, testName: true, score: true, testedAt: true },
      orderBy: { testedAt: 'desc' },
    }),
    prisma.homework.findMany({
      where: { academyId: academy.id, programId: { in: programIds } },
      select: { studentId: true, programId: true, isCompleted: true, title: true },
    }),
    prisma.schoolExamResult.findMany({
      where: { academyId: academy.id, studentId: { in: studentIds }, ...(mySubjects.length > 0 ? { subject: { in: mySubjects } } : {}) },
      select: { studentId: true, subject: true, score: true, grade: true, examYear: true, semester: true, examType: true },
      orderBy: [{ examYear: 'desc' }, { semester: 'desc' }],
    }),
  ])
  const attendanceMap = new Map<string, { present: number; total: number }>()
  for (const r of attendanceRecords) {
    if (!studentIds.includes(r.studentId)) continue
    const entry = attendanceMap.get(r.studentId) ?? { present: 0, total: 0 }
    entry.total++
    if (r.status === 'PRESENT' || r.status === 'LATE') entry.present++
    attendanceMap.set(r.studentId, entry)
  }

  // per-program stats
  const programStats = programs.map((program) => {
    const enrolled = enrollments.filter((e) => e.programId === program.id)
    const rates = enrolled
      .map((e) => {
        const att = attendanceMap.get(e.studentId)
        return att && att.total >= 3 ? att.present / att.total : null
      })
      .filter((r): r is number => r !== null)
    const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null
    return { program, count: enrolled.length, avgRate }
  })

  // KPIs
  const allRates = [...attendanceMap.values()]
    .filter((a) => a.total >= 3)
    .map((a) => a.present / a.total)
  const avgAttendance = allRates.length > 0 ? allRates.reduce((a, b) => a + b, 0) / allRates.length : null

  // unique students list (sorted by name)
  const uniqueStudents = enrollments
    .reduce<{ id: string; name: string; schoolName: string | null; programIds: string[] }[]>((acc, e) => {
      const existing = acc.find((s) => s.id === e.studentId)
      if (existing) {
        existing.programIds.push(e.programId)
      } else {
        acc.push({ id: e.studentId, name: e.student.name, schoolName: e.student.schoolName ?? null, programIds: [e.programId] })
      }
      return acc
    }, [])
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))

  // test results per student (latest 3)
  const testByStudent = new Map<string, typeof testResults>()
  for (const t of testResults) {
    const list = testByStudent.get(t.studentId) ?? []
    list.push(t)
    testByStudent.set(t.studentId, list)
  }

  // homework stats per student
  const homeworkStatByStudent = new Map<string, { total: number; completed: number }>()
  for (const student of uniqueStudents) {
    const relevant = homeworks.filter(
      (h) => h.studentId === student.id || (h.studentId === null && student.programIds.includes(h.programId)),
    )
    homeworkStatByStudent.set(student.id, {
      total: relevant.length,
      completed: relevant.filter((h) => h.isCompleted).length,
    })
  }

  // school exam per student
  const examByStudent = new Map<string, typeof schoolExams>()
  for (const e of schoolExams) {
    const list = examByStudent.get(e.studentId) ?? []
    list.push(e)
    examByStudent.set(e.studentId, list)
  }

  // build per-student detail objects (serialized for client component)
  const studentDetails: StudentDetail[] = uniqueStudents.map((student) => {
    const att = attendanceMap.get(student.id)
    const relevant = homeworks.filter(
      (h) => h.studentId === student.id || (h.studentId === null && student.programIds.includes(h.programId)),
    )
    return {
      id: student.id,
      name: student.name,
      schoolName: student.schoolName,
      attendance: att ?? null,
      tests: (testByStudent.get(student.id) ?? []).map((t) => ({
        testName: t.testName,
        score: t.score,
        testedAt: t.testedAt.toISOString(),
      })),
      homeworks: relevant.map((h) => ({ title: h.title, isCompleted: h.isCompleted })),
      schoolExams: (examByStudent.get(student.id) ?? []).map((e) => ({
        subject: e.subject,
        examType: e.examType,
        examYear: e.examYear,
        semester: e.semester,
        score: e.score,
        grade: e.grade,
      })),
    }
  })

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-bold">내 수업 분석</h1>

      {/* KPI */}
      <section className="mb-10">
        <h2 className="mb-4 text-base font-semibold text-slate-700">현황 요약</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-t-4 border-indigo-500 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">담당 수업</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {programs.length}<span className="ml-1 text-sm font-normal text-slate-500">개</span>
            </p>
          </div>
          <div className="rounded-xl border border-t-4 border-sky-500 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">담당 학생</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {studentIds.length}<span className="ml-1 text-sm font-normal text-slate-500">명</span>
            </p>
          </div>
          <div className="rounded-xl border border-t-4 border-emerald-500 bg-white p-5 shadow-sm">
            <p className="text-xs text-slate-500">평균 출석률 (최근 30일)</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {avgAttendance !== null ? Math.round(avgAttendance * 100) : '-'}
              <span className="ml-1 text-sm font-normal text-slate-500">{avgAttendance !== null ? '%' : '데이터 없음'}</span>
            </p>
          </div>
        </div>
      </section>

      {/* 수업별 현황 */}
      <section className="mb-10">
        <h2 className="mb-4 text-base font-semibold text-slate-700">수업별 현황</h2>
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">수업명</th>
                <th className="px-4 py-3 text-left font-medium">구분</th>
                <th className="px-4 py-3 text-right font-medium">수강 학생</th>
                <th className="px-4 py-3 text-right font-medium">평균 출석률</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {programStats.map(({ program, count, avgRate }) => (
                <tr key={program.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <a href={`/admin/${slug}/programs/${program.id}`} className="hover:underline">
                      {program.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {programModeLabels[program.mode]} · {targetLevelLabels[program.targetLevel]}
                    {program.subject ? ` · ${program.subject}` : ''}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{count}명</td>
                  <td className="px-4 py-3 text-right">
                    {avgRate !== null ? (
                      <span className={avgRate < 0.7 ? 'font-semibold text-red-600' : 'text-slate-700'}>
                        {Math.round(avgRate * 100)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 학생별 성적 현황 */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-slate-700">학생별 성적 현황</h2>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">학생</th>
                <th className="px-4 py-3 text-right font-medium">출석률</th>
                <th className="px-4 py-3 text-left font-medium">최근 테스트</th>
                <th className="px-4 py-3 text-center font-medium">숙제 완료</th>
                <th className="px-4 py-3 text-left font-medium">최근 학교 시험</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {studentDetails.map((student) => {
                const att = student.attendance
                const attendanceRate = att && att.total >= 3 ? att.present / att.total : null
                const recentTests = student.tests.slice(0, 3)
                const hwStat = { total: student.homeworks.length, completed: student.homeworks.filter((h) => h.isCompleted).length }
                const recentExams = student.schoolExams.slice(0, 3)

                return (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800">{student.name}</span>
                      {student.schoolName && (
                        <span className="ml-1.5 text-xs text-slate-400">{student.schoolName}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {attendanceRate !== null ? (
                        <span className={attendanceRate < 0.7 ? 'font-semibold text-red-600' : 'text-slate-700'}>
                          {Math.round(attendanceRate * 100)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {recentTests.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {recentTests.map((t, i) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                              <span className="text-slate-500">{t.testName}</span>
                              <span className="font-semibold">{t.score}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hwStat.total > 0 ? (
                        <span className={hwStat.completed / hwStat.total < 0.5 ? 'font-semibold text-amber-600' : 'text-slate-700'}>
                          {hwStat.completed}/{hwStat.total}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {recentExams.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {recentExams.map((e, i) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-800">
                              <span className="text-blue-500">{e.subject}</span>
                              <span className="font-semibold">
                                {e.score != null ? `${e.score}점` : e.grade != null ? `${e.grade}등급` : '-'}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StudentDetailModal student={student} slug={slug} />
                    </td>
                  </tr>
                )
              })}
              {studentDetails.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">수강 학생이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
