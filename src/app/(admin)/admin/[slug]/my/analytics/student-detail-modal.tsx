'use client'

import { useState } from 'react'

export type StudentDetail = {
  id: string
  name: string
  schoolName: string | null
  attendance: { present: number; total: number } | null
  tests: { testName: string; score: string; testedAt: string }[]
  homeworks: { title: string; isCompleted: boolean }[]
  schoolExams: { subject: string; examType: string; examYear: number; semester: number; score: number | null; grade: number | null }[]
}

type Tab = 'attendance' | 'tests' | 'homeworks' | 'exams'

const TAB_LABELS: { key: Tab; label: string }[] = [
  { key: 'attendance', label: '출석' },
  { key: 'tests', label: '테스트' },
  { key: 'homeworks', label: '숙제' },
  { key: 'exams', label: '학교 시험' },
]

function AttendanceTab({ attendance }: { attendance: StudentDetail['attendance'] }) {
  if (!attendance || attendance.total === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">출석 데이터가 없습니다.</p>
  }
  const rate = attendance.present / attendance.total
  return (
    <div className="py-6">
      <div className="flex items-center gap-6">
        <div className="flex-1 rounded-xl border border-t-4 border-emerald-500 bg-slate-50 p-5">
          <p className="text-xs text-slate-500">출석률 (최근 30일)</p>
          <p className={`mt-2 text-4xl font-bold ${rate < 0.7 ? 'text-red-600' : 'text-slate-900'}`}>
            {Math.round(rate * 100)}%
          </p>
        </div>
        <div className="flex-1 rounded-xl border bg-slate-50 p-5">
          <p className="text-xs text-slate-500">출석 / 전체</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {attendance.present}
            <span className="text-slate-400"> / {attendance.total}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function TestsTab({ tests }: { tests: StudentDetail['tests'] }) {
  if (tests.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">테스트 기록이 없습니다.</p>
  }
  return (
    <table className="mt-2 w-full text-sm">
      <thead className="bg-slate-50 text-xs text-slate-500">
        <tr>
          <th className="px-4 py-2 text-left font-medium">테스트명</th>
          <th className="px-4 py-2 text-right font-medium">점수</th>
          <th className="px-4 py-2 text-right font-medium">날짜</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {tests.map((t, i) => (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-2.5 text-slate-800">{t.testName}</td>
            <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{t.score}</td>
            <td className="px-4 py-2.5 text-right text-slate-500">
              {new Date(t.testedAt).toLocaleDateString('ko-KR')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function HomeworksTab({ homeworks }: { homeworks: StudentDetail['homeworks'] }) {
  if (homeworks.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">숙제 기록이 없습니다.</p>
  }
  const completed = homeworks.filter((h) => h.isCompleted).length
  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        완료 <span className="font-semibold text-slate-800">{completed}</span> / {homeworks.length}건
      </p>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th className="px-4 py-2 text-left font-medium">제목</th>
            <th className="px-4 py-2 text-center font-medium">완료</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {homeworks.map((h, i) => (
            <tr key={i} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 text-slate-800">{h.title}</td>
              <td className="px-4 py-2.5 text-center">
                {h.isCompleted ? (
                  <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">완료</span>
                ) : (
                  <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">미완료</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ExamsTab({ exams }: { exams: StudentDetail['schoolExams'] }) {
  if (exams.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">학교 시험 기록이 없습니다.</p>
  }
  return (
    <table className="mt-2 w-full text-sm">
      <thead className="bg-slate-50 text-xs text-slate-500">
        <tr>
          <th className="px-4 py-2 text-left font-medium">과목</th>
          <th className="px-4 py-2 text-left font-medium">시험 종류</th>
          <th className="px-4 py-2 text-center font-medium">시기</th>
          <th className="px-4 py-2 text-right font-medium">점수/등급</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {exams.map((e, i) => (
          <tr key={i} className="hover:bg-slate-50">
            <td className="px-4 py-2.5 font-medium text-slate-800">{e.subject}</td>
            <td className="px-4 py-2.5 text-slate-500">{e.examType}</td>
            <td className="px-4 py-2.5 text-center text-slate-500">{e.examYear}년 {e.semester}학기</td>
            <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
              {e.score != null ? `${e.score}점` : e.grade != null ? `${e.grade}등급` : '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function StudentDetailModal({ student, slug }: { student: StudentDetail; slug: string }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('attendance')

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setTab('attendance') }}
        className="rounded border px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
      >
        상세보기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl"
            style={{ maxHeight: '90vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{student.name}</h2>
                {student.schoolName && (
                  <p className="mt-0.5 text-sm text-slate-500">{student.schoolName}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/admin/${slug}/students/${student.id}`}
                  className="rounded border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  학생 상세 페이지 →
                </a>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="닫기"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {TAB_LABELS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={[
                    'px-5 py-2.5 text-sm font-medium transition-colors',
                    tab === key
                      ? 'border-b-2 border-blue-700 text-blue-700'
                      : 'text-slate-500 hover:text-slate-800',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-4">
              {tab === 'attendance' && <AttendanceTab attendance={student.attendance} />}
              {tab === 'tests' && <TestsTab tests={student.tests} />}
              {tab === 'homeworks' && <HomeworksTab homeworks={student.homeworks} />}
              {tab === 'exams' && <ExamsTab exams={student.schoolExams} />}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
