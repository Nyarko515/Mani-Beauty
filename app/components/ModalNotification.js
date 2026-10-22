'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Loader, AlertCircle, X } from 'lucide-react'
import styles from './ModalNotification.module.css'

/**
 * ModalNotification Component
 * 
 * A modal pop-up notification that displays prominently on screen
 * Perfect for showing success after bookings, orders, or payments
 * 
 * Props:
 *   - isOpen: boolean - Whether to show the modal
 *   - type: 'success' | 'error' | 'loading' - Notification type
 *   - title: string - Main title/heading
 *   - message: string - Main message text
 *   - details: string[] - Optional array of additional details
 *   - actions: array - Optional action buttons [{label, onClick, primary}]
 *   - onClose: function - Callback when user closes modal
 *   - reference: string - Optional reference ID/number to display
 *   - autoClose: boolean - Auto-close after 8 seconds (default: false)
 * 
 * Example usage:
 *   <ModalNotification
 *     isOpen={isSuccess}
 *     type="success"
 *     title="Booking Confirmed!"
 *     message="We'll contact you shortly."
 *     reference={bookingId}
 *     actions={[{label: 'Close', onClick: () => setIsSuccess(false), primary: true}]}
 *     onClose={() => setIsSuccess(false)}
 *   />
 */
export default function ModalNotification({
  isOpen,
  type = 'success',
  title,
  message,
  details = [],
  actions = [],
  onClose,
  reference,
  autoClose = false,
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(isOpen)

    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) onClose()
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, onClose])

  const handleClose = () => {
    setIsVisible(false)
    if (onClose) onClose()
  }

  if (!isVisible) return null

  const typeConfig = {
    success: {
      icon: CheckCircle,
      bgClass: styles.modalSuccess,
      headerClass: styles.headerSuccess,
      iconColor: '#10b981',
    },
    error: {
      icon: AlertCircle,
      bgClass: styles.modalError,
      headerClass: styles.headerError,
      iconColor: '#ef4444',
    },
    loading: {
      icon: Loader,
      bgClass: styles.modalLoading,
      headerClass: styles.headerLoading,
      iconColor: '#3b82f6',
      isSpinning: true,
    },
  }

  const config = typeConfig[type] || typeConfig.success
  const IconComponent = config.icon

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={handleClose} aria-hidden="true" />

      {/* Modal */}
      <div className={`${styles.modal} ${config.bgClass}`} role="alertdialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Close Button */}
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close notification"
          type="button"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className={styles.content}>
          {/* Icon */}
          <div className={`${styles.iconWrapper} ${config.headerClass}`}>
            <IconComponent
              size={48}
              className={config.isSpinning ? styles.spinner : ''}
              style={{ color: config.iconColor }}
            />
          </div>

          {/* Title */}
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>

          {/* Message */}
          {message && <p className={styles.message}>{message}</p>}

          {/* Reference ID */}
          {reference && (
            <div className={styles.referenceBox}>
              <p className={styles.referenceLabel}>Confirmation Reference:</p>
              <p className={styles.referenceValue}>{reference}</p>
            </div>
          )}

          {/* Details List */}
          {details && details.length > 0 && (
            <ul className={styles.detailsList}>
              {details.map((detail, idx) => (
                <li key={idx} className={styles.detailItem}>
                  {detail}
                </li>
              ))}
            </ul>
          )}

          {/* Action Buttons */}
          {actions && actions.length > 0 && (
            <div className={styles.actionsContainer}>
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  className={`${styles.actionButton} ${action.primary ? styles.actionButtonPrimary : styles.actionButtonSecondary}`}
                  onClick={() => {
                    action.onClick?.()
                    handleClose()
                  }}
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
