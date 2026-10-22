import { CSRF_COOKIE_NAME } from './csrf'

export function getCsrfTokenFromBrowser() {
  if (typeof document === 'undefined') return ''

  const entry = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${CSRF_COOKIE_NAME}=`))

  if (!entry) return ''
  return decodeURIComponent(entry.split('=').slice(1).join('='))
}
