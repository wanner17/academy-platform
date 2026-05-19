export type StoredObject = {
  objectKey: string
  publicUrl: string | null
}

export type SaveObjectInput = {
  data: Buffer
  objectKey: string
  contentType: string
}

export type StorageProvider = {
  deleteObject(objectKey: string): Promise<void>
  saveObject(input: SaveObjectInput): Promise<StoredObject>
}
