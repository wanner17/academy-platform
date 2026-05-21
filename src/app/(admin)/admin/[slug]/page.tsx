import { getAcademyBySlug } from '@/lib/utils/tenant'
import { isAcademyAdminRole } from '@/lib/auth/authorization'
import { requireMemberPage } from '@/lib/auth/server'
import { adminPath } from '@/lib/utils/public-path'
import { redirect } from 'next/navigation'

type AdminHomePageProps = {
  params: Promise<{ slug: string }>
}

export default async function AdminHomePage({ params }: AdminHomePageProps) {
  const { slug } = await params
  const { user } = await requireMemberPage(slug)
  if (!isAcademyAdminRole(user.role)) redirect(adminPath(slug, '/my'))
  const academy = await getAcademyBySlug(slug)

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">{academy.name} 관리자</h1>
      <p className="mb-6 text-slate-600">공지와 상담 문의를 관리합니다.</p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <a className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-indigo-500" href={adminPath(slug, '/settings')}>
          <h2 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200">기본 설정</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">학원명, 소개, 연락처, 주소를 수정합니다.</p>
        </a>
        <a className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-emerald-500" href={adminPath(slug, '/programs')}>
          <h2 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors duration-200">수업 관리</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">학교별/수준별 수업을 관리합니다.</p>
        </a>
        <a className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-amber-500" href={adminPath(slug, '/teachers')}>
          <h2 className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors duration-200">강사진 관리</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">강사 소개와 공개 여부를 관리합니다.</p>
        </a>
        <a className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-violet-500" href={adminPath(slug, '/students')}>
          <h2 className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors duration-200">학생 관리</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">학생 계정과 수강 수업을 관리합니다.</p>
        </a>
        <a className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-sky-500" href={adminPath(slug, '/notices')}>
          <h2 className="font-semibold text-slate-900 group-hover:text-sky-600 transition-colors duration-200">공지 관리</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">사용자 사이트 공지를 작성하고 삭제합니다.</p>
        </a>
        <a className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md border-t-4 border-t-rose-500" href={adminPath(slug, '/inquiries')}>
          <h2 className="font-semibold text-slate-900 group-hover:text-rose-600 transition-colors duration-200">문의 관리</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">방문자 상담 문의를 확인하고 상태를 변경합니다.</p>
        </a>
      </div>
    </main>
  )
}
