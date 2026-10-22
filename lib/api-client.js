const CONFIGURED_API_BASE_URL = String(process.env.VITE_API_URL || '').replace(/\/$/, '')
const API_BASE_URL = process.env.NODE_ENV === 'production' ? CONFIGURED_API_BASE_URL : ''

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath
}

async function getSupabaseAccessToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    const { createSupabaseBrowserClient } = await import('./supabase/client')
    const supabase = createSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token || ''
  } catch {
    return ''
  }
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = await getSupabaseAccessToken()

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(apiUrl(path), {
    credentials: 'include',
    ...options,
    headers,
  })
}
