'use client'

import { useEffect, useState } from 'react'
import { Link, useSearchParams } from '../../src/router'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import ModalNotification from '../components/ModalNotification'
import { apiFetch } from '../../lib/api-client'

/**
 * Payment verification page
 * Paystack redirects here after payment attempt
 * URL: /payment-result?reference=XXXX
 */
export default function PaymentResult() {
  const searchParams = useSearchParams()
  const reference = searchParams.get('reference')

  const [status, setStatus] = useState('verifying') // 'verifying', 'success', 'failed'
  const [message, setMessage] = useState('Verifying your payment...')
  const [details, setDetails] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const returnPath = reference?.startsWith('booking-') ? '/booking' : '/products'

  useEffect(() => {
    if (!reference) {
      setStatus('failed')
      setMessage('No payment reference found')
      setShowModal(true)
      return
    }

    // Verify payment with backend
    const verifyPayment = async () => {
      try {
        const response = await apiFetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage('Payment successful! Your order has been confirmed.')
          setDetails(data.data)
          setShowModal(true)
        } else {
          setStatus('failed')
          setMessage(data.message || 'Payment verification failed')
          setShowModal(true)
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('failed')
        setMessage('Could not verify payment. Please contact support.')
        setShowModal(true)
      }
    }

    // Wait a moment for webhook to process, then verify
    const timer = setTimeout(verifyPayment, 2000)

    return () => clearTimeout(timer)
  }, [reference])

  return (
    <>
      {/* Loading State - Shown during verification */}
      {status === 'verifying' && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
            <Loader size={48} className="mx-auto mb-4 text-blue-600 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Verifying Payment</h1>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <ModalNotification
        isOpen={showModal && status === 'success'}
        type="success"
        title="Payment Successful! ✅"
        message="Your order has been confirmed and payment received."
        reference={details?.reference}
        details={[
          `Amount Paid: ₵${details?.amount.toFixed(2) || '0.00'}`,
          `Date: ${details?.paidAt ? new Date(details.paidAt).toLocaleString() : 'N/A'}`,
          "Check your email for order confirmation",
          "You'll receive SMS updates about your order",
        ]}
        actions={[
          {
            label: '🛍️ Continue Shopping',
            onClick: () => window.location.href = '/products',
            primary: true,
          },
          {
            label: 'Home',
            onClick: () => window.location.href = '/',
          },
        ]}
        onClose={() => window.location.href = '/products'}
      />

      {/* Failed Modal */}
      <ModalNotification
        isOpen={showModal && status === 'failed'}
        type="error"
        title="Payment Failed ❌"
        message={message}
        reference={reference}
        details={[
          "Please check your card details and try again",
          "If problem persists, please contact support",
          "We could not confirm the payment status; check Paystack before trying again",
        ]}
        actions={[
          {
            label: '🔄 Try Again',
            onClick: () => window.location.href = returnPath,
            primary: true,
          },
          {
            label: '📞 Contact Support',
            onClick: () => window.location.href = '/contact',
          },
          {
            label: 'Home',
            onClick: () => window.location.href = '/',
          },
        ]}
        onClose={() => window.location.href = returnPath}
      />
    </>
  )
}
