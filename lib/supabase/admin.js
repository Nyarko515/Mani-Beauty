import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'

let supabaseAdminClient = null

export function hasSupabaseAdminConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function getSupabaseAdminClient() {
  if (!hasSupabaseAdminConfig()) {
    return null
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        realtime: {
          transport: WebSocket,
        },
      }
    )
  }

  return supabaseAdminClient
}
