import { createBrowserClient } from '@supabase/ssr'
import { getAdminAllowlist } from '../auth/admin'

let browserClient = null

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Return a lightweight stub for local development so admin pages
    // can bootstrap and load the local JSON fallback without Supabase.
    const devEmail = getAdminAllowlist()[0] || 'admin@manibeauty.com'
    return {
      auth: {
        getUser: async () => ({ data: { user: { email: devEmail } } }),
      },
    }
  }

  if (!browserClient) {
    browserClient = createBrowserClient(url, key)
  }

  return browserClient
}
