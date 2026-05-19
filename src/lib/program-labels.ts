import type { ProgramMode, TargetLevel } from '@prisma/client'

export const programModeLabels: Record<ProgramMode, string> = {
  SCHOOL_EXAM: '학교별 수업',
  LEVEL: '수준별 수업',
}

export const targetLevelLabels: Record<TargetLevel, string> = {
  ELEMENTARY: '초등',
  MIDDLE: '중등',
  HIGH: '고등',
}
