import { requireMemberPage } from '@/lib/auth/server'
import { messageService } from '@/lib/services/message.service'
import { sendMessageAction, markReadAction, deleteInboxMessageAction, deleteSentMessageAction } from './actions'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { RecipientSelector } from '@/components/admin/recipient-selector'

type Props = { params: Promise<{ slug: string }> }

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d))
}

export default async function AdminMessagesPage({ params }: Props) {
  const { slug } = await params
  const { academy, user } = await requireMemberPage(slug)

  const [recipients, inbox, sent] = await Promise.all([
    messageService.getRecipients(academy.id, user.role, user.id),
    messageService.getInbox(academy.id, user.id),
    messageService.getSent(academy.id, user.id),
  ])

  const unreadCount = inbox.filter((m) => !m.isRead).length

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold">쪽지</h1>

      {/* 쪽지 보내기 */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">쪽지 보내기</h2>
        <form action={sendMessageAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <div>
            <label className="mb-1 block text-sm font-medium">수신자 선택</label>
            {recipients.length === 0 ? (
              <p className="text-sm text-slate-500">수신 가능한 대상이 없습니다.</p>
            ) : (
              <RecipientSelector recipients={recipients} />
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">내용</label>
            <textarea
              name="content"
              rows={4}
              required
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="쪽지 내용을 입력하세요"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            전송
          </button>
        </form>
      </section>

      {/* 받은 쪽지함 */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            받은 쪽지함
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                {unreadCount}
              </span>
            )}
          </h2>
        </div>
        {inbox.length === 0 ? (
          <p className="px-6 py-4 text-sm text-slate-500">받은 쪽지가 없습니다.</p>
        ) : (
          <ul className="divide-y">
            {inbox.map((msg) => (
              <li key={msg.id} className={`px-6 py-4 ${!msg.isRead ? 'bg-blue-50' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{msg.sender.name}</span>
                      {!msg.isRead && (
                        <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">NEW</span>
                      )}
                      <span className="text-xs text-slate-400">{formatDate(msg.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700">{msg.content}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!msg.isRead && (
                      <form action={markReadAction}>
                        <input type="hidden" name="slug" value={slug} />
                        <input type="hidden" name="id" value={msg.id} />
                        <button type="submit" className="rounded border px-3 py-1 text-xs hover:bg-slate-50">
                          읽음
                        </button>
                      </form>
                    )}
                    <form action={deleteInboxMessageAction}>
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="id" value={msg.id} />
                      <button type="submit" className="rounded border border-red-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50">
                        삭제
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 보낸 쪽지함 */}
      <section className="rounded-lg border bg-white overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">보낸 쪽지함</h2>
        </div>
        {sent.length === 0 ? (
          <p className="px-6 py-4 text-sm text-slate-500">보낸 쪽지가 없습니다.</p>
        ) : (
          <ul className="divide-y">
            {sent.map((msg) => (
              <li key={msg.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">→ {msg.receiver.name}</span>
                      <span className="text-xs text-slate-400">{formatDate(msg.createdAt)}</span>
                      {msg.isRead ? (
                        <span className="text-xs text-slate-400">읽음</span>
                      ) : (
                        <span className="text-xs text-blue-500">미읽음</span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-600">{msg.content}</p>
                  </div>
                  <form action={deleteSentMessageAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={msg.id} />
                    <button type="submit" className="shrink-0 rounded border border-red-200 px-3 py-1 text-xs text-red-500 hover:bg-red-50">
                      삭제
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
