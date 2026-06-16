'use client'

import { useState } from 'react'

type StudentScopeCheckboxesProps = {
  students: { id: string; name: string }[]
  initialStudentId?: string | null
}

export function StudentScopeCheckboxes({ students, initialStudentId }: StudentScopeCheckboxesProps) {
  const [studentIds, setStudentIds] = useState<string[]>([initialStudentId ?? ''])

  function toggleStudent(id: string) {
    setStudentIds((prev) => {
      if (id === '') return ['']
      const withoutAll = prev.filter(Boolean)
      const next = withoutAll.includes(id) ? withoutAll.filter((studentId) => studentId !== id) : [...withoutAll, id]
      return next.length > 0 ? next : ['']
    })
  }

  return (
    <fieldset>
      <span className="mb-1 block text-sm font-medium">대상 학생</span>
      <div className="max-h-44 space-y-2 overflow-y-auto rounded border px-3 py-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            name="studentIds"
            type="checkbox"
            value=""
            checked={studentIds.includes('')}
            onChange={() => toggleStudent('')}
          />
          전체 학생
        </label>
        {students.map((student) => (
          <label key={student.id} className="flex items-center gap-2">
            <input
              name="studentIds"
              type="checkbox"
              value={student.id}
              checked={studentIds.includes(student.id)}
              onChange={() => toggleStudent(student.id)}
            />
            {student.name}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
