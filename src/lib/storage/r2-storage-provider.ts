import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { SaveObjectInput, StorageProvider } from '@/lib/storage/storage-provider'

export type R2StorageProviderConfig = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicBaseUrl: string
}

export class R2StorageProvider implements StorageProvider {
  private readonly client: S3Client

  constructor(private readonly config: R2StorageProviderConfig) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    })
  }

  async saveObject(input: SaveObjectInput) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: input.objectKey,
        Body: input.data,
        ContentType: input.contentType,
      }),
    )

    return {
      objectKey: input.objectKey,
      publicUrl: `${this.config.publicBaseUrl.replace(/\/$/, '')}/${input.objectKey}`,
    }
  }

  async deleteObject(objectKey: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: objectKey,
      }),
    )
  }

  async createPresignedUploadUrl(input: {
    contentType: string
    objectKey: string
  }) {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: input.objectKey,
      ContentType: input.contentType,
    })

    return {
      objectKey: input.objectKey,
      publicUrl: `${this.config.publicBaseUrl.replace(/\/$/, '')}/${input.objectKey}`,
      uploadUrl: await getSignedUrl(this.client, command, { expiresIn: 60 * 5 }),
    }
  }
}
