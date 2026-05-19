import { getAcademyBySlug } from '@/lib/utils/tenant'
import { noticeService } from '@/lib/services/notice.service'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function AcademyHomePage({ params }: PageProps) {
  const { slug } = await params
  const academy = await getAcademyBySlug(slug)
  const { items } = await noticeService.getPublicNotices(academy.id, 1, 5)

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="mb-10">
        <p className="mb-3 text-sm font-medium text-blue-700">학원 플랫폼 MVP</p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight">{academy.name}</h1>
        <p className="max-w-2xl text-slate-600">{academy.description ?? '학원 소개를 준비 중입니다.'}</p>
        <dl className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
          {academy.phone ? (
            <div className="rounded-lg border bg-white p-4">
              <dt className="mb-1 font-medium">전화</dt>
              <dd>{academy.phone}</dd>
            </div>
          ) : null}
          {academy.email ? (
            <div className="rounded-lg border bg-white p-4">
              <dt className="mb-1 font-medium">이메일</dt>
              <dd>{academy.email}</dd>
            </div>
          ) : null}
          {academy.address ? (
            <div className="rounded-lg border bg-white p-4">
              <dt className="mb-1 font-medium">주소</dt>
              <dd>{academy.address}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">최근 공지</h2>
          <a className="text-sm text-blue-700" href={`/${slug}/notices`}>
            전체 보기
          </a>
        </div>
        <div className="divide-y rounded-lg border bg-white">
          {items.map((notice) => (
            <article key={notice.id} className="p-4">
              <h3 className="font-medium">
                <a href={`/${slug}/notices/${notice.id}`}>{notice.title}</a>
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{notice.content}</p>
            </article>
          ))}
          {items.length === 0 ? <p className="p-4 text-sm text-slate-500">공지 없음</p> : null}
        </div>
      </section>
    </main>
  )
}
