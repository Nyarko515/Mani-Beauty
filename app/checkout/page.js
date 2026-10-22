'use client'

import { useState, useEffect } from 'react'
import { Link, useRouter } from '../../src/router'
import { Trash2, Plus, Minus, ShoppingCart, AlertCircle, Loader, Truck, ShieldCheck, CreditCard } from 'lucide-react'
import { useCart } from '../../lib/useCart'
import ModalNotification from '../components/ModalNotification'
import styles from './checkout.module.css'
import { apiFetch } from '../../lib/api-client'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem, getTotal, isLoading } = useCart()
  
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', address: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [orderTotal, setOrderTotal] = useState(0)
  const [paymentError, setPaymentError] = useState('')
  const [orderCreated, setOrderCreated] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [isStartingPayment, setIsStartingPayment] = useState(false)

  const total = getTotal()
  const hasQuoteItems = items.some((item) => item.requiresQuote || !/[0-9]/.test(String(item.price || '')))

  // Check for empty cart
  useEffect(() => {
    if (!isLoading && items.length === 0) {
      setPaymentError('Your cart is empty. Please add products before checkout.')
    }
  }, [items, isLoading])

  const handleCustomerChange = (field, value) => {
    setCustomer((prev) => ({ ...prev, [field]: value }))
    setPaymentError('')
  }

  const openProductPayment = async (nextOrderId) => {
    const reference = `product-${nextOrderId}-${Date.now()}`
    const response = await apiFetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'product', orderId: nextOrderId, reference }),
    })
    const payload = await response.json()
    if (!response.ok || !payload.data?.authorizationUrl) {
      throw new Error(payload.error || 'Could not start Paystack payment')
    }
    window.location.assign(payload.data.authorizationUrl)
  }

  const handleCreateOrder = async (e) => {
    e.preventDefault()
    setPaymentError('')
    setIsSubmitting(true)

    // Validate customer info
    const missingLabels = {
      name: 'full name',
      email: 'email address',
      phone: 'phone number',
    }
    const missingField = ['name', 'email', 'phone'].find(
      (field) => !String(customer[field] || '').trim()
    )
    if (missingField) {
      setPaymentError(`Please fill in your ${missingLabels[missingField]}.`)
      setIsSubmitting(false)
      return
    }

    if (items.length === 0) {
      setPaymentError('Your cart is empty. Please add products.')
      setIsSubmitting(false)
      return
    }

    try {
      // Create the order first
      const response = await apiFetch('/api/product-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            image: item.image,
            price: item.price,
            quantity: item.quantity || 1,
          })),
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to create order')
      }

      setOrderId(payload.orderId)
      setOrderTotal(total)
      setOrderCreated(true)
      setShowOrderModal(true)
      setPaymentError('')
    } catch (error) {
      setPaymentError(error.message || 'Failed to create order')
      setIsStartingPayment(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePayNow = async () => {
    setPaymentError('')
    setIsStartingPayment(true)

    try {
      await openProductPayment(orderId)
    } catch (error) {
      setPaymentError(error.message || 'Could not start Paystack payment')
      setShowOrderModal(false)
      setIsStartingPayment(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader size={48} className={styles.spinner} />
        <p>Loading cart...</p>
      </div>
    )
  }

  return (
    <main className={styles.page}>
      <section className={styles.promoStrip} aria-label="Checkout benefits">
        <div className="container">
          <div className={styles.promoItems}>
            <span><Truck size={15} /> Ghana delivery</span>
            <span><ShieldCheck size={15} /> Secure order request</span>
            <span><CreditCard size={15} /> Secure Paystack payment</span>
          </div>
        </div>
      </section>

      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div>
              <h1 className={styles.heroTitle}>Your Cart</h1>
                <p className={styles.heroText}>Review your items, enter your details, and pay securely with Paystack.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.contentSection}>
        <div className="container">
          <div className={styles.layout}>
            {/* Cart Items */}
            <div className={styles.cartSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <ShoppingCart size={20} />
                  Order Items
                </h2>
                <p className={styles.sectionText}>{items.length} product line(s) in your bag</p>
              </div>

              {items.length === 0 ? (
                <div className={styles.emptyCart}>
                  <ShoppingCart size={48} className={styles.emptyIcon} />
                  <p className={styles.emptyText}>Your cart is empty</p>
                  <Link href="/products" className="btn btn-primary">
                    Continue Shopping
                  </Link>
                </div>
              ) : (
                <div className={styles.cartItems}>
                  {items.map((item) => (
                    <div key={item.id} className={styles.cartItem}>
                      <div className={styles.itemImage}>
                        {item.image && (
                          <img src={encodeURI(item.image)} alt={item.name} />
                        )}
                      </div>

                      <div className={styles.itemDetails}>
                        <h3 className={styles.itemName}>{item.name}</h3>
                        <p className={styles.itemPrice}>{item.price}</p>
                      </div>

                      <div className={styles.itemQuantity}>
                        <label className={styles.quantityLabel}>Qty:</label>
                        <div className={styles.quantityControls}>
                          <button
                            onClick={() =>
                              updateQuantity(item.id, Math.max(1, item.quantity - 1))
                            }
                            className={styles.quantityBtn}
                            title="Decrease quantity"
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={item.quantity || 1}
                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                            className={styles.quantityInput}
                          />
                          <button
                            onClick={() =>
                              updateQuantity(item.id, Math.min(99, item.quantity + 1))
                            }
                            className={styles.quantityBtn}
                            title="Increase quantity"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      <div className={styles.itemTotal}>
                        <span className={styles.totalCaption}>Line total</span>
                        <span className={styles.totalLabel}>
                          {item.requiresQuote ? 'To be confirmed' : `GH₵${(
                            (Number(
                              String(item.price || '').replace(/[^0-9.]/g, '')
                            ) || 0) *
                            (item.quantity || 1)
                          ).toFixed(2)}`}
                        </span>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className={styles.removeBtn}
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary & Checkout Form */}
            <aside className={styles.sidebar}>
              {/* Summary */}
              <div className={styles.summary}>
                <h3 className={styles.summaryTitle}>Order Summary</h3>

                <div className={styles.summaryRow}>
                  <span>Items:</span>
                  <strong>{items.length}</strong>
                </div>

                <div className={styles.summaryRow}>
                  <span>Subtotal:</span>
                  <strong>{hasQuoteItems ? 'To be confirmed' : `GH₵${total.toFixed(2)}`}</strong>
                </div>

                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Total:</span>
                  <strong className={styles.totalAmount}>{hasQuoteItems ? 'Confirmed after review' : `GH₵${total.toFixed(2)}`}</strong>
                </div>
              </div>

              {/* Customer Info Form */}
              {items.length > 0 && (
                <form onSubmit={handleCreateOrder} className={styles.form}>
                  <h3 className={styles.formTitle}>Order Information</h3>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Full Name *</label>
                    <input
                      type="text"
                      value={customer.name}
                      onChange={(e) => handleCustomerChange('name', e.target.value)}
                      placeholder="John Doe"
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Email Address for Payment Receipt *</label>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={customer.email}
                      onChange={(e) => handleCustomerChange('email', e.target.value)}
                      placeholder="john@example.com"
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Phone Number *</label>
                    <input
                      type="tel"
                      value={customer.phone}
                      onChange={(e) => handleCustomerChange('phone', e.target.value)}
                      placeholder="+233 XX XXX XXXX"
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Pickup or Order Preference (Optional)</label>
                    <textarea
                      value={customer.address}
                      onChange={(e) => handleCustomerChange('address', e.target.value)}
                      placeholder="Atomic branch, Haatso branch, or any note for your order"
                      className={styles.textarea}
                      rows="3"
                    />
                  </div>

                  {/* Messages */}
                  {paymentError && (
                    <div className={styles.errorMessage}>
                      <AlertCircle size={18} />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {/* Create Order Button */}
                  {!orderCreated ? (
                    <button
                      type="submit"
                      disabled={isSubmitting || items.length === 0}
                      className={`${styles.submitBtn} btn btn-primary`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader size={18} className={styles.spinner} />
                          Preparing Payment...
                        </>
                      ) : (
                        hasQuoteItems ? 'Submit Order for Price Confirmation' : `Pay GH₵${total.toFixed(2)} with Paystack`
                      )}
                    </button>
                  ) : (
                    !hasQuoteItems && !showOrderModal ? (
                      <button type="button" onClick={handlePayNow} disabled={isStartingPayment} className={`${styles.submitBtn} btn btn-primary`}>
                        {isStartingPayment ? 'Opening Paystack...' : `Retry Pay GH₵${orderTotal.toFixed(2)} with Paystack`}
                      </button>
                    ) : null
                  )}
                </form>
              )}

              {/* Continue Shopping Link */}
              {items.length === 0 && (
                <Link href="/products" className={`${styles.continueLink} btn btn-outline`}>
                  Start Shopping
                </Link>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* Order Created Modal Notification */}
      <ModalNotification
        isOpen={showOrderModal}
        type="success"
        title={hasQuoteItems ? 'Order Confirmed!' : 'Order Ready for Payment!'}
        message={hasQuoteItems ? "Your order has been placed. We'll confirm the final price before payment." : 'Your order has been saved. Continue securely to Paystack to complete payment.'}
        reference={orderId}
        details={[
          hasQuoteItems ? 'Price will be confirmed by Mani Beauty' : `Total Amount: GH₵${orderTotal.toFixed(2)}`,
          `Payment receipt email: ${customer.email}`,
          "Order reference saved",
          "We will contact you to confirm your order",
        ]}
        actions={[
          ...(!hasQuoteItems ? [{
            label: isStartingPayment ? 'Opening Paystack...' : `Pay GH₵${orderTotal.toFixed(2)} Now`,
            onClick: handlePayNow,
            primary: true,
          }] : []),
          {
            label: hasQuoteItems ? 'Continue Shopping' : 'Not Now',
            onClick: () => hasQuoteItems ? router.push('/products') : setShowOrderModal(false),
            primary: hasQuoteItems,
          },
        ]}
        onClose={() => setShowOrderModal(false)}
      />
    </main>
  )
}
