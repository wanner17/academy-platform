'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAcademyMember } from '@/lib/auth/authorization'
import { authConfig } from '@/lib/integrations/auth/config'
import { testCategoryService } from '@/lib/services/test-category.service'

async function readContext(formData: FormData) {
  const slug = String(formData.get('slug') ?? '')
  const session = await getServerSession(authConfig)
  const { academy, user } = await requireAcademyMember(session, slug)
  const redirectTo = String(formData.get('redirectTo') ?? '') || `/admin/${slug}/test-categories`
  return { academy, slug, user, redirectTo }
}

function revalidate(slug: string) {
  revalidatePath(`/admin/${slug}/test-categories`)
  revalidatePath(`/admin/${slug}/tests`)
  revalidatePath(`/admin/${slug}/programs`, 'layout')
}

export async function createTestCategoryAction(formData: FormData) {
  const { academy, slug, user, redirectTo } = await readContext(formData)
  await testCategoryService.createCategory(academy.id, {
    name: String(formData.get('name') ?? ''),
    color: String(formData.get('color') ?? '#6366f1'),
    authorId: user.id,
  })
  revalidate(slug)
  redirect(redirectTo)
}

export async function updateTestCategoryAction(formData: FormData) {
  const { academy, slug, redirectTo } = await readContext(formData)
  const id = String(formData.get('id') ?? '')
  await testCategoryService.updateCategory(id, academy.id, {
    name: String(formData.get('name') ?? ''),
    color: String(formData.get('color') ?? '#6366f1'),
  })
  revalidate(slug)
  redirect(redirectTo)
}

export async function deleteTestCategoryAction(formData: FormData) {
  const { academy, slug, redirectTo } = await readContext(formData)
  const id = String(formData.get('id') ?? '')
  await testCategoryService.deleteCategory(id, academy.id)
  revalidate(slug)
  redirect(redirectTo)
}
