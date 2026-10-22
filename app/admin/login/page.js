'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from '../../../src/router'
import { LogIn, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../lib/supabase/client'
import { apiFetch } from '../../../lib/api-client'
import styles from './page.module.css'

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

export default function AdminLogin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const unauthorizedMessage =
    searchParams.get('error') === 'unauthorized'
      ? 'Your account is not authorized for admin access.'
      : ''

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simple client-side rate limiting
    const attemptKey = `login_attempts_${email}`
    const attempts = JSON.parse(localStorage.getItem(attemptKey) || JSON.stringify({ count: 0, blockedUntil: 0 }))
    const now = Date.now()

    if (attempts.blockedUntil > now) {
      const minutesLeft = Math.ceil((attempts.blockedUntil - now) / 60000)
      setError(`Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`)
      setIsLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (!signInError) {
      // Log the successful login attempt
      await apiFetch('/api/admin/login-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), success: true }),
      }).catch(() => {})
      
      localStorage.removeItem(attemptKey)
      router.push('/admin/dashboard')
    } else {
      // Increment failed attempts
      attempts.count += 1
      if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        attempts.blockedUntil = now + LOCKOUT_DURATION
        setError(`Too many failed attempts. Please try again in 15 minutes.`)
      } else {
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - attempts.count
        setError(`Invalid email or password. ${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining.`)
      }
      localStorage.setItem(attemptKey, JSON.stringify(attempts))

      // Log the failed login attempt
      await apiFetch('/api/admin/login-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), success: false }),
      }).catch(() => {})
    }

    setIsLoading(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <ShieldCheck className={styles.brandIcon} aria-hidden="true" />
          <h1 className={styles.brandTitle}>
            <span className={styles.brandGradient}>Mani</span>
            <span className={styles.brandSolid}>Beauty</span>
          </h1>
          <p className={styles.headerSub}>Admin Dashboard</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Admin Login</h2>

          {unauthorizedMessage && !error && (
            <div className={styles.errorBox}>
              <AlertCircle size={20} className={styles.errorIcon} />
              <p className={styles.errorText}>{unauthorizedMessage}</p>
            </div>
          )}

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={20} className={styles.errorIcon} />
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className={styles.fieldWrap}>
              <label className={styles.fieldLabel}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.fieldWrapPassword}>
              <label className={styles.fieldLabel}>Password</label>
              <div className={styles.passwordFieldWrap}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className={`${styles.fieldInput} ${styles.passwordInput}`}
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`${styles.submitButton} ${isLoading ? styles.submitButtonLoading : ''}`}
            >
              <LogIn size={20} />
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                router.push('/admin/forgot-password')
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#228B22',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textDecoration: 'underline',
                padding: '0.5rem',
                fontWeight: 500,
              }}
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
