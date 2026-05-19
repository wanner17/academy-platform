import { mkdir, unlink, writeFile } from 'fs/promises'
import path from 'path'
import type { SaveObjectInput, StorageProvider } from '@/lib/storage/storage-provider'

export class LocalStorageProvider implements StorageProvider {
  constructor(
    private readonly rootDir = path.join(process.cwd(), 'public', 'uploads'),
    private readonly publicBasePath = '/uploads',
  ) {}

  async saveObject(input: SaveObjectInput) {
    const filePath = path.join(this.rootDir, input.objectKey)
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, input.data)

    return {
      objectKey: input.objectKey,
      publicUrl: `${this.publicBasePath}/${input.objectKey.replaceAll('\\', '/')}`,
    }
  }

  async deleteObject(objectKey: string) {
    const filePath = path.join(this.rootDir, objectKey)
    await unlink(filePath).catch(() => undefined)
  }
}
