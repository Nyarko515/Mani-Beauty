import crypto from 'node:crypto'

/**
 * Paystack Integration Utility
 *
 * Handles all Paystack API interactions
 * Docs: https://paystack.com/docs/api/
 */

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

/**
 * Initialize a Paystack transaction
 *
 * @param {Object} params
 * @param {number} params.amount - Amount in GHS (smallest denomination - kobo)
 * @param {string} params.email - Customer email
 * @param {string} params.reference - Unique reference ID
 * @param {Object} params.metadata - Additional data (orderId, userId, etc)
 * @returns {Promise<Object>} Authorization URL and access code
 */
export async function initializePayment({ amount, email, reference, metadata = {} }) {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }

  if (!amount || !email || !reference) {
    throw new Error('Missing required fields: amount, email, reference')
  }

  // Convert GHS to Kobo (1 GHS = 100 Kobo)
  const amountInKobo = Math.round(amount * 100)
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://manibeauty.co').replace(/\/$/, '')
  
  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInKobo,
        email,
        reference,
        metadata,
        callback_url: `${siteUrl}/payment-result`,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to initialize payment')
    }

    return {
      status: 'success',
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    }
  } catch (error) {
    console.error('Paystack initialization failed:', error.message)
    throw error
  }
}

/**
 * Verify a Paystack transaction
 *
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>} Transaction details
 */
export async function verifyPayment(reference) {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }

  if (!reference) {
    throw new Error('Reference is required')
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify payment')
    }

    return {
      status: data.data.status,
      reference: data.data.reference,
      amount: data.data.amount / 100, // Convert back to GHS
      customer: data.data.customer,
      metadata: data.data.metadata,
      paidAt: data.data.paid_at,
      transactionId: data.data.id,
      channel: data.data.channel,
      currency: data.data.currency,
      gatewayResponse: data.data.gateway_response,
      authorization: data.data.authorization
        ? {
            bank: data.data.authorization.bank || null,
            brand: data.data.authorization.brand || null,
            cardType: data.data.authorization.card_type || null,
            last4: data.data.authorization.last4 || null,
            countryCode: data.data.authorization.country_code || null,
          }
        : null,
    }
  } catch (error) {
    console.error('Paystack verification error:', error)
    throw error
  }
}

/**
 * Verify webhook signature from Paystack
 *
 * @param {string} body - Request body as string
 * @param {string} signature - X-Paystack-Signature header
 * @returns {boolean} Whether signature is valid
 */
export function verifyWebhookSignature(body, signature) {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }

  // Paystack uses the secret key to sign the request
  // Documentation: https://paystack.com/docs/webhooks/understand-webhooks/
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false

  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(signature, 'hex'))
}

/**
 * Format currency for display
 *
 * @param {number} amount - Amount in GHS
 * @returns {string} Formatted string like "₵100.00"
 */
export function formatCurrency(amount) {
  return `₵${(amount || 0).toFixed(2)}`
}

/**
 * Calculate total order amount
 *
 * @param {Array} items - Order items with price and quantity
 * @returns {number} Total amount in GHS
 */
export function calculateOrderTotal(items) {
  return items.reduce((total, item) => {
    const price = parseFloat(String(item.price || 0).replace(/[^0-9.]/g, '')) || 0
    const quantity = parseInt(item.quantity || 1, 10) || 1
    return total + price * quantity
  }, 0)
}
