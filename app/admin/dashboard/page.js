'use client'

import { Link, useRouter } from '../../../src/router'
import { useState, useEffect } from 'react'
import { LogOut, Calendar, CheckCircle, Clock, Trash2, Search, Filter, RotateCcw } from 'lucide-react'
import { createSupabaseBrowserClient } from '../../../lib/supabase/client'
import { getCsrfTokenFromBrowser } from '../../../lib/csrf-client'
import styles from './page.module.css'
import { apiFetch } from '../../../lib/api-client'

const bookingDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const paymentDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function AdminDashboard() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [adminEmail, setAdminEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0
  })

  useEffect(() => {
    const bootstrap = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data?.user) {
        router.push('/admin/login')
        return
      }

      setAdminEmail(data.user.email || '')
      await loadBookings()
    }

    bootstrap()
  }, [router, supabase])

  const loadBookings = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiFetch('/api/bookings')
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setBookings(data || [])
      filterBookings(data || [], searchTerm, filterStatus)
      calculateStats(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load bookings'
      setError(errorMessage)
      setBookings([])
      setFilteredBookings([])
      setStats({ total: 0, pending: 0, completed: 0, cancelled: 0 })
    } finally {
      setIsLoading(false)
    }
  }

  const filterBookings = (bookingsToFilter, search, status) => {
    let filtered = [...bookingsToFilter]

    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(b => b.status === status)
    }

    // Filter by search term
    if (search) {
      const query = search.toLowerCase()
      filtered = filtered.filter(b =>
        String(b.name || '').toLowerCase().includes(query) ||
        String(b.email || '').toLowerCase().includes(query) ||
        String(b.phone || '').includes(search) ||
        String(b.id || '').toLowerCase().includes(query) ||
        String(b.paymentReference || '').toLowerCase().includes(query) ||
        String(b.paymentTransactionId || '').toLowerCase().includes(query)
      )
    }

    setFilteredBookings(filtered)
  }

  const calculateStats = (bookingsToCalc) => {
    const stats = {
      total: bookingsToCalc.length,
      pending: bookingsToCalc.filter(b => b.status === 'pending').length,
      completed: bookingsToCalc.filter(b => b.status === 'completed').length,
      cancelled: bookingsToCalc.filter(b => b.status === 'cancelled').length
    }
    setStats(stats)
  }

  const handleSearch = (value) => {
    setSearchTerm(value)
    filterBookings(bookings, value, filterStatus)
  }

  const handleFilterStatus = (status) => {
    setFilterStatus(status)
    filterBookings(bookings, searchTerm, status)
  }

  const updateBookingStatus = async (id, newStatus) => {
    try {
      const response = await apiFetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromBrowser(),
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update booking status')
      }

      await loadBookings()
    } catch {
      await loadBookings()
    }
  }

  const deleteBooking = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const response = await apiFetch(`/api/bookings/${id}`, {
          method: 'DELETE',
          headers: {
            'X-CSRF-Token': getCsrfTokenFromBrowser(),
          },
        })

        if (!response.ok) {
          throw new Error('Failed to delete booking')
        }

        await loadBookings()
      } catch {
        await loadBookings()
      }
    }
  }

  const handleLogout = () => {
    supabase.auth.signOut().finally(() => {
      router.push('/admin/login')
    })
  }

  const getServiceLabel = (serviceValue) => {
    // Map service values to labels
    const serviceLabels = {
      'knotless-braids-6-rows': 'Knotless Braids (6 Rows)',
      'fulani-goddess-braids': 'Fulani / Goddess Braids',
      'soft-twist-island-twist': 'Soft Twist / Island Twist',
      'spiral-goddess-french-curls': 'Spiral Goddess / French Curls',
      'spiral-braids': 'Spiral Braids',
      'distressed-butterfly-locs-6-rows': 'Distressed/ Butterfly Locs',
      'faux-soft-locs-6-rows': 'Faux / Soft Locs',
      'small-twists-passion-twists-8-rows': 'Small Twists/ Passion Twists (8 rows)',
      'regular-twists-passion-twists-6-rows': 'Regular Twists/ Passion Twists (6 rows)',
      'regular-box-braids-6-rows': 'Regular Box Braids (6 rows)',
      'straight-back-cornrows': 'Straight Back Cornrows',
      'cornrows-ponytail': 'Cornrows Ponytail',
      'back-cornrows-design': 'Back Cornrows with Design',
      'stitch-cornrows': 'Stitch Cornrows',
      'regular-cornrows-rasta': 'Regular Cornrows Rasta',
      'cornrows-rasta-design': 'Cornrows Rasta (with design)',
      'jayda-wayda-cornrows-weave': 'Jayda Wayda/Cornrows Weave',
      'twists-with-extensions': 'Twists (with extensions)',
      'natural-cornrows-twists': 'Natural Cornrows / Twists',
      'natural-styling': 'Natural Styling',
      'frontal-wig-installation-styling': 'Frontal Wig Installation & Styling',
      'weave-on-closure': 'Weave-on (closure)',
      'weave-on-frontal': 'Weave-on (frontal)',
      'wash-style': 'Wash & Style',
      'deep-conditioning-treatment': 'Deep Conditioning / Treatment',
      'relaxer-texturizer': 'Relaxer / Texturizer',
      'wig-revamp': 'Wig Revamp',
      'straightening-curling-only': 'Straightening/ Curling Only',
      'braids-rejuvenation': 'Braids Rejuvenation'
    }
    return serviceLabels[serviceValue] || serviceValue
  }

  const parseSpecialRequest = (notes) => {
    const rawNotes = String(notes || '').trim()
    if (!rawNotes) {
      return { description: '', referenceImageUrl: '' }
    }

    const referenceMatch = rawNotes.match(/Reference image:\s*(\S+)/i)
    const referenceImageUrl = referenceMatch?.[1] || ''
    const description = rawNotes
      .replace(/Reference image:\s*\S+/i, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    return { description, referenceImageUrl }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return styles.statusPending
      case 'completed':
        return styles.statusCompleted
      case 'cancelled':
        return styles.statusCancelled
      default:
        return styles.statusDefault
    }
  }

  const getStatColorClass = (label) => {
    if (label === 'Total Bookings') return styles.statValueOrange
    if (label === 'Pending') return styles.statValuePink
    if (label === 'Completed') return styles.statValueGreen
    return styles.statValueRed
  }

  return (
    <div className={styles.page}>
      <div className={`container ${styles.containerWrap}`}>
        <div className={styles.headerCard}>
          <div>
            <h1 className={styles.brandTitle}>
              <span className={styles.brandGradient}>Mani</span>
              <span className={styles.brandSolid}>Beauty</span>
            </h1>
            <p className={styles.brandSub}>Admin Dashboard - {adminEmail}</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/admin/catalog" className={styles.catalogButton}>
              Manage Services & Products
            </Link>
            <Link href="/admin/product-orders" className={styles.catalogButton}>
              Product Orders
            </Link>
            <Link href="/admin/audit-logs" className={styles.catalogButton}>
              Activity History
            </Link>
            <button
              onClick={() => loadBookings()}
              disabled={isLoading}
              className={styles.catalogButton}
              title="Refresh bookings"
            >
              <RotateCcw size={18} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button
              onClick={handleLogout}
              className={styles.logoutButton}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        <div className={styles.statsGrid}>
          {[
            { label: 'Total Bookings', value: stats.total, icon: '#', className: styles.statCardOrange },
            { label: 'Pending', value: stats.pending, icon: 'P', className: styles.statCardPink },
            { label: 'Completed', value: stats.completed, icon: 'OK', className: styles.statCardGreen },
            { label: 'Cancelled', value: stats.cancelled, icon: 'X', className: styles.statCardRed },
          ].map((stat, idx) => (
            <div key={idx} className={`${styles.statCard} ${stat.className}`}>
              <div className={styles.statIcon}>{stat.icon}</div>
              <div className={styles.statLabel}>{stat.label}</div>
              <div className={`${styles.statValue} ${getStatColorClass(stat.label)}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className={styles.filtersCard}>
          <div className={styles.searchGroup}>
            <Search size={18} className={styles.filterIcon} />
            <input
              type="text"
              placeholder="Search customer, booking ID, or payment reference..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className={styles.searchInput}
              disabled={isLoading}
            />
          </div>
          <div className={styles.filterButtonsWrap}>
            <Filter size={18} className={styles.filterIcon} />
            {['all', 'pending', 'completed', 'cancelled'].map((status) => (
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
              onClick={() => loadBookings()}
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
              <p className={styles.emptyTitle}>Loading bookings...</p>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeaderRow}>
                    <th className={styles.tableHeadCell}>Client Name</th>
                    <th className={styles.tableHeadCell}>Service</th>
                    <th className={styles.tableHeadCell}>Date & Time</th>
                    <th className={styles.tableHeadCell}>Payment</th>
                    <th className={styles.tableHeadCell}>Status</th>
                    <th className={`${styles.tableHeadCell} ${styles.actionsHead}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => {
                    const statusClass = getStatusColor(booking.status)
                    const specialRequest = parseSpecialRequest(booking.notes)
                    return (
                      <tr key={booking.id} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          <div className={styles.clientName}>{booking.name}</div>
                          <div className={styles.clientMeta}>{booking.email || 'No email provided'}</div>
                          <div className={styles.clientMeta}>{booking.phone}</div>
                        </td>
                        <td className={`${styles.tableCell} ${styles.cellText}`}> 
                          <div className={styles.serviceText}>
                            {booking.serviceLabel || getServiceLabel(booking.service)}
                          </div>
                          {specialRequest.description && (
                            <div className={styles.bookingNote}>
                              {specialRequest.description}
                            </div>
                          )}
                          {specialRequest.referenceImageUrl && (
                            <div className={styles.bookingPhotoWrap}>
                              <a
                                href={specialRequest.referenceImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.bookingPhotoLink}
                              >
                                <img
                                  src={specialRequest.referenceImageUrl}
                                  alt={`${booking.name} reference braid photo`}
                                  className={styles.bookingPhotoThumb}
                                />
                              </a>
                              <a
                                href={specialRequest.referenceImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.bookingNoteLink}
                              >
                                View reference photo
                              </a>
                            </div>
                          )}
                        </td>
                        <td className={`${styles.tableCell} ${styles.cellText}`}>
                          <div className={styles.dateRow}>
                            <Calendar size={14} className={styles.dateIcon} />
                            {bookingDateFormatter.format(new Date(booking.date))}
                          </div>
                          <div className={styles.timeRow}>
                            <Clock size={14} className={styles.timeIcon} />
                            {booking.time}
                          </div>
                        </td>
                        <td className={`${styles.tableCell} ${styles.cellText}`}>
                          <div className={styles.serviceText}>
                            {booking.paymentStatus === 'paid' ? 'Paid' : booking.paymentStatus === 'not-required' ? 'Price pending' : booking.paymentStatus === 'initialized' ? 'Paystack opened — awaiting payment' : 'Payment pending'}
                          </div>
                          {booking.paymentAmount != null && (
                            <div className={styles.clientMeta}>{booking.paymentCurrency || 'GHS'} {Number(booking.paymentAmount).toFixed(2)}</div>
                          )}
                          <div className={styles.clientMeta}>Method: {booking.paymentMethod || '—'}</div>
                          <div className={styles.clientMeta}>Channel: {booking.paymentChannel || '—'}</div>
                          <div className={styles.clientMeta}>Paystack ref: {booking.paymentReference || '—'}</div>
                          <div className={styles.clientMeta}>Transaction ID: {booking.paymentTransactionId || '—'}</div>
                          {booking.paymentDetails?.authorization?.last4 && (
                            <div className={styles.clientMeta}>
                              {booking.paymentDetails.authorization.brand || booking.paymentDetails.authorization.cardType || 'Card'} •••• {booking.paymentDetails.authorization.last4}
                            </div>
                          )}
                          {booking.paidAt && <div className={styles.clientMeta}>Paid: {paymentDateFormatter.format(new Date(booking.paidAt))}</div>}
                        </td>
                        <td className={styles.tableCell}>
                          <select
                            value={booking.status}
                            onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                            className={`${styles.statusSelect} ${statusClass}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className={`${styles.tableCell} ${styles.actionsCell}`}>
                          <button
                            onClick={() => deleteBooking(booking.id)}
                            className={styles.deleteButton}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>No bookings found</p>
              <p className={styles.emptyText}>There are no bookings matching your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
