'use client'

import { useState } from 'react'
import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'

type ProgramFieldsProps = {
  teachers?: Array<{ id: string; name: string; subject: string }>
  showTeacherSelect?: boolean
  showAdminControls?: boolean
  defaults?: {
    teacherId: string | null
    title: string
    mode: 'SCHOOL_EXAM' | 'LEVEL'
    targetLevel: 'ELEMENTARY' | 'MIDDLE' | 'HIGH'
    schoolName: string | null
    grade: string | null
    subject: string | null
    description: string | null
    order: number
    isActive: boolean
  }
}

export function ProgramFields({
  defaults,
  teachers = [],
  showTeacherSelect = true,
  showAdminControls = true,
}: ProgramFieldsProps) {
  const [mode, setMode] = useState(defaults?.mode ?? 'SCHOOL_EXAM')
  const isSchoolExam = mode === 'SCHOOL_EXAM'

  return (
    <>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">수업명</span>
        <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.title ?? ''} name="title" required />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">구분</span>
          <select
            className="w-full rounded border px-3 py-2"
            name="mode"
            onChange={(event) => setMode(event.target.value as 'SCHOOL_EXAM' | 'LEVEL')}
            value={mode}
          >
            {Object.entries(programModeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">대상</span>
          <select className="w-full rounded border px-3 py-2" defaultValue={defaults?.targetLevel ?? 'MIDDLE'} name="targetLevel">
            {Object.entries(targetLevelLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {showTeacherSelect ? (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">담당 강사</span>
          <select className="w-full rounded border px-3 py-2" defaultValue={defaults?.teacherId ?? ''} name="teacherId">
            <option value="">선택 안 함</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.subject})
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className={`grid gap-4 ${isSchoolExam ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
        {isSchoolExam ? (
          <>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">학교명</span>
              <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.schoolName ?? ''} name="schoolName" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">학년</span>
              <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.grade ?? ''} name="grade" />
            </label>
          </>
        ) : (
          <>
            <input name="schoolName" type="hidden" value="" />
            <input name="grade" type="hidden" value="" />
          </>
        )}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">과목</span>
          <input
            className="w-full rounded border px-3 py-2"
            defaultValue={defaults?.subject ?? ''}
            name="subject"
            placeholder="수학, 영어, 국어 등"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">설명</span>
        <textarea className="min-h-24 w-full rounded border px-3 py-2" defaultValue={defaults?.description ?? ''} name="description" />
      </label>
      {showAdminControls ? (
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">정렬</span>
            <input className="w-24 rounded border px-3 py-2" defaultValue={defaults?.order ?? 0} name="order" type="number" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input defaultChecked={defaults?.isActive ?? true} name="isActive" type="checkbox" value="true" />
            공개
          </label>
        </div>
      ) : null}
    </>
  )
}
