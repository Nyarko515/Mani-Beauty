import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { getSupabaseAdminClient } from './supabase/admin'

const auditPath = path.join(process.cwd(), 'data', 'audit-logs.json')

function mapAuditRowToModel(row) {
  return {
    id: row.id,
    timestamp: row.timestamp,
    email: row.email,
    action: row.action,
    details: row.details || {},
  }
}

export async function readAuditLogs() {
  const supabase = getSupabaseAdminClient()

  if (supabase) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500)

    if (error) {
      throw new Error(`Failed to load audit logs from database: ${error.message}`)
    }

    return (data || []).map(mapAuditRowToModel)
  }

  try {
    const raw = await readFile(auditPath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function writeAuditLogs(logs) {
  const supabase = getSupabaseAdminClient()

  if (supabase) {
    const rows = logs.map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      email: entry.email,
      action: entry.action,
      details: entry.details || {},
    }))

    const { error: deleteError } = await supabase
      .from('audit_logs')
      .delete()
      .not('id', 'is', null)

    if (deleteError) {
      throw new Error(`Failed to reset audit logs in database: ${deleteError.message}`)
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase.from('audit_logs').insert(rows)
      if (insertError) {
        throw new Error(`Failed to save audit logs to database: ${insertError.message}`)
      }
    }

    return
  }

  await writeFile(auditPath, `${JSON.stringify(logs, null, 2)}\n`, 'utf-8')
}

export async function logAdminAction(email, action, details = {}) {
  const entry = {
    id: `AUDIT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    email,
    action,
    details,
  }

  const supabase = getSupabaseAdminClient()
  if (supabase) {
    const { error } = await supabase.from('audit_logs').insert({
      id: entry.id,
      timestamp: entry.timestamp,
      email: entry.email,
      action: entry.action,
      details: entry.details,
    })

    if (error) {
      throw new Error(`Failed to write audit log to database: ${error.message}`)
    }

    return entry
  }

  const logs = await readAuditLogs()

  logs.unshift(entry)

  // Keep only last 500 logs to avoid sprawl
  if (logs.length > 500) {
    logs.pop()
  }

  await writeAuditLogs(logs)
  return entry
}

export function scrubDetailsForAudit(details) {
  const scrubbed = { ...details }
  delete scrubbed.password
  delete scrubbed.resetToken
  return scrubbed
}
