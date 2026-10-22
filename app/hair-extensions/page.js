'use client'

import { useEffect, useRef, useState } from 'react'
import { useCart } from '../../lib/useCart'
import { defaultExtensions } from '../../data/extensions'
import { apiFetch } from '../../lib/api-client'
import styles from './page.module.css'

const heroImages = [
  'pexels-dhemer-17291688.jpg',
  'pexels-bigshowlamar-18307159.jpg',
  'pexels-amaria-16539693.jpg',
  'pexels-toni-guy-pondicherry-404397363-17164030.jpg',
  'pexels-adegboye-habeeb-22468562-10816994.jpg',
]

export default function HairExtensionsPage() {
  const { addItem } = useCart()
  const [addedItem, setAddedItem] = useState('')
  const [extensions, setExtensions] = useState(defaultExtensions)
  const [currentHero, setCurrentHero] = useState(0)
  const touchStart = useRef(null)

  useEffect(() => {
    apiFetch('/api/catalog').then((response) => response.ok ? response.json() : null).then((data) => {
      if (Array.isArray(data?.extensions)) setExtensions(data.extensions)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentHero((current) => (current + 1) % heroImages.length), 4500)
    return () => clearInterval(timer)
  }, [])

  const handleAddToCart = (item) => {
    addItem({ ...item, quantity: 1 })
    setAddedItem(item.id)
    setTimeout(() => setAddedItem(''), 1800)
  }

  const finishSwipe = (clientX) => {
    if (touchStart.current === null) return
    const distance = clientX - touchStart.current
    if (Math.abs(distance) > 45) {
      setCurrentHero((current) => distance < 0 ? (current + 1) % heroImages.length : (current - 1 + heroImages.length) % heroImages.length)
    }
    touchStart.current = null
  }

  return (
    <main className={styles.page}>
      {addedItem && <div className={styles.cartNotice} role="status">Extension added to your cart!</div>}

      <section className={styles.hero} aria-label="Mani Beauty hair extension inspiration" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX }} onTouchEnd={(event) => finishSwipe(event.changedTouches[0].clientX)}>
        {heroImages.map((image, index) => {
          const nextHero = (currentHero + 1) % heroImages.length
          const imageClass = index === currentHero
            ? styles.heroImageActive
            : index === nextHero
              ? styles.heroImageNext
              : ''

          return <img key={image} src={`/images/hair-extension-hero/${image}`} alt="" className={imageClass} />
        })}
        <div className={styles.heroDots} aria-label="Hair extension image slides">
          {heroImages.map((image, index) => <button key={image} type="button" aria-label={`Show image ${index + 1}`} className={`${styles.heroDot} ${index === currentHero ? styles.heroDotActive : ''}`} onClick={() => setCurrentHero(index)} />)}
        </div>
      </section>

      <section className={styles.shopSection}>
        <div className="container">
          <div className={styles.sectionHeading}><h2>Shop Hair Extensions</h2><p>Explore our collection and add your preferred hair extension to your bag.</p></div>
          <div className={styles.grid}>
            {extensions.map((item) => <article key={item.id} className={styles.card}><img src={item.image} alt={`${item.name} hair extension`} /><div className={styles.cardBody}><h3>{item.name}</h3><p>{item.price}</p><button type="button" className={styles.addButton} onClick={() => handleAddToCart(item)}>{addedItem === item.id ? 'Added to Cart' : 'Add to Cart'}</button></div></article>)}
          </div>
        </div>
      </section>
    </main>
  )
}
