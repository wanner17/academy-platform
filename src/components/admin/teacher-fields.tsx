import { SmartEditor } from '@/components/admin/smart-editor'
import { TeacherMediaFields } from '@/components/admin/teacher-media-fields'

type TeacherFieldsProps = {
  defaults?: {
    bio: string | null
    isActive: boolean
    name: string
    order: number
    profileImageUrl?: string | null
    subject: string
    introVideoUrl?: string | null
    introVideoUrls?: string | null
    user?: { email: string } | null
  }
  slug: string
}

export function TeacherFields({ defaults, slug }: TeacherFieldsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">이름</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.name ?? ''} name="name" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">과목</span>
          <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.subject ?? ''} name="subject" required />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">소개</span>
        <SmartEditor defaultValue={defaults?.bio ?? ''} minHeight={170} name="bio" slug={slug} />
      </label>
      <TeacherMediaFields imageUrl={defaults?.profileImageUrl} slug={slug} videoUrls={defaults?.introVideoUrls ?? defaults?.introVideoUrl} />
      <div className="rounded border bg-slate-50 p-4">
        <p className="mb-3 text-sm font-medium">강사 로그인 계정</p>
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
      <div className="flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">정렬</span>
          <input className="w-24 rounded border px-3 py-2" defaultValue={defaults?.order ?? 0} name="order" type="number" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input defaultChecked={defaults?.isActive ?? true} name="isActive" type="checkbox" value="true" />
          공개
        </label>
      </div>
    </>
  )
}
