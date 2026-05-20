import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { ScheduleFields } from '@/components/admin/schedule-fields'
import { createScheduleAction } from '../actions'
import { requireAdminPage } from '@/lib/auth/server'

type NewSchedulePageProps = {
  params: Promise<{ slug: string }>
}

export default async function NewSchedulePage({ params }: NewSchedulePageProps) {
  const { slug } = await params
  await requireAdminPage(slug)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/schedule`}>
        시간표 관리
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">시간표 등록</h1>
        <form action={createScheduleAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <ScheduleFields />
          <ConfirmSubmitButton
            className="w-full rounded bg-blue-700 px-4 py-2 font-medium text-white"
            message="시간표를 저장할까요?"
          >
            저장
          </ConfirmSubmitButton>
        </form>
      </section>
    </main>
  )
}
