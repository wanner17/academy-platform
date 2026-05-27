import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { NoticeFields } from '@/components/admin/notice-fields'
import { createNoticeAction } from '../actions'
import { requireAdminPage } from '@/lib/auth/server'

type NewNoticePageProps = {
  params: Promise<{ slug: string }>
}

export default async function NewNoticePage({ params }: NewNoticePageProps) {
  const { slug } = await params
  await requireAdminPage(slug)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/notices`}>
        ← 공지 관리
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">공지 작성</h1>
        <form action={createNoticeAction} className="space-y-4" encType="multipart/form-data">
          <input type="hidden" name="slug" value={slug} />
          <NoticeFields slug={slug} />
          <ConfirmSubmitButton
            className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
            message="공지를 저장할까요?"
          >
            저장
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}
