'use client'

import { useState, useEffect, useRef } from 'react'

const CART_STORAGE_KEY = 'mani_beauty_cart'
const CART_UPDATE_EVENT = 'mani-beauty-cart-updated'

/**
 * Custom hook for managing shopping cart
 * Stores cart items in localStorage (products only)
 *
 * Cart item structure:
 * {
 *   id: string (unique product identifier),
 *   name: string,
 *   price: string (e.g., "₵380"),
 *   quantity: number,
 *   image: string (URL),
 * }
 */
export function useCart() {
  const sourceId = useRef(Math.random().toString(36).slice(2))
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e)
        setItems([])
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const syncCart = (event) => {
      if (event.detail?.source === sourceId.current) return
      setItems(Array.isArray(event.detail?.items) ? event.detail.items : [])
    }
    window.addEventListener(CART_UPDATE_EVENT, syncCart)
    return () => window.removeEventListener(CART_UPDATE_EVENT, syncCart)
  }, [])

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isLoading])

  const addItem = (product) => {
    const quantityToAdd = Math.max(1, Math.min(99, Number(product.quantity) || 1))

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id)
      let nextItems
      if (existingItem) {
        nextItems = prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min((item.quantity || 1) + quantityToAdd, 99) }
            : item
        )
      } else {
        nextItems = [...prevItems, { ...product, quantity: quantityToAdd }]
      }
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems))
      queueMicrotask(() => window.dispatchEvent(new CustomEvent(CART_UPDATE_EVENT, { detail: { items: nextItems, source: sourceId.current } })))
      return nextItems
    })
  }

  const removeItem = (productId) => {
    setItems((prevItems) => {
      const nextItems = prevItems.filter((item) => item.id !== productId)
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems))
      queueMicrotask(() => window.dispatchEvent(new CustomEvent(CART_UPDATE_EVENT, { detail: { items: nextItems, source: sourceId.current } })))
      return nextItems
    })
  }

  const updateQuantity = (productId, quantity) => {
    const clampedQuantity = Math.max(1, Math.min(99, Number(quantity) || 1))
    setItems((prevItems) => {
      const nextItems = prevItems.map((item) =>
        item.id === productId
          ? { ...item, quantity: clampedQuantity }
          : item
      )
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextItems))
      queueMicrotask(() => window.dispatchEvent(new CustomEvent(CART_UPDATE_EVENT, { detail: { items: nextItems, source: sourceId.current } })))
      return nextItems
    })
  }

  const clearCart = () => {
    setItems([])
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]))
    queueMicrotask(() => window.dispatchEvent(new CustomEvent(CART_UPDATE_EVENT, { detail: { items: [], source: sourceId.current } })))
  }

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const priceAmount = Number(String(item.price || '').replace(/[^0-9.]/g, '')) || 0
      return sum + priceAmount * (item.quantity || 1)
    }, 0)
  }

  return {
    items,
    isLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    itemCount: items.length,
    totalItems: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
  }
}
