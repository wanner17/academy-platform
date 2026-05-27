'use client'

import { useState } from 'react'
import type { Program, ProgramMode } from '@prisma/client'
import { programModeLabels, targetLevelLabels } from '@/lib/program-labels'
import { publicPath } from '@/lib/utils/public-path'

const ALL_MODES: ProgramMode[] = ['SCHOOL_EXAM', 'LEVEL']

type Props = {
  programs: Program[]
  slug: string
}

export function ProgramTabs({ programs, slug }: Props) {
  const [activeMode, setActiveMode] = useState<ProgramMode>('SCHOOL_EXAM')
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>(undefined)

  const modePrograms = programs.filter((p) => p.mode === activeMode)
  const subjects = getSubjects(modePrograms)
  const visiblePrograms = selectedSubject
    ? modePrograms.filter((p) => p.subject === selectedSubject)
    : modePrograms

  function handleModeChange(m: ProgramMode) {
    setActiveMode(m)
    setSelectedSubject(undefined)
  }

  return (
    <>
      <nav className="pub-filter-nav" aria-label="수업 유형" style={{ marginBottom: 8 }}>
        {ALL_MODES.map((m) => (
          <button
            key={m}
            type="button"
            className={`pub-filter-btn${activeMode === m ? ' active' : ''}`}
            onClick={() => handleModeChange(m)}
          >
            {programModeLabels[m]}
          </button>
        ))}
      </nav>

      {subjects.length > 0 && (
        <nav className="pub-filter-nav" aria-label="과목 조회">
          <button
            type="button"
            className={`pub-filter-btn${!selectedSubject ? ' active' : ''}`}
            onClick={() => setSelectedSubject(undefined)}
          >
            전체
          </button>
          {subjects.map((item) => (
            <button
              key={item}
              type="button"
              className={`pub-filter-btn${selectedSubject === item ? ' active' : ''}`}
              onClick={() => setSelectedSubject(item)}
            >
              {item.toUpperCase()}
            </button>
          ))}
        </nav>
      )}

      {visiblePrograms.length > 0 ? (
        <div className="pub-program-grid">
          {visiblePrograms.map((program) => (
            <article key={program.id} className="pub-card">
              <div>
                <span className="pub-card-tag">{targetLevelLabels[program.targetLevel]}</span>
                {program.subject && <span className="pub-card-tag muted">{program.subject}</span>}
                {program.schoolName && <span className="pub-card-tag muted">{program.schoolName}</span>}
                {program.grade && <span className="pub-card-tag muted">{program.grade}</span>}
              </div>
              <h3 className="pub-card-title">{program.title}</h3>
              <p className="pub-card-body">
                {program.description || '수업 설명을 준비 중입니다.'}
              </p>
              <a className="pub-card-link" href={publicPath(slug, `/programs/${program.id}`)}>
                상세 / 시간표 →
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="pub-card" style={{ textAlign: 'center', padding: '80px 40px' }}>
          <p style={{ color: 'var(--muted)', fontSize: 16 }}>등록된 수업이 없습니다.</p>
        </div>
      )}
    </>
  )
}

function getSubjects(programs: Program[]) {
  return Array.from(new Set(programs.map((p) => p.subject).filter(Boolean) as string[])).sort(
    (a, b) => a.localeCompare(b, 'ko-KR'),
  )
}
