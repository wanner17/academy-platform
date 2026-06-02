'use client'

import { useState } from 'react'
import type { AttendanceSource, AttendanceStatus } from '@prisma/client'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { attendanceSourceLabels, attendanceStatusLabels } from '@/lib/attendance-labels'
import { bulkMarkAttendanceAction, markAttendanceAction } from './actions'

export type AttendanceRow = {
  key: string
  studentId: string
  studentName: string
  studentSchool: string
  scheduleId: string | null
  scheduleLabel: string | null
  recordStatus: AttendanceStatus | null
  recordCheckedAtFormatted: string | null
  recordDistanceMeters: number | null
  recordSource: AttendanceSource | null
  recordMemo: string | null
}

type Props = {
  children?: React.ReactNode
  dateValue: string
  rows: AttendanceRow[]
  slug: string
}

export function AttendanceTable({ children, dateValue, rows, slug }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allKeys = rows.map((r) => r.key)
  const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.has(k))

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allKeys))
  }

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const selectedRows = rows.filter((r) => selected.has(r.key))

  return (
    <>
      {selected.size > 0 && (
        <BulkActionBar
          dateValue={dateValue}
          onClear={() => setSelected(new Set())}
          selectedRows={selectedRows}
          slug={slug}
        />
      )}
      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3">
                <input
                  checked={allSelected}
                  className="cursor-pointer"
                  onChange={toggleAll}
                  type="checkbox"
                />
              </th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">학생</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">학교/학년</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">수업</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">상태</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">출석 시간</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">거리</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">처리 방식</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">메모</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.key} className={selected.has(row.key) ? 'bg-blue-50' : ''}>
                <td className="px-4 py-3">
                  <input
                    checked={selected.has(row.key)}
                    className="cursor-pointer"
                    onChange={() => toggle(row.key)}
                    type="checkbox"
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium">{row.studentName}</td>
                <td className="whitespace-nowrap px-4 py-3">{row.studentSchool}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row.scheduleLabel ?? '-'}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {row.recordStatus ? attendanceStatusLabels[row.recordStatus] : '미처리'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{row.recordCheckedAtFormatted ?? '-'}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {row.recordDistanceMeters !== null ? `${Math.round(row.recordDistanceMeters)}m` : '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {row.recordSource ? attendanceSourceLabels[row.recordSource] : '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{row.recordMemo ?? '-'}</td>
                <td className="px-4 py-3">
                  <form action={markAttendanceAction} className="flex justify-end gap-2">
                    <input name="slug" type="hidden" value={slug} />
                    <input name="date" type="hidden" value={dateValue} />
                    <input name="studentId" type="hidden" value={row.studentId} />
                    <input name="scheduleId" type="hidden" value={row.scheduleId ?? ''} />
                    <select
                      className="rounded border px-2 py-1 text-sm"
                      defaultValue={row.recordStatus ?? 'PRESENT'}
                      name="status"
                    >
                      {Object.entries(attendanceStatusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <input
                      className="w-32 rounded border px-2 py-1 text-sm"
                      defaultValue={row.recordMemo ?? ''}
                      name="memo"
                      placeholder="메모"
                    />
                    <ConfirmSubmitButton className="rounded border px-3 py-1 text-sm" message="출석 상태를 저장할까요?">
                      저장
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={10}>
                  표시할 학생이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="border-t px-4">{children}</div>
      </div>
    </>
  )
}

type BulkActionBarProps = {
  dateValue: string
  onClear: () => void
  selectedRows: AttendanceRow[]
  slug: string
}

function BulkActionBar({ dateValue, onClear, selectedRows, slug }: BulkActionBarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
      <span className="text-sm font-medium text-blue-800">{selectedRows.length}명 선택됨</span>
      <form action={bulkMarkAttendanceAction} className="flex flex-wrap items-center gap-2">
        <input name="slug" type="hidden" value={slug} />
        <input name="date" type="hidden" value={dateValue} />
        {selectedRows.map((row) => (
          <input
            key={row.key}
            name="entry"
            type="hidden"
            value={JSON.stringify({ scheduleId: row.scheduleId, studentId: row.studentId })}
          />
        ))}
        <select className="rounded border px-2 py-1 text-sm" name="status">
          {Object.entries(attendanceStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input className="rounded border px-2 py-1 text-sm" name="memo" placeholder="메모(선택)" />
        <ConfirmSubmitButton
          className="rounded bg-blue-700 px-3 py-1 text-sm font-medium text-white"
          message={`${selectedRows.length}명을 일괄 처리할까요?`}
        >
          일괄 저장
        </ConfirmSubmitButton>
      </form>
      <button className="ml-auto text-sm text-slate-500 hover:text-slate-800" onClick={onClear} type="button">
        선택 해제
      </button>
    </div>
  )
}
