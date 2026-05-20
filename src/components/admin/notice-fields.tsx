import { NoticeAttachmentInput } from '@/components/admin/notice-attachment-input'
import { SmartEditor } from '@/components/admin/smart-editor'

type NoticeFieldsProps = {
  defaults?: {
    content: string
    isPinned: boolean
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    title: string
  }
  showStatus?: boolean
  slug: string
}

export function NoticeFields({ defaults, showStatus = false, slug }: NoticeFieldsProps) {
  return (
    <>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">제목</span>
        <input className="w-full rounded border px-3 py-2" defaultValue={defaults?.title ?? ''} name="title" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">내용</span>
        <SmartEditor defaultValue={defaults?.content ?? ''} name="content" required slug={slug} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        {showStatus ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium">상태</span>
            <select className="w-full rounded border px-3 py-2" defaultValue={defaults?.status ?? 'PUBLISHED'} name="status">
              <option value="DRAFT">초안</option>
              <option value="PUBLISHED">게시</option>
              <option value="ARCHIVED">보관</option>
            </select>
          </label>
        ) : null}
        <label className="flex items-end gap-2 text-sm">
          <input defaultChecked={defaults?.isPinned ?? false} name="isPinned" type="checkbox" value="true" />
          고정 공지
        </label>
      </div>
      <NoticeAttachmentInput slug={slug} />
    </>
  )
}
