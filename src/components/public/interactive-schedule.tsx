'use client'

import { useState } from 'react'
import type { Schedule } from '@prisma/client'
import { dayLabels } from '@/lib/schedule-labels'

type PublicSchedule = Schedule & {
  program: {
    schoolName: string | null
  } | null
}

type InteractiveScheduleProps = {
  schedules: PublicSchedule[]
}

export function InteractiveSchedule({ schedules }: InteractiveScheduleProps) {
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])

  const schools = new Set<string>()
  const subjects = new Set<string>()
  schedules.forEach((s) => {
    if (s.program?.schoolName) schools.add(s.program.schoolName)
    if (s.subject) subjects.add(s.subject)
  })
  const schoolList = ['ALL', ...Array.from(schools).sort((a, b) => a.localeCompare(b, 'ko'))]
  const subjectList = Array.from(subjects).sort((a, b) => a.localeCompare(b, 'ko'))

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((current) =>
      current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]
    )
  }

  const filteredSchedules = schedules.filter((s) => {
    if (selectedSchool !== 'ALL' && s.program?.schoolName !== selectedSchool) return false
    if (selectedSubjects.length > 0 && (!s.subject || !selectedSubjects.includes(s.subject))) return false
    return true
  })

  return (
    <>
      {(schoolList.length > 1 || subjectList.length > 0) && (
        <div className="pub-schedule-filter-panel">
          {schoolList.length > 1 && (
            <div className="pub-schedule-filter-group">
              <div className="pub-schedule-filter-label">학교</div>
              <div className="pub-schedule-filter-tabs">
                {schoolList.map((school) => (
                  <button
                    key={school}
                    className={`pub-schedule-tab${selectedSchool === school ? ' active' : ''}`}
                    onClick={() => setSelectedSchool(school)}
                    type="button"
                  >
                    {school === 'ALL' ? '전체 학교' : school}
                  </button>
                ))}
              </div>
            </div>
          )}

          {subjectList.length > 0 && (
            <div className="pub-schedule-filter-group">
              <div className="pub-schedule-filter-label">과목</div>
              <div className="pub-schedule-filter-tabs">
                <button
                  className={`pub-schedule-tab${selectedSubjects.length === 0 ? ' active' : ''}`}
                  onClick={() => setSelectedSubjects([])}
                  type="button"
                >
                  전체 과목
                </button>
                {subjectList.map((subject) => (
                  <button
                    key={subject}
                    className={`pub-schedule-tab${selectedSubjects.includes(subject) ? ' active' : ''}`}
                    onClick={() => toggleSubject(subject)}
                    type="button"
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pub-schedule-grid">
        {dayLabels.map((label, dayOfWeek) => {
          const daySchedules = filteredSchedules.filter((s) => s.dayOfWeek === dayOfWeek)
          return (
            <section key={label} className="pub-day-col">
              <div className="pub-day-header">{label}</div>
              <div className="pub-day-body">
                {daySchedules.length === 0 ? (
                  <p className="pub-empty">수업 없음</p>
                ) : (
                  daySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="pub-schedule-card"
                      style={{ borderLeftColor: schedule.color ?? 'var(--gold)' }}
                    >
                      <div className="pub-schedule-card-time">
                        {schedule.startTime} – {schedule.endTime}
                      </div>
                      <div className="pub-schedule-card-title">{schedule.title}</div>
                      <div className="pub-schedule-card-meta">
                        <div>
                          {schedule.subject ? <span>{schedule.subject}</span> : null}
                          {schedule.subject && schedule.teacher ? ' · ' : null}
                          {schedule.teacher ? <span>{schedule.teacher}</span> : null}
                        </div>
                        {schedule.program?.schoolName ? <div>{schedule.program.schoolName}</div> : null}
                        {schedule.room ? <div>{schedule.room}</div> : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
