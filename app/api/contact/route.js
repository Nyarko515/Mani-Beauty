import { NextResponse } from '../../../server/http.js'
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit'
import { sendContactConfirmationEmail, sendContactNotificationEmail } from '../../../lib/notifications/email'
import { sendContactConfirmationSms, sendContactNotificationSms } from '../../../lib/notifications/sms'

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

export async function POST(request) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`${ip}:contact:post`, 'BOOKING_PUBLIC')
    if (rateLimit.limited) {
      return NextResponse.json({ error: 'Too many contact attempts. Please try again shortly.' }, { status: 429, headers: rateLimit.headers })
    }

    const body = await request.json()
    const required = ['name', 'phone', 'subject', 'message']

    for (const key of required) {
      if (!body[key]) {
        return NextResponse.json({ error: `Missing required field: ${key}` }, { status: 400 })
      }
    }

    const contact = {
      id: `MC-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      name: String(body.name || '').trim().slice(0, 120),
      email: String(body.email || '').trim().toLowerCase().slice(0, 200),
      phone: String(body.phone || '').trim().slice(0, 40),
      subject: String(body.subject || '').trim().slice(0, 180),
      message: String(body.message || '').trim().slice(0, 4000),
      receivedAt: new Date().toISOString(),
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (contact.email && !emailPattern.test(contact.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (contact.message.length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters long' }, { status: 400 })
    }

    const [adminEmailResult, customerEmailResult, customerSmsResult, adminSmsResult] = await Promise.allSettled([
      sendContactNotificationEmail(contact),
      contact.email ? sendContactConfirmationEmail(contact) : Promise.resolve({ sent: false, reason: 'no-email-provided' }),
      sendContactConfirmationSms(contact),
      sendContactNotificationSms(contact),
    ])

    const notification = {
      email: {
        admin: settledResultToStatus(adminEmailResult),
        customer: settledResultToStatus(customerEmailResult),
      },
      sms: {
        admin: settledResultToStatus(adminSmsResult),
        customer: settledResultToStatus(customerSmsResult),
      },
    }

    const adminDelivered = Boolean(notification.email.admin?.sent)

    if (!adminDelivered) {
      return NextResponse.json(
        {
          error: 'Your message was saved, but email delivery failed. Please verify CONTACT_NOTIFICATION_TO/BOOKING_NOTIFICATION_TO and Resend sender settings.',
          notification,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      contactId: contact.id,
      notification,
      notice: notification.email.customer?.sent || notification.sms.customer?.sent
        ? 'Message received and confirmation sent.'
        : 'Message received and notification processed.',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit contact message', details: error.message }, { status: 500 })
  }
}
