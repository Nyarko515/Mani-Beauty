const DEFAULT_ADMIN_EMAILS = ['admin@manibeauty.com']

export function getAdminAllowlist() {
  const source = process.env.ADMIN_EMAIL_ALLOWLIST

  if (!source || !source.trim()) {
    return DEFAULT_ADMIN_EMAILS
  }

  return source
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email) {
  if (!email) return false
  return getAdminAllowlist().includes(email.toLowerCase())
}
