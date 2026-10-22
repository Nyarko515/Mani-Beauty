import { AsyncLocalStorage } from 'node:async_hooks'

const requestStorage = new AsyncLocalStorage()

export function runWithRequestContext(context, callback) {
  return requestStorage.run(context, callback)
}

export function getRequestContext() {
  return requestStorage.getStore()
}

export function getRequestCookies() {
  return getRequestContext()?.cookies || []
}

export function addResponseCookie(cookie) {
  getRequestContext()?.responseCookies.push(cookie)
}
