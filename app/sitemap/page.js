import { Link } from '../../src/router'
import styles from './page.module.css'

export const metadata = {
  title: 'Sitemap | Mani Beauty',
  description: 'Browse all main pages on Mani Beauty website.'
}

const links = [
  { href: '/', label: 'Home' },
  { href: '/hair-extensions', label: 'Hair Extensions' },
  { href: '/cart', label: 'Cart' },
  { href: '/services', label: 'Services' },
  { href: '/services', label: 'Book Appointment' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
]

export default function SitemapPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Sitemap</h1>
        <ul className={styles.list}>
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={styles.link}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
