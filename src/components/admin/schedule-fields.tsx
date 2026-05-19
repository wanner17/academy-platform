import { dayLabels } from '@/lib/schedule-labels'

type ScheduleFieldsProps = {
  programId?: string
  defaults?: {
    title: string
    subject: string | null
    teacher: string | null
    room: string | null
    dayOfWeek: number
    startTime: string
    endTime: string
    color: string | null
    isActive: boolean
  }
}

export function ScheduleFields({ defaults, programId }: ScheduleFieldsProps) {
  return (
    <>
      {programId ? <input name="programId" type="hidden" value={programId} /> : null}
      <label className="block">
        <span className="mb-1 block text-sm font-medium">수업명</span>
        <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.title ?? ''} name="title" required />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">요일</span>
          <select className="w-full rounded border px-3 py-2" defaultValue={defaults?.dayOfWeek ?? 0} name="dayOfWeek">
            {dayLabels.map((label, index) => (
              <option key={label} value={index}>
                {label}요일
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">색상</span>
          <input className="h-10 w-full rounded border px-2" defaultValue={defaults?.color ?? '#2563EB'} name="color" type="color" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">시작</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.startTime ?? '16:00'} name="startTime" required type="time" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">종료</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.endTime ?? '18:00'} name="endTime" required type="time" />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">과목</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.subject ?? ''} name="subject" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">강사</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.teacher ?? ''} name="teacher" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">교실</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.room ?? ''} name="room" />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input defaultChecked={defaults?.isActive ?? true} name="isActive" type="checkbox" value="true" />
        공개
      </label>
    </>
  )
}
