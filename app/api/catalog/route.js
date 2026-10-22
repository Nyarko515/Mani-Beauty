import { NextResponse } from '../../../server/http.js'
import { requireAdminUser } from '../../../lib/auth/requireAdminUser'
import { getCatalog, saveCatalog } from '../../../lib/dataStore'
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit'
import { logAdminAction } from '../../../lib/audit'
import { isValidCsrfRequest } from '../../../lib/csrf'

export async function GET() {
  try {
    const catalog = await getCatalog()
    return NextResponse.json(catalog)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load catalog', details: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`${ip}:catalog:put`, 'API_WRITE')
    if (rateLimit.limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers })
    }

    const { data, response } = await requireAdminUser()
    if (response) return response

    if (!isValidCsrfRequest(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }

    const payload = await request.json()

    if (!payload || !Array.isArray(payload.services) || !Array.isArray(payload.products)) {
      return NextResponse.json({ error: 'Invalid catalog format' }, { status: 400 })
    }

    await saveCatalog(payload)

    await logAdminAction(data.user.email, 'UPDATE_CATALOG', {
      serviceCount: payload.services.length,
      productCount: payload.products.length,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save catalog', details: error.message }, { status: 500 })
  }
}
