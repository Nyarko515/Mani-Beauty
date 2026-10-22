import { NextResponse } from '../../../../server/http.js'
import { requireAdminUser } from '../../../../lib/auth/requireAdminUser'
import { deleteBookingById, updateBookingStatusById } from '../../../../lib/dataStore'
import { checkRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { logAdminAction } from '../../../../lib/audit'
import { isValidCsrfRequest } from '../../../../lib/csrf'

export async function PATCH(request, { params }) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`${ip}:bookings:patch`, 'API_WRITE')
    if (rateLimit.limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers })
    }

    const { data, response } = await requireAdminUser()
    if (response) return response

    if (!isValidCsrfRequest(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }

    const { id } = params
    const { status } = await request.json()
    const allowedStatuses = ['pending', 'completed', 'cancelled']

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const result = await updateBookingStatusById(id, status)
    if (!result) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const { booking, oldStatus } = result

    await logAdminAction(data.user.email, 'UPDATE_BOOKING_STATUS', {
      bookingId: id,
      oldStatus,
      newStatus: status,
      clientName: booking.name,
    })

    return NextResponse.json({ ok: true, booking })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update booking', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`${ip}:bookings:delete`, 'API_WRITE')
    if (rateLimit.limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers })
    }

    const { data, response } = await requireAdminUser()
    if (response) return response

    if (!isValidCsrfRequest(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }

    const { id } = params
    const deletedBooking = await deleteBookingById(id)
    if (!deletedBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    await logAdminAction(data.user.email, 'DELETE_BOOKING', {
      bookingId: id,
      clientName: deletedBooking?.name,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete booking', details: error.message }, { status: 500 })
  }
}
