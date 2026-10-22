import { NextResponse } from '../../../../server/http.js'
import { verifyWebhookSignature, verifyPayment } from '../../../../lib/paystack'
import { updateProductOrder, updateBooking } from '../../../../lib/dataStore'
import { logPayment, logError, logDebug } from '../../../../lib/helpers'
import { resolvePaystackOrder } from '../../../../lib/paystackOrder'

/**
 * POST /api/paystack/webhook
 *
 * Webhook endpoint for Paystack payment confirmation
 * Set this URL in Paystack dashboard: Settings → API Keys & Webhooks
 *
 * Paystack will send a POST request with:
 * - X-Paystack-Signature header (HMAC-SHA512 hash of the body)
 * - JSON body with event data
 */
export async function POST(request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      logError('PAYSTACK_WEBHOOK', new Error('Invalid webhook signature'))
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse the JSON body
    const event = JSON.parse(rawBody)

    // Only process successful charges
    if (event.event !== 'charge.success') {
      logDebug('PAYSTACK_WEBHOOK', `Event skipped: ${event.event}`)
      return NextResponse.json({ status: 'ok', message: 'Event not processed' })
    }

    const { data } = event
    const { reference, status } = data

    if (status !== 'success') {
      logDebug('PAYSTACK_WEBHOOK', `Payment not successful: ${reference}`)
      return NextResponse.json({ status: 'ok' })
    }

    // Verify the payment with Paystack (double-check)
    const verification = await verifyPayment(reference)

    if (verification.status !== 'success') {
      logError('PAYSTACK_WEBHOOK', new Error(`Payment verification failed: ${reference}`))
      return NextResponse.json({ status: 'ok' })
    }

    const { orderId, type } = verification.metadata || {}

    if (!orderId || !['product', 'booking'].includes(type)) {
      logError('PAYSTACK_WEBHOOK', new Error('Invalid payment metadata'))
      return NextResponse.json({ error: 'Invalid payment metadata' }, { status: 400 })
    }

    const payable = await resolvePaystackOrder(orderId, type)
    if (payable.record.paymentStatus === 'paid') {
      if (payable.record.paymentReference !== verification.reference) {
        logError('PAYSTACK_WEBHOOK', new Error(`Order already paid with another reference: ${orderId}`))
        return NextResponse.json({ error: 'Order already paid' }, { status: 409 })
      }
      return NextResponse.json({ status: 'ok', message: 'Payment already recorded', reference, orderId })
    }
    if ((verification.currency || '').toUpperCase() !== 'GHS') {
      logError('PAYSTACK_WEBHOOK', new Error(`Payment currency mismatch: ${reference}`))
      return NextResponse.json({ error: 'Payment currency mismatch' }, { status: 400 })
    }
    if (Math.round(verification.amount * 100) !== Math.round(payable.amount * 100)) {
      logError('PAYSTACK_WEBHOOK', new Error(`Payment amount mismatch: ${reference}`))
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
    }

    // Update the order based on type
    const paymentUpdates = {
      paymentStatus: 'paid',
      paymentReference: reference,
      paymentMethod: 'paystack',
      paymentAmount: verification.amount,
      paymentCurrency: verification.currency || 'GHS',
      paymentChannel: verification.channel || null,
      paymentTransactionId: verification.transactionId == null ? null : String(verification.transactionId),
      paymentDetails: {
        gatewayResponse: verification.gatewayResponse || null,
        authorization: verification.authorization || null,
        customerEmail: verification.customer?.email || payable.email,
      },
      paidAt: verification.paidAt || new Date().toISOString(),
    }

    if (type === 'booking') {
      // Update booking payment status
      await updateBooking(orderId, paymentUpdates)

      logPayment('BOOKING_PAYMENT_CONFIRMED', { orderId, reference })
    } else if (type === 'product' || !type) {
      // Update product order payment status
      await updateProductOrder(orderId, paymentUpdates)

      logPayment('ORDER_PAYMENT_CONFIRMED', { orderId, reference })
    }

    logPayment('WEBHOOK_PROCESSED', { reference, orderId })

    return NextResponse.json({
      status: 'ok',
      message: 'Webhook processed',
      reference,
      orderId,
    })
  } catch (error) {
    logError('PAYSTACK_WEBHOOK', error)

    // Return a failure status so Paystack can retry instead of silently losing
    // a successful payment notification.
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/paystack/webhook
 *
 * For testing purposes - verifies the endpoint exists
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Paystack webhook endpoint is ready',
  })
}
