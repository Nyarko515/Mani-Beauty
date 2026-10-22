'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from '../../../src/router'
import { Lock, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../lib/supabase/client'
import styles from '../login/page.module.css'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [isCheckingToken, setIsCheckingToken] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          setError('Reset link is invalid or expired. Please request a new one.')
          setIsValidToken(false)
        } else if (!data?.session) {
          setError('Reset link is invalid or expired. Please request a new one.')
          setIsValidToken(false)
        } else {
          setIsValidToken(true)
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.')
        setIsValidToken(false)
      }
      setIsCheckingToken(false)
    }

    checkSession()
  }, [supabase])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setIsLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError('Failed to reset password. Please try again.')
    } else {
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        router.push('/admin/login')
      }, 2000)
    }

    setIsLoading(false)
  }

  if (isCheckingToken) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.header}>
            <ShieldCheck className={styles.brandIcon} aria-hidden="true" />
            <h1 className={styles.brandTitle}>
              <span className={styles.brandGradient}>Mani</span>
              <span className={styles.brandSolid}>Beauty</span>
            </h1>
          </div>
          <div className={styles.card}>
            <p>Verifying reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.header}>
            <ShieldCheck className={styles.brandIcon} aria-hidden="true" />
            <h1 className={styles.brandTitle}>
              <span className={styles.brandGradient}>Mani</span>
              <span className={styles.brandSolid}>Beauty</span>
            </h1>
          </div>
          <div className={styles.card}>
            <div className={styles.errorBox}>
              <AlertCircle size={20} className={styles.errorIcon} />
              <p className={styles.errorText}>{error}</p>
            </div>
            <button
              onClick={() => router.push('/admin/forgot-password')}
              className={styles.submitButton}
              style={{ marginTop: '1rem' }}
            >
              Request New Link
            </button>
          </div>
        </div>
      </div>
    )
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
          <p className={styles.headerSub}>Create New Password</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Reset Your Password</h2>

          {error && (
            <div className={styles.errorBox}>
              <AlertCircle size={20} className={styles.errorIcon} />
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          {success && (
            <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', borderRadius: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
              <CheckCircle size={20} style={{ color: '#059669', flexShrink: 0 }} />
              <p style={{ color: '#059669', margin: 0, fontSize: '0.95rem' }}>
                Password reset successful. Redirecting to login...
              </p>
            </div>
          )}

          {!success && (
            <form onSubmit={handleResetPassword}>
              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  className={styles.fieldInput}
                  disabled={isLoading}
                />
              </div>

              <div className={styles.fieldWrapPassword}>
                <label className={styles.fieldLabel}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  required
                  className={styles.fieldInput}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`${styles.submitButton} ${isLoading ? styles.submitButtonLoading : ''}`}
              >
                <Lock size={20} />
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
