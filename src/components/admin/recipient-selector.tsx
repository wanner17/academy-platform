'use client'

import { useState, useMemo } from 'react'

type Recipient = { id: string; name: string; group: string }

export function RecipientSelector({ recipients }: { recipients: Recipient[] }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? recipients.filter((r) => r.name.toLowerCase().includes(q)) : recipients
  }, [recipients, search])

  const groups = useMemo(
    () =>
      filtered.reduce<Record<string, Recipient[]>>((acc, r) => {
        ;(acc[r.group] ??= []).push(r)
        return acc
      }, {}),
    [filtered]
  )

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleGroup = (group: string) => {
    const ids = (groups[group] ?? []).map((r) => r.id)
    const allOn = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      allOn ? ids.forEach((id) => next.delete(id)) : ids.forEach((id) => next.add(id))
      return next
    })
  }

  const isAllSelected = (group: string) => {
    const ids = groups[group]?.map((r) => r.id) ?? []
    return ids.length > 0 && ids.every((id) => selected.has(id))
  }

  return (
    <div className="space-y-2">
      {Array.from(selected).map((id) => (
        <input key={id} name="receiverIds" type="hidden" value={id} />
      ))}

      <input
        className="w-full rounded border px-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
        onChange={(e) => setSearch(e.target.value)}
        placeholder="이름으로 검색..."
        type="text"
        value={search}
      />

      <div className="max-h-52 overflow-y-auto rounded border bg-white p-3 space-y-3">
        {Object.entries(groups).length === 0 ? (
          <p className="py-2 text-center text-sm text-slate-400">검색 결과가 없습니다.</p>
        ) : (
          Object.entries(groups).map(([group, members]) => (
            <div key={group}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {group} ({members.length}명)
                </span>
                <button
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => toggleGroup(group)}
                  type="button"
                >
                  {isAllSelected(group) ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              {members.map((r) => (
                <label className="flex cursor-pointer items-center gap-2 py-0.5 text-sm" key={r.id}>
                  <input
                    checked={selected.has(r.id)}
                    className="rounded"
                    onChange={() => toggle(r.id)}
                    type="checkbox"
                  />
                  {r.name}
                </label>
              ))}
            </div>
          ))
        )}
      </div>

      {selected.size > 0 && (
        <p className="text-xs text-slate-500">{selected.size}명 선택됨</p>
      )}
    </div>
  )
}
