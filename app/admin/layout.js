"use client"

import { useEffect } from 'react'
import styles from './layout.module.css'

export default function AdminLayout({ children }) {
  useEffect(() => {
    // SSR Guard: Only modify DOM on client side after hydration
    if (typeof document !== 'undefined') {
      document.body.classList.add('admin-mode')
      return () => {
        if (typeof document !== 'undefined') {
          document.body.classList.remove('admin-mode')
        }
      }
    }
  }, [])

  return <div className={styles.adminContent}>{children}</div>
}
