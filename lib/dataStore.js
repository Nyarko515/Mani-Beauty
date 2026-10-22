import { readFile, writeFile } from 'fs/promises'
import path from 'path'
import { getSupabaseAdminClient } from './supabase/admin'
import bundledCatalog from '../data/catalog.json' with { type: 'json' }
import { defaultExtensions } from '../data/extensions.js'

const bookingsPath = path.join(process.cwd(), 'data', 'bookings.json')
const catalogPath = path.join(process.cwd(), 'data', 'catalog.json')
const productOrdersPath = path.join(process.cwd(), 'data', 'product-orders.json')

function normalizeCatalogKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function hasMeaningfulProductPrice(price) {
  const text = String(price || '').trim()
  if (!text) return false

  const numeric = Number(text.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(numeric)) return true

  return numeric > 0
}

function mergeCatalogProducts(payload, fallbackCatalog) {
  if (!payload || !Array.isArray(payload.products)) {
    return payload
  }

  const fallbackProducts = Array.isArray(fallbackCatalog?.products) ? fallbackCatalog.products : []
  const fallbackByKey = new Map()

  fallbackProducts.forEach((product, index) => {
    const key = normalizeCatalogKey(product.name || product.image || index)
    if (!fallbackByKey.has(key)) {
      fallbackByKey.set(key, product)
    }
  })

  return {
    ...payload,
    products: payload.products.map((product, index) => {
      if (hasMeaningfulProductPrice(product.price)) {
        return product
      }

      const key = normalizeCatalogKey(product.name || product.image || index)
      const fallbackProduct = fallbackByKey.get(key) || fallbackProducts[index]

      if (fallbackProduct?.price) {
        return {
          ...product,
          price: fallbackProduct.price,
        }
      }

      return product
    }),
  }
}

function mergeCatalogExtensions(payload, fallbackCatalog) {
  const fallbackExtensions = Array.isArray(fallbackCatalog?.extensions) && fallbackCatalog.extensions.length > 0
    ? fallbackCatalog.extensions
    : defaultExtensions
  if (!fallbackExtensions.length) return payload

  const savedExtensions = Array.isArray(payload?.extensions) ? payload.extensions : []
  const savedByKey = new Map()

  savedExtensions.forEach((extension) => {
    for (const key of [extension.id, extension.name, extension.image]) {
      const normalized = normalizeCatalogKey(key)
      if (normalized && !savedByKey.has(normalized)) savedByKey.set(normalized, extension)
    }
  })

  const matchedSavedExtensions = new Set()
  const mergedExtensions = fallbackExtensions.map((fallbackExtension) => {
    const savedExtension = [fallbackExtension.id, fallbackExtension.name, fallbackExtension.image]
      .map(normalizeCatalogKey)
      .map((key) => savedByKey.get(key))
      .find(Boolean)

    if (savedExtension) matchedSavedExtensions.add(savedExtension)
    return savedExtension ? { ...fallbackExtension, ...savedExtension } : fallbackExtension
  })

  const savedOnlyExtensions = savedExtensions.filter((extension) => !matchedSavedExtensions.has(extension))

  return {
    ...payload,
    extensions: [...mergedExtensions, ...savedOnlyExtensions],
  }
}

function mapBookingRowToModel(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    service: row.service,
    serviceLabel: row.service_label,
    date: row.date,
    time: row.time,
    notes: row.notes || '',
    status: row.status,
    bookedDate: row.booked_date,
    paymentStatus: row.payment_status || 'not-required',
    paymentReference: row.payment_reference || null,
    paymentMethod: row.payment_method || null,
    paymentAmount: row.payment_amount == null ? null : Number(row.payment_amount),
    paymentCurrency: row.payment_currency || null,
    paymentChannel: row.payment_channel || null,
    paymentTransactionId: row.payment_transaction_id || null,
    paymentDetails: row.payment_details || {},
    paidAt: row.paid_at || null,
  }
}

function mapBookingModelToRow(booking) {
  return {
    id: booking.id,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    service: booking.service,
    service_label: booking.serviceLabel,
    date: booking.date,
    time: booking.time,
    notes: booking.notes || '',
    status: booking.status,
    booked_date: booking.bookedDate,
    payment_status: booking.paymentStatus || 'not-required',
    payment_reference: booking.paymentReference || null,
    payment_method: booking.paymentMethod || null,
    payment_amount: booking.paymentAmount ?? null,
    payment_currency: booking.paymentCurrency || null,
    payment_channel: booking.paymentChannel || null,
    payment_transaction_id: booking.paymentTransactionId == null ? null : String(booking.paymentTransactionId),
    payment_details: booking.paymentDetails || {},
    paid_at: booking.paidAt || null,
  }
}

function mapProductOrderRowToModel(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    note: row.note || '',
    items: Array.isArray(row.items) ? row.items : [],
    status: row.status,
    orderedAt: row.ordered_at,
    paymentStatus: row.payment_status || 'pending',
    paymentReference: row.payment_reference || null,
    paymentMethod: row.payment_method || null,
    paymentAmount: row.payment_amount == null ? null : Number(row.payment_amount),
    paymentCurrency: row.payment_currency || null,
    paymentChannel: row.payment_channel || null,
    paymentTransactionId: row.payment_transaction_id || null,
    paymentDetails: row.payment_details || {},
    paidAt: row.paid_at || null,
  }
}

function mapProductOrderModelToRow(order) {
  return {
    id: order.id,
    name: order.name,
    email: order.email,
    phone: order.phone,
    address: order.address,
    note: order.note || '',
    items: Array.isArray(order.items) ? order.items : [],
    status: order.status,
    ordered_at: order.orderedAt,
    payment_status: order.paymentStatus || 'pending',
    payment_reference: order.paymentReference || null,
    payment_method: order.paymentMethod || null,
    payment_amount: order.paymentAmount ?? null,
    payment_currency: order.paymentCurrency || null,
    payment_channel: order.paymentChannel || null,
    payment_transaction_id: order.paymentTransactionId == null ? null : String(order.paymentTransactionId),
    payment_details: order.paymentDetails || {},
    paid_at: order.paidAt || null,
  }
}

async function readJsonArray(filePath) {
  try {
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value))
}

function mapPaymentUpdatesToRow(updates) {
  const row = {}
  const mappings = {
    paymentStatus: 'payment_status',
    paymentReference: 'payment_reference',
    paymentMethod: 'payment_method',
    paymentAmount: 'payment_amount',
    paymentCurrency: 'payment_currency',
    paymentChannel: 'payment_channel',
    paymentTransactionId: 'payment_transaction_id',
    paymentDetails: 'payment_details',
    paidAt: 'paid_at',
  }

  for (const [modelKey, rowKey] of Object.entries(mappings)) {
    if (Object.prototype.hasOwnProperty.call(updates, modelKey)) {
      row[rowKey] = modelKey === 'paymentTransactionId' && updates[modelKey] != null
        ? String(updates[modelKey])
        : updates[modelKey]
    }
  }

  return row
}

async function readJsonObject(filePath) {
  try {
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    if (filePath === catalogPath) {
      return cloneJson(bundledCatalog)
    }

    return { services: [], products: [] }
  }
}

function mergeCatalogServices(payload, fallbackCatalog) {
  if (!payload || !Array.isArray(payload.services)) {
    return payload
  }

  const fallbackServices = Array.isArray(fallbackCatalog?.services) ? fallbackCatalog.services : []
  const fallbackByItemName = new Map()

  fallbackServices.forEach((group) => {
    ;(group.items || []).forEach((item) => {
      const key = normalizeCatalogKey(item.name)
      if (key && !fallbackByItemName.has(key)) {
        fallbackByItemName.set(key, item)
      }
    })
  })

  return {
    ...payload,
    services: payload.services.map((group) => ({
      ...group,
      items: (group.items || []).map((item) => {
        const fallbackItem = fallbackByItemName.get(normalizeCatalogKey(item.name))
        if (!fallbackItem?.image) {
          return item
        }

        const sameImage = normalizeCatalogKey(item.image) === normalizeCatalogKey(fallbackItem.image)
        if (!item.image || sameImage) {
          return {
            ...item,
            image: fallbackItem.image,
          }
        }

        return item
      }),
    })),
  }
}

function mergeCatalogPayload(payload, fallbackCatalog) {
  return mergeCatalogExtensions(mergeCatalogProducts(mergeCatalogServices(payload, fallbackCatalog), fallbackCatalog), fallbackCatalog)
}

function hasCatalogContent(payload) {
  return Boolean(
    payload &&
      (
        (Array.isArray(payload.services) && payload.services.length > 0) ||
        (Array.isArray(payload.products) && payload.products.length > 0) ||
        (Array.isArray(payload.extensions) && payload.extensions.length > 0)
      )
  )
}

export async function listBookings() {
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    return readJsonArray(bookingsPath)
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booked_date', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data || []).map(mapBookingRowToModel)
  } catch {
    // If Supabase fails (table missing, network error, permissions), fall back to local JSON
    return readJsonArray(bookingsPath)
  }
}

export async function insertBooking(booking) {
  const supabase = getSupabaseAdminClient()
  let savedToSupabase = false
  let supabaseError = null

  // Always save to local JSON as backup
  try {
    const bookings = await readJsonArray(bookingsPath)
    bookings.unshift(booking)
    await writeFile(bookingsPath, `${JSON.stringify(bookings, null, 2)}\n`, 'utf-8')
  } catch (writeError) {
    console.error('Failed to write booking to local JSON:', writeError)
  }

  // Try to save to Supabase if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert(mapBookingModelToRow(booking))
        .select()
        .single()

      if (error) {
        supabaseError = error.message
        console.warn(`Warning: Booking saved locally but failed to sync to Supabase: ${error.message}`)
      } else {
        savedToSupabase = true
        return { ...mapBookingRowToModel(data), savedToSupabase }
      }
    } catch (error) {
      supabaseError = error instanceof Error ? error.message : String(error)
      console.warn(`Warning: Booking saved locally but failed to sync to Supabase: ${supabaseError}`)
    }
  } else {
    console.warn('Warning: Supabase not configured. Booking saved to local storage only.')
  }

  // Return booking with sync status
  return { ...booking, savedToSupabase, supabaseError }
}

export async function updateBookingStatusById(id, status) {
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    const bookings = await readJsonArray(bookingsPath)
    const index = bookings.findIndex((item) => item.id === id)

    if (index === -1) {
      return null
    }

    const oldStatus = bookings[index].status
    bookings[index] = { ...bookings[index], status }
    await writeFile(bookingsPath, `${JSON.stringify(bookings, null, 2)}\n`, 'utf-8')

    return {
      booking: bookings[index],
      oldStatus,
    }
  }

  const { data: current, error: selectError } = await supabase
    .from('bookings')
    .select('id,status')
    .eq('id', id)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Failed to load booking from database: ${selectError.message}`)
  }

  if (!current) {
    return null
  }

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single()

  if (updateError) {
    throw new Error(`Failed to update booking in database: ${updateError.message}`)
  }

  return {
    booking: mapBookingRowToModel(updated),
    oldStatus: current.status,
  }
}

export async function deleteBookingById(id) {
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    const bookings = await readJsonArray(bookingsPath)
    const deletedBooking = bookings.find((item) => item.id === id)
    const nextBookings = bookings.filter((item) => item.id !== id)

    if (nextBookings.length === bookings.length) {
      return null
    }

    await writeFile(bookingsPath, `${JSON.stringify(nextBookings, null, 2)}\n`, 'utf-8')
    return deletedBooking
  }

  const { data: deleted, error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)
    .select('*')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to delete booking from database: ${error.message}`)
  }

  return deleted ? mapBookingRowToModel(deleted) : null
}

export async function getCatalog() {
  const supabase = getSupabaseAdminClient()
  const fallbackCatalog = await readJsonObject(catalogPath)

  if (!supabase) {
    return mergeCatalogPayload(fallbackCatalog, fallbackCatalog)
  }

  try {
    const { data, error } = await supabase
      .from('catalog')
      .select('payload')
      .eq('id', 1)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (hasCatalogContent(data?.payload)) {
      return mergeCatalogPayload(data.payload, fallbackCatalog)
    }

    // If DB catalog is not seeded yet, keep public pages working from local catalog data.
    return fallbackCatalog
  } catch {
    return fallbackCatalog
  }
}

export async function saveCatalog(payload) {
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    await writeFile(catalogPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8')
    return payload
  }

  const { error } = await supabase
    .from('catalog')
    .upsert(
      {
        id: 1,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

  if (error) {
    throw new Error(`Failed to save catalog to database: ${error.message}`)
  }

  return payload
}

export async function listProductOrders() {
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    return readJsonArray(productOrdersPath)
  }

  try {
    const { data, error } = await supabase
      .from('product_orders')
      .select('*')
      .order('ordered_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data || []).map(mapProductOrderRowToModel)
  } catch (error) {
    // If the DB table is missing or Supabase errors, fall back to local JSON file
    return readJsonArray(productOrdersPath)
  }
}

export async function insertProductOrder(order) {
  const supabase = getSupabaseAdminClient()
  let savedToSupabase = false
  let supabaseError = null

  // Always save to local JSON as backup
  try {
    const orders = await readJsonArray(productOrdersPath)
    orders.unshift(order)
    await writeFile(productOrdersPath, `${JSON.stringify(orders, null, 2)}\n`, 'utf-8')
  } catch (writeError) {
    console.error('Failed to write product order to local JSON:', writeError)
  }

  // Try to save to Supabase if configured
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('product_orders')
        .insert(mapProductOrderModelToRow(order))
        .select('*')
        .single()

      if (error) {
        supabaseError = error.message
        console.warn(`Warning: Product order saved locally but failed to sync to Supabase: ${error.message}`)
      } else {
        savedToSupabase = true
        return { ...mapProductOrderRowToModel(data), savedToSupabase }
      }
    } catch (error) {
      supabaseError = error instanceof Error ? error.message : String(error)
      console.warn(`Warning: Product order saved locally but failed to sync to Supabase: ${supabaseError}`)
    }
  } else {
    console.warn('Warning: Supabase not configured. Product order saved to local storage only.')
  }

  // Return order with sync status
  return { ...order, savedToSupabase, supabaseError }
}

export async function updateProductOrderStatusById(id, status) {
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    const orders = await readJsonArray(productOrdersPath)
    const index = orders.findIndex((item) => item.id === id)

    if (index === -1) {
      return null
    }

    const oldStatus = orders[index].status
    orders[index] = { ...orders[index], status }
    await writeFile(productOrdersPath, `${JSON.stringify(orders, null, 2)}\n`, 'utf-8')

    return {
      order: orders[index],
      oldStatus,
    }
  }

  const { data: current, error: selectError } = await supabase
    .from('product_orders')
    .select('id,status')
    .eq('id', id)
    .maybeSingle()

  if (selectError) {
    const orders = await readJsonArray(productOrdersPath)
    const index = orders.findIndex((item) => item.id === id)

    if (index === -1) {
      return null
    }

    const oldStatus = orders[index].status
    orders[index] = { ...orders[index], status }
    await writeFile(productOrdersPath, `${JSON.stringify(orders, null, 2)}\n`, 'utf-8')

    return {
      order: orders[index],
      oldStatus,
    }
  }

  if (!current) {
    return null
  }

  const { data: updated, error: updateError } = await supabase
    .from('product_orders')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single()
  if (updateError) {
    const orders = await readJsonArray(productOrdersPath)
    const index = orders.findIndex((item) => item.id === id)

    if (index === -1) {
      return null
    }

    const oldStatus = orders[index].status
    orders[index] = { ...orders[index], status }
    await writeFile(productOrdersPath, `${JSON.stringify(orders, null, 2)}\n`, 'utf-8')

    return {
      order: orders[index],
      oldStatus,
    }
  }

  return {
    order: mapProductOrderRowToModel(updated),
    oldStatus: current.status,
  }
}

export async function deleteProductOrderById(id) {
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    const orders = await readJsonArray(productOrdersPath)
    const deletedOrder = orders.find((item) => item.id === id)
    const nextOrders = orders.filter((item) => item.id !== id)

    if (nextOrders.length === orders.length) {
      return null
    }

    await writeFile(productOrdersPath, `${JSON.stringify(nextOrders, null, 2)}\n`, 'utf-8')
    return deletedOrder
  }

  const { data: deleted, error } = await supabase
    .from('product_orders')
    .delete()
    .eq('id', id)
    .select('*')
    .maybeSingle()
  if (error) {
    const orders = await readJsonArray(productOrdersPath)
    const deletedOrder = orders.find((item) => item.id === id)
    const nextOrders = orders.filter((item) => item.id !== id)

    if (nextOrders.length === orders.length) {
      return null
    }

    await writeFile(productOrdersPath, `${JSON.stringify(nextOrders, null, 2)}\n`, 'utf-8')
    return deletedOrder
  }

  return deleted ? mapProductOrderRowToModel(deleted) : null
}

/**
 * Update a booking with payment information
 * @param {string} id - Booking ID
 * @param {Object} updates - Payment updates (paymentStatus, paymentReference, etc.)
 * @returns {Promise<Object>} Updated booking
 */
export async function updateBooking(id, updates) {
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    const bookings = await readJsonArray(bookingsPath)
    const index = bookings.findIndex((item) => item.id === id)

    if (index === -1) {
      return null
    }

    bookings[index] = { ...bookings[index], ...updates }
    await writeFile(bookingsPath, `${JSON.stringify(bookings, null, 2)}\n`, 'utf-8')

    return bookings[index]
  }

  try {
    const { data: updated, error } = await supabase
      .from('bookings')
      .update(mapPaymentUpdatesToRow(updates))
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return mapBookingRowToModel(updated)
  } catch (error) {
    // A configured production database is the source of truth for payment state.
    // Do not report success after writing only to Lambda's temporary filesystem.
    throw error
  }
}

/**
 * Update a product order with payment information
 * @param {string} id - Order ID
 * @param {Object} updates - Payment updates (paymentStatus, paymentReference, etc.)
 * @returns {Promise<Object>} Updated order
 */
export async function updateProductOrder(id, updates) {
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    const orders = await readJsonArray(productOrdersPath)
    const index = orders.findIndex((item) => item.id === id)

    if (index === -1) {
      return null
    }

    orders[index] = { ...orders[index], ...updates }
    await writeFile(productOrdersPath, `${JSON.stringify(orders, null, 2)}\n`, 'utf-8')

    return orders[index]
  }

  try {
    const { data: updated, error } = await supabase
      .from('product_orders')
      .update(mapPaymentUpdatesToRow(updates))
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return mapProductOrderRowToModel(updated)
  } catch (error) {
    // A configured production database is the source of truth for payment state.
    // Do not report success after writing only to Lambda's temporary filesystem.
    throw error
  }
}

/**
 * Save an initialized Paystack attempt without allowing a late initialization
 * response to overwrite an order that a webhook has already marked as paid.
 */
export async function recordPaymentInitialization(id, type, updates) {
  const isBooking = type === 'booking'
  const filePath = isBooking ? bookingsPath : productOrdersPath
  const table = isBooking ? 'bookings' : 'product_orders'
  const mapper = isBooking ? mapBookingRowToModel : mapProductOrderRowToModel
  const supabase = getSupabaseAdminClient()

  if (!supabase) {
    const records = await readJsonArray(filePath)
    const index = records.findIndex((item) => item.id === id)
    if (index === -1) throw new Error(`${isBooking ? 'Booking' : 'Product order'} not found`)
    if (records[index].paymentStatus === 'paid') return records[index]

    records[index] = { ...records[index], ...updates }
    await writeFile(filePath, `${JSON.stringify(records, null, 2)}\n`, 'utf-8')
    return records[index]
  }

  const { data, error } = await supabase
    .from(table)
    .update(mapPaymentUpdatesToRow(updates))
    .eq('id', id)
    .neq('payment_status', 'paid')
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (data) return mapper(data)

  const { data: current, error: currentError } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (currentError) throw new Error(currentError.message)
  if (!current) throw new Error(`${isBooking ? 'Booking' : 'Product order'} not found`)
  return mapper(current)
}
