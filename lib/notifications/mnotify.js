/**
 * Mnotify SMS Service Module
 * Handles SMS sending via Mnotify API
 * Documentation: https://www.mnotify.com/
 */

const MNOTIFY_QUICK_SMS_ENDPOINT = 'https://api.mnotify.com/api/sms/quick'
const MNOTIFY_GROUP_SMS_ENDPOINT = 'https://api.mnotify.com/api/sms/group'
const MNOTIFY_SCHEDULED_ENDPOINT = 'https://api.mnotify.com/api/scheduled'
const MNOTIFY_SCHEDULE_UPDATE_ENDPOINT = (id) => `https://api.mnotify.com/api/schedule/${id}`

/**
 * Check if Mnotify SMS is configured
 */
function isMnotifySmsConfigured() {
  return Boolean(
    process.env.MNOTIFY_API_KEY &&
    process.env.MNOTIFY_SENDER_ID
  )
}

/**
 * Normalize phone number to format expected by Mnotify
 * Mnotify expects format without + (e.g., 233241234567)
 */
function normalizeMnotifyPhoneNumber(value) {
  const digitsOnly = String(value || '').replace(/[^\d]/g, '')

  if (!digitsOnly) return ''
  
  // Ghana: 0242445558 (10 digits starting with 0) → 233242445558
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    return `233${digitsOnly.slice(1)}`
  }

  // Ghana: 233242445558 (12 digits starting with 233) → 233242445558
  if (digitsOnly.startsWith('233') && digitsOnly.length === 12) {
    return digitsOnly
  }

  // US/Canada: 1xxxxxxxxxx (11 digits starting with 1) → 1xxxxxxxxxx
  if (digitsOnly.startsWith('1') && digitsOnly.length === 11) {
    return digitsOnly
  }

  // Generic: assume it's already a valid number
  if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    return digitsOnly
  }

  return ''
}

/**
 * Send SMS via Mnotify Quick SMS endpoint
 */
async function sendQuickSms({ recipients, message, sender = null }) {
  if (!isMnotifySmsConfigured()) {
    console.log('📱 [Mnotify SMS] Mnotify not configured - skipping')
    return { sent: false, reason: 'not-configured' }
  }

  // Ensure recipients is an array
  const recipientArray = Array.isArray(recipients) ? recipients : [recipients]
  
  // Format recipients
  const formattedRecipients = recipientArray
    .map(r => normalizeMnotifyPhoneNumber(r))
    .filter(r => r) // Remove empty strings

  if (formattedRecipients.length === 0) {
    console.log('📱 [Mnotify SMS ERROR] No valid recipients found')
    return { sent: false, reason: 'invalid-recipient' }
  }

  const senderId = sender || String(process.env.MNOTIFY_SENDER_ID || '').trim()
  const apiKey = String(process.env.MNOTIFY_API_KEY || '').trim()

  const payload = {
    recipient: formattedRecipients,
    sender: senderId,
    message: message,
    is_schedule: false,
  }

  console.log('📱 [Mnotify SMS] Sending quick SMS:')
  console.log('  - Recipients:', formattedRecipients)
  console.log('  - Sender:', senderId)
  console.log('  - Message length:', message.length)
  console.log('  - Endpoint:', MNOTIFY_QUICK_SMS_ENDPOINT)

  try {
    const response = await fetch(`${MNOTIFY_QUICK_SMS_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()

    console.log('📱 [Mnotify SMS] Response status:', response.status)
    console.log('📱 [Mnotify SMS] Response:', JSON.stringify(responseData).substring(0, 300))

    if (!response.ok || responseData.status !== 'success') {
      const errorMsg = responseData.message || `HTTP ${response.status}`
      console.log('📱 [Mnotify SMS ERROR] Failed:', errorMsg)
      throw new Error(`SMS notification failed: ${errorMsg}`)
    }

    console.log('📱 [Mnotify SMS SUCCESS] SMS sent to', formattedRecipients.length, 'recipient(s)')
    return { 
      sent: true, 
      campaignId: responseData.summary?._id,
      creditUsed: responseData.summary?.credit_used,
    }
  } catch (error) {
    console.error('📱 [Mnotify SMS ERROR]', error.message)
    throw error
  }
}

/**
 * Send SMS using message template via Mnotify Group SMS endpoint
 */
async function sendGroupSms({ groupIds, messageId, sender = null }) {
  if (!isMnotifySmsConfigured()) {
    console.log('📱 [Mnotify SMS] Mnotify not configured - skipping')
    return { sent: false, reason: 'not-configured' }
  }

  const groupIdArray = Array.isArray(groupIds) ? groupIds : [groupIds]
  const senderId = sender || String(process.env.MNOTIFY_SENDER_ID || '').trim()
  const apiKey = String(process.env.MNOTIFY_API_KEY || '').trim()

  const payload = {
    group_id: groupIdArray,
    message_id: parseInt(messageId),
    sender: senderId,
    is_schedule: false,
  }

  console.log('📱 [Mnotify SMS] Sending group SMS with template:')
  console.log('  - Group IDs:', groupIdArray)
  console.log('  - Message Template ID:', messageId)
  console.log('  - Sender:', senderId)

  try {
    const response = await fetch(`${MNOTIFY_GROUP_SMS_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()

    console.log('📱 [Mnotify SMS] Response status:', response.status)
    console.log('📱 [Mnotify SMS] Response:', JSON.stringify(responseData).substring(0, 300))

    if (!response.ok || responseData.status !== 'success') {
      const errorMsg = responseData.message || `HTTP ${response.status}`
      console.log('📱 [Mnotify SMS ERROR] Failed:', errorMsg)
      throw new Error(`SMS notification failed: ${errorMsg}`)
    }

    console.log('📱 [Mnotify SMS SUCCESS] Group SMS sent')
    return { 
      sent: true, 
      campaignId: responseData.summary?._id,
      creditUsed: responseData.summary?.credit_used,
    }
  } catch (error) {
    console.error('📱 [Mnotify SMS ERROR]', error.message)
    throw error
  }
}

/**
 * Schedule SMS to be sent at a specific date/time
 * Date format: YYYY-MM-DD hh:mm
 */
async function scheduleQuickSms({ recipients, message, scheduleDate, sender = null }) {
  if (!isMnotifySmsConfigured()) {
    console.log('📱 [Mnotify SMS] Mnotify not configured - skipping')
    return { sent: false, reason: 'not-configured' }
  }

  const recipientArray = Array.isArray(recipients) ? recipients : [recipients]
  
  const formattedRecipients = recipientArray
    .map(r => normalizeMnotifyPhoneNumber(r))
    .filter(r => r)

  if (formattedRecipients.length === 0) {
    console.log('📱 [Mnotify SMS ERROR] No valid recipients found')
    return { sent: false, reason: 'invalid-recipient' }
  }

  const senderId = sender || String(process.env.MNOTIFY_SENDER_ID || '').trim()
  const apiKey = String(process.env.MNOTIFY_API_KEY || '').trim()

  const payload = {
    recipient: formattedRecipients,
    sender: senderId,
    message: message,
    is_schedule: true,
    schedule_date: scheduleDate, // Format: YYYY-MM-DD hh:mm
  }

  console.log('📱 [Mnotify SMS] Scheduling quick SMS:')
  console.log('  - Recipients:', formattedRecipients)
  console.log('  - Sender:', senderId)
  console.log('  - Schedule Date:', scheduleDate)
  console.log('  - Message length:', message.length)

  try {
    const response = await fetch(`${MNOTIFY_QUICK_SMS_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()

    console.log('📱 [Mnotify SMS] Response status:', response.status)
    console.log('📱 [Mnotify SMS] Response:', JSON.stringify(responseData).substring(0, 300))

    if (!response.ok || responseData.status !== 'success') {
      const errorMsg = responseData.message || `HTTP ${response.status}`
      console.log('📱 [Mnotify SMS ERROR] Failed:', errorMsg)
      throw new Error(`SMS scheduling failed: ${errorMsg}`)
    }

    console.log('📱 [Mnotify SMS SUCCESS] SMS scheduled')
    return { 
      sent: true, 
      campaignId: responseData.summary?._id,
      creditUsed: responseData.summary?.credit_used,
    }
  } catch (error) {
    console.error('📱 [Mnotify SMS ERROR]', error.message)
    throw error
  }
}

/**
 * Get all scheduled messages
 */
async function getScheduledMessages() {
  if (!isMnotifySmsConfigured()) {
    return { scheduled: [], reason: 'not-configured' }
  }

  const apiKey = String(process.env.MNOTIFY_API_KEY || '').trim()

  try {
    const response = await fetch(`${MNOTIFY_SCHEDULED_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const responseData = await response.json()

    if (!response.ok || responseData.status !== 'success') {
      console.log('📱 [Mnotify SMS] Failed to get scheduled messages')
      return { scheduled: [] }
    }

    return { 
      scheduled: responseData.summary || [],
      status: 'success'
    }
  } catch (error) {
    console.error('📱 [Mnotify SMS ERROR]', error.message)
    return { scheduled: [] }
  }
}

/**
 * Update a scheduled message
 */
async function updateScheduledMessage(scheduleId, { message, scheduleDate, sender = null }) {
  if (!isMnotifySmsConfigured()) {
    console.log('📱 [Mnotify SMS] Mnotify not configured - skipping')
    return { updated: false, reason: 'not-configured' }
  }

  const senderId = sender || String(process.env.MNOTIFY_SENDER_ID || '').trim()
  const apiKey = String(process.env.MNOTIFY_API_KEY || '').trim()

  const payload = {
    sender: senderId,
    message: message,
    schedule_date: scheduleDate, // Format: YYYY-MM-DD hh:mm
  }

  console.log('📱 [Mnotify SMS] Updating scheduled message:')
  console.log('  - Schedule ID:', scheduleId)
  console.log('  - New Schedule Date:', scheduleDate)

  try {
    const response = await fetch(`${MNOTIFY_SCHEDULE_UPDATE_ENDPOINT(scheduleId)}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const responseData = await response.json()

    if (!response.ok || responseData.status !== 'success') {
      const errorMsg = responseData.message || `HTTP ${response.status}`
      console.log('📱 [Mnotify SMS ERROR] Update failed:', errorMsg)
      throw new Error(`SMS update failed: ${errorMsg}`)
    }

    console.log('📱 [Mnotify SMS SUCCESS] Message updated')
    return { updated: true }
  } catch (error) {
    console.error('📱 [Mnotify SMS ERROR]', error.message)
    throw error
  }
}

export {
  isMnotifySmsConfigured,
  normalizeMnotifyPhoneNumber,
  sendQuickSms,
  sendGroupSms,
  scheduleQuickSms,
  getScheduledMessages,
  updateScheduledMessage,
}
