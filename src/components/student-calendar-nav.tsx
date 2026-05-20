'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

type StudentCalendarNavProps = {
  currentLabel: string
  nextHref: string
  prevHref: string
}

export function StudentCalendarNav({ currentLabel, nextHref, prevHref }: StudentCalendarNavProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const move = (href: string) => {
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <div className="student-calendar-head">
      <button disabled={pending} onClick={() => move(prevHref)} type="button">
        이전 달
      </button>
      <strong>{currentLabel}</strong>
      <button disabled={pending} onClick={() => move(nextHref)} type="button">
        다음 달
      </button>
    </div>
  )
}
