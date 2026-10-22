import { getCatalog, listBookings, listProductOrders } from './dataStore'
import { defaultExtensions } from '../data/extensions.js'

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const legacyProductIds = (product, index) => [
  product.id,
  `product-${normalize(product.name || product.image || index)}`,
  `product-${normalize(product.image || product.name || index)}`,
].filter(Boolean).map(normalize)

export function parseGhsAmount(value) {
  const firstPrice = Array.isArray(value) ? value[0] : value
  const match = String(firstPrice || '').replace(/,/g, '').match(/(?:GHS|GH₵|₵)?\s*([0-9]+(?:\.[0-9]{1,2})?)/i)
  const amount = match ? Number(match[1]) : 0
  return Number.isFinite(amount) && amount > 0 ? amount : 0
}

const productNameFromImage = (image) =>
  String(image || '')
    .split('/')
    .pop()
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const imageKey = (image) => normalize(productNameFromImage(image))

export async function resolvePaystackOrder(orderId, requestedType) {
  const type = requestedType === 'booking' ? 'booking' : 'product'

  if (type === 'product') {
    const order = (await listProductOrders()).find((item) => item.id === orderId)
    if (!order) throw new Error('Product order not found')

    // Never trust prices posted by the browser. Match each ordered item to the
    // server-side catalog and calculate the amount from that authoritative copy.
    const catalog = await getCatalog()
    const products = Array.isArray(catalog.products) ? catalog.products : []
    const extensions = Array.isArray(catalog.extensions) ? catalog.extensions : []
    const knownExtensionKeys = new Set(extensions.flatMap((extension) => [extension.id, extension.name, extension.image].map(normalize)))
    const fallbackExtensions = defaultExtensions.filter((extension) =>
      ![extension.id, extension.name, extension.image].some((key) => knownExtensionKeys.has(normalize(key)))
    )
    const catalogItems = [
      ...products.map((product) => ({ ...product, __kind: 'product' })),
      ...[...extensions, ...fallbackExtensions].map((extension) => ({ ...extension, __kind: 'extension' })),
    ]

    const amounts = (order.items || []).map((item) => {
      const itemId = String(item.id || '')
      const indexMatch = itemId.match(/^(\d+)-/)
      const catalogIndex = indexMatch ? Number(indexMatch[1]) : -1
      const indexedProduct = Number.isInteger(catalogIndex) ? products[catalogIndex] : null
      const expectedId = indexedProduct
        ? `${catalogIndex}-${indexedProduct.image || indexedProduct.name || 'product'}`
        : ''

      const exactIdMatch = catalogItems.find((candidate, candidateIndex) =>
        normalize(candidate.id) === normalize(itemId) ||
        (candidate.__kind === 'product' && legacyProductIds(candidate, candidateIndex).includes(normalize(itemId)))
      )
      const nameMatch = catalogItems.find((candidate) =>
        normalize(candidate.name || productNameFromImage(candidate.image)) === normalize(item.name)
      )
      const imageMatch = catalogItems.find((candidate) =>
        candidate.image && item.image && imageKey(candidate.image) === imageKey(item.image)
      )
      const product = nameMatch || imageMatch || (expectedId === itemId ? indexedProduct : exactIdMatch)

      if (!product) throw new Error(`Product is no longer available: ${item.name || 'unknown product'}`)

      return {
        price: parseGhsAmount(product.price),
        quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
      }
    })

    if (!amounts.length || amounts.some((item) => item.price <= 0)) {
      throw new Error('This order contains an item whose price must be confirmed before payment')
    }

    return {
      type,
      record: order,
      email: order.email,
      customerName: order.name,
      amount: Number(amounts.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)),
    }
  }

  const booking = (await listBookings()).find((item) => item.id === orderId)
  if (!booking) throw new Error('Booking not found')
  if (booking.service === 'special-request') {
    throw new Error('Custom service requests must be priced before payment')
  }

  const catalog = await getCatalog()
  const service = (catalog.services || [])
    .flatMap((group) => group.items || [])
    .find((item) => normalize(item.name) === normalize(booking.serviceLabel) || normalize(item.name) === normalize(booking.service))
  const servicePrice = parseGhsAmount(service?.price)

  if (!servicePrice) throw new Error('The selected service does not have a payable price')

  return {
    type,
    record: booking,
    email: booking.email,
    customerName: booking.name,
    amount: Number(servicePrice.toFixed(2)),
  }
}
