import { redirect } from 'next/navigation'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { requireMemberPage } from '@/lib/auth/server'
import { teacherService } from '@/lib/services/teacher.service'
import { updateMyPasswordAction, updateMyTeacherAction } from './actions'

type MyProfilePageProps = {
  params: Promise<{ slug: string }>
}

export default async function MyProfilePage({ params }: MyProfilePageProps) {
  const { slug } = await params
  const { academy, user } = await requireMemberPage(slug)
  if (isAcademyAdminRole(user.role)) redirect(`/admin/${slug}`)

  const teacher = await teacherService.getTeacherByUserId(user.id, academy.id)

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10 lg:grid-cols-2">
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">내 정보</h1>
        <form action={updateMyTeacherAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">이름</span>
            <input className="w-full rounded border px-3 py-2" defaultValue={teacher.name} name="name" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">과목</span>
            <input className="w-full rounded border px-3 py-2" defaultValue={teacher.subject} name="subject" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">소개</span>
            <textarea className="min-h-40 w-full rounded border px-3 py-2" defaultValue={teacher.bio ?? ''} name="bio" />
          </label>
          <ConfirmSubmitButton
            className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
            message="내 정보를 저장할까요?"
          >
            저장
          </ConfirmSubmitButton>
        </form>
      </section>

      <section className="rounded-lg border bg-white p-5">
        <h2 className="mb-4 text-2xl font-bold">비밀번호 설정</h2>
        <form action={updateMyPasswordAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">현재 비밀번호</span>
            <input className="w-full rounded border px-3 py-2" name="currentPassword" required type="password" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">새 비밀번호</span>
            <input className="w-full rounded border px-3 py-2" minLength={8} name="newPassword" required type="password" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">새 비밀번호 확인</span>
            <input className="w-full rounded border px-3 py-2" minLength={8} name="confirmPassword" required type="password" />
          </label>
          <ConfirmSubmitButton
            className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
            message="비밀번호를 변경할까요?"
          >
            변경
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}
