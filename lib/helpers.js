// Helper functions for common operations and logging
// Use these instead of console.log directly so they can be controlled centrally

import { DEBUG_CONFIG } from './config'

// ============================================
// LOGGING HELPERS
// ============================================

export function logDebug(context, message, data = null) {
  if (!DEBUG_CONFIG.LOG_API_CALLS) return
  console.log(`[${context}]`, message, data || '')
}

export function logDataOp(operation, details = {}) {
  if (!DEBUG_CONFIG.LOG_DATA_OPERATIONS) return
  console.log(`[DATA_OP:${operation}]`, details)
}

export function logSupabase(query, result = null) {
  if (!DEBUG_CONFIG.LOG_SUPABASE) return
  console.log('[SUPABASE]', query, result || '')
}

export function logPayment(event, details = {}) {
  if (!DEBUG_CONFIG.LOG_PAYMENTS) return
  console.log(`[PAYMENT:${event}]`, details)
}

export function logError(context, error) {
  // Always log errors, but structure them consistently
  const errorInfo = {
    context,
    message: error?.message || String(error),
    stack: error?.stack || '',
    timestamp: new Date().toISOString(),
  }
  
  console.error(`[ERROR:${context}]`, errorInfo)
  
  // In production, also send to error tracking service if available
  if (process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    // Server-side: would send to error tracking here
    // Example: sendToErrorTracker(errorInfo)
  }
  
  return errorInfo
}

// ============================================
// VALIDATION HELPERS
// ============================================

import { VALIDATION } from './config'

export function validatePhone(phone) {
  if (!phone) return false
  const cleaned = phone.replace(/\s/g, '')
  return VALIDATION.PHONE_PATTERN.test(cleaned)
}

export function validateEmail(email) {
  if (!email) return true // Optional field
  return VALIDATION.EMAIL_PATTERN.test(email)
}

export function validateName(name) {
  if (!name) return false
  const trimmed = name.trim()
  return (
    trimmed.length >= VALIDATION.FIELD_LENGTHS.NAME_MIN &&
    trimmed.length <= VALIDATION.FIELD_LENGTHS.NAME_MAX
  )
}

export function validateDate(dateString) {
  if (!dateString) return false
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

// ============================================
// ERROR RESPONSE HELPERS
// ============================================

export function createErrorResponse(statusCode, errorCode, message = null) {
  return {
    ok: false,
    error: errorCode,
    message: message || getErrorMessage(errorCode),
    timestamp: new Date().toISOString(),
  }
}

export function createSuccessResponse(data = {}) {
  return {
    ok: true,
    ...data,
    timestamp: new Date().toISOString(),
  }
}

// ============================================
// RATE LIMITING HELPERS
// ============================================

export function getClientIp(request) {
  // Extract IP from various headers that might be present
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  
  const clientIp = request.headers.get('x-client-ip')
  if (clientIp) return clientIp
  
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  
  return request.ip || '0.0.0.0'
}

// ============================================
// ID GENERATION HELPERS
// ============================================

export function generateBookingId() {
  // Format: MB-{timestamp}-{random-hash}
  const timestamp = Date.now()
  const randomPart = Math.random().toString(16).slice(2, 10)
  return `MB-${timestamp}-${randomPart}`
}

export function generateOrderId() {
  // Format: ORD-{timestamp}-{random-hash}
  const timestamp = Date.now()
  const randomPart = Math.random().toString(16).slice(2, 10)
  return `ORD-${timestamp}-${randomPart}`
}

export function generatePaymentReference(orderId) {
  // Use random UUID instead of Date.now() to prevent collisions
  const randomPart = crypto.getRandomValues(new Uint8Array(4))
  const hexPart = Array.from(randomPart)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${orderId}-${hexPart}`
}

// ============================================
// FORMATTING HELPERS
// ============================================

export function formatPhoneForDisplay(phone) {
  // Format: +233 XXX XXX XXXX
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  return phone
}

export function formatCurrency(amount) {
  // Format as GHS currency
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(amount)
}

export function formatDate(dateString) {
  // Format: June 23, 2026
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(isoString) {
  // Format: June 23, 2026 at 3:00 PM
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ============================================
// NOTIFICATION MESSAGE BUILDERS
// ============================================

import { getEmailSubject } from './config'

export function buildBookingConfirmationEmail(booking) {
  return {
    subject: getEmailSubject('booking_confirmation'),
    html: `
      <h2>Your Booking Confirmation</h2>
      <p>Dear ${booking.name},</p>
      <p>Thank you for booking with Mani Beauty! Here are your booking details:</p>
      <ul>
        <li><strong>Service:</strong> ${booking.serviceLabel}</li>
        <li><strong>Date:</strong> ${formatDate(booking.date)}</li>
        <li><strong>Time:</strong> ${booking.time}</li>
        <li><strong>Reference:</strong> ${booking.id}</li>
      </ul>
      <p>We'll contact you at <strong>${booking.phone}</strong> to confirm your appointment.</p>
      <p>Best regards,<br>Mani Beauty Team</p>
    `,
  }
}

export function buildAdminBookingNotification(booking) {
  return {
    subject: getEmailSubject('booking_admin_notification'),
    html: `
      <h2>New Booking</h2>
      <ul>
        <li><strong>Client:</strong> ${booking.name}</li>
        <li><strong>Phone:</strong> ${booking.phone}</li>
        <li><strong>Email:</strong> ${booking.email}</li>
        <li><strong>Service:</strong> ${booking.serviceLabel}</li>
        <li><strong>Date:</strong> ${formatDate(booking.date)}</li>
        <li><strong>Time:</strong> ${booking.time}</li>
        <li><strong>Reference:</strong> ${booking.id}</li>
        ${booking.notes ? `<li><strong>Notes:</strong> ${booking.notes}</li>` : ''}
      </ul>
      <p><a href="/admin/dashboard">View in Dashboard</a></p>
    `,
  }
}

// ============================================
// DATA TRANSFORMATION HELPERS
// ============================================

export function sanitizeBookingForDisplay(booking) {
  return {
    ...booking,
    // Hide full email in list views, show only domain
    emailDisplay: booking.email ? booking.email.split('@')[0] + '@...' : 'N/A',
    // Format phone for display
    phoneDisplay: formatPhoneForDisplay(booking.phone),
    // Format date for display
    dateDisplay: formatDate(booking.date),
    // Format booking date
    bookedDateDisplay: formatDateTime(booking.bookedDate),
  }
}

export function sanitizeOrderForDisplay(order) {
  return {
    ...order,
    emailDisplay: order.email ? order.email.split('@')[0] + '@...' : 'N/A',
    phoneDisplay: formatPhoneForDisplay(order.phone),
    orderedDateDisplay: formatDateTime(order.orderedAt),
  }
}

// ============================================
// COMMON CHECKS
// ============================================

export function isDevelopment() {
  return process.env.NODE_ENV === 'development'
}

export function isProduction() {
  return process.env.NODE_ENV === 'production'
}

export function isTest() {
  return process.env.NODE_ENV === 'test'
}

export default {
  // Logging
  logDebug,
  logDataOp,
  logSupabase,
  logPayment,
  logError,
  
  // Validation
  validatePhone,
  validateEmail,
  validateName,
  validateDate,
  
  // Responses
  createErrorResponse,
  createSuccessResponse,
  
  // Rate limiting
  getClientIp,
  
  // ID generation
  generateBookingId,
  generateOrderId,
  generatePaymentReference,
  
  // Formatting
  formatPhoneForDisplay,
  formatCurrency,
  formatDate,
  formatDateTime,
  
  // Email builders
  buildBookingConfirmationEmail,
  buildAdminBookingNotification,
  
  // Data transformation
  sanitizeBookingForDisplay,
  sanitizeOrderForDisplay,
  
  // Environment checks
  isDevelopment,
  isProduction,
  isTest,
}
