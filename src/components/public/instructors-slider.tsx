'use client'

import { useEffect, useRef } from 'react'
import { TeacherCard } from '@/components/public/teacher-card'
import { publicPath } from '@/lib/utils/public-path'

type Teacher = {
  id: string
  name: string
  profileImageUrl?: string | null
  subject: string | null
}

type InstructorsSliderProps = {
  teachers: Teacher[]
  slug: string
}

const SCROLL_AMOUNT = 320
const AUTO_INTERVAL_MS = 3000

export function InstructorsSlider({ teachers, slug }: InstructorsSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)

  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current
    if (!el) return
    const next = direction === 'left'
      ? el.scrollLeft - SCROLL_AMOUNT
      : el.scrollLeft + SCROLL_AMOUNT
    el.scrollTo({ left: next, behavior: 'smooth' })
  }

  useEffect(() => {
    const id = setInterval(() => {
      const el = containerRef.current
      if (!el || pausedRef.current) return
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
      el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + SCROLL_AMOUNT, behavior: 'smooth' })
    }, AUTO_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="pub-slider-wrapper pub-instructors-slider"
      onMouseEnter={() => { pausedRef.current = true }}
      onMouseLeave={() => { pausedRef.current = false }}
    >
      <button className="pub-slider-nav-btn left" onClick={() => scroll('left')} aria-label="이전 강사" type="button">
        ‹
      </button>
      <div ref={containerRef} className="pub-slider-container">
        {teachers.map((teacher) => (
          <TeacherCard href={publicPath(slug, `/teachers/${teacher.id}`)} key={teacher.id} teacher={teacher} />
        ))}
      </div>
      <button className="pub-slider-nav-btn right" onClick={() => scroll('right')} aria-label="다음 강사" type="button">
        ›
      </button>
    </div>
  )
}
