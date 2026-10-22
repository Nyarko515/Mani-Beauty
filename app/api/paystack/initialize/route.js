import { NextResponse } from '../../../../server/http.js'
import { initializePayment } from '../../../../lib/paystack'
import { resolvePaystackOrder } from '../../../../lib/paystackOrder'
import { checkRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { logDebug, logPayment, logError } from '../../../../lib/helpers'
import { recordPaymentInitialization } from '../../../../lib/dataStore'
import crypto from 'node:crypto'

/**
 * POST /api/paystack/initialize
 *
 * Initialize a Paystack payment for orders/bookings
 *
 * Body:
 * {
 *   type: 'product' | 'booking',
 *   orderId: string,
 * }
 */
export async function POST(request) {
  try {
    logDebug('PAYSTACK_API', 'Payment initialization endpoint called')
    
    // Rate limiting
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`${ip}:paystack:initialize`, 'BOOKING_PUBLIC')
    if (rateLimit.limited) {
      logDebug('PAYSTACK_API', `Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json(
        { error: 'Too many payment attempts. Please try again shortly.' },
        { status: 429, headers: rateLimit.headers }
      )
    }

    const body = await request.json()
    logPayment('INIT_REQUEST', { orderId: body.orderId, type: body.type, amount: body.amount })

    // Validate required fields
    const { orderId, type } = body

    if (!orderId || !['product', 'booking'].includes(type)) {
      logError('PAYSTACK_VALIDATION', new Error('Missing required fields'))
      return NextResponse.json(
        { error: 'Missing or invalid order ID or payment type' },
        { status: 400 }
      )
    }

    const payable = await resolvePaystackOrder(orderId, type)
    const { email, amount, customerName } = payable
    const reference = `${type}-${orderId}-${crypto.randomUUID()}`

    if (payable.record.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'This order has already been paid' }, { status: 409 })
    }

    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      logError('PAYSTACK_VALIDATION', new Error(`Invalid email: ${email}`))
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Initialize payment with Paystack
    logDebug('PAYSTACK_API', `Initializing payment with Paystack: ₵${amount}`)
    const paymentResult = await initializePayment({
      amount: parseFloat(amount),
      email: String(email).toLowerCase().trim(),
      reference,
      metadata: {
        orderId,
        customerName,
        type,
        expectedAmount: amount,
        initiatedAt: new Date().toISOString(),
      },
    })

    const recordedPayment = await recordPaymentInitialization(orderId, type, {
      paymentStatus: 'initialized',
      paymentReference: paymentResult.reference,
      paymentMethod: 'paystack',
      paymentAmount: amount,
      paymentCurrency: 'GHS',
      paymentDetails: {
        initiatedAt: new Date().toISOString(),
        gatewayStatus: 'initialized',
      },
    })
    if (recordedPayment.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'This order has already been paid' }, { status: 409 })
    }
    
    logPayment('INIT_SUCCESS', { orderId, reference })

    const response = {
      success: true,
      data: {
        authorizationUrl: paymentResult.authorizationUrl,
        accessCode: paymentResult.accessCode,
        reference: paymentResult.reference,
        amount,
      },
    }
    
    return NextResponse.json(response)
  } catch (error) {
    logError('PAYSTACK_INIT', error)

    return NextResponse.json(
      {
        error: error.message || 'Failed to initialize payment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}
