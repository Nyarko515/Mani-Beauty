import { readFile } from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

function parseEnvValue(raw) {
  const trimmed = raw.trim()

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

async function loadLocalEnv(envPath) {
  const content = await readFile(envPath, 'utf-8')
  const map = {}

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue

    const key = trimmed.slice(0, idx).trim()
    const value = parseEnvValue(trimmed.slice(idx + 1))
    map[key] = value
  }

  return map
}

function chunkArray(items, size) {
  const chunks = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

async function upsertInChunks(supabase, table, rows, onConflict) {
  if (!rows.length) return

  const chunks = chunkArray(rows, 200)

  for (const chunk of chunks) {
    const { error } = await supabase.from(table).upsert(chunk, { onConflict })
    if (error) {
      throw new Error(`Upsert failed for ${table}: ${error.message}`)
    }
  }
}

async function main() {
  const root = process.cwd()
  const envPath = path.join(root, '.env.local')
  const env = await loadLocalEnv(envPath)

  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRole) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }

  const supabase = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const bookingsData = JSON.parse(await readFile(path.join(root, 'data', 'bookings.json'), 'utf-8'))
  const catalogData = JSON.parse(await readFile(path.join(root, 'data', 'catalog.json'), 'utf-8'))
  const auditData = JSON.parse(await readFile(path.join(root, 'data', 'audit-logs.json'), 'utf-8'))

  const bookingsRows = bookingsData.map((b) => ({
    id: b.id,
    name: b.name,
    email: b.email,
    phone: b.phone,
    service: b.service,
    service_label: b.serviceLabel,
    date: b.date,
    time: b.time,
    notes: b.notes || '',
    status: b.status || 'pending',
    booked_date: b.bookedDate,
  }))

  const auditRows = auditData.map((a) => ({
    id: a.id,
    timestamp: a.timestamp,
    email: a.email,
    action: a.action,
    details: a.details || {},
  }))

  await upsertInChunks(supabase, 'bookings', bookingsRows, 'id')

  const { error: catalogError } = await supabase
    .from('catalog')
    .upsert(
      {
        id: 1,
        payload: catalogData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

  if (catalogError) {
    throw new Error(`Upsert failed for catalog: ${catalogError.message}`)
  }

  await upsertInChunks(supabase, 'audit_logs', auditRows, 'id')

  const [{ count: bookingsCount, error: bookingsCountError }, { count: auditCount, error: auditCountError }] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
  ])

  if (bookingsCountError) {
    throw new Error(`Could not verify bookings count: ${bookingsCountError.message}`)
  }

  if (auditCountError) {
    throw new Error(`Could not verify audit_logs count: ${auditCountError.message}`)
  }

  const { data: catalogRow, error: catalogReadError } = await supabase
    .from('catalog')
    .select('id, updated_at')
    .eq('id', 1)
    .maybeSingle()

  if (catalogReadError) {
    throw new Error(`Could not verify catalog row: ${catalogReadError.message}`)
  }

  console.log('Migration complete.')
  console.log(`bookings: ${bookingsCount ?? 0}`)
  console.log(`audit_logs: ${auditCount ?? 0}`)
  console.log(`catalog row present: ${catalogRow ? 'yes' : 'no'}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
