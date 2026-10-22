import { NextResponse } from '../../../server/http.js'
import { requireAdminUser } from '../../../lib/auth/requireAdminUser'
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit'
import { insertProductOrder, listProductOrders } from '../../../lib/dataStore'
import { logAdminAction } from '../../../lib/audit'
import {
  sendProductOrderConfirmationEmail,
  sendProductOrderNotificationEmail,
} from '../../../lib/notifications/email'
import {
  sendProductOrderConfirmationSms,
  sendProductOrderConfirmationWhatsApp,
  sendProductOrderNotificationSms,
  sendProductOrderNotificationWhatsApp,
} from '../../../lib/notifications/sms'

function settledResultToStatus(result) {
  if (result.status === 'fulfilled') {
    return result.value
  }

  return {
    sent: false,
    reason: 'send-failed',
    details: result.reason instanceof Error ? result.reason.message : String(result.reason || 'unknown-error'),
  }
}

function buildWhatsappLink(order) {
  const phoneDigits = String(order.phone || '').replace(/[^\d]/g, '')
  const whatsappNumber = phoneDigits.startsWith('0') ? `233${phoneDigits.slice(1)}` : phoneDigits

  if (!whatsappNumber) return ''

  const lines = [
    `Hello ${order.name}, your product order has been received by Mani Beauty.`,
    `Order Ref: ${order.id}`,
    `Order Preference: ${order.address}`,
    '',
    'Items:',
    ...order.items.map((item) => `- ${item.name} | ${item.price || 'Price not set'} x${item.quantity || 1}`),
    '',
    'We will review and confirm your order shortly.',
  ]

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`
}

export async function GET() {
  try {
    const { response } = await requireAdminUser()
    if (response) return response

    const orders = await listProductOrders()
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load product orders', details: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`${ip}:product-orders:post`, 'BOOKING_PUBLIC')
    if (rateLimit.limited) {
      return NextResponse.json({ error: 'Too many order attempts. Please try again shortly.' }, { status: 429, headers: rateLimit.headers })
    }

    const body = await request.json()
    const customer = body.customer || {}
    const items = Array.isArray(body.items) ? body.items : []

    const requiredFields = ['name', 'email', 'phone']
    const requiredLabels = {
      name: 'name',
      email: 'email address',
      phone: 'phone number',
    }
    for (const field of requiredFields) {
      if (!String(customer[field] || '').trim()) {
        return NextResponse.json({ error: `Missing required field: ${requiredLabels[field]}` }, { status: 400 })
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'Add at least one product to your order.' }, { status: 400 })
    }

    const email = String(customer.email || '').trim().toLowerCase().slice(0, 200)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailPattern.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const order = {
      id: `PO-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      name: String(customer.name || '').trim().slice(0, 120),
      email,
      phone: String(customer.phone || '').trim().slice(0, 40),
      address: String(customer.address || '').trim().slice(0, 500),
      note: String(customer.note || '').trim().slice(0, 1000),
      items: items.map((item) => ({
        id: String(item.id || '').slice(0, 180),
        name: String(item.name || '').trim().slice(0, 160),
        image: String(item.image || '').trim().slice(0, 300),
        price: String(item.price || '').trim().slice(0, 80),
        quantity: Number(item.quantity || 1) || 1,
      })),
      status: 'pending',
      orderedAt: new Date().toISOString(),
      paymentStatus: 'pending',
      paymentReference: null,
      paymentMethod: null,
      paidAt: null,
    }

    const savedOrder = await insertProductOrder(order)

    // Log order creation for audit trail
    try {
      await logAdminAction('system', 'CREATE_PRODUCT_ORDER_PUBLIC', {
        orderId: order.id,
        customerName: order.name,
        customerPhone: order.phone,
        itemCount: order.items.length,
        syncStatus: savedOrder.syncStatus || false,
      })
    } catch (auditError) {
      // Don't fail order if audit logging fails
      console.warn('Failed to log order creation:', auditError.message)
    }

    let notification = {
      email: {
        admin: { sent: false, reason: 'not-attempted' },
        customer: { sent: false, reason: 'not-attempted' },
      },
      sms: {
        admin: { sent: false, reason: 'not-attempted' },
        customer: { sent: false, reason: 'not-attempted' },
      },
      whatsapp: {
        admin: { sent: false, reason: 'not-attempted' },
        customer: { sent: false, reason: 'not-attempted' },
      },
    }

    try {
      const [adminEmailResult, customerEmailResult, adminSmsResult, customerSmsResult, adminWhatsAppResult, customerWhatsAppResult] =
        await Promise.allSettled([
          sendProductOrderNotificationEmail(savedOrder),
          savedOrder.email ? sendProductOrderConfirmationEmail(savedOrder) : Promise.resolve({ sent: false, reason: 'no-email-provided' }),
          sendProductOrderNotificationSms(savedOrder),
          sendProductOrderConfirmationSms(savedOrder),
          sendProductOrderNotificationWhatsApp(savedOrder),
          sendProductOrderConfirmationWhatsApp(savedOrder),
        ])

      notification = {
        email: {
          admin: settledResultToStatus(adminEmailResult),
          customer: settledResultToStatus(customerEmailResult),
        },
        sms: {
          admin: settledResultToStatus(adminSmsResult),
          customer: settledResultToStatus(customerSmsResult),
        },
        whatsapp: {
          admin: settledResultToStatus(adminWhatsAppResult),
          customer: settledResultToStatus(customerWhatsAppResult),
        },
      }
    } catch (notifyError) {
      notification = {
        email: {
          admin: { sent: false, reason: 'send-failed' },
          customer: { sent: false, reason: 'send-failed' },
        },
        sms: {
          admin: { sent: false, reason: 'send-failed' },
          customer: { sent: false, reason: 'send-failed' },
        },
        whatsapp: {
          admin: { sent: false, reason: 'send-failed' },
          customer: { sent: false, reason: 'send-failed' },
        },
      }
    }

    const customerDelivered = Boolean(notification.email.customer?.sent || notification.sms.customer?.sent || notification.whatsapp.customer?.sent)

    return NextResponse.json({
      ok: true,
      orderId: savedOrder.id,
      order: savedOrder,
      syncStatus: {
        savedToSupabase: savedOrder.savedToSupabase || false,
        supabaseError: savedOrder.supabaseError || null,
        savedLocally: true,
      },
      notification,
      actions: {
        whatsapp: buildWhatsappLink(savedOrder),
        mailto: `mailto:manibeautygh@gmail.com?subject=${encodeURIComponent(`New Product Order ${savedOrder.id}`)}&body=${encodeURIComponent(`${savedOrder.name}\n${savedOrder.phone}\n${savedOrder.address}\n\n${savedOrder.items.map((item) => `${item.name} - ${item.price} x${item.quantity || 1}`).join('\n')}`)}`,
      },
      notice: customerDelivered
        ? 'Order confirmation sent.'
        : 'Order saved, but customer confirmation may not have been delivered.',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to place product order', details: error.message }, { status: 500 })
  }
}
