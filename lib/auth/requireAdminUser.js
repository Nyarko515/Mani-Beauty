import { NextResponse } from '../../server/http.js'
import { isAdminEmail, getAdminAllowlist } from './admin'
import { createSupabaseServerClient } from '../supabase/server'
import { getRequestContext } from '../../server/request-context.js'

export async function requireAdminUser() {
  try {
    const supabase = createSupabaseServerClient()
    const request = getRequestContext()?.request
    const authHeader = request?.headers.get('authorization') || ''
    const bearerToken = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : ''
    const { data, error } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser()

    if (error || !data?.user) {
      return {
        data: null,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    if (!isAdminEmail(data.user.email)) {
      return {
        data: null,
        response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      }
    }

    return { data: { user: data.user }, response: null }
  } catch (err) {
    // If Supabase is not configured (local dev), allow access using the first
    // address in the admin allowlist so admin pages can operate against the
    // local JSON fallback (data/product-orders.json).
    if (process.env.NODE_ENV !== 'production') {
      const devEmail = (getAdminAllowlist()[0]) || 'admin@manibeauty.com'
      return { data: { user: { email: devEmail } }, response: null }
    }

    return {
      data: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }
}
