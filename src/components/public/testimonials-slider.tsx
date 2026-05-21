'use client'

import { useRef } from 'react'
import type { TestimonialItem } from '@/lib/homepage-sections'

type TestimonialsSliderProps = {
  testimonials: TestimonialItem[]
}

export function TestimonialsSlider({ testimonials }: TestimonialsSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  if (testimonials.length === 0) return null

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 360
      const newScrollLeft =
        direction === 'left'
          ? containerRef.current.scrollLeft - scrollAmount
          : containerRef.current.scrollLeft + scrollAmount
      containerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      })
    }
  }

  return (
    <section className="pub-testimonial-section">
      <div className="pub-testimonial-container">
        <div className="pub-testimonial-header">
          <div className="pub-label">TESTIMONIALS</div>
          <h2 className="pub-section-title">생생한 수강생 및 학부모 후기</h2>
          <p className="pub-section-desc">성적 향상과 목표 대학 합격을 함께 만든 리얼 성공 스토리입니다.</p>
        </div>

        <div className="pub-slider-wrapper">
          <button className="pub-slider-nav-btn left" onClick={() => scroll('left')} aria-label="이전 후기" type="button">
            ‹
          </button>

          <div ref={containerRef} className="pub-slider-container">
            {testimonials.map((t) => (
              <div key={t.id} className="pub-testimonial-card">
                <div className="stars-row">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} className="star-icon">★</span>
                  ))}
                </div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-footer">
                  <div className="author-info">
                    <span className="author-name">{t.author}</span>
                    <span className="author-relation">{t.relation}</span>
                  </div>
                  <span className="author-subtext">{t.subText}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="pub-slider-nav-btn right" onClick={() => scroll('right')} aria-label="다음 후기" type="button">
            ›
          </button>
        </div>
      </div>
    </section>
  )
}
