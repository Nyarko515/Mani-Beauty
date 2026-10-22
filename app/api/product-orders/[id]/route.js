import { NextResponse } from '../../../../server/http.js'
import { requireAdminUser } from '../../../../lib/auth/requireAdminUser'
import { checkRateLimit, getClientIp } from '../../../../lib/rateLimit'
import { isValidCsrfRequest } from '../../../../lib/csrf'
import { deleteProductOrderById, updateProductOrderStatusById } from '../../../../lib/dataStore'
import { logAdminAction } from '../../../../lib/audit'

export async function PATCH(request, { params }) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`${ip}:product-orders:patch`, 'API_WRITE')
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
    const allowedStatuses = ['pending', 'processing', 'completed', 'cancelled']

    if (!status) {
      return NextResponse.json({ error: 'Missing status' }, { status: 400 })
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const result = await updateProductOrderStatusById(id, status)
    if (!result) {
      return NextResponse.json({ error: 'Product order not found' }, { status: 404 })
    }

    const { order, oldStatus } = result

    await logAdminAction(data.user.email, 'UPDATE_PRODUCT_ORDER_STATUS', {
      orderId: id,
      oldStatus,
      newStatus: status,
      clientName: order.name,
    })

    return NextResponse.json({ ok: true, order })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product order', details: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`${ip}:product-orders:delete`, 'API_WRITE')
    if (rateLimit.limited) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimit.headers })
    }

    const { data, response } = await requireAdminUser()
    if (response) return response

    if (!isValidCsrfRequest(request)) {
      return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
    }

    const { id } = params
    const deletedOrder = await deleteProductOrderById(id)
    if (!deletedOrder) {
      return NextResponse.json({ error: 'Product order not found' }, { status: 404 })
    }

    await logAdminAction(data.user.email, 'DELETE_PRODUCT_ORDER', {
      orderId: id,
      clientName: deletedOrder?.name,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete product order', details: error.message }, { status: 500 })
  }
}
