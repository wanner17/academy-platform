'use client'

import { useState } from 'react'

type Category = {
  id: string
  name: string
  color: string
}

type TestCategorySelectProps = {
  categories: Category[]
  defaultValue?: string | null
}

export function TestCategorySelect({ categories, defaultValue }: TestCategorySelectProps) {
  const [selectedId, setSelectedId] = useState(defaultValue ?? '')
  const selected = categories.find((c) => c.id === selectedId)

  return (
    <div className="flex items-center gap-2">
      {selected ? (
        <span
          className="inline-block h-4 w-4 shrink-0 rounded-full border border-slate-200"
          style={{ backgroundColor: selected.color }}
        />
      ) : (
        <span className="inline-block h-4 w-4 shrink-0 rounded-full border border-dashed border-slate-300" />
      )}
      <select
        className="flex-1 rounded border px-3 py-2 text-sm"
        name="categoryId"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">구분 없음</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  )
}
