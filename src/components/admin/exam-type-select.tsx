'use client'

import { useState } from 'react'

const PRESET_TYPES = ['중간고사', '기말고사', '모의고사', '기타']

export function ExamTypeSelect({ defaultValue }: { defaultValue?: string }) {
  const isCustom = defaultValue ? !PRESET_TYPES.includes(defaultValue) : false
  const [selected, setSelected] = useState(isCustom ? '기타' : (defaultValue ?? ''))
  const [custom, setCustom] = useState(isCustom ? (defaultValue ?? '') : '')

  return (
    <div className="space-y-2">
      <select
        className="w-full rounded border px-3 py-2 text-sm"
        name={selected === '기타' ? '_examTypeSelect' : 'examType'}
        onChange={(e) => setSelected(e.target.value)}
        required
        value={selected}
      >
        <option value="">선택</option>
        {PRESET_TYPES.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      {selected === '기타' && (
        <>
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            name="examType"
            onChange={(e) => setCustom(e.target.value)}
            placeholder="시험 종류 직접 입력"
            required
            type="text"
            value={custom}
          />
        </>
      )}
    </div>
  )
}
