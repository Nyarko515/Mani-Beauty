import { NextResponse } from '../../../../server/http.js'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { requireAdminUser } from '../../../../lib/auth/requireAdminUser'
import { isValidCsrfRequest } from '../../../../lib/csrf'
import { checkRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { getSupabaseAdminClient, hasSupabaseAdminConfig } from '../../../../lib/supabase/admin'

export const runtime = 'nodejs'

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const DEFAULT_STORAGE_BUCKET = 'media'

function normalizeExtension(file) {
  const byMime = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  }

  return byMime[file.type] || path.extname(file.name || '').toLowerCase() || '.jpg'
}

async function ensureStorageBucket(supabase, bucketName) {
  const { error: getBucketError } = await supabase.storage.getBucket(bucketName)
  if (!getBucketError) return

  const looksMissing =
    Number(getBucketError?.statusCode) === 404 ||
    /not found|does not exist/i.test(String(getBucketError?.message || ''))

  if (!looksMissing) {
    throw new Error(`Storage bucket check failed: ${getBucketError.message}`)
  }

  const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: '8MB',
    allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
  })

  if (createBucketError) {
    throw new Error(`Failed to create storage bucket '${bucketName}': ${createBucketError.message}`)
  }
}

export async function POST(request) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`${ip}:admin:uploads:post`, 'API_WRITE')
    if (rateLimit.limited) {
      return NextResponse.json({ error: 'Too many upload attempts. Please try again shortly.' }, { status: 429, headers: rateLimit.headers })
    }

    const { response } = await requireAdminUser()
    if (response) return response

    if (!isValidCsrfRequest(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file found in upload request.' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, and WEBP images are allowed.' }, { status: 400 })
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'Image size must be between 1 byte and 8MB.' }, { status: 400 })
    }

    const extension = normalizeExtension(file)
    const safeBase = String(file.name || 'upload')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 60) || 'upload'

    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${safeBase}${extension}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (hasSupabaseAdminConfig()) {
      const supabase = getSupabaseAdminClient()
      if (!supabase) {
        throw new Error('Supabase admin client is not available for storage upload.')
      }

      const bucketName = String(process.env.SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET).trim()
      await ensureStorageBucket(supabase, bucketName)

      const folder = new Date().toISOString().slice(0, 10)
      const storagePath = `uploads/${folder}/${filename}`

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Supabase storage upload failed: ${uploadError.message}`)
      }

      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(storagePath)
      if (!publicUrlData?.publicUrl) {
        throw new Error('Upload completed but no public URL was returned by Supabase.')
      }

      return NextResponse.json({
        ok: true,
        url: publicUrlData.publicUrl,
        filename,
        storage: 'supabase',
      })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'images', 'uploads')
    await mkdir(uploadsDir, { recursive: true })
    await writeFile(path.join(uploadsDir, filename), buffer)

    return NextResponse.json({
      ok: true,
      url: `/images/uploads/${filename}`,
      filename,
      storage: 'local',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload image', details: error.message }, { status: 500 })
  }
}
