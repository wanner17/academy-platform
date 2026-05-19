import { createInquiryAction } from './actions'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'

type ContactPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ submitted?: string }>
}

export default async function ContactPage({ params, searchParams }: ContactPageProps) {
  const { slug } = await params
  const { submitted } = await searchParams
  const academy = await getAcademyBySlug(slug)

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10 md:grid-cols-[320px_1fr]">
      <aside className="rounded-lg border bg-white p-5">
        <h1 className="mb-2 text-2xl font-bold">상담문의</h1>
        <p className="mb-6 text-sm text-slate-600">연락처와 문의 내용을 남기면 학원 담당자가 확인합니다.</p>
        <dl className="space-y-4 text-sm">
          {academy.phone ? (
            <div>
              <dt className="font-medium">전화</dt>
              <dd className="mt-1 text-slate-600">{academy.phone}</dd>
            </div>
          ) : null}
          {academy.email ? (
            <div>
              <dt className="font-medium">이메일</dt>
              <dd className="mt-1 text-slate-600">{academy.email}</dd>
            </div>
          ) : null}
          {academy.address ? (
            <div>
              <dt className="font-medium">주소</dt>
              <dd className="mt-1 text-slate-600">{academy.address}</dd>
            </div>
          ) : null}
        </dl>
      </aside>

      <section>
        {submitted === '1' ? (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            문의가 접수되었습니다.
          </div>
        ) : null}

        <form action={createInquiryAction} className="space-y-4 rounded-lg border bg-white p-5">
          <input type="hidden" name="slug" value={slug} />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">이름</span>
            <input className="w-full rounded border px-3 py-2" name="name" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">연락처</span>
            <input
              className="w-full rounded border px-3 py-2"
              name="phone"
              placeholder="010-1234-5678"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">이메일</span>
            <input className="w-full rounded border px-3 py-2" name="email" type="email" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">제목</span>
            <input className="w-full rounded border px-3 py-2" name="subject" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">문의 내용</span>
            <textarea className="min-h-36 w-full rounded border px-3 py-2" name="content" required />
          </label>
          <ConfirmSubmitButton
            className="rounded bg-blue-700 px-4 py-2 font-medium text-white"
            message="문의 내용을 접수할까요?"
          >
            문의 접수
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}
