import { supabase } from '@/lib/supabase/client'

const AVATAR_BUCKET = 'avatars'
const OUTPUT_SIZE = 400
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export interface AvatarResult {
  url?: string
  path?: string
  error?: string
}

export function validateImage(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED.includes(file.type)) return { valid: false, error: 'JPEG, PNG, or WebP only' }
  if (file.size > MAX_BYTES) return { valid: false, error: 'Image must be under 5 MB' }
  return { valid: true }
}

export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const size = Math.min(img.width, img.height)
      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, sx, sy, size, size, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
        'image/webp',
        0.85
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = objectUrl
  })
}

export async function uploadAvatar(userId: string, file: File): Promise<AvatarResult> {
  if (!supabase) return { error: 'Not configured' }
  const check = validateImage(file)
  if (!check.valid) return { error: check.error }

  let blob: Blob
  try {
    blob = await compressImage(file)
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Compression failed' }
  }

  const path = `${userId}/avatar.webp`
  const { error: uploadErr } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, blob, { contentType: 'image/webp', upsert: true })

  if (uploadErr) return { error: uploadErr.message }

  const { data: { publicUrl } } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(path)

  const url = `${publicUrl}?v=${Date.now()}`

  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ avatar_url: url, avatar_storage_path: path, avatar_updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (dbErr) return { error: dbErr.message }
  return { url, path }
}

export async function deleteAvatar(userId: string, storagePath: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Not configured' }

  const { error: removeErr } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([storagePath])

  if (removeErr) return { error: removeErr.message }

  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ avatar_url: null, avatar_storage_path: null, avatar_updated_at: new Date().toISOString() })
    .eq('id', userId)

  return dbErr ? { error: dbErr.message } : {}
}

export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}
