'use client'

import { useState, useEffect } from 'react'
import { Link } from '../src/router'
import { Star } from 'lucide-react'
import styles from './styles/home.module.css'

export default function Home() {
  const [currentImage, setCurrentImage] = useState(0)

  const heroSlideClasses = [styles.heroSlideTwo, styles.heroSlideThree, styles.heroSlideFour]

  const heroImages = [
    '/images/mainpage/hero-2.jpg',
    '/images/mainpage/hero-3.jpg',
    '/images/mainpage/hero-4.jpg',
  ]

  const heroAspectRatios = [1280 / 683, 1280 / 853, 1280 / 978]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [heroImages.length])

  return (
    <>
      <section className={styles.hero} style={{ '--desktop-hero-ratio': heroAspectRatios[currentImage] }}>
        {heroImages.map((_, index) => (
          <div
            key={heroImages[index]}
            className={`${styles.heroSlide} ${heroSlideClasses[index % heroSlideClasses.length]} ${currentImage === index ? styles.heroSlideActive : ''}`}
          />
        ))}
        <div className={styles.heroOverlay} />
      </section>

      <section className={styles.introSection}>
        <div className="container">
          <div className={styles.introInner}>
            <h1 className={styles.introTitle}>Mani Beauty Salon and Hair Extensions in Accra</h1>
            <p className={styles.introSubtitle}>
              Helping you look and feel your best with premium hair extensions, braids, wigs and professional beauty services for clients in Haatso, Atomic, Legon, Madina and nearby areas.
            </p>

            <div className={styles.introActions}>
              <Link href="/hair-extensions" className={`btn ${styles.introBlushButton}`}>
                Shop Hair Extensions
              </Link>
              <Link href="/products" className={`btn ${styles.introGoldButton}`}>
                Shop Beauty Products
              </Link>
            </div>

            <div className={styles.introTrust}>
              <span className={styles.introTrustStars}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className={styles.trustStarIcon} fill="currentColor" />
                ))}
              </span>
              <span>Quality you can trust</span>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}
