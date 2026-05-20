import { getAcademyBySlug } from '@/lib/utils/tenant'
import { AcademyGalleryFields } from '@/components/admin/academy-gallery-fields'
import { MainHeroImageField } from '@/components/admin/main-hero-image-field'
import { updateAcademySettingsAction } from './actions'
import { ConfirmSubmitButton } from '@/components/confirm-submit-button'
import { requireAdminPage } from '@/lib/auth/server'
import { academyGalleryService } from '@/lib/services/academy-gallery.service'

type SettingsPageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ error?: string; saved?: string }>
}

export default async function SettingsPage({ params, searchParams }: SettingsPageProps) {
  const { slug } = await params
  await requireAdminPage(slug)
  const { saved } = await searchParams
  const { error } = await searchParams
  const academy = await getAcademyBySlug(slug)
  const galleryImages = await academyGalleryService.getAdminImages(academy.id)

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-4 text-2xl font-bold">기본 설정</h1>

      {saved === '1' ? (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          저장되었습니다.
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <form action={updateAcademySettingsAction} className="space-y-6">
        <input type="hidden" name="slug" value={slug} />
        <section className="space-y-4 rounded-lg border bg-white p-5">
          <h2 className="text-xl font-bold">기본 정보</h2>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">학원명</span>
            <input className="w-full rounded border px-3 py-2" defaultValue={academy.name} name="name" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">소개</span>
            <textarea
              className="min-h-32 w-full rounded border px-3 py-2"
              defaultValue={academy.description ?? ''}
              name="description"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">전화</span>
              <input className="w-full rounded border px-3 py-2" defaultValue={academy.phone ?? ''} name="phone" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">이메일</span>
              <input
                className="w-full rounded border px-3 py-2"
                defaultValue={academy.email ?? ''}
                name="email"
                type="email"
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">주소</span>
            <input className="w-full rounded border px-3 py-2" defaultValue={academy.address ?? ''} name="address" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">지도 URL</span>
            <input className="w-full rounded border px-3 py-2" defaultValue={academy.mapUrl ?? ''} name="mapUrl" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">네이버 블로그 URL</span>
              <input
                className="w-full rounded border px-3 py-2"
                defaultValue={academy.naverBlogUrl ?? ''}
                name="naverBlogUrl"
                placeholder="https://blog.naver.com/..."
                type="url"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">인스타그램 URL</span>
              <input
                className="w-full rounded border px-3 py-2"
                defaultValue={academy.instagramUrl ?? ''}
                name="instagramUrl"
                placeholder="https://www.instagram.com/..."
                type="url"
              />
            </label>
          </div>
          <MainHeroImageField imageUrl={academy.heroImageUrl} slug={slug} />
        </section>
        <AcademyGalleryFields images={galleryImages} slug={slug} />
        <ConfirmSubmitButton
          className="rounded bg-blue-700 px-4 py-2 font-medium text-white"
          message="기본 설정을 저장할까요?"
        >
          저장
        </ConfirmSubmitButton>
      </form>
    </main>
  )
}
