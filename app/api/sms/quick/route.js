/**
 * API Endpoint: Quick SMS Test
 * POST /api/sms/quick
 * 
 * Send a quick SMS message for testing
 */

import { sendQuickSms } from '../../../../lib/notifications/mnotify'

export async function POST(request) {
  try {
    const body = await request.json()
    const { recipients, message } = body

    // Verify admin authorization
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')
    
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!recipients || !message) {
      return Response.json(
        { error: 'Recipients and message are required' },
        { status: 400 }
      )
    }

    console.log('📱 [Quick SMS] Sending test SMS...')
    
    const result = await sendQuickSms({
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      message,
    })

    return Response.json({
      success: true,
      message: 'SMS sent successfully',
      result,
    })
  } catch (error) {
    console.error('📱 [Quick SMS ERROR]', error)
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
