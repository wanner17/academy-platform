'use client'

import { useState } from 'react'
import type { ProgramMode, TargetLevel } from '@prisma/client'

type ProgramType = {
  id: string
  title: string
  mode: ProgramMode
  targetLevel: TargetLevel
  schoolName: string | null
  grade: string | null
  subject: string | null
  description: string | null
  teacher?: {
    name: string
  } | null
}

type CourseFinderQuizProps = {
  programs: ProgramType[]
  slug: string
}

export function CourseFinderQuiz({ programs, slug }: CourseFinderQuizProps) {
  const [step, setStep] = useState(1)
  const [level, setLevel] = useState<TargetLevel | null>(null)
  const [mode, setMode] = useState<ProgramMode | null>(null)
  const [subject, setSubject] = useState<string | null>(null)

  const handleLevelSelect = (val: TargetLevel) => {
    setLevel(val)
    setStep(2)
  }

  const handleModeSelect = (val: ProgramMode) => {
    setMode(val)
    setStep(3)
  }

  const handleSubjectSelect = (val: string) => {
    setSubject(val)
    setStep(4)
  }

  const resetQuiz = () => {
    setLevel(null)
    setMode(null)
    setSubject(null)
    setStep(1)
  }

  // Get subjects that are available based on currently selected level and mode
  const getAvailableSubjects = () => {
    const filtered = programs.filter(
      (p) => p.targetLevel === level && p.mode === mode && p.subject
    )
    const subjects = new Set<string>()
    filtered.forEach((p) => {
      if (p.subject) subjects.add(p.subject)
    })
    return Array.from(subjects)
  }

  const filteredPrograms = programs.filter((p) => {
    if (p.targetLevel !== level) return false
    if (p.mode !== mode) return false
    if (subject !== 'ALL' && p.subject !== subject) return false
    return true
  })

  const availableSubjects = getAvailableSubjects()

  return (
    <section className="pub-quiz-section">
      <div className="pub-quiz-container">
        <div className="pub-quiz-header">
          <div className="pub-label">COURSE FINDER</div>
          <h2 className="pub-section-title">나에게 딱 맞는 수업 찾기</h2>
          <p className="pub-section-desc">몇 가지 간단한 질문에 답하고 최적의 강의를 추천받으세요.</p>
        </div>

        <div className="pub-quiz-card">
          {/* Step Progress */}
          <div className="pub-quiz-progress-bar">
            <div className="pub-quiz-progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
          </div>

          <div className="pub-quiz-step-content">
            {step === 1 && (
              <div className="pub-quiz-step animate-fade-in">
                <h3 className="pub-quiz-question">Q1. 학생의 학년 구분을 선택해 주세요.</h3>
                <div className="pub-quiz-options">
                  <button className="pub-quiz-opt-btn" onClick={() => handleLevelSelect('ELEMENTARY')} type="button">
                    <span className="emoji">🎒</span>
                    <span className="title">초등부</span>
                    <span className="desc">기초 개념 확립 및 공부 습관 형성</span>
                  </button>
                  <button className="pub-quiz-opt-btn" onClick={() => handleLevelSelect('MIDDLE')} type="button">
                    <span className="emoji">🏫</span>
                    <span className="title">중등부</span>
                    <span className="desc">내신 완벽 대비 및 심화 과정 입문</span>
                  </button>
                  <button className="pub-quiz-opt-btn" onClick={() => handleLevelSelect('HIGH')} type="button">
                    <span className="emoji">🎓</span>
                    <span className="title">고등부</span>
                    <span className="desc">대입 수능 대비 및 1등급 목표 심화</span>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="pub-quiz-step animate-fade-in">
                <h3 className="pub-quiz-question">Q2. 어떤 목적으로 수강을 원하시나요?</h3>
                <div className="pub-quiz-options">
                  <button className="pub-quiz-opt-btn" onClick={() => handleModeSelect('SCHOOL_EXAM')} type="button">
                    <span className="emoji">📝</span>
                    <span className="title">학교별 내신 완벽 대비</span>
                    <span className="desc">인근 학교 기출 정밀 분석 및 내신 고득점</span>
                  </button>
                  <button className="pub-quiz-opt-btn" onClick={() => handleModeSelect('LEVEL')} type="button">
                    <span className="emoji">🎯</span>
                    <span className="title">수능 대비 및 수준별 심화</span>
                    <span className="desc">핵심 이론 확립 및 고난도 문제 완벽 마스터</span>
                  </button>
                </div>
                <button className="pub-quiz-back-btn" onClick={() => setStep(1)} type="button">
                  ← 이전 단계로
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="pub-quiz-step animate-fade-in">
                <h3 className="pub-quiz-question">Q3. 관심 있는 과목을 선택해 주세요.</h3>
                <div className="pub-quiz-options">
                  {availableSubjects.map((sub) => (
                    <button key={sub} className="pub-quiz-opt-btn" onClick={() => handleSubjectSelect(sub)} type="button">
                      <span className="emoji">💡</span>
                      <span className="title">{sub}</span>
                      <span className="desc">{sub} 과목 핵심 정밀 수업</span>
                    </button>
                  ))}
                  {availableSubjects.length > 0 && (
                    <button className="pub-quiz-opt-btn" onClick={() => handleSubjectSelect('ALL')} type="button">
                      <span className="emoji">📚</span>
                      <span className="title">전체 과목 보기</span>
                      <span className="desc">조건에 맞는 모든 수업 추천</span>
                    </button>
                  )}
                  {availableSubjects.length === 0 && (
                    <div className="pub-quiz-empty-state">
                      <p>선택하신 학년 및 목적에 맞는 개설된 수업이 없습니다.</p>
                      <button className="pub-quiz-opt-btn" onClick={() => handleSubjectSelect('ALL')} type="button">
                        <span className="emoji">🔍</span>
                        <span className="title">학원 전체 수업 확인</span>
                        <span className="desc">개설 대기 수업 및 상담 안내</span>
                      </button>
                    </div>
                  )}
                </div>
                <button className="pub-quiz-back-btn" onClick={() => setStep(2)} type="button">
                  ← 이전 단계로
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="pub-quiz-step animate-fade-in">
                <h3 className="pub-quiz-question">✨ 학생에게 추천하는 맞춤형 강좌</h3>
                <div className="pub-quiz-results">
                  {filteredPrograms.length > 0 ? (
                    <div className="pub-quiz-results-grid">
                      {filteredPrograms.map((prog) => (
                        <div key={prog.id} className="pub-quiz-result-card">
                          <div className="badge-row">
                            <span className="prog-subject-badge">{prog.subject || '과목'}</span>
                            <span className="prog-mode-badge">
                              {prog.mode === 'SCHOOL_EXAM' ? '내신대비' : '수준별'}
                            </span>
                          </div>
                          <h4 className="prog-title">{prog.title}</h4>
                          {prog.schoolName && (
                            <p className="prog-target">
                              🏢 {prog.schoolName} {prog.grade}
                            </p>
                          )}
                          {prog.description && <p className="prog-desc">{prog.description}</p>}
                          {prog.teacher && (
                            <div className="prog-teacher-row">
                              <span className="label">담당 강사:</span>
                              <span className="name">{prog.teacher.name} 선생님</span>
                            </div>
                          )}
                          <a className="prog-detail-link" href={`/${slug}/programs/${prog.id}`}>
                            수업 커리큘럼 보기 →
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="pub-quiz-no-results">
                      <p className="no-result-text">
                        현재 찾으시는 맞춤형 추천 수업이 개설 대기 중입니다.<br />
                        아래 상담 신청을 통해 맞춤 수업 설정을 문의하실 수 있습니다.
                      </p>
                      <a className="pub-quiz-cta-link" href={`/${slug}/contact`}>
                        온라인 상담 문의하기
                      </a>
                    </div>
                  )}
                </div>
                <button className="pub-quiz-restart-btn" onClick={resetQuiz} type="button">
                  다시 찾기 ↺
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
