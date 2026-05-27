import { requireStudentPage } from '@/lib/auth/server'
import { messageService } from '@/lib/services/message.service'
import { markMessageReadAction, deleteStudentMessageAction } from '../actions'

type Props = { params: Promise<{ slug: string }> }

function formatDate(d: Date) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(d))
}

export default async function StudentMessagesPage({ params }: Props) {
  const { slug } = await params
  const { academy, user } = await requireStudentPage(slug)
  const messages = await messageService.getInbox(academy.id, user.id)
  const unreadCount = messages.filter((m) => !m.isRead).length

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="pub-h2">받은 쪽지함</h1>
        {unreadCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-medium text-red-600">
            {unreadCount}개 읽지 않음
          </span>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="rounded-xl border bg-white px-6 py-12 text-center text-slate-400">
          받은 쪽지가 없습니다.
        </div>
      ) : (
        <ul className="space-y-3">
          {messages.map((msg) => (
            <li
              key={msg.id}
              className={`rounded-xl border bg-white p-5 ${!msg.isRead ? 'border-l-4 border-l-blue-400' : ''}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-800">{msg.sender.name}</span>
                    {!msg.isRead && (
                      <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[11px] font-semibold text-white">NEW</span>
                    )}
                    <span className="text-xs text-slate-400">{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-slate-700">{msg.content}</p>
                  {msg.link && (
                    <a
                      className="mt-2 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                      href={msg.link}
                    >
                      바로가기
                      <svg fill="none" height="12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24" width="12">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {!msg.isRead && (
                    <form action={markMessageReadAction}>
                      <input name="slug" type="hidden" value={slug} />
                      <input name="id" type="hidden" value={msg.id} />
                      <button className="rounded-lg border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50" type="submit">
                        읽음
                      </button>
                    </form>
                  )}
                  <form action={deleteStudentMessageAction}>
                    <input name="slug" type="hidden" value={slug} />
                    <input name="id" type="hidden" value={msg.id} />
                    <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50" type="submit">
                      삭제
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
