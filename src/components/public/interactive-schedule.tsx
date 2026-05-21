'use client'

import { useState } from 'react'
import type { Schedule } from '@prisma/client'
import { dayLabels } from '@/lib/schedule-labels'

type InteractiveScheduleProps = {
  schedules: Schedule[]
}

export function InteractiveSchedule({ schedules }: InteractiveScheduleProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL')

  // Get unique list of subjects
  const subjects = new Set<string>()
  schedules.forEach((s) => {
    if (s.subject) subjects.add(s.subject)
  })
  const subjectList = ['ALL', ...Array.from(subjects)]

  const filteredSchedules = schedules.filter((s) => {
    if (selectedSubject === 'ALL') return true
    return s.subject === selectedSubject
  })

  return (
    <>
      {subjectList.length > 1 && (
        <div className="pub-schedule-filter-tabs">
          {subjectList.map((subject) => (
            <button
              key={subject}
              className={`pub-schedule-tab${selectedSubject === subject ? ' active' : ''}`}
              onClick={() => setSelectedSubject(subject)}
              type="button"
            >
              {subject === 'ALL' ? '전체 과목' : subject}
            </button>
          ))}
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
                        {schedule.subject ? <span>{schedule.subject}</span> : null}
                        {schedule.subject && schedule.teacher ? ' · ' : null}
                        {schedule.teacher ? <span>{schedule.teacher}</span> : null}
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
