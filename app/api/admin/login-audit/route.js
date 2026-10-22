import { NextResponse } from '../../../../server/http.js'
import { logAdminAction } from '../../../../lib/audit'
import { checkRateLimit, getClientIp } from '../../../../lib/rateLimit'

export async function POST(request) {
  try {
    const ip = getClientIp(request)

    const rateLimit = await checkRateLimit(`${ip}:login:audit`, 'LOGIN')
    if (rateLimit.limited) {
      return NextResponse.json({ error: 'Too many login attempts' }, { status: 429, headers: rateLimit.headers })
    }

    const { email, success } = await request.json()

    if (!email || typeof success !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    await logAdminAction('system', 'LOGIN_ATTEMPT', {
      email: email.toLowerCase(),
      success,
      ip,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log login attempt', details: error.message }, { status: 500 })
  }
}
