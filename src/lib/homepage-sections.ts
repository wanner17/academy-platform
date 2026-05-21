export type StatCounterItem = {
  decimals: number
  label: string
  suffix: string
  target: number
}

export type TestimonialItem = {
  author: string
  id: string
  relation: string
  stars: number
  subText: string
  text: string
}

export const DEFAULT_STAT_COUNTERS: StatCounterItem[] = [
  { decimals: 1, label: '명문대/의치한 합격률', suffix: '%', target: 98.6 },
  { decimals: 1, label: '평균 성적 향상도', suffix: '점', target: 24.8 },
  { decimals: 0, label: '누적 졸업생 후기', suffix: '건', target: 982 },
  { decimals: 0, label: '강사진 평균 경력', suffix: '년', target: 12 },
]

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: '1',
    stars: 5,
    text: '“모르는 부분에 대해 질문하면 선생님께서 피하지 않고 끝까지 이해시켜 주셨어요. 덕분에 매번 3등급에 머물던 모의고사 점수가 고3 최종 수능에서 당당히 1등급을 받게 되었습니다.”',
    author: '이OO 학생',
    relation: '서울대학교 의예과 합격생',
    subText: '수능 대비반 수강생',
  },
  {
    id: '2',
    stars: 5,
    text: '“단순 진도 빼기 학습이 아닌, 아이의 오답 노트를 1:1로 밀착 관리해 주는 철저한 학습 시스템에 가장 믿음이 갔습니다. 공부를 귀찮아하던 아이가 이제 스스로 독서실에 갑니다.”',
    author: '김OO 학부모',
    relation: '중등 심화반 수강생 학부모',
    subText: '내신 완벽 대비반 학부모',
  },
  {
    id: '3',
    stars: 5,
    text: '“인근 학교의 지난 5개년 수학 시험 기출 문제를 정밀하게 집계한 교재 덕분에 이번 중간고사 시험 문제를 보자마자 학원에서 푼 문제라는 생각에 너무 쉽게 정답을 맞춰 100점을 맞았어요!”',
    author: '박OO 학생',
    relation: 'OO고등학교 2학년 전교 1등',
    subText: '학교별 내신 대비반 수강생',
  },
  {
    id: '4',
    stars: 5,
    text: '“학원 상담 신청 때 원장님과 강사진분들이 로드맵을 꼼꼼하게 짜주셔서 믿고 보낼 수 있었어요. 과목별로 밸런스 있는 시간표 배치와 체계적인 클리닉 시간 덕분에 아이의 전교 등수가 크게 올랐습니다.”',
    author: '최OO 학부모',
    relation: '고등부 내신 대비반 학부모',
    subText: '1:1 밀착 코칭 케어 학부모',
  },
  {
    id: '5',
    stars: 5,
    text: '“개념서만 봐서는 응용 문제를 풀지 못했는데, 수준별 문제 은행을 바탕으로 기초부터 고난도 킬러 문제까지 단계별 해결 기법을 알려주셔서 내신과 모의고사를 한 번에 잡게 되었습니다.”',
    author: '정OO 학생',
    relation: '고등학교 3학년',
    subText: '수능 심화반 수강생',
  },
]

export function parseStatCounters(value?: string | null): StatCounterItem[] {
  return parseJsonArray(value, sanitizeStatCounter, DEFAULT_STAT_COUNTERS)
}

export function parseTestimonials(value?: string | null): TestimonialItem[] {
  return parseJsonArray(value, sanitizeTestimonial, DEFAULT_TESTIMONIALS)
}

function parseJsonArray<T>(value: string | null | undefined, sanitize: (item: unknown, index: number) => T | null, fallback: T[]) {
  if (!value) return fallback

  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return fallback
    const sanitized = parsed.map(sanitize).filter((item): item is T => item !== null)
    return sanitized
  } catch {
    return fallback
  }
}

function sanitizeStatCounter(item: unknown): StatCounterItem | null {
  if (!isRecord(item)) return null

  const label = String(item.label ?? '').trim()
  const suffix = String(item.suffix ?? '').trim()
  const target = Number(item.target)
  const decimals = Math.min(Math.max(Number(item.decimals ?? 0), 0), 2)

  if (!label || !Number.isFinite(target)) return null
  return { decimals, label, suffix, target }
}

function sanitizeTestimonial(item: unknown, index: number): TestimonialItem | null {
  if (!isRecord(item)) return null

  const text = String(item.text ?? '').trim()
  const author = String(item.author ?? '').trim()
  const relation = String(item.relation ?? '').trim()
  const subText = String(item.subText ?? '').trim()
  const stars = Math.min(Math.max(Math.round(Number(item.stars ?? 5)), 1), 5)

  if (!text || !author) return null
  return {
    id: String(item.id ?? index + 1),
    stars,
    text,
    author,
    relation,
    subText,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
