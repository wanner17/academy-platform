import { getAcademyBySlug } from '@/lib/utils/tenant'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { requireMemberPage } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

type AdminHomePageProps = {
  params: Promise<{ slug: string }>
}

export default async function AdminHomePage({ params }: AdminHomePageProps) {
  const { slug } = await params
  const { user } = await requireMemberPage(slug)
  if (!isAcademyAdminRole(user.role)) redirect(`/admin/${slug}/my`)
  const academy = await getAcademyBySlug(slug)

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">{academy.name} 관리자</h1>
      <p className="mb-6 text-slate-600">공지와 상담 문의를 관리합니다.</p>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <a className="rounded-lg border bg-white p-5 shadow-sm" href={`/admin/${slug}/settings`}>
          <h2 className="font-semibold">기본 설정</h2>
          <p className="mt-1 text-sm text-slate-600">학원명, 소개, 연락처, 주소를 수정합니다.</p>
        </a>
        <a className="rounded-lg border bg-white p-5 shadow-sm" href={`/admin/${slug}/programs`}>
          <h2 className="font-semibold">수업 관리</h2>
          <p className="mt-1 text-sm text-slate-600">학교별/수준별 수업을 관리합니다.</p>
        </a>
        <a className="rounded-lg border bg-white p-5 shadow-sm" href={`/admin/${slug}/teachers`}>
          <h2 className="font-semibold">강사진 관리</h2>
          <p className="mt-1 text-sm text-slate-600">강사 소개와 공개 여부를 관리합니다.</p>
        </a>
        <a className="rounded-lg border bg-white p-5 shadow-sm" href={`/admin/${slug}/students`}>
          <h2 className="font-semibold">학생 관리</h2>
          <p className="mt-1 text-sm text-slate-600">학생 계정과 수강 수업을 관리합니다.</p>
        </a>
        <a className="rounded-lg border bg-white p-5 shadow-sm" href={`/admin/${slug}/notices`}>
          <h2 className="font-semibold">공지 관리</h2>
          <p className="mt-1 text-sm text-slate-600">사용자 사이트 공지를 작성하고 삭제합니다.</p>
        </a>
        <a className="rounded-lg border bg-white p-5 shadow-sm" href={`/admin/${slug}/inquiries`}>
          <h2 className="font-semibold">문의 관리</h2>
          <p className="mt-1 text-sm text-slate-600">방문자 상담 문의를 확인하고 상태를 변경합니다.</p>
        </a>
      </div>
    </main>
  )
}
