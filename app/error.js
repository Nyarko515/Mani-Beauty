'use client'

import { Link } from '../src/router'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import styles from './error.module.css'

export default function GlobalError({ error, reset }) {
  return (
    <div className={styles.wrap} role="alert" aria-live="assertive">
      <div className={styles.card}>
        <div className={styles.iconBox}>
          <AlertTriangle size={34} />
        </div>
        <h1 className={styles.title}>Something went wrong</h1>
        <p className={styles.text}>
          We could not load this page right now. Please try again or return home.
        </p>
        <p className={styles.detail}>
          An unexpected error occurred.
        </p>
        <div className={styles.actions}>
          <button onClick={reset} className={`btn btn-primary ${styles.button}`}>
            <RefreshCw size={18} />
            Try again
          </button>
          <Link href="/" className={`btn btn-outline ${styles.button}`}>
            <Home size={18} />
            Go home
          </Link>
        </div>
      </div>
    </div>
  )
}
