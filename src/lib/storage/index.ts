import { LocalStorageProvider } from '@/lib/storage/local-storage-provider'
import { R2StorageProvider, type R2StorageProviderConfig } from '@/lib/storage/r2-storage-provider'
import type { StorageProvider } from '@/lib/storage/storage-provider'

export function getStorageProvider(): StorageProvider {
  if (process.env.STORAGE_DRIVER === 'r2') {
    return new R2StorageProvider(readR2Config())
  }

  return new LocalStorageProvider()
}

export function getR2StorageProvider() {
  return new R2StorageProvider(readR2Config())
}

export type { StorageProvider }

function readR2Config(): R2StorageProviderConfig {
  const accountId = requireEnv('R2_ACCOUNT_ID')
  const accessKeyId = requireEnv('R2_ACCESS_KEY_ID')
  const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY')
  const bucket = requireEnv('R2_BUCKET')
  const publicBaseUrl = requireEnv('R2_PUBLIC_BASE_URL')

  return { accountId, accessKeyId, secretAccessKey, bucket, publicBaseUrl }
}

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required when STORAGE_DRIVER=r2`)
  return value
}
