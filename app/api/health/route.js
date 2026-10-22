import { NextResponse } from '../../../server/http.js'
import { getSupabaseAdminClient } from '../../../lib/supabase/admin'

async function checkSupabase() {
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    return {
      ok: true,
      status: 'skipped',
      reason: 'SUPABASE_SERVICE_ROLE_KEY not configured',
    }
  }

  const { error } = await supabase
    .from('catalog')
    .select('id')
    .eq('id', 1)
    .limit(1)

  if (error) {
    return {
      ok: false,
      status: 'down',
      reason: error.message,
    }
  }

  return {
    ok: true,
    status: 'up',
  }
}

export async function GET() {
  const supabaseCheck = await checkSupabase()

  const checks = {
    api: { ok: true, status: 'up' },
    supabase: supabaseCheck,
  }

  const allUp = Object.values(checks).every((entry) => entry.ok)

  return NextResponse.json(
    {
      status: allUp ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      checks,
    },
    { status: allUp ? 200 : 503 }
  )
}
