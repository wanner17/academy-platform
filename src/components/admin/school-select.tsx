'use client'

import { useState } from 'react'

type Props = {
  defaultValue?: string | null
  schools: string[]
}

export function SchoolSelect({ defaultValue, schools }: Props) {
  const isCustom = defaultValue ? !schools.includes(defaultValue) : false
  const [selected, setSelected] = useState(isCustom ? '기타' : (defaultValue ?? ''))
  const [custom, setCustom] = useState(isCustom ? (defaultValue ?? '') : '')

  return (
    <div className="space-y-2">
      <select
        className="w-full rounded border px-3 py-2"
        name={selected === '기타' ? '_schoolSelect' : 'schoolName'}
        onChange={(e) => setSelected(e.target.value)}
        value={selected}
      >
        <option value="">선택 안 함</option>
        {schools.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
        <option value="기타">기타 (직접 입력)</option>
      </select>
      {selected === '기타' && (
        <input
          className="w-full rounded border px-3 py-2"
          name="schoolName"
          onChange={(e) => setCustom(e.target.value)}
          placeholder="학교명 직접 입력"
          type="text"
          value={custom}
        />
      )}
    </div>
  )
}
