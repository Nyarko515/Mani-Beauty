import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const attempts = new Map()

const RATE_LIMIT_WINDOWS = {
  LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  API_WRITE: { maxAttempts: 20, windowMs: 60 * 1000 },
  BOOKING_PUBLIC: { maxAttempts: 10, windowMs: 5 * 60 * 1000 },
}

const hasRedisConfig = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

const ratelimiters = hasRedisConfig
  ? {
      LOGIN: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(RATE_LIMIT_WINDOWS.LOGIN.maxAttempts, `${RATE_LIMIT_WINDOWS.LOGIN.windowMs} ms`),
        prefix: 'ratelimit:login',
      }),
      API_WRITE: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(RATE_LIMIT_WINDOWS.API_WRITE.maxAttempts, `${RATE_LIMIT_WINDOWS.API_WRITE.windowMs} ms`),
        prefix: 'ratelimit:apiwrite',
      }),
      BOOKING_PUBLIC: new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(
          RATE_LIMIT_WINDOWS.BOOKING_PUBLIC.maxAttempts,
          `${RATE_LIMIT_WINDOWS.BOOKING_PUBLIC.windowMs} ms`
        ),
        prefix: 'ratelimit:bookingpublic',
      }),
    }
  : null

export function getClientIp(request) {
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp.trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown'
}

function memoryRateLimit(identifier, limitType) {
  const limit = RATE_LIMIT_WINDOWS[limitType]
  const now = Date.now()
  const record = attempts.get(identifier) || { count: 0, resetTime: now + limit.windowMs }

  if (now > record.resetTime) {
    attempts.set(identifier, { count: 1, resetTime: now + limit.windowMs })
    return {
      limited: false,
      headers: {
        'RateLimit-Limit': limit.maxAttempts.toString(),
        'RateLimit-Remaining': (limit.maxAttempts - 1).toString(),
        'RateLimit-Reset': (now + limit.windowMs).toString(),
      },
    }
  }

  if (record.count >= limit.maxAttempts) {
    return {
      limited: true,
      headers: {
        'RateLimit-Limit': limit.maxAttempts.toString(),
        'RateLimit-Remaining': '0',
        'RateLimit-Reset': record.resetTime.toString(),
      },
    }
  }

  record.count += 1
  attempts.set(identifier, record)

  return {
    limited: false,
    headers: {
      'RateLimit-Limit': limit.maxAttempts.toString(),
      'RateLimit-Remaining': Math.max(0, limit.maxAttempts - record.count).toString(),
      'RateLimit-Reset': record.resetTime.toString(),
    },
  }
}

export async function checkRateLimit(identifier, limitType = 'LOGIN') {
  const limit = RATE_LIMIT_WINDOWS[limitType]
  if (!limit) {
    return { limited: false, headers: {} }
  }

  if (ratelimiters) {
    try {
      const ratelimiter = ratelimiters[limitType]
      const result = await ratelimiter.limit(identifier)

      return {
        limited: !result.success,
        headers: {
          'RateLimit-Limit': String(result.limit),
          'RateLimit-Remaining': String(result.remaining),
          'RateLimit-Reset': String(result.reset),
        },
      }
    } catch {
      return memoryRateLimit(identifier, limitType)
    }
  }

  return memoryRateLimit(identifier, limitType)
}
