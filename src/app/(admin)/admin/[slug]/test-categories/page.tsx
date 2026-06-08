import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { requireMemberPage } from '@/lib/auth/server'
import { testCategoryService } from '@/lib/services/test-category.service'
import { createTestCategoryAction, deleteTestCategoryAction, updateTestCategoryAction } from './actions'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function TestCategoriesPage({ params }: Props) {
  const { slug } = await params
  const { academy, user } = await requireMemberPage(slug)
  const categories = await testCategoryService.getCategories(academy.id, user.id)

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <a className="mb-2 inline-block text-sm text-blue-700" href={`/admin/${slug}/tests`}>
        ← 테스트 관리
      </a>
      <h1 className="mb-1 text-2xl font-bold">테스트 구분 관리</h1>
      <p className="mb-6 text-sm text-slate-500">내 구분만 표시됩니다. 다른 강사의 구분은 별도로 관리됩니다.</p>

      <div className="mb-8 rounded-lg border bg-white p-5">
        <h2 className="mb-4 font-semibold">구분 추가</h2>
        <form action={createTestCategoryAction} className="flex flex-wrap items-end gap-3">
          <input name="slug" type="hidden" value={slug} />
          <label className="block flex-1 min-w-[160px]">
            <span className="mb-1 block text-sm font-medium">구분명</span>
            <input className="w-full rounded border px-3 py-2 text-sm" name="name" placeholder="예: 단어 테스트" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">색상</span>
            <input className="h-[38px] w-16 cursor-pointer rounded border px-1 py-1" defaultValue="#6366f1" name="color" type="color" />
          </label>
          <button className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white" type="submit">
            추가
          </button>
        </form>
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">색상</th>
              <th className="px-4 py-3 font-medium">구분명</th>
              <th className="px-4 py-3 text-right font-medium">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="px-4 py-3">
                  <span className="inline-block h-5 w-5 rounded-full border border-slate-200" style={{ backgroundColor: cat.color }} />
                </td>
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <details className="relative">
                      <summary className="cursor-pointer list-none rounded border px-3 py-1 text-sm hover:bg-slate-50">수정</summary>
                      <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-lg border bg-white p-4 shadow-lg">
                        <form action={updateTestCategoryAction} className="space-y-3">
                          <input name="slug" type="hidden" value={slug} />
                          <input name="id" type="hidden" value={cat.id} />
                          <label className="block">
                            <span className="mb-1 block text-xs font-medium">구분명</span>
                            <input className="w-full rounded border px-3 py-1.5 text-sm" defaultValue={cat.name} name="name" required />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-xs font-medium">색상</span>
                            <input className="h-9 w-full cursor-pointer rounded border px-1 py-1" defaultValue={cat.color} name="color" type="color" />
                          </label>
                          <button className="w-full rounded bg-blue-700 px-3 py-1.5 text-sm font-medium text-white" type="submit">저장</button>
                        </form>
                      </div>
                    </details>
                    <form action={deleteTestCategoryAction}>
                      <input name="slug" type="hidden" value={slug} />
                      <input name="id" type="hidden" value={cat.id} />
                      <ConfirmSubmitButton
                        className="rounded border px-3 py-1 text-sm text-red-700"
                        message={`"${cat.name}" 구분을 삭제할까요? 연결된 테스트 결과의 구분이 초기화됩니다.`}
                      >
                        삭제
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 ? (
              <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={3}>등록된 구분이 없습니다.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </main>
  )
}
