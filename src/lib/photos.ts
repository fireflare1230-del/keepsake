/**
 * Photo storage (PDR v1.3 §1), the ONLY module that touches IndexedDB.
 *
 * Photos are far too big for localStorage, so they live in a small
 * IndexedDB store instead, downscaled on import so a dozen photos costs
 * a few megabytes. Photos never leave the device: not in JSON backups,
 * not in cloud backups, by design.
 */

export interface PhotoMeta {
  id: string
  profileId: string
  caption: string
  createdAt: string // ISO
}

export interface StoredPhoto extends PhotoMeta {
  blob: Blob
}

export const MAX_PHOTOS_PER_PROFILE = 12
const DB_NAME = 'keepsake-photos'
const STORE = 'photos'
const MAX_EDGE = 1280
const JPEG_QUALITY = 0.82

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('byProfile', 'profileId', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

/** Downscale to a friendly size; falls back to the original on any hiccup. */
async function downscale(file: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.type === 'image/jpeg') return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    )
    return blob ?? file
  } catch {
    return file
  }
}

export async function addPhoto(
  profileId: string,
  file: Blob,
  caption: string
): Promise<PhotoMeta> {
  const blob = await downscale(file)
  const photo: StoredPhoto = {
    id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10),
    profileId,
    caption: caption.trim(),
    createdAt: new Date().toISOString(),
    blob,
  }
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).put(photo)
  await txDone(tx)
  db.close()
  const { blob: _omitted, ...meta } = photo
  return meta
}

/** All photos for a profile, oldest first, with their blobs. */
export async function listPhotos(profileId: string): Promise<StoredPhoto[]> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readonly')
  const index = tx.objectStore(STORE).index('byProfile')
  const photos = await new Promise<StoredPhoto[]>((resolve, reject) => {
    const request = index.getAll(profileId)
    request.onsuccess = () => resolve(request.result as StoredPhoto[])
    request.onerror = () => reject(request.error)
  })
  db.close()
  return photos.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
}

export async function updateCaption(id: string, caption: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  const photo = await new Promise<StoredPhoto | undefined>((resolve, reject) => {
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result as StoredPhoto | undefined)
    request.onerror = () => reject(request.error)
  })
  if (photo) store.put({ ...photo, caption: caption.trim() })
  await txDone(tx)
  db.close()
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).delete(id)
  await txDone(tx)
  db.close()
}

/** Called when a profile is deleted; its photos go with it. */
export async function deleteProfilePhotos(profileId: string): Promise<void> {
  const photos = await listPhotos(profileId)
  if (!photos.length) return
  const db = await openDb()
  const tx = db.transaction(STORE, 'readwrite')
  for (const photo of photos) tx.objectStore(STORE).delete(photo.id)
  await txDone(tx)
  db.close()
}
