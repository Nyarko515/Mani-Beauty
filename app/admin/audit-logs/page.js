'use client'

import { Link, useRouter } from '../../../src/router'
import { useEffect, useState } from 'react'
import { ArrowLeft, Calendar, User, FileText, Filter } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../lib/supabase/client'
import styles from '../dashboard/page.module.css'
import { apiFetch } from '../../../lib/api-client'

const auditDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function AuditLogsPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [logs, setLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])
  const [filterAction, setFilterAction] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const bootstrap = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data?.user) {
        router.push('/admin/login')
        return
      }

      await loadAuditLogs()
    }

    bootstrap()
  }, [router, supabase])

  const loadAuditLogs = async () => {
    try {
      const response = await apiFetch('/api/admin/audit-logs')
      if (!response.ok) {
        throw new Error('Failed to load audit logs')
      }

      const data = await response.json()
      setLogs(data)
      filterLogs(data, filterAction)
      setError('')
    } catch (err) {
      setError('Could not load the activity history. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const filterLogs = (logsToFilter, action) => {
    let filtered = logsToFilter
    if (action !== 'all') {
      filtered = logsToFilter.filter(log => log.action === action)
    }
    setFilteredLogs(filtered)
  }

  const handleFilterAction = (action) => {
    setFilterAction(action)
    filterLogs(logs, action)
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'UPDATE_BOOKING_STATUS':
        return '#FF8C42'
      case 'DELETE_BOOKING':
        return '#EF4444'
      case 'UPDATE_CATALOG':
        return '#228B22'
      case 'LOGIN_ATTEMPT':
        return '#6366F1'
      default:
        return '#6B7280'
    }
  }

  const getActionLabel = (action) => {
    const labels = {
      UPDATE_BOOKING_STATUS: 'Update Booking Status',
      DELETE_BOOKING: 'Delete Booking',
      UPDATE_CATALOG: 'Update Catalog',
      LOGIN_ATTEMPT: 'Login Attempt',
    }
    return labels[action] || action
  }

  const uniqueActions = ['all', ...new Set(logs.map(l => l.action))]

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={`container ${styles.containerWrap}`}>
          <p>Loading audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={`container ${styles.containerWrap}`}>
        <div className={styles.headerCard}>
          <div>
            <h1 className={styles.brandTitle}>
              <span className={styles.brandGradient}>Activity</span>
              <span className={styles.brandSolid}>History</span>
            </h1>
            <p className={styles.brandSub}>A record of important changes made in the admin area</p>
          </div>
          <Link href="/admin/dashboard" className={styles.catalogButton}>
            <ArrowLeft size={18} /> Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="fixed-notice" style={{ padding: '1rem', backgroundColor: '#FEE2E2', borderRadius: '0.5rem', marginBottom: '1.5rem', color: '#DC2626' }}>
            {error}
          </div>
        )}

        <div className={styles.filtersCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Filter size={18} style={{ color: '#6B7280' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#6B7280' }}>Show:</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {uniqueActions.map((action) => (
              <button
                key={action}
                onClick={() => handleFilterAction(action)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #E5E7EB',
                  backgroundColor: filterAction === action ? '#228B22' : '#FFFFFF',
                  color: filterAction === action ? '#FFFFFF' : '#6B7280',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: filterAction === action ? 600 : 400,
                }}
              >
                {action === 'all' ? 'All Actions' : getActionLabel(action)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.tableCard}>
          {filteredLogs.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeaderRow}>
                    <th className={styles.tableHeadCell}>Timestamp</th>
                    <th className={styles.tableHeadCell}>Admin Email</th>
                    <th className={styles.tableHeadCell}>Action</th>
                    <th className={styles.tableHeadCell}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className={styles.tableRow}>
                      <td className={`${styles.tableCell} ${styles.cellText}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                          <Calendar size={14} />
                          {auditDateFormatter.format(new Date(log.timestamp))}
                        </div>
                      </td>
                      <td className={`${styles.tableCell} ${styles.cellText}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                          <User size={14} />
                          {log.email}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '9999px',
                            backgroundColor: getActionColor(log.action) + '20',
                            color: getActionColor(log.action),
                            fontSize: '0.85rem',
                            fontWeight: 500,
                          }}
                        >
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className={styles.tableCell}>
                        <details style={{ cursor: 'pointer' }}>
                          <summary style={{ fontSize: '0.9rem', color: '#228B22' }}>
                            <FileText size={14} style={{ marginRight: '0.5rem' }} />
                            View
                          </summary>
                          <pre
                            style={{
                              marginTop: '0.75rem',
                              padding: '0.75rem',
                              backgroundColor: '#F9FAFB',
                              borderRadius: '0.375rem',
                              fontSize: '0.85rem',
                              overflow: 'auto',
                              maxHeight: '300px',
                              maxWidth: '400px',
                            }}
                          >
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No audit logs found</p>
              <p className={styles.emptyText}>Admin actions will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
