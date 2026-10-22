import { readFile } from 'fs/promises'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

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

async function main() {
  const root = process.cwd()
  let env
  try {
    env = await loadLocalEnv(path.join(root, '.env.local'))
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    env = await loadLocalEnv(path.join(root, '.env'))
  }

  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRole) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }

  const supabase = createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  })

  const paymentColumns = 'id,payment_status,payment_reference,payment_method,payment_amount,payment_currency,payment_channel,payment_transaction_id,payment_details,paid_at'
  const [bookingsCountResult, ordersCountResult, bookingsPaymentResult, ordersPaymentResult, auditCountResult, catalogResult] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('product_orders').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select(paymentColumns).limit(1),
    supabase.from('product_orders').select(paymentColumns).limit(1),
    supabase.from('audit_logs').select('*', { count: 'exact', head: true }),
    supabase.from('catalog').select('id, payload, updated_at').eq('id', 1).maybeSingle(),
  ])

  if (bookingsCountResult.error) {
    throw new Error(`bookings check failed: ${bookingsCountResult.error.message}`)
  }

  if (auditCountResult.error) {
    throw new Error(`audit_logs check failed: ${auditCountResult.error.message}`)
  }

  if (ordersCountResult.error) throw new Error(`product_orders check failed: ${ordersCountResult.error.message}`)
  if (bookingsPaymentResult.error) throw new Error(`bookings payment columns check failed: ${bookingsPaymentResult.error.message}`)
  if (ordersPaymentResult.error) throw new Error(`product_orders payment columns check failed: ${ordersPaymentResult.error.message}`)

  if (catalogResult.error) {
    throw new Error(`catalog check failed: ${catalogResult.error.message}`)
  }

  const catalogPayload = catalogResult.data?.payload || {}
  const serviceCount = Array.isArray(catalogPayload.services) ? catalogPayload.services.length : 0
  const productCount = Array.isArray(catalogPayload.products) ? catalogPayload.products.length : 0

  console.log('Supabase verification complete.')
  console.log(`bookings: ${bookingsCountResult.count ?? 0}`)
  console.log(`product_orders: ${ordersCountResult.count ?? 0}`)
  console.log('payment columns: present on bookings and product_orders')
  console.log(`audit_logs: ${auditCountResult.count ?? 0}`)
  console.log(`catalog row: ${catalogResult.data ? 'present' : 'missing'}`)
  console.log(`catalog services: ${serviceCount}`)
  console.log(`catalog products: ${productCount}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
