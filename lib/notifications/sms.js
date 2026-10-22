/**
 * SMS Notification Module
 * Primary provider: Mnotify
 * Fallback: BulkieMsg
 */

import {
  isMnotifySmsConfigured,
  normalizeMnotifyPhoneNumber,
  sendQuickSms as mnotifySendQuickSms,
  sendGroupSms as mnotifySendGroupSms,
} from './mnotify.js'

const BULKIEMSG_DEFAULT_AUTH_PREFIX = 'Bearer'
const BULKIEMSG_SEND_ENDPOINT = 'https://api.bulkiemsg.net/api/sms/send'

function isBulkieMsgSmsConfigured() {
  return Boolean(process.env.BULKIEMSG_API_KEY && process.env.BULKIEMSG_SENDER_ID)
}


function getBulkieMsgHeaders() {
  const apiKey = String(process.env.BULKIEMSG_API_KEY || '').trim()
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `${BULKIEMSG_DEFAULT_AUTH_PREFIX} ${apiKey}`,
  }
  return headers
}

function normalizeE164PhoneNumber(value) {
  const digitsOnly = String(value || '').replace(/[^\d]/g, '')

  if (!digitsOnly) return ''
  
  // Ghana: 0242445558 (10 digits starting with 0) → +233242445558
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    return `+233${digitsOnly.slice(1)}`
  }

  // Ghana: 233242445558 (12 digits starting with 233) → +233242445558
  if (digitsOnly.startsWith('233') && digitsOnly.length === 12) {
    return `+${digitsOnly}`
  }

  // US/Canada: 1xxxxxxxxxx (11 digits starting with 1) → +1xxxxxxxxxx
  if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
    return `+${digitsOnly}`
  }

  // Generic: assume it's already a valid number and add + prefix
  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`
  }

  return ''
}

function normalizePhoneNumber(value) {
  const text = String(value || '').trim()

  if (!text) return ''

  const hasPlus = text.startsWith('+')
  const digitsOnly = text.replace(/[^\d]/g, '')

  return hasPlus ? `+${digitsOnly}` : digitsOnly
}

function getSmsRecipient(value) {
  return normalizeE164PhoneNumber(value)
}


function getBulkieMsgRecipient(value) {
  return normalizeE164PhoneNumber(value).replace(/^\+/, '')
}

function getBulkieMsgPayload({ to, body }) {
  const senderId = String(process.env.BULKIEMSG_SENDER_ID || '').trim()
  return {
    sender_id: senderId,
    message: body,
    to: [to],
  }
}

async function sendBulkieMsgSms({ to, body }) {
  if (!isBulkieMsgSmsConfigured()) {
    return { sent: false, reason: 'not-configured' }
  }

  const recipient = getBulkieMsgRecipient(to)
  if (!recipient) {
    return { sent: false, reason: 'invalid-recipient' }
  }

  const payload = getBulkieMsgPayload({ to: recipient, body })
  
  console.log('📱 [SMS DEBUG] Attempting BulkieMsg SMS send:')
  console.log('  - Recipient (input):', to)
  console.log('  - Recipient (formatted):', recipient)
  console.log('  - Endpoint:', BULKIEMSG_SEND_ENDPOINT)

  const response = await fetch(BULKIEMSG_SEND_ENDPOINT, {
    method: 'POST',
    headers: getBulkieMsgHeaders(),
    body: JSON.stringify(payload),
  })

  const raw = await response.text()
  let json
  try {
    json = JSON.parse(raw)
  } catch (e) {
    json = null
  }

  console.log('📱 [SMS DEBUG] Response status:', response.status)
  console.log('📱 [SMS DEBUG] Response body (first 200 chars):', raw.substring(0, 200))

  if (!response.ok || (json && json.success === false)) {
    const details = (json && (json.error || json.message)) || raw || `HTTP ${response.status}`
    console.log('📱 [SMS ERROR] Failed:', details.substring(0, 300))
    throw new Error(`SMS notification failed: ${details}`)
  }

  console.log('📱 [SMS SUCCESS] BulkieMsg SMS sent successfully to', recipient)
  return { sent: true }
}

/**
 * Send SMS using Mnotify (primary) or BulkieMsg (fallback)
 */
async function sendSms({ to, body }) {
  // Prioritize Mnotify
  if (isMnotifySmsConfigured()) {
    console.log('📱 [SMS] Using Mnotify for SMS send')
    return mnotifySendQuickSms({
      recipients: to,
      message: body,
    })
  }

  // Fallback to BulkieMsg
  if (isBulkieMsgSmsConfigured()) {
    console.log('📱 [SMS] Using BulkieMsg for SMS send')
    return sendBulkieMsgSms({ to, body })
  }

  console.log('📱 [SMS] SMS not configured - skipping')
  return { sent: false, reason: 'not-configured' }
}

// ===== Message Builders =====

function buildAdminBookingSms(booking) {
  const salonName = process.env.NEXT_PUBLIC_SITE_NAME || 'Mani Beauty'
  return [
    `${salonName}: New booking received`,
    `Ref: ${booking.id}`,
    `Name: ${booking.name}`,
    `Phone: ${booking.phone}`,
    `Service: ${booking.serviceLabel || booking.service}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
  ].join('\n')
}

function buildCustomerConfirmationSms(booking) {
  const salonName = process.env.NEXT_PUBLIC_SITE_NAME || 'Mani Beauty'
  return [
    `Hi ${booking.name},`,
    `${salonName}: your booking has been received.`,
    `Ref: ${booking.id}`,
    `Service: ${booking.serviceLabel || booking.service}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
  ].join('\n')
}

function buildContactConfirmationSms(contact) {
  const salonName = process.env.NEXT_PUBLIC_SITE_NAME || 'Mani Beauty'
  return [
    `Hi ${contact.name},`,
    `${salonName}: we received your message and will get back to you soon.`,
    `Ref: ${contact.id}`,
    `Subject: ${contact.subject}`,
  ].join('\n')
}

function buildAdminContactSms(contact) {
  const salonName = process.env.NEXT_PUBLIC_SITE_NAME || 'Mani Beauty'
  return [
    `${salonName}: New contact message received`,
    `Ref: ${contact.id}`,
    `Name: ${contact.name}`,
    `Phone: ${contact.phone || 'N/A'}`,
    `Email: ${contact.email || 'N/A'}`,
    `Subject: ${contact.subject}`,
  ].join('\n')
}

function buildAdminProductOrderSms(order) {
  const salonName = process.env.NEXT_PUBLIC_SITE_NAME || 'Mani Beauty'
  return [
    `${salonName}: New product order received`,
    `Ref: ${order.id}`,
    `Name: ${order.name}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}`,
    `Items: ${order.items.map((item) => `${item.name} x${item.quantity || 1}`).join(', ')}`,
  ].join('\n')
}

function buildCustomerProductOrderSms(order) {
  const salonName = process.env.NEXT_PUBLIC_SITE_NAME || 'Mani Beauty'
  return [
    `Hi ${order.name},`,
    `${salonName}: your product order has been received.`,
    `Ref: ${order.id}`,
    `Items: ${order.items.map((item) => `${item.name} x${item.quantity || 1}`).join(', ')}`,
  ].join('\n')
}

function getProductOrderSmsTo() {
  return process.env.PRODUCT_ORDER_SMS_TO || process.env.BOOKING_SMS_TO || ''
}

function getProductOrderWhatsAppTo() {
  return process.env.PRODUCT_ORDER_WHATSAPP_TO || process.env.BOOKING_WHATSAPP_TO || ''
}

async function sendWhatsAppMessage() {
  return { sent: false, reason: 'not-configured' }
}

export async function sendBookingNotificationSms(booking) {
  const adminTo = process.env.BOOKING_SMS_TO
  if (!adminTo) {
    console.log('📱 [SMS] Booking notification SMS - admin phone not configured')
    return { sent: false, reason: 'not-configured' }
  }

  console.log('📱 [SMS] Sending booking notification SMS to admin:', adminTo)
  const result = await sendSms({
    to: adminTo,
    body: buildAdminBookingSms(booking),
  })
  console.log('📱 [SMS] Booking notification result:', result)
  return result
}

export async function sendBookingConfirmationSms(booking) {
  console.log('📱 [SMS] Sending booking confirmation SMS to customer:', booking.phone)
  const result = await sendSms({
    to: booking.phone,
    body: buildCustomerConfirmationSms(booking),
  })
  console.log('📱 [SMS] Booking confirmation result:', result)
  return result
}

export async function sendBookingNotificationWhatsApp(booking) {
  const adminTo = process.env.BOOKING_WHATSAPP_TO || ''
  if (!adminTo) return { sent: false, reason: 'not-configured' }

  return sendWhatsAppMessage({
    to: adminTo,
    body: buildAdminBookingSms(booking),
  })
}

export async function sendBookingConfirmationWhatsApp(booking) {
  return sendWhatsAppMessage({
    to: booking.phone,
    body: buildCustomerConfirmationSms(booking),
  })
}


function buildAdminProductOrderWhatsApp(order) {
  const salonName = process.env.NEXT_PUBLIC_SITE_NAME || 'Mani Beauty'
  return [
    `${salonName}: New product order received`,
    `Ref: ${order.id}`,
    `Name: ${order.name}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}`,
    `Items: ${order.items.map((item) => `${item.name} x${item.quantity || 1}`).join(', ')}`,
  ].join('\n')
}

function buildCustomerProductOrderWhatsApp(order) {
  const salonName = process.env.NEXT_PUBLIC_SITE_NAME || 'Mani Beauty'
  return [
    `Hi ${order.name},`,
    `${salonName}: your product order has been received.`,
    `Ref: ${order.id}`,
    `Items: ${order.items.map((item) => `${item.name} x${item.quantity || 1}`).join(', ')}`,
  ].join('\n')
}

export async function sendProductOrderNotificationWhatsApp(order) {
  const adminTo = getProductOrderWhatsAppTo()
  if (!adminTo) {
    return { sent: false, reason: 'not-configured' }
  }

  return sendWhatsAppMessage({
    to: adminTo,
    body: buildAdminProductOrderWhatsApp(order),
  })
}

export async function sendProductOrderConfirmationWhatsApp(order) {
  return sendWhatsAppMessage({
    to: order.phone,
    body: buildCustomerProductOrderWhatsApp(order),
  })
}

export async function sendProductOrderNotificationSms(order) {
  const adminTo = getProductOrderSmsTo()
  if (!adminTo) {
    console.log('📱 [SMS] Product order notification SMS - admin phone not configured')
    return { sent: false, reason: 'not-configured' }
  }

  console.log('📱 [SMS] Sending product order notification SMS to admin:', adminTo)
  const result = await sendSms({
    to: adminTo,
    body: buildAdminProductOrderSms(order),
  })
  console.log('📱 [SMS] Product order notification result:', result)
  return result
}

export async function sendProductOrderConfirmationSms(order) {
  console.log('📱 [SMS] Sending product order confirmation SMS to customer:', order.phone)
  const result = await sendSms({
    to: order.phone,
    body: buildCustomerProductOrderSms(order),
  })
  console.log('📱 [SMS] Product order confirmation result:', result)
  return result
}

export async function sendContactConfirmationSms(contact) {
  return sendSms({
    to: contact.phone,
    body: buildContactConfirmationSms(contact),
  })
}

export async function sendContactNotificationSms(contact) {
  const adminTo = process.env.CONTACT_NOTIFICATION_SMS_TO || process.env.BOOKING_SMS_TO || ''
  if (!adminTo) return { sent: false, reason: 'not-configured' }

  return sendSms({
    to: adminTo,
    body: buildAdminContactSms(contact),
  })
}

// Export helper functions
export {
  isMnotifySmsConfigured,
  isBulkieMsgSmsConfigured,
  normalizeMnotifyPhoneNumber,
}
