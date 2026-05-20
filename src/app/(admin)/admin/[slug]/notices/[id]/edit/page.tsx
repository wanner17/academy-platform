import { notFound } from 'next/navigation'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { noticeService } from '@/lib/services/notice.service'
import { deleteNoticeAttachmentAction, updateNoticeAction } from '../../actions'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { NoticeFields } from '@/components/admin/notice-fields'
import { requireAdminPage } from '@/lib/auth/server'

type EditNoticePageProps = {
  params: Promise<{ slug: string; id: string }>
}

export default async function EditNoticePage({ params }: EditNoticePageProps) {
  const { slug, id } = await params
  await requireAdminPage(slug)
  const academy = await getAcademyBySlug(slug)
  const notice = await noticeService.getNoticeById(id, academy.id).catch(() => null)
  if (!notice) notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-6 inline-block text-sm text-blue-700" href={`/admin/${slug}/notices`}>
        공지 관리
      </a>
      <section className="rounded-lg border bg-white p-5">
        <h1 className="mb-4 text-2xl font-bold">공지 수정</h1>
        <form action={updateNoticeAction} className="space-y-4" encType="multipart/form-data">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="id" value={notice.id} />
          <NoticeFields defaults={notice} showStatus slug={slug} />
          <ConfirmSubmitButton
            className="rounded bg-blue-700 px-4 py-2 font-medium text-white"
            message="공지 수정 내용을 저장할까요?"
          >
            수정 저장
          </ConfirmSubmitButton>
        </form>
        {notice.attachments.length > 0 ? (
          <div className="mt-6 border-t pt-5">
            <h2 className="mb-3 font-semibold">첨부 파일</h2>
            <div className="space-y-2">
              {notice.attachments.map((attachment) => (
                <div className="flex items-center justify-between gap-3 rounded border p-3" key={attachment.id}>
                  <a className="text-sm text-blue-700" href={attachment.publicUrl ?? '#'} target="_blank">
                    {attachment.displayName ?? attachment.objectKey}
                  </a>
                  <form action={deleteNoticeAttachmentAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="noticeId" value={notice.id} />
                    <input type="hidden" name="attachmentId" value={attachment.id} />
                    <ConfirmSubmitButton
                      className="rounded border px-3 py-1 text-sm text-red-700"
                      message="이 첨부를 삭제할까요?"
                    >
                      삭제
                    </ConfirmSubmitButton>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  )
}
