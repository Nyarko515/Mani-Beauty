const RESEND_ENDPOINT = 'https://api.resend.com/emails'

function getBookingNotificationFrom() {
  return String(process.env.BOOKING_NOTIFICATION_FROM || '').trim()
}

function getBookingNotificationTo() {
  return String(process.env.BOOKING_NOTIFICATION_TO || '').trim()
}

function getContactNotificationFrom() {
  return String(process.env.CONTACT_NOTIFICATION_FROM || getBookingNotificationFrom() || '').trim()
}

function getContactNotificationTo() {
  return String(process.env.CONTACT_NOTIFICATION_TO || getBookingNotificationTo() || process.env.NEXT_PUBLIC_EMAIL || '').trim()
}

function isEmailNotificationsConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
      getBookingNotificationTo() &&
      getBookingNotificationFrom()
  )
}

function isContactEmailNotificationsConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
      getContactNotificationFrom() &&
      getContactNotificationTo()
  )
}

function buildContactEmail(contact) {
  const subject = `New Contact Message ${contact.id} - ${contact.name}`

  const text = [
    'A new contact message has been submitted.',
    '',
    `Reference: ${contact.id}`,
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Phone: ${contact.phone || 'N/A'}`,
    `Subject: ${contact.subject}`,
    `Message: ${contact.message}`,
    `Submitted At: ${contact.receivedAt}`,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 12px;">New Contact Message</h2>
      <p style="margin: 0 0 12px;"><strong>Reference:</strong> ${contact.id}</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 640px;">
        <tr><td style="padding: 6px 0;"><strong>Name</strong></td><td style="padding: 6px 0;">${contact.name}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Email</strong></td><td style="padding: 6px 0;">${contact.email}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Phone</strong></td><td style="padding: 6px 0;">${contact.phone || 'N/A'}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Subject</strong></td><td style="padding: 6px 0;">${contact.subject}</td></tr>
        <tr><td style="padding: 6px 0; vertical-align: top;"><strong>Message</strong></td><td style="padding: 6px 0; white-space: pre-wrap;">${contact.message}</td></tr>
      </table>
    </div>
  `

  return { subject, text, html }
}

function buildContactConfirmationEmail(contact) {
  const salonName = process.env.NEXT_PUBLIC_SITE_NAME || 'Mani Beauty'
  const subject = `We received your message - ${salonName}`

  const text = [
    `Hi ${contact.name},`,
    '',
    `Thank you for contacting ${salonName}. We have received your message and will get back to you shortly.`,
    '',
    `Reference: ${contact.id}`,
    `Subject: ${contact.subject}`,
    '',
    'Message received:',
    contact.message,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">${salonName}</h2>
      <p style="margin-top: 0;">Hi ${contact.name},</p>
      <p>Thank you for contacting ${salonName}. We have received your message and will get back to you shortly.</p>
      <p style="margin: 0 0 12px;"><strong>Reference:</strong> ${contact.id}</p>
      <p style="margin: 0 0 12px;"><strong>Subject:</strong> ${contact.subject}</p>
      <div style="padding: 12px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; white-space: pre-wrap;">${contact.message}</div>
    </div>
  `

  return { subject, text, html }
}

function buildBookingEmail(booking) {
  const subject = `New Booking ${booking.id} - ${booking.name}`

  const text = [
    'A new booking has been submitted.',
    '',
    `Reference: ${booking.id}`,
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Service: ${booking.serviceLabel || booking.service}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
    `Notes: ${booking.notes || 'N/A'}`,
    `Submitted At: ${booking.bookedDate}`,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 12px;">New Booking Received</h2>
      <p style="margin: 0 0 12px;"><strong>Reference:</strong> ${booking.id}</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 640px;">
        <tr><td style="padding: 6px 0;"><strong>Name</strong></td><td style="padding: 6px 0;">${booking.name}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Email</strong></td><td style="padding: 6px 0;">${booking.email}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Phone</strong></td><td style="padding: 6px 0;">${booking.phone}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Service</strong></td><td style="padding: 6px 0;">${booking.serviceLabel || booking.service}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Date</strong></td><td style="padding: 6px 0;">${booking.date}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Time</strong></td><td style="padding: 6px 0;">${booking.time}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Notes</strong></td><td style="padding: 6px 0;">${booking.notes || 'N/A'}</td></tr>
      </table>
    </div>
  `

  return { subject, text, html }
}

function buildCustomerConfirmationEmail(booking) {
  const salonName = process.env.NEXT_PUBLIC_SITE_NAME || 'Mani Beauty Salon'
  const phone = process.env.NEXT_PUBLIC_PHONE || ''
  const email = process.env.NEXT_PUBLIC_EMAIL || ''
  const subject = `Booking confirmed - ${booking.serviceLabel || booking.service}`

  const text = [
    `Hi ${booking.name},`,
    '',
    `Thank you for booking with ${salonName}. We have received your request and will review it shortly.`,
    '',
    `Reference: ${booking.id}`,
    `Service: ${booking.serviceLabel || booking.service}`,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
    '',
    'If you need to make changes, please reply to this email or contact us directly.',
    phone ? `Phone: ${phone}` : '',
    email ? `Email: ${email}` : '',
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">${salonName}</h2>
      <p style="margin-top: 0;">Hi ${booking.name},</p>
      <p>Thank you for booking with ${salonName}. We have received your request and will review it shortly.</p>
      <p style="margin: 0 0 12px;"><strong>Reference:</strong> ${booking.id}</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 640px;">
        <tr><td style="padding: 6px 0;"><strong>Service</strong></td><td style="padding: 6px 0;">${booking.serviceLabel || booking.service}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Date</strong></td><td style="padding: 6px 0;">${booking.date}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Time</strong></td><td style="padding: 6px 0;">${booking.time}</td></tr>
      </table>
      <p style="margin-top: 16px;">If you need to make changes, please reply to this email or contact us directly.</p>
      <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #E5E7EB; color: #4B5563; font-size: 0.95rem;">
        ${phone ? `<div><strong>Phone:</strong> ${phone}</div>` : ''}
        ${email ? `<div><strong>Email:</strong> ${email}</div>` : ''}
      </div>
    </div>
  `

  return { subject, text, html }
}

export async function sendBookingNotificationEmail(booking) {
  if (!isEmailNotificationsConfigured()) {
    return { sent: false, reason: 'not-configured' }
  }

  const { subject, text, html } = buildBookingEmail(booking)

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getBookingNotificationFrom(),
      to: [getBookingNotificationTo()],
      subject,
      text,
      html,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Email notification failed: ${details}`)
  }

  return { sent: true }
}

export async function sendBookingConfirmationEmail(booking) {
  if (!isEmailNotificationsConfigured()) {
    return { sent: false, reason: 'not-configured' }
  }

  if (!booking.email) {
    return { sent: false, reason: 'no-email-provided' }
  }

  const { subject, text, html } = buildCustomerConfirmationEmail(booking)

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getBookingNotificationFrom(),
      to: [booking.email],
      subject,
      text,
      html,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Customer confirmation failed: ${details}`)
  }

  return { sent: true }
}

export async function sendContactNotificationEmail(contact) {
  if (!isContactEmailNotificationsConfigured()) {
    return { sent: false, reason: 'not-configured' }
  }

  const { subject, text, html } = buildContactEmail(contact)

  const from = getContactNotificationFrom()
  const to = getContactNotificationTo()

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html,
      ...(contact.email ? { reply_to: contact.email } : {}),
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    const errorInfo = `Resend API error (${response.status}): ${details}. Config - From: "${from}", To: "${to}"`
    throw new Error(`Contact notification failed: ${errorInfo}`)
  }

  return { sent: true }
}

export async function sendContactConfirmationEmail(contact) {
  if (!isContactEmailNotificationsConfigured()) {
    return { sent: false, reason: 'not-configured' }
  }

  if (!contact.email) {
    return { sent: false, reason: 'no-email-provided' }
  }

  const { subject, text, html } = buildContactConfirmationEmail(contact)

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getContactNotificationFrom(),
      to: [contact.email],
      subject,
      text,
      html,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Contact confirmation failed: ${details}`)
  }

  return { sent: true }
}

function getProductOrderNotificationFrom() {
  return String(process.env.PRODUCT_ORDER_NOTIFICATION_FROM || process.env.BOOKING_NOTIFICATION_FROM || process.env.CONTACT_NOTIFICATION_FROM || '').trim()
}

function getProductOrderNotificationTo() {
  return String(process.env.PRODUCT_ORDER_NOTIFICATION_TO || process.env.BOOKING_NOTIFICATION_TO || process.env.CONTACT_NOTIFICATION_TO || process.env.NEXT_PUBLIC_EMAIL || '').trim()
}

function isProductOrderAdminEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && getProductOrderNotificationFrom() && getProductOrderNotificationTo())
}

function isProductOrderCustomerEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && getProductOrderNotificationFrom())
}

function buildProductOrderAdminEmail(order) {
  const subject = `New Product Order ${order.id} - ${order.name}`

  const text = [
    'A new product order has been submitted.',
    '',
    `Reference: ${order.id}`,
    `Name: ${order.name}`,
    `Email: ${order.email}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}`,
    `Note: ${order.note || 'N/A'}`,
    'Items:',
    ...order.items.map((item) => `- ${item.name} | ${item.price || 'Price not set'} x${item.quantity || 1}`),
    `Submitted At: ${order.orderedAt}`,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin-bottom: 12px;">New Product Order</h2>
      <p style="margin: 0 0 12px;"><strong>Reference:</strong> ${order.id}</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
        <tr><td style="padding: 6px 0;"><strong>Name</strong></td><td style="padding: 6px 0;">${order.name}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Email</strong></td><td style="padding: 6px 0;">${order.email}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Phone</strong></td><td style="padding: 6px 0;">${order.phone}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Address</strong></td><td style="padding: 6px 0;">${order.address}</td></tr>
        <tr><td style="padding: 6px 0; vertical-align: top;"><strong>Note</strong></td><td style="padding: 6px 0; white-space: pre-wrap;">${order.note || 'N/A'}</td></tr>
      </table>
      <div style="margin-top: 16px;">
        <strong>Items</strong>
        <ul style="margin: 8px 0 0; padding-left: 20px;">
          ${order.items
            .map(
              (item) =>
                `<li style="margin-bottom: 6px;">${item.name} - ${item.price || 'Price not set'} x${item.quantity || 1}</li>`
            )
            .join('')}
        </ul>
      </div>
    </div>
  `

  return { subject, text, html }
}

function buildProductOrderCustomerEmail(order) {
  const salonName = process.env.NEXT_PUBLIC_SITE_NAME || 'Mani Beauty'
  const subject = `Product order received - ${salonName}`

  const text = [
    `Hi ${order.name},`,
    '',
    `Thank you for your product order with ${salonName}. We have received it and will review it shortly.`,
    '',
    `Reference: ${order.id}`,
    `Address: ${order.address}`,
    '',
    'Items:',
    ...order.items.map((item) => `- ${item.name} | ${item.price || 'Price not set'} x${item.quantity || 1}`),
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">${salonName}</h2>
      <p style="margin-top: 0;">Hi ${order.name},</p>
      <p>Thank you for your product order with ${salonName}. We have received it and will review it shortly.</p>
      <p style="margin: 0 0 12px;"><strong>Reference:</strong> ${order.id}</p>
      <p style="margin: 0 0 12px;"><strong>Delivery Address:</strong> ${order.address}</p>
      <div style="padding: 12px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
        <strong>Items</strong>
        <ul style="margin: 8px 0 0; padding-left: 20px;">
          ${order.items
            .map(
              (item) =>
                `<li style="margin-bottom: 6px;">${item.name} - ${item.price || 'Price not set'} x${item.quantity || 1}</li>`
            )
            .join('')}
        </ul>
      </div>
    </div>
  `

  return { subject, text, html }
}

export async function sendProductOrderNotificationEmail(order) {
  if (!isProductOrderAdminEmailConfigured()) {
    return { sent: false, reason: 'not-configured' }
  }

  const { subject, text, html } = buildProductOrderAdminEmail(order)

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getProductOrderNotificationFrom(),
      to: [getProductOrderNotificationTo()],
      subject,
      text,
      html,
      ...(order.email ? { reply_to: order.email } : {}),
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Product order notification failed: ${details}`)
  }

  return { sent: true }
}

export async function sendProductOrderConfirmationEmail(order) {
  if (!isProductOrderCustomerEmailConfigured()) {
    return { sent: false, reason: 'not-configured' }
  }

  if (!order.email) {
    return { sent: false, reason: 'no-email-provided' }
  }

  const { subject, text, html } = buildProductOrderCustomerEmail(order)

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: getProductOrderNotificationFrom(),
      to: [order.email],
      subject,
      text,
      html,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Product order confirmation failed: ${details}`)
  }

  return { sent: true }
}
