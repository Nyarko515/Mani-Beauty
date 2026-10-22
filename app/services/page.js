'use client'

import { useState, useEffect } from 'react'
import { Link } from '../../src/router'
import fallbackCatalog from '../../data/catalog.json'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import styles from '../styles/services.module.css'
import { apiFetch } from '../../lib/api-client'

const toneClass = (tone) => {
  if (!tone) return ''
  const map = {
    pink: styles.tonePink,
    orange: styles.toneOrange,
    green: styles.toneGreen,
    pinkDark: styles.tonePinkDark,
  }
  return map[tone] || ''
}

const serviceSlides = [
 
  {
    image: '/images/photos/gustavo-spindula-K2D7muBun1A-unsplash.jpg.jpeg',
    label: 'Hair care inspiration',
  },
  {
    image: '/images/photos/good-faces-xmSWVeGEnJw-unsplash.jpg.jpeg',
    label: 'Salon hair inspiration',
  },
  {
    image: '/images/photos/IMG_9403.JPG',
    label: 'Salon hair inspiration',
  },
  {
    image: '/images/photos/good-faces-GYg6t9rztC4-unsplash.jpg.jpeg',
    label: 'Beauty styling inspiration',
  },
   {
    image: '/images/photos/good-faces-3yvAe5gJ-SI-unsplash.jpg.jpeg',
    label: 'Braided hair inspiration',
  },
  
]

const formatCediPrice = (price) => String(price || '').replace(/GHS/gi, '₵')
const formatCategory = (category) => String(category || '').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())

export default function ServicesPage() {
  const [catalog, setCatalog] = useState(fallbackCatalog)
  const [active, setActive] = useState(fallbackCatalog.services?.[0]?.category || 'BRAIDING')
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const services = (catalog && catalog.services) || []

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await apiFetch('/api/catalog')
        if (!response.ok) {
          throw new Error('Failed to load catalog')
        }
        const data = await response.json()
        setCatalog(data)
        if ((!active || !data.services?.some((group) => group.category === active)) && data.services?.length > 0) {
          setActive(data.services[0].category)
        }
      } catch {
        setCatalog(fallbackCatalog)
        if ((!active || !fallbackCatalog.services?.some((group) => group.category === active)) && fallbackCatalog.services?.length > 0) {
          setActive(fallbackCatalog.services[0].category)
        }
      }
    }

    loadCatalog()
  }, [])

  // Initialize active category from services
  useEffect(() => {
    if (!active && services.length > 0) {
      setActive(services[0].category)
    }
  }, [services, active])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((current) => (current + 1) % serviceSlides.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [])

  const activeGroup = services.find((g) => g.category === active) || services[0] || { items: [] }
  const goToPreviousSlide = () => setCurrentSlide((current) => (current - 1 + serviceSlides.length) % serviceSlides.length)
  const goToNextSlide = () => setCurrentSlide((current) => (current + 1) % serviceSlides.length)
  const previousSlide = (currentSlide - 1 + serviceSlides.length) % serviceSlides.length
  const nextSlide = (currentSlide + 1) % serviceSlides.length

  return (
    <main>
      <section className={styles.serviceGallerySection} aria-label="Mani Beauty service inspiration">
        <div className={styles.serviceSlider}>
          {serviceSlides.map((slide, index) => (
            <img
              key={slide.image}
              src={slide.image}
              alt={slide.label}
              className={`${styles.serviceSlideImage} ${currentSlide === index ? styles.serviceSlideImageActive : ''} ${previousSlide === index ? styles.serviceSlideImagePrevious : ''} ${nextSlide === index ? styles.serviceSlideImageNext : ''}`}
            />
          ))}

          <button type="button" className={`${styles.sliderButton} ${styles.sliderButtonPrev}`} onClick={goToPreviousSlide} aria-label="Previous service image">
            <ArrowLeft size={18} />
          </button>
          <button type="button" className={`${styles.sliderButton} ${styles.sliderButtonNext}`} onClick={goToNextSlide} aria-label="Next service image">
            <ArrowRight size={18} />
          </button>

          <div className={styles.sliderDots} aria-label="Service image slides">
            {serviceSlides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                aria-label={`Show slide ${index + 1}`}
                className={`${styles.sliderDot} ${currentSlide === index ? styles.sliderDotActive : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.servicesIntroSection}>
        <div className="container">
          <p className={styles.servicesIntro}>Explore our collection of expertly crafted braid styles, wig installations, and protective hairstyles. Every service includes quality hair extensions and professional installation for a beautiful, comfortable, and long-lasting finish.</p>
        </div>
      </section>

      <section className={styles.tabsSection}>
        <div className="container">
          <nav className={styles.tabsNav} role="tablist">
            {services.map((group) => (
              <button
                key={group.category}
                role="tab"
                aria-selected={active === group.category}
                onClick={() => setActive(group.category)}
                className={`${styles.tabButton} ${active === group.category ? styles.tabButtonActive : ''}`}
              >
                {formatCategory(group.category)}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <section className={styles.listSection}>
        <div className="container">
          <div className={styles.categoryBlock}>
            <div className={`${styles.categoryHeader} ${toneClass(activeGroup.tone)}`}>
              <div>
                <span className={styles.categoryEyebrow}>Currently viewing</span>
                <h2 className={styles.categoryTitle}>{formatCategory(activeGroup.category)}</h2>
                {activeGroup.note && <p className={styles.categoryNote}>{activeGroup.note}</p>}
              </div>
            </div>

            <div className={`${styles.itemsGrid} ${activeGroup.category === 'BRAIDING' ? styles.braidingGrid : ''} ${activeGroup.items.length === 1 ? styles.singleItemGrid : ''}`}>
              {(activeGroup.items || []).map((item) => (
                <article
                  key={item.name}
                  className={`${styles.serviceCard} ${activeGroup.category === 'BRAIDING' ? styles.braidingCard : ''} ${activeGroup.items.length === 1 ? styles.singleItemCard : ''}`}>
                  <div className={`${styles.serviceImage} ${activeGroup.category === 'BRAIDING' ? styles.braidingImage : ''}`}>
                    {item.image ? (
                      <img src={encodeURI(item.image)} alt={item.name} className={activeGroup.category === 'BRAIDING' ? styles.braidingPhoto : styles.servicePhoto} />
                    ) : (
                      <div className={styles.serviceImageFallback}>
                        <p className={styles.serviceImageText}>Image unavailable</p>
                      </div>
                    )}
                  </div>

                  <div className={styles.serviceDetails}>
                    <h3 className={styles.serviceName}>{item.name}</h3>
                    <div className={styles.serviceMeta}>
                      {item.duration && (
                        <div className={styles.serviceMetaItem}>
                          <span className={styles.serviceMetaText}>{item.duration}</span>
                        </div>
                      )}

                      {item.price && (
                        <div className={styles.serviceMetaItem}>
                          <span className={styles.serviceMetaPrice}>{formatCediPrice(Array.isArray(item.price) ? item.price[0] : item.price)}</span>
                        </div>
                      )}
                    </div>

                    <Link href={`/booking?service=${encodeURIComponent(item.name)}`} className={`btn btn-secondary ${styles.serviceButton}`}>
                      Book Now
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.specialRequestCard}>
              <div className={styles.specialRequestContent}>
                <p className={styles.specialRequestEyebrow}>Special Request</p>
                <h3 className={styles.specialRequestTitle}>
                  Need a custom look in {formatCategory(activeGroup.category)}?
                </h3>
                <p className={styles.specialRequestText}>
                  If you do not see the exact braid style you want, upload a reference photo and add a short description so we can review the look with you.
                </p>
              </div>

              <Link
                href={`/booking?specialRequest=1&category=${encodeURIComponent(activeGroup.category || '')}`}
                className={`btn btn-secondary ${styles.specialRequestButton}`}
              >
                Upload Reference Photo
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
