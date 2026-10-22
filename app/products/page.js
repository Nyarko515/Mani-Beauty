'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link } from '../../src/router'
import { Check, Truck, ShieldCheck } from 'lucide-react'
import { useCart } from '../../lib/useCart'
import fallbackCatalog from '../../data/catalog.json'
import styles from './page.module.css'
import { apiFetch } from '../../lib/api-client'

const normalizeProductKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const formatCedis = (amount) => {
  const text = String(amount || '').trim()
  if (!text) return 'GH₵0'

  if (text.startsWith('GH₵')) return text
  if (text.startsWith('₵')) return `GH${text}`
  if (/^ghs\s*/i.test(text)) return text.replace(/^ghs\s*/i, 'GH₵')

  const numericMatch = text.match(/[0-9]+(?:\.[0-9]+)?/)
  return numericMatch ? `GH₵${numericMatch[0]}` : `GH₵${text}`
}

const defaultProductPrices = {
  [normalizeProductKey('FHI Heat UNbrush Detangling Brush')]: 'GH₵380',
  [normalizeProductKey('Dove Revitalizante Gentle Body Wash, Cherry and')]: 'GH₵160',
  [normalizeProductKey('Garnier Ultimate Blends Soothing Coconut Hair')]: 'GH₵200',
  [normalizeProductKey('Garnier COCOA BUTTER SUPERCHARGED HAIR')]: 'GH₵200',
  [normalizeProductKey('DOO GRO Stimulating Hair Oil- 4.50z')]: 'GH₵180',
  [normalizeProductKey('DOO GRO Mega Thick Hair Vitalizer - 10oz')]: 'GH₵180',
  [normalizeProductKey('DOO GRO Triple Strength Hair Vitalizer - 4oz')]: 'GH₵180',
  [normalizeProductKey('Doo Gro Mega Thick Shampoo- 10oz')]: 'GH₵180',
  [normalizeProductKey('DOO GRO ega Thick Formula Hair Oil- 4.5oz')]: 'GH₵180',
  [normalizeProductKey('DOO GRO Mega Thick Lotion- 8oz')]: 'GH₵180',
  [normalizeProductKey('Godrej Nupur Mehendi Pure Henna Powder 9')]: 'GH₵250',
}

const formatProductName = (imagePath) => {
  const fileName = String(imagePath || '')
    .split('/')
    .pop()
    .replace(/\.[^.]+$/, '')

  return fileName.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()).trim()
}

const formatProductPrice = (price) => formatCedis(price)
const hasMeaningfulPrice = (price) => {
  const text = String(price || '').trim()
  if (!text) return false

  const numeric = Number(text.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(numeric)) return true

  return numeric > 0
}

const getFallbackProductPrice = (product) =>
  (hasMeaningfulPrice(product.price)
    ? product.price
    : defaultProductPrices[normalizeProductKey(product.name)] || defaultProductPrices[normalizeProductKey(product.image)] || 'GH₵0')

export default function ProductsPage() {
  const [catalog, setCatalog] = useState(fallbackCatalog)
  const { addItem } = useCart()
  const [cartAddedMessage, setCartAddedMessage] = useState('')
  
  const products = useMemo(
    () =>
      (catalog.products || []).map((product, index) => ({
        id: product.id || `product-${normalizeProductKey(product.name || product.image || index)}`,
        image: product.image,
        name: product.name || formatProductName(product.image),
        price: formatProductPrice(getFallbackProductPrice(product)) || 'GH₵0',
      })),
    [catalog]
  )

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await apiFetch('/api/catalog')

        if (!response.ok) {
          throw new Error('Could not load catalog')
        }

        const data = await response.json()
        setCatalog(data)
      } catch {
        setCatalog(fallbackCatalog)
      }
    }

    loadCatalog()
  }, [])

  const handleAddToCart = (product) => {
    addItem({ ...product, quantity: 1 })
    setCartAddedMessage(`${product.name} added to cart!`)
    setTimeout(() => setCartAddedMessage(''), 3000)
  }

  return (
    <main className={styles.page}>
      <section className={styles.promoStrip} aria-label="Store offers">
        <div className="container">
          <div className={styles.promoItems}>
            <span>New beauty arrivals in stock</span>
            <span><Truck size={15} /> Fast delivery across Ghana</span>
            <span><ShieldCheck size={15} /> Genuine salon-selected products</span>
          </div>
        </div>
      </section>

      <section className={styles.hero}>
        <div className={styles.heroImage} role="img" aria-label="Mani Beauty products and beauty looks" />
        <div className="container">
          <div className={styles.heroGrid}>
            <div>
              <span className={styles.heroEyebrow}>Mani Beauty Shop</span>
              <h1 className={styles.heroTitle}>Hair, body and beauty essentials for polished everyday care.</h1>
              <p className={styles.heroText}>Shop trusted products selected for protective styling, healthy hair routines and a fresh salon finish at home.</p>
            </div>

            <div className={styles.heroFeature} aria-label="Featured product categories">
              <img src="/images/products/Garnier Ultimate Blends Soothing Coconut Hair.jpg" alt="" />
              <img src="/images/products/FHI Heat UNbrush Detangling Brush.jpg" alt="" />
              <img src="/images/products/DOO GRO Mega Thick Hair Vitalizer - 10oz.webp" alt="" />
            </div>
          </div>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className="container">
          {cartAddedMessage && (
            <div style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: '#10b981',
              color: 'white',
              padding: '1rem 1.5rem',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Check size={18} />
              {cartAddedMessage}
            </div>
          )}
          <div className={styles.layout}>
            <div>
              <div className={styles.sectionHeader}>
                <div>
                  <span className={styles.sectionEyebrow}>New and trusted</span>
                  <h2 className={styles.sectionTitle}>Available Products</h2>
                </div>
                <p className={styles.sectionText}>{products.length} products ready to order.</p>
              </div>

              <div className={styles.productsGrid}>
                {products.map((product) => {
                  return (
                    <article key={product.id} className={styles.productCard}>
                      <div className={styles.productImageWrap}>
                        <img src={encodeURI(product.image)} alt={product.name} className={styles.productImage} />
                      </div>

                      <div className={styles.productBody}>
                        <h3 className={styles.productName}>{product.name}</h3>
                        <div className={styles.priceValue}>{product.price}</div>

                        <button 
                          type="button" 
                          className={`btn btn-success ${styles.smallButton}`}
                          onClick={() => handleAddToCart(product)}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}
