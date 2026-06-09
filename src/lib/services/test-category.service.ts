import {
  testCategoryRepository,
  type CreateTestCategoryInput,
  type UpdateTestCategoryInput,
} from '@/lib/repositories/test-category.repository'

export const testCategoryService = {
  getCategories(academyId: string, authorId: string | null) {
    if (!authorId) return testCategoryRepository.findAll(academyId)
    return testCategoryRepository.findByUser(academyId, authorId)
  },

  async getCategoryById(id: string, academyId: string) {
    const category = await testCategoryRepository.findById(id, academyId)
    if (!category) throw new Error('Test category not found')
    return category
  },

  createCategory(academyId: string, data: CreateTestCategoryInput) {
    const name = data.name.trim()
    if (!name) throw new Error('Category name is required')
    return testCategoryRepository.create(academyId, { ...data, name })
  },

  async updateCategory(id: string, academyId: string, data: UpdateTestCategoryInput) {
    await this.getCategoryById(id, academyId)
    const name = data.name?.trim()
    if (data.name !== undefined && !name) throw new Error('Category name is required')
    return testCategoryRepository.update(id, academyId, { ...data, ...(name ? { name } : {}) })
  },

  async deleteCategory(id: string, academyId: string) {
    await this.getCategoryById(id, academyId)
    return testCategoryRepository.delete(id, academyId)
  },
}
