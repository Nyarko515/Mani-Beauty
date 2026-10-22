'use client'

import { Link } from '../../src/router'
import { Instagram, Music2, Youtube, MessageCircle, Mail, Phone, MapPin, Clock } from 'lucide-react'
import styles from './Footer.module.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.mainWrap}`}>
        <div className={`grid grid-3 ${styles.mainGrid}`}>
          <div>
            <div className={styles.brandRow}>
              <h3 className={styles.brandTitle}>
                <span className={styles.brandGradient}>Mani</span>
                <span className={styles.brandSolid}>Beauty</span>
              </h3>
            </div>
            <p className={styles.aboutText}>
              Premium hair extensions, salon services, and cosmetics delivered with care, quality, and community in mind.
            </p>
            <div className={styles.socialRow}>
              <a 
                href="https://www.instagram.com/manibeautylounge/"
                target="_blank" 
                rel="noopener noreferrer"
                className={`${styles.socialIcon} ${styles.socialOrange}`}
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a href="https://www.youtube.com/results?search_query=Mani+Beauty+Lounge" target="_blank" rel="noopener noreferrer" className={`${styles.socialIcon} ${styles.socialPink}`} aria-label="Find Mani Beauty Lounge on YouTube">
                <Youtube size={18} />
              </a>
              <a 
                href="https://www.tiktok.com/@manibeautygh"
                target="_blank" 
                rel="noopener noreferrer"
                className={`${styles.socialIcon} ${styles.socialGreen}`}
                aria-label="TikTok @manibeautygh"
              >
                <Music2 size={18} />
              </a>
              <a href="https://wa.me/233558812020" target="_blank" rel="noopener noreferrer" className={`${styles.socialIcon} ${styles.socialGreen}`} aria-label="Chat with Mani Beauty on WhatsApp">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className={styles.sectionTitle}>
              Quick Links
            </h4>
            <ul className={styles.listReset}>
              {[
                { href: '/', label: 'Home' },
                { href: '/hair-extensions', label: 'Hair Extensions' },
                { href: '/cart', label: 'Cart' },
                { href: '/services', label: 'Our Services' },
                { href: '/reviews', label: 'Reviews' },
                { href: '/about', label: 'About Us' },
                { href: '/contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.href} className={styles.quickLinkItem}>
                  <Link 
                    href={link.href}
                    className={styles.footerLink}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={styles.sectionTitle}>
              Get in Touch
            </h4>
            <ul className={styles.listReset}>
              <li className={styles.contactItem}>
                <MapPin size={18} className={`${styles.contactIcon} ${styles.iconGreen}`} />
                <span>Atomic Junction Roundabout and Haatso Branch</span>
              </li>
              <li className={styles.contactItem}>
                <Phone size={18} className={`${styles.contactIcon} ${styles.iconGreen}`} />
                <a href="tel:+233558812020" className={styles.footerLink}>
                  055 881 2020
                </a>
                <span> / </span>
                <a href="tel:+233536591889" className={styles.footerLink}>
                  053 659 1889
                </a>
              </li>
              <li className={styles.contactItem}>
                <Mail size={18} className={`${styles.contactIcon} ${styles.iconGreen}`} />
                <a href="mailto:manibeautygh@gmail.com" className={`${styles.footerLink} ${styles.mailLink}`}>
                  manibeautygh@gmail.com
                </a>
              </li>
            </ul>
            <div className={styles.hoursCard}>
              <p className={styles.hoursTitle}>
                <Clock size={16} className={styles.hoursIcon} /> Business Hours
              </p>
              <p className={styles.hoursText}>
                Mon - Sat: 8:00 AM - 7:00 PM<br />
                Sunday: 1:00 PM - 7:00 PM
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomWrap}`}>
          <div className={styles.bottomRow}>
            <p className={styles.copyText}>
              © {currentYear} Mani Beauty. All rights reserved.
            </p>
            <div className={styles.bottomLinks}>
              <Link href="/privacy" className={`${styles.footerLink} ${styles.bottomLink}`}>Privacy Policy</Link>
              <Link href="/terms" className={`${styles.footerLink} ${styles.bottomLink}`}>Terms of Service</Link>
              <Link href="/sitemap" className={`${styles.footerLink} ${styles.bottomLink}`}>Sitemap</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
