import { NextResponse } from '../../../../server/http.js'
import { verifyPayment } from '../../../../lib/paystack'
import { updateProductOrder, updateBooking } from '../../../../lib/dataStore'
import { resolvePaystackOrder } from '../../../../lib/paystackOrder'

/**
 * GET /api/paystack/verify?reference=XXXX
 *
 * Verify a payment and return its status
 * Called after user is redirected back from Paystack
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
    }

    const verification = await verifyPayment(reference)

    if (verification.status === 'success') {
      const { orderId, type } = verification.metadata || {}
      if (!orderId || !['product', 'booking'].includes(type)) {
        return NextResponse.json({ success: false, message: 'Payment metadata is invalid' }, { status: 400 })
      }

      const payable = await resolvePaystackOrder(orderId, type)
      if (payable.record.paymentStatus === 'paid' && payable.record.paymentReference !== verification.reference) {
        return NextResponse.json({ success: false, message: 'This order is already linked to another payment' }, { status: 409 })
      }
      if ((verification.currency || '').toUpperCase() !== 'GHS') {
        return NextResponse.json({ success: false, message: 'Payment currency does not match the order' }, { status: 400 })
      }
      if (Math.round(verification.amount * 100) !== Math.round(payable.amount * 100)) {
        return NextResponse.json({ success: false, message: 'Payment amount does not match the order' }, { status: 400 })
      }

      const updates = {
        paymentStatus: 'paid',
        paymentReference: verification.reference,
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
      if (type === 'booking') await updateBooking(orderId, updates)
      else await updateProductOrder(orderId, updates)

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          reference: verification.reference,
          amount: verification.amount,
          paidAt: verification.paidAt,
          channel: verification.channel,
          metadata: verification.metadata,
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: `Payment status: ${verification.status}`,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Verification error:', error)

    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to verify payment',
      },
      { status: 500 }
    )
  }
}
