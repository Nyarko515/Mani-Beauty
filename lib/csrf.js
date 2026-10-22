export const CSRF_COOKIE_NAME = 'sb-csrf-token'
export const CSRF_HEADER_NAME = 'x-csrf-token'

export function ensureCsrfCookie(request, response) {
  const existing = request.cookies.get(CSRF_COOKIE_NAME)?.value
  if (existing) return

  const token = crypto.randomUUID().replace(/-/g, '')
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
}

export function isValidCsrfRequest(request) {
  const authorization = request.headers.get('authorization') || ''
  if (authorization.toLowerCase().startsWith('bearer ')) {
    return true
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken) {
    return false
  }

  return cookieToken === headerToken
}
