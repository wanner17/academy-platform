import { SchoolSelect } from '@/components/admin/school-select'

type StudentFieldsProps = {
  defaults?: {
    grade: string | null
    isActive: boolean
    memo: string | null
    name: string
    parentPhone: string | null
    phone: string | null
    schoolName: string | null
    user?: { email: string } | null
  }
  schools?: string[]
}

export function StudentFields({ defaults, schools = [] }: StudentFieldsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">이름</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.name ?? ''} name="name" required />
        </label>
        <div className="block">
          <span className="mb-1 block text-sm font-medium">학교</span>
          {schools.length > 0 ? (
            <SchoolSelect defaultValue={defaults?.schoolName} schools={schools} />
          ) : (
            <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.schoolName ?? ''} name="schoolName" />
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">학년</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.grade ?? ''} name="grade" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">학생 연락처</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.phone ?? ''} name="phone" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">학부모 연락처</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.parentPhone ?? ''} name="parentPhone" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">메모</span>
        <textarea className="min-h-24 w-full rounded border px-3 py-2" defaultValue={defaults?.memo ?? ''} name="memo" />
      </label>
      <div className="rounded border bg-slate-50 p-4">
        <p className="mb-3 text-sm font-medium">학생 로그인 계정</p>
        {defaults?.user ? (
          <p className="text-sm text-slate-600">{defaults.user.email}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">로그인 이메일</span>
              <input className="w-full rounded border px-3 py-2" name="loginEmail" type="email" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">임시 비밀번호</span>
              <input className="w-full rounded border px-3 py-2" minLength={8} name="loginPassword" type="password" />
            </label>
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input defaultChecked={defaults?.isActive ?? true} name="isActive" type="checkbox" value="true" />
        활성
      </label>
    </>
  )
}
