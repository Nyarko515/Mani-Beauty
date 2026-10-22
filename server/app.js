import 'dotenv/config'
import crypto from 'node:crypto'
import path from 'node:path'
import express from 'express'
import { runWithRequestContext } from './request-context.js'

import * as auditLogs from '../app/api/admin/audit-logs/route.js'
import * as loginAudit from '../app/api/admin/login-audit/route.js'
import * as adminUploads from '../app/api/admin/uploads/route.js'
import * as bookings from '../app/api/bookings/route.js'
import * as bookingById from '../app/api/bookings/[id]/route.js'
import * as catalog from '../app/api/catalog/route.js'
import * as contact from '../app/api/contact/route.js'
import * as health from '../app/api/health/route.js'
import * as paystackInitialize from '../app/api/paystack/initialize/route.js'
import * as paystackVerify from '../app/api/paystack/verify/route.js'
import * as paystackWebhook from '../app/api/paystack/webhook/route.js'
import * as productOrders from '../app/api/product-orders/route.js'
import * as productOrderById from '../app/api/product-orders/[id]/route.js'
import * as uploads from '../app/api/uploads/route.js'

const rootDir = process.cwd()
const app = express()
app.disable('x-powered-by')
const port = Number(process.env.PORT || 3001)
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://manibeauty.co').replace(/\/$/, '')
const stageName = process.env.STAGE_NAME
const corsOrigins = (process.env.CORS_ORIGINS || siteUrl)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

function parseCookies(header = '') {
  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf('=')
      const name = separator >= 0 ? part.slice(0, separator) : part
      const value = separator >= 0 ? part.slice(separator + 1) : ''
      return { name, value: decodeURIComponent(value) }
    })
}

function serializeCookie({ name, value, options = {} }) {
  const segments = [`${name}=${encodeURIComponent(value)}`]
  if (options.maxAge) segments.push(`Max-Age=${options.maxAge}`)
  if (options.path) segments.push(`Path=${options.path}`)
  if (options.httpOnly) segments.push('HttpOnly')
  if (options.secure) segments.push('Secure')
  if (options.sameSite) {
    const sameSite = String(options.sameSite)
    segments.push(`SameSite=${sameSite[0].toUpperCase()}${sameSite.slice(1)}`)
  }
  return segments.join('; ')
}

function toWebRequest(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol
  const host = req.headers.host || `localhost:${port}`
  const init = {
    method: req.method,
    headers: new Headers(
      Object.entries(req.headers).flatMap(([key, value]) =>
        Array.isArray(value) ? value.map((entry) => [key, entry]) : value == null ? [] : [[key, value]]
      )
    ),
  }

  if (!['GET', 'HEAD'].includes(req.method)) {
    init.body = req
    init.duplex = 'half'
  }

  const request = new Request(`${protocol}://${host}${req.url}`, init)
  const cookies = parseCookies(req.headers.cookie)
  Object.defineProperty(request, 'cookies', {
    value: {
      get(name) {
        return cookies.find((cookie) => cookie.name === name)
      },
      getAll() {
        return cookies
      },
    },
  })
  return { request, cookies }
}

async function sendWebResponse(res, response, responseCookies) {
  res.status(response.status)
  response.headers.forEach((value, key) => res.setHeader(key, value))
  for (const cookie of responseCookies) {
    res.append('Set-Cookie', serializeCookie(cookie))
  }
  const body = Buffer.from(await response.arrayBuffer())
  res.send(body)
}

function route(module, method, getContext) {
  return async (req, res, next) => {
    try {
      const handler = module[method]
      if (!handler) {
        res.status(405).json({ error: 'Method not allowed' })
        return
      }

      const { request, cookies } = toWebRequest(req)
      const responseCookies = []
      const response = await runWithRequestContext(
        { request, cookies, responseCookies },
        () => handler(request, getContext ? getContext(req) : undefined)
      )
      await sendWebResponse(res, response, responseCookies)
    } catch (error) {
      next(error)
    }
  }
}

const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://api.twilio.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

app.use((req, res, next) => {
  if (stageName) {
    const stagePrefix = `/${stageName}`
    if (req.url === stagePrefix) {
      req.url = '/'
    } else if (req.url.startsWith(`${stagePrefix}/`)) {
      req.url = req.url.slice(stagePrefix.length)
    }
  }

  next()
})

app.use((req, res, next) => {
  const origin = req.headers.origin?.replace(/\/$/, '')
  const allowAnyOrigin = corsOrigins.includes('*')
  const allowedOrigin = origin && (allowAnyOrigin || corsOrigins.includes(origin)) ? origin : ''

  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,X-CSRF-Token,X-Requested-With'
  )

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
    return
  }

  next()
})

app.use((req, res, next) => {
  Object.entries(securityHeaders).forEach(([key, value]) => res.setHeader(key, value))
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  next()
})

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`)
})

app.get('/sitemap.xml', (req, res) => {
  const pages = [
    '',
    '/about',
    '/contact',
    '/hair-extensions',
    '/locations',
    '/locations/atomic',
    '/locations/haatso',
    '/locations/legon',
    '/locations/madina',
    '/products',
    '/reviews',
    '/services',
  ]
  const urls = pages.map((page) => `<url><loc>${siteUrl}${page}</loc></url>`).join('')
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`)
})

app.get('/api/csrf', (req, res) => {
  const existing = parseCookies(req.headers.cookie).find((cookie) => cookie.name === 'sb-csrf-token')
  const token = existing?.value || crypto.randomUUID().replaceAll('-', '')
  if (!existing) {
    res.cookie('sb-csrf-token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
    })
  }
  res.json({ ok: true })
})

app.get('/api/admin/audit-logs', route(auditLogs, 'GET'))
app.post('/api/admin/login-audit', route(loginAudit, 'POST'))
app.post('/api/admin/uploads', route(adminUploads, 'POST'))
app.get('/api/bookings', route(bookings, 'GET'))
app.post('/api/bookings', route(bookings, 'POST'))
app.patch('/api/bookings/:id', route(bookingById, 'PATCH', (req) => ({ params: req.params })))
app.delete('/api/bookings/:id', route(bookingById, 'DELETE', (req) => ({ params: req.params })))
app.get('/api/catalog', route(catalog, 'GET'))
app.put('/api/catalog', route(catalog, 'PUT'))
app.post('/api/contact', route(contact, 'POST'))
app.get('/api/health', route(health, 'GET'))
app.post('/api/paystack/initialize', route(paystackInitialize, 'POST'))
app.get('/api/paystack/verify', route(paystackVerify, 'GET'))
app.post('/api/paystack/webhook', route(paystackWebhook, 'POST'))
app.get('/api/product-orders', route(productOrders, 'GET'))
app.post('/api/product-orders', route(productOrders, 'POST'))
app.patch('/api/product-orders/:id', route(productOrderById, 'PATCH', (req) => ({ params: req.params })))
app.delete('/api/product-orders/:id', route(productOrderById, 'DELETE', (req) => ({ params: req.params })))
app.post('/api/uploads', route(uploads, 'POST'))

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.use(express.static(path.join(rootDir, 'public')))
app.use(express.static(path.join(rootDir, 'dist')))
app.use((req, res) => {
  res.sendFile(path.join(rootDir, 'dist', 'index.html'))
})

app.use((error, req, res, next) => {
  console.error(error)
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' })
  } else {
    next(error)
  }
})

export { app }

if (!process.env.AWS_LAMBDA_FUNCTION_NAME && process.argv[1]?.replaceAll('\\', '/').endsWith('/server/app.js')) {
  app.listen(port, () => {
    console.log(`Mani Beauty server listening on http://localhost:${port}`)
  })
}
