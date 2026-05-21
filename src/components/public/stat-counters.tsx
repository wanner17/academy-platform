'use client'

import { useEffect, useRef, useState } from 'react'
import type { StatCounterItem } from '@/lib/homepage-sections'

interface CounterProps {
  target: number
  decimals?: number
  duration?: number
  suffix?: string
}

function Counter({ target, decimals = 0, duration = 1500, suffix = '' }: CounterProps) {
  const [count, setCount] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
        }
      },
      { threshold: 0.1 }
    )
    if (ref.current) {
      observer.observe(ref.current)
    }
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return

    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(progress * target)
      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }
    window.requestAnimationFrame(step)
  }, [visible, target, duration])

  return (
    <span ref={ref} className="stat-counter-number">
      {count.toFixed(decimals)}
      {suffix}
    </span>
  )
}

type StatCountersProps = {
  counters: StatCounterItem[]
}

export function StatCounters({ counters }: StatCountersProps) {
  if (counters.length === 0) return null

  return (
    <section className="pub-stat-section">
      <div className="pub-stat-grid">
        {counters.map((counter, index) => (
          <div className="pub-stat-card" key={`${counter.label}-${index}`}>
            <Counter decimals={counter.decimals} suffix={counter.suffix} target={counter.target} />
            <div className="pub-stat-label">{counter.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
