'use client'

import { Link } from '../../src/router'
import Image from '../../src/image'
import { useState, useEffect } from 'react'
import { Menu, X, Phone, Mail, ShoppingCart } from 'lucide-react'
import { useCart } from '../../lib/useCart'
import styles from './Header.module.css'

export default function Header() {
  const { totalItems } = useCart()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/hair-extensions', label: 'Hair Extensions' },
    { href: '/services', label: 'Salon Services' },
    { href: '/products', label: 'Beauty Products' },
    { href: '/reviews', label: 'Reviews' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <header
      className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}
    >
      <div className={styles.topBar}>
        <div className={`container ${styles.topBarContainer}`}>
          <div className={styles.topBarRow}>
            <a
              href="tel:+233558812020"
              className={styles.topBarLink}
            >
              <Phone size={14} className={styles.topBarIcon} />
              <span className={styles.topBarText}>055-881-2020</span>
            </a>
            <a
              href="mailto:manibeautygh@gmail.com"
              className={styles.topBarLink}
            >
              <Mail size={14} className={styles.topBarIcon} />
              <span className={styles.topBarText}>manibeautygh@gmail.com</span>
            </a>
            <Link href="/cart" className={styles.topBarCart} aria-label={`View cart with ${totalItems} items`}>
              <ShoppingCart size={19} />
              {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
            </Link>
          </div>
        </div>
      </div>

      <div className={`container ${styles.mainNavContainer}`}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="/images/logo.jpeg"
              alt="Mani Beauty Logo"
              width={100}
              height={100}
              priority
              className={styles.logoImage}
            />

            <div className={styles.brandTextWrap}>
              <div className={styles.brandTop}>MANI</div>
              <div className={styles.brandBottom}>BEAUTY</div>
            </div>
          </Link>

          <div className={styles.desktopNav}>
            <ul className={styles.desktopNavList}>
              {navLinks.map((link) => {
                return (
                  <li key={link.label} className={styles.desktopNavItem}>
                    <Link
                      href={link.href}
                      className={styles.desktopLink}
                    >
                      <span className={styles.navLinkText}>{link.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={styles.mobileMenuBtn}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        <div
          className={`${styles.mobileOverlay} ${isMenuOpen ? styles.mobileOverlayOpen : ''}`}
        >
          <nav id="mobile-navigation" className={styles.mobileNav}>
            <ul className={styles.mobileNavList}>
              {navLinks.map((link) => {
                return (
                  <li key={link.label} className={styles.mobileNavItem}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={styles.mobileLink}
                    >
                      {link.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
