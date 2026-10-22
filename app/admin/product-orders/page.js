'use client'

import { Link, useRouter } from '../../../src/router'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Clock, Trash2, Search, Filter, RotateCcw } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../lib/supabase/client'
import { getCsrfTokenFromBrowser } from '../../../lib/csrf-client'
import styles from './page.module.css'
import { apiFetch } from '../../../lib/api-client'

const orderDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  dateStyle: 'medium',
  timeStyle: 'short',
})

const statuses = ['all', 'pending', 'processing', 'completed', 'cancelled']

// WhatsApp sharing removed from admin UI per request

export default function AdminProductOrdersPage() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [adminEmail, setAdminEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, completed: 0, cancelled: 0 })

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getUser()

        if (!data?.user) {
          router.push('/admin/login')
          return
        }

        setAdminEmail(data.user.email || '')
        await loadOrders()
        } catch {
          router.push('/admin/login')
      }
    }

    bootstrap()
  }, [router, supabase])

  const loadOrders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiFetch('/api/product-orders')
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setOrders(data || [])
      applyFilters(data || [], searchTerm, filterStatus)
      calculateStats(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load product orders'
      setError(errorMessage)
      setOrders([])
      setFilteredOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = (ordersToFilter, search, status) => {
    let filtered = [...ordersToFilter]

    if (status !== 'all') {
      filtered = filtered.filter((order) => order.status === status)
    }

    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.name?.toLowerCase().includes(query) ||
          order.email?.toLowerCase().includes(query) ||
          order.phone?.includes(search) ||
          order.id?.toLowerCase().includes(query) ||
          order.paymentReference?.toLowerCase().includes(query) ||
          String(order.paymentTransactionId || '').toLowerCase().includes(query)
      )
    }

    setFilteredOrders(filtered)
  }

  const calculateStats = (ordersToCalc) => {
    setStats({
      total: ordersToCalc.length,
      pending: ordersToCalc.filter((order) => order.status === 'pending').length,
      processing: ordersToCalc.filter((order) => order.status === 'processing').length,
      completed: ordersToCalc.filter((order) => order.status === 'completed').length,
      cancelled: ordersToCalc.filter((order) => order.status === 'cancelled').length,
    })
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    applyFilters(orders, value, filterStatus)
  }

  const handleFilterStatus = (status) => {
    setFilterStatus(status)
    applyFilters(orders, searchTerm, status)
  }

  const updateOrderStatus = async (id, nextStatus) => {
    try {
      const response = await apiFetch(`/api/product-orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromBrowser(),
        },
        body: JSON.stringify({ status: nextStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update product order status')
      }

      await loadOrders()
    } catch {
      await loadOrders()
    }
  }

  const deleteOrder = async (id) => {
    if (!window.confirm('Delete this product order?')) return

    try {
      const response = await apiFetch(`/api/product-orders/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': getCsrfTokenFromBrowser(),
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete product order')
      }

      await loadOrders()
    } catch {
      await loadOrders()
    }
  }

  const statCards = useMemo(
    () => [
      { label: 'Total Orders', value: stats.total, icon: '#', className: styles.statCardOrange },
      { label: 'Pending', value: stats.pending, icon: 'P', className: styles.statCardPink },
      { label: 'Processing', value: stats.processing, icon: 'IP', className: styles.statCardBlue },
      { label: 'Completed', value: stats.completed, icon: 'OK', className: styles.statCardGreen },
      { label: 'Cancelled', value: stats.cancelled, icon: 'X', className: styles.statCardRed },
    ],
    [stats]
  )

  useEffect(() => {
    if (!orders.length) return
    applyFilters(orders, searchTerm, filterStatus)
  }, [orders, searchTerm, filterStatus])

  return (
    <div className={styles.page}>
      <div className={`container ${styles.containerWrap}`}>
        <div className={styles.headerCard}>
          <div>
            <h1 className={styles.brandTitle}>Product Orders</h1>
            <p className={styles.brandSub}>Admin Dashboard - {adminEmail}</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/admin/dashboard" className={styles.catalogButton}>
              <ArrowLeft size={18} /> Back to Dashboard
            </Link>
            <button
              onClick={() => loadOrders()}
              disabled={isLoading}
              className={styles.catalogButton}
              title="Refresh orders"
            >
              <RotateCcw size={18} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        <div className={styles.statsGrid}>
          {statCards.map((stat, index) => (
            <div key={index} className={`${styles.statCard} ${stat.className}`}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statLabel}>{stat.label}</div>
                      <div className={styles.statValue}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className={styles.filtersCard}>
          <div className={styles.searchGroup}>
            <Search size={18} className={styles.filterIcon} />
            <input
              type="text"
              placeholder="Search customer, order ID, or payment reference..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.searchInput}
              disabled={isLoading}
            />
          </div>
          <div className={styles.filterButtonsWrap}>
            <Filter size={18} className={styles.filterIcon} />
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => handleFilterStatus(status)}
                disabled={isLoading}
                className={`${styles.filterButton} ${filterStatus === status ? styles.filterButtonActive : ''}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="fixed-notice" style={{
            background: '#fee',
            border: '1px solid #fcc',
            color: '#c33',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <strong>Error:</strong> {error}
            <button
              onClick={() => loadOrders()}
              style={{
                marginLeft: '1rem',
                padding: '0.5rem 1rem',
                background: '#c33',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Retry
            </button>
          </div>
        )}

        <div className={styles.tableCard}>
          {isLoading ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Loading orders...</p>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeaderRow}>
                    <th className={styles.tableHeadCell}>Customer</th>
                    <th className={styles.tableHeadCell}>Payment</th>
                    <th className={styles.tableHeadCell}>Items</th>
                    <th className={styles.tableHeadCell}>Order Preference</th>
                    <th className={styles.tableHeadCell}>Status</th>
                    <th className={styles.tableHeadCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className={styles.tableRow}>
                      <td className={styles.tableCell}>
                        <div className={styles.clientName}>{order.name}</div>
                        <div className={styles.clientMeta}>{order.email || 'No email provided'}</div>
                        <div className={styles.clientMeta}>{order.phone}</div>
                        <div className={styles.clientMeta}>Ref: {order.id}</div>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.clientName}>
                          {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'initialized' ? 'Paystack opened — awaiting payment' : 'Payment pending'}
                        </div>
                        {order.paymentAmount != null && (
                          <div className={styles.clientMeta}>{order.paymentCurrency || 'GHS'} {Number(order.paymentAmount).toFixed(2)}</div>
                        )}
                        <div className={styles.clientMeta}>Method: {order.paymentMethod || '—'}</div>
                        <div className={styles.clientMeta}>Channel: {order.paymentChannel || '—'}</div>
                        <div className={styles.clientMeta}>Paystack ref: {order.paymentReference || '—'}</div>
                        <div className={styles.clientMeta}>Transaction ID: {order.paymentTransactionId || '—'}</div>
                        {order.paymentDetails?.authorization?.last4 && (
                          <div className={styles.clientMeta}>
                            {order.paymentDetails.authorization.brand || order.paymentDetails.authorization.cardType || 'Card'} •••• {order.paymentDetails.authorization.last4}
                          </div>
                        )}
                        {order.paidAt && <div className={styles.clientMeta}>Paid: {orderDateFormatter.format(new Date(order.paidAt))}</div>}
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.serviceText}>
                          {(order.items || []).map((item) => (
                            <div key={`${order.id}-${item.id}`} className={styles.itemLine}>
                              {item.name} x{item.quantity || 1}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.clientMeta}>{order.address}</div>
                        <div className={styles.clientMeta}>{order.note || 'No note'}</div>
                        <div className={styles.clientMeta}>
                          <Clock size={14} className={styles.dateIcon} /> {orderDateFormatter.format(new Date(order.orderedAt))}
                        </div>
                      </td>
                      <td className={styles.tableCell}>
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className={styles.statusSelect}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className={styles.tableCell}>
                        <div className={styles.actionsCell}>
                          <button type="button" className={styles.deleteButton} onClick={() => deleteOrder(order.id)}>
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.noItems}>No product orders found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
