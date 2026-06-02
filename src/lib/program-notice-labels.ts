import type { ProgramNotice, ProgramNoticeType } from '@prisma/client'

export const programNoticeTypeLabels: Record<ProgramNoticeType, string> = {
  MAKEUP: '보충',
  CANCEL: '휴강',
  SCHEDULE_CHANGE: '시간표변경',
  OTHER: '기타',
}

export const programNoticeTypeBadgeClass: Record<ProgramNoticeType, string> = {
  MAKEUP: 'bg-blue-50 text-blue-700',
  CANCEL: 'bg-red-50 text-red-700',
  SCHEDULE_CHANGE: 'bg-amber-50 text-amber-700',
  OTHER: 'bg-slate-100 text-slate-600',
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export function formatProgramNoticeDetail(notice: ProgramNotice): string {
  const label = programNoticeTypeLabels[notice.type]
  switch (notice.type) {
    case 'MAKEUP':
      if (notice.makeupDate) {
        const date = notice.makeupDate.toLocaleDateString('ko-KR')
        return `${label} · ${date} ${notice.makeupStartTime ?? ''}~${notice.makeupEndTime ?? ''}`
      }
      return label
    case 'CANCEL':
      if (notice.cancelDate) {
        return `${label} · ${notice.cancelDate.toLocaleDateString('ko-KR')}`
      }
      return label
    case 'OTHER':
      return label
    case 'SCHEDULE_CHANGE': {
      const dayStr = notice.dayOfWeek != null ? `(${DAY_LABELS[notice.dayOfWeek]}) ` : ''
      const originalTimeStr = notice.changeFromTime ? `${notice.changeFromTime} ` : ''
      const originalDateStr = notice.originalDate ? notice.originalDate.toLocaleDateString('ko-KR') : ''
      const fromStr = `${dayStr}${originalTimeStr}수업${originalDateStr ? ` ${originalDateStr}` : ''}`
      const toStr = notice.changeDate
        ? `${notice.changeDate.toLocaleDateString('ko-KR')}${notice.changeToTime ? ` ${notice.changeToTime}` : ''}`
        : ''
      return toStr ? `${label} · ${fromStr} → ${toStr}` : `${label} · ${fromStr}`
    }
  }
}
