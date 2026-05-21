'use client'

import { useState } from 'react'
import type { StatCounterItem, TestimonialItem } from '@/lib/homepage-sections'

type HomepageSectionFieldsProps = {
  showStatCounters: boolean
  showTestimonials: boolean
  statCounters: StatCounterItem[]
  testimonials: TestimonialItem[]
}

export function HomepageSectionFields({
  showStatCounters,
  showTestimonials,
  statCounters,
  testimonials,
}: HomepageSectionFieldsProps) {
  const [stats, setStats] = useState(statCounters)
  const [reviews, setReviews] = useState(testimonials)

  return (
    <section className="space-y-6 rounded-lg border bg-white p-5">
      <div>
        <h2 className="text-xl font-bold">메인 화면 콘텐츠</h2>
        <p className="mt-1 text-sm text-slate-500">사용자 메인 화면의 지표 카운터와 수강 후기 슬라이더를 관리합니다.</p>
      </div>

      <input name="statCounters" type="hidden" value={JSON.stringify(stats)} />
      <input name="testimonials" type="hidden" value={JSON.stringify(reviews)} />

      <div className="space-y-4 rounded border bg-slate-50 p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input defaultChecked={showStatCounters} name="showStatCounters" type="checkbox" />
          지표 카운터 표시
        </label>

        <div className="grid gap-4">
          {stats.map((item, index) => (
            <div className="grid gap-3 rounded border bg-white p-4 md:grid-cols-[1fr_140px_100px_100px_auto]" key={index}>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">라벨</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  onChange={(event) => updateStat(setStats, index, { label: event.target.value })}
                  value={item.label}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">숫자</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  onChange={(event) => updateStat(setStats, index, { target: Number(event.target.value) })}
                  step="0.1"
                  type="number"
                  value={item.target}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">소수점</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  max={2}
                  min={0}
                  onChange={(event) => updateStat(setStats, index, { decimals: Number(event.target.value) })}
                  type="number"
                  value={item.decimals}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">단위</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  onChange={(event) => updateStat(setStats, index, { suffix: event.target.value })}
                  value={item.suffix}
                />
              </label>
              <button className="self-end rounded border border-red-200 bg-white px-3 py-2 text-sm text-red-700" onClick={() => removeItem(setStats, index)} type="button">
                삭제
              </button>
            </div>
          ))}
        </div>

        <button className="rounded border bg-white px-3 py-2 text-sm" onClick={() => setStats((items) => [...items, { decimals: 0, label: '새 지표', suffix: '', target: 0 }])} type="button">
          지표 추가
        </button>
      </div>

      <div className="space-y-4 rounded border bg-slate-50 p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input defaultChecked={showTestimonials} name="showTestimonials" type="checkbox" />
          수강 후기 슬라이더 표시
        </label>

        <div className="grid gap-4">
          {reviews.map((item, index) => (
            <div className="space-y-3 rounded border bg-white p-4" key={item.id}>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-500">작성자</span>
                  <input
                    className="w-full rounded border px-3 py-2"
                    onChange={(event) => updateReview(setReviews, index, { author: event.target.value })}
                    value={item.author}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-500">관계/성과</span>
                  <input
                    className="w-full rounded border px-3 py-2"
                    onChange={(event) => updateReview(setReviews, index, { relation: event.target.value })}
                    value={item.relation}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-500">별점</span>
                  <input
                    className="w-full rounded border px-3 py-2"
                    max={5}
                    min={1}
                    onChange={(event) => updateReview(setReviews, index, { stars: Number(event.target.value) })}
                    type="number"
                    value={item.stars}
                  />
                </label>
                <button className="self-end rounded border border-red-200 bg-white px-3 py-2 text-sm text-red-700" onClick={() => removeItem(setReviews, index)} type="button">
                  삭제
                </button>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">후기 내용</span>
                <textarea
                  className="min-h-24 w-full rounded border px-3 py-2"
                  onChange={(event) => updateReview(setReviews, index, { text: event.target.value })}
                  value={item.text}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-slate-500">하단 설명</span>
                <input
                  className="w-full rounded border px-3 py-2"
                  onChange={(event) => updateReview(setReviews, index, { subText: event.target.value })}
                  value={item.subText}
                />
              </label>
            </div>
          ))}
        </div>

        <button className="rounded border bg-white px-3 py-2 text-sm" onClick={() => setReviews((items) => [...items, { author: '새 후기', id: crypto.randomUUID(), relation: '', stars: 5, subText: '', text: '후기 내용을 입력하세요.' }])} type="button">
          후기 추가
        </button>
      </div>
    </section>
  )
}

function updateStat(setItems: (updater: (items: StatCounterItem[]) => StatCounterItem[]) => void, index: number, patch: Partial<StatCounterItem>) {
  setItems((items) => items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
}

function updateReview(setItems: (updater: (items: TestimonialItem[]) => TestimonialItem[]) => void, index: number, patch: Partial<TestimonialItem>) {
  setItems((items) => items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
}

function removeItem<T>(setItems: (updater: (items: T[]) => T[]) => void, index: number) {
  setItems((items) => items.filter((_, itemIndex) => itemIndex !== index))
}
