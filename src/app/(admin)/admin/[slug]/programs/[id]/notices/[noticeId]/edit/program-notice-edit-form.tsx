'use client'

import { useState, useTransition } from 'react'
import type { ProgramNoticeType } from '@prisma/client'
import { updateProgramNoticeAction } from '../../actions'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

type Schedule = {
  id: string
  title: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

type Props = {
  slug: string
  programId: string
  noticeId: string
  schedules: Schedule[]
  initialType: ProgramNoticeType
  initialTitle: string
  initialContent: string
  initialIsVisible: boolean
  initialMakeupDate: string
  initialMakeupStartTime: string
  initialMakeupEndTime: string
  initialCancelDate: string
  initialOriginalDate: string
  initialChangeDate: string
  initialChangeFromTime: string
  initialChangeToTime: string
  initialDayOfWeek: string
}

export function ProgramNoticeEditForm({
  slug, programId, noticeId, schedules,
  initialType, initialTitle, initialContent, initialIsVisible,
  initialMakeupDate, initialMakeupStartTime, initialMakeupEndTime,
  initialCancelDate,
  initialOriginalDate, initialChangeDate, initialChangeFromTime, initialChangeToTime, initialDayOfWeek,
}: Props) {
  const [type, setType] = useState<ProgramNoticeType>(initialType)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [isVisible, setIsVisible] = useState(initialIsVisible)
  const [makeupDate, setMakeupDate] = useState(initialMakeupDate)
  const [makeupStartTime, setMakeupStartTime] = useState(initialMakeupStartTime)
  const [makeupEndTime, setMakeupEndTime] = useState(initialMakeupEndTime)
  const [cancelDate, setCancelDate] = useState(initialCancelDate)
  const [originalDate, setOriginalDate] = useState(initialOriginalDate)
  const [changeDate, setChangeDate] = useState(initialChangeDate)
  const [changeFromTime, setChangeFromTime] = useState(initialChangeFromTime)
  const [changeToTime, setChangeToTime] = useState(initialChangeToTime)
  const [dayOfWeek, setDayOfWeek] = useState(initialDayOfWeek)
  const [isPending, startTransition] = useTransition()

  function handleScheduleSelect(scheduleId: string) {
    const s = schedules.find((s) => s.id === scheduleId)
    if (s) {
      setChangeFromTime(s.startTime)
      setChangeToTime(s.endTime)
      setDayOfWeek(String(s.dayOfWeek))
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) { alert('제목을 입력해주세요.'); return }
    if (!window.confirm('공지를 저장할까요?')) return

    startTransition(async () => {
      const fd = new FormData()
      fd.append('slug', slug)
      fd.append('programId', programId)
      fd.append('id', noticeId)
      fd.append('type', type)
      fd.append('title', title)
      fd.append('content', content)
      fd.append('isVisible', isVisible ? 'true' : 'false')
      if (type === 'MAKEUP') {
        fd.append('makeupDate', makeupDate)
        fd.append('makeupStartTime', makeupStartTime)
        fd.append('makeupEndTime', makeupEndTime)
      } else if (type === 'CANCEL') {
        fd.append('cancelDate', cancelDate)
      } else if (type === 'SCHEDULE_CHANGE') {
        fd.append('originalDate', originalDate)
        fd.append('changeDate', changeDate)
        fd.append('changeFromTime', changeFromTime)
        fd.append('changeToTime', changeToTime)
        if (dayOfWeek !== '') fd.append('dayOfWeek', dayOfWeek)
      }
      await updateProgramNoticeAction(fd)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">공지 유형</span>
        <select
          className="w-full rounded border px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as ProgramNoticeType)}
        >
          <option value="MAKEUP">보충</option>
          <option value="CANCEL">휴강</option>
          <option value="SCHEDULE_CHANGE">시간표변경</option>
          <option value="OTHER">기타</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">제목</span>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      {type === 'MAKEUP' && (
        <>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">보충 날짜</span>
            <input type="date" className="w-full rounded border px-3 py-2 text-sm" value={makeupDate} onChange={(e) => setMakeupDate(e.target.value)} required />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">시작 시간</span>
              <input type="time" className="w-full rounded border px-3 py-2 text-sm" value={makeupStartTime} onChange={(e) => setMakeupStartTime(e.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">종료 시간</span>
              <input type="time" className="w-full rounded border px-3 py-2 text-sm" value={makeupEndTime} onChange={(e) => setMakeupEndTime(e.target.value)} required />
            </label>
          </div>
        </>
      )}

      {type === 'CANCEL' && (
        <label className="block">
          <span className="mb-1 block text-sm font-medium">휴강 날짜</span>
          <input type="date" className="w-full rounded border px-3 py-2 text-sm" value={cancelDate} onChange={(e) => setCancelDate(e.target.value)} required />
        </label>
      )}

      {type === 'SCHEDULE_CHANGE' && (
        <>
          <div className="rounded-lg bg-slate-50 p-3 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">원래 수업</p>
            {schedules.length > 0 && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium">시간표 선택</span>
                <select
                  className="w-full rounded border px-3 py-2 text-sm"
                  defaultValue=""
                  onChange={(e) => handleScheduleSelect(e.target.value)}
                >
                  <option value="">직접 입력</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {DAY_LABELS[s.dayOfWeek]}요일 {s.startTime}~{s.endTime} ({s.title})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block">
              <span className="mb-1 block text-sm font-medium">원래 수업 날짜</span>
              <input type="date" className="w-full rounded border px-3 py-2 text-sm" value={originalDate} onChange={(e) => setOriginalDate(e.target.value)} required />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">원래 시작 시간</span>
                <input type="time" className="w-full rounded border px-3 py-2 text-sm" value={changeFromTime} onChange={(e) => setChangeFromTime(e.target.value)} required />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">요일</span>
                <select className="w-full rounded border px-3 py-2 text-sm" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
                  <option value="">-</option>
                  {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 space-y-3">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">이동할 수업</p>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">이동 날짜</span>
              <input type="date" className="w-full rounded border px-3 py-2 text-sm" value={changeDate} onChange={(e) => setChangeDate(e.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">이동 후 시작 시간</span>
              <input type="time" className="w-full rounded border px-3 py-2 text-sm" value={changeToTime} onChange={(e) => setChangeToTime(e.target.value)} required />
            </label>
          </div>
        </>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium">{type === 'OTHER' ? '내용' : '메모 (선택)'}</span>
        <textarea
          className="min-h-16 w-full rounded border px-3 py-2 text-sm"
          placeholder={type === 'OTHER' ? '공지 내용을 입력해주세요' : '추가 내용'}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
        학생에게 공개
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {isPending ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
