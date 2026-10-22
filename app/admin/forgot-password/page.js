'use client'

import { useState } from 'react'
import { useRouter } from '../../../src/router'
import { Mail, AlertCircle, CheckCircle, ArrowLeft, ShieldCheck } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../lib/supabase/client'
import styles from '../login/page.module.css'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSendReset = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    // Build reset URL more reliably
    const resetUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.host}/admin/reset-password`
      : 'http://localhost:3000/admin/reset-password'

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: resetUrl,
    })

    if (resetError) {
      setError('Failed to send reset email. Please try again.')
    } else {
      setSuccess(true)
      setEmail('')
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
          <p className={styles.headerSub}>Reset Password</p>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Forgot Password?</h2>
          <p style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '1.5rem' }}>
            Enter your email and we'll send you a link to reset your password.
          </p>

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
                Check your email for a reset link. It expires in 1 hour.
              </p>
            </div>
          )}

          <form onSubmit={handleSendReset}>
            <div className={styles.fieldWrap}>
              <label className={styles.fieldLabel}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className={styles.fieldInput}
                disabled={isLoading || success}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || success}
              className={`${styles.submitButton} ${isLoading ? styles.submitButtonLoading : ''}`}
            >
              <Mail size={20} />
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <button
            onClick={() => router.push('/admin/login')}
            style={{
              marginTop: '1rem',
              background: 'none',
              border: 'none',
              color: '#228B22',
              cursor: 'pointer',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              gap: '0.5rem',
            }}
          >
            <ArrowLeft size={18} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
