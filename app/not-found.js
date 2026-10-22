import { Link } from '../src/router'
import { SearchX, Home, CalendarDays } from 'lucide-react'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.iconBox}>
          <SearchX size={34} />
        </div>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.text}>
          The page you requested does not exist or may have been moved.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={`btn btn-outline ${styles.button}`}>
            <Home size={18} />
            Home
          </Link>
          <Link href="/booking" className={`btn btn-primary ${styles.button}`}>
            <CalendarDays size={18} />
            Book now
          </Link>
        </div>
      </div>
    </div>
  )
}
