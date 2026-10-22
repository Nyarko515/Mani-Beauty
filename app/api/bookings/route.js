import { NextResponse } from '../../../server/http.js'
import { requireAdminUser } from '../../../lib/auth/requireAdminUser'
import { insertBooking, listBookings } from '../../../lib/dataStore'
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit'
import { logAdminAction } from '../../../lib/audit'
import { sendBookingConfirmationEmail, sendBookingNotificationEmail } from '../../../lib/notifications/email'
import {
  sendBookingConfirmationSms,
  sendBookingNotificationSms,
  sendBookingConfirmationWhatsApp,
  sendBookingNotificationWhatsApp,
} from '../../../lib/notifications/sms'

function buildWhatsappLink(booking) {
  const phoneDigits = String(booking.phone || '').replace(/[^\d]/g, '')
  const whatsappNumber = phoneDigits.startsWith('0')
    ? `233${phoneDigits.slice(1)}`
    : phoneDigits

  if (!whatsappNumber) {
    return ''
  }

  const message = [
    `Hello ${booking.name}, your booking request has been received by Mani Beauty.`,
    `Booking Ref: ${booking.id}`,
    `Service: ${booking.serviceLabel || booking.service}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
    booking.notes ? `Notes: ${booking.notes}` : '',
  ].join('\n')

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
}

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

export async function GET() {
  try {
    const { response } = await requireAdminUser()
    if (response) return response

    const bookings = await listBookings()
    return NextResponse.json(bookings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load bookings', details: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`${ip}:bookings:post`, 'BOOKING_PUBLIC')
    if (rateLimit.limited) {
      return NextResponse.json({ error: 'Too many booking attempts. Please try again shortly.' }, { status: 429, headers: rateLimit.headers })
    }

    const body = await request.json()
    const specialRequest = Boolean(body.specialRequest)
    const required = ['name', 'email', 'phone', 'date', 'time']

    if (!specialRequest) {
      required.push('service', 'serviceLabel')
    }

    for (const key of required) {
      if (!body[key]) {
        return NextResponse.json({ error: `Missing required field: ${key}` }, { status: 400 })
      }
    }

    const name = String(body.name || '').trim().slice(0, 120)
    const email = String(body.email || '').trim().toLowerCase().slice(0, 200)
    const phone = String(body.phone || '').trim().slice(0, 40)
    const service = specialRequest ? 'special-request' : String(body.service || '').trim().slice(0, 120)
    const serviceLabel = specialRequest
      ? String(body.serviceLabel || 'Custom request').trim().slice(0, 160)
      : String(body.serviceLabel || '').trim().slice(0, 160)
    const date = String(body.date || '').trim().slice(0, 20)
    const time = String(body.time || '').trim().slice(0, 40)
    const notes = String(body.notes || '').trim().slice(0, 1000)

    const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
    const timeParts = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time)
    if (dateParts && timeParts) {
      const [, year, month, day] = dateParts
      const appointmentDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
      const rawHour = Number(timeParts[1]) % 12
      const appointmentMinutes = (rawHour + (timeParts[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(timeParts[2])

      if (
        appointmentDate.getUTCFullYear() === Number(year) &&
        appointmentDate.getUTCMonth() === Number(month) - 1 &&
        appointmentDate.getUTCDate() === Number(day) &&
        appointmentDate.getUTCDay() === 0 &&
        appointmentMinutes < 13 * 60
      ) {
        return NextResponse.json({ error: 'Sunday appointments start at 1:00 PM.' }, { status: 400 })
      }
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (email && !emailPattern.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const booking = {
      id: `MB-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      name,
      email,
      phone,
      service,
      serviceLabel,
      date,
      time,
      notes,
      status: 'pending',
      bookedDate: new Date().toISOString(),
      paymentStatus: specialRequest ? 'not-required' : 'pending',
      paymentReference: null,
      paymentMethod: null,
      paidAt: null,
    }

    const insertResult = await insertBooking(booking)

    // Log booking creation for audit trail
    try {
      await logAdminAction('system', 'CREATE_BOOKING_PUBLIC', {
        bookingId: booking.id,
        clientName: booking.name,
        clientPhone: booking.phone,
        service: booking.service,
        date: booking.date,
        time: booking.time,
        syncStatus: insertResult.syncStatus || false,
      })
    } catch (auditError) {
      // Don't fail booking if audit logging fails
      console.warn('Failed to log booking creation:', auditError.message)
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
      const [
        adminEmailResult,
        customerEmailResult,
        adminSmsResult,
        customerSmsResult,
        adminWhatsAppResult,
        customerWhatsAppResult,
      ] = await Promise.allSettled([
        sendBookingNotificationEmail(booking),
        sendBookingConfirmationEmail(booking),
        sendBookingNotificationSms(booking),
        sendBookingConfirmationSms(booking),
        sendBookingNotificationWhatsApp(booking),
        sendBookingConfirmationWhatsApp(booking),
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

    return NextResponse.json({
      ok: true,
      booking,
      syncStatus: {
        savedToSupabase: insertResult.savedToSupabase || false,
        supabaseError: insertResult.supabaseError || null,
        savedLocally: true,
      },
      notification,
      notice:
        notification.email.customer?.sent || notification.sms.customer?.sent || notification.whatsapp.customer?.sent
          ? 'Customer confirmation sent.'
          : 'Booking saved, but customer confirmation may not have been delivered.',
      actions: {
        whatsapp: buildWhatsappLink(booking),
        mailto: `mailto:manibeautygh@gmail.com?subject=${encodeURIComponent(`New Booking ${booking.id}`)}&body=${encodeURIComponent([booking.name, booking.phone, booking.serviceLabel, `${booking.date} ${booking.time}`, booking.notes || ''].filter(Boolean).join('\n'))}`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create booking', details: error.message }, { status: 500 })
  }
}
