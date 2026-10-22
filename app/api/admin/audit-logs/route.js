import { NextResponse } from '../../../../server/http.js'
import { requireAdminUser } from '../../../../lib/auth/requireAdminUser'
import { readAuditLogs } from '../../../../lib/audit'

export async function GET(request) {
  try {
    const { response } = await requireAdminUser()
    if (response) return response

    const logs = await readAuditLogs()
    return NextResponse.json(logs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load audit logs', details: error.message }, { status: 500 })
  }
}
