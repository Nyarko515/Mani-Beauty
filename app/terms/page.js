import styles from './page.module.css'

export const metadata = {
  title: 'Terms of Service | Mani Beauty',
  description: 'Service terms for booking and attending appointments at Mani Beauty.'
}

export default function TermsPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.text}>
          By booking with Mani Beauty, you agree to arrive on time and provide accurate contact details.
        </p>
        <h2 className={styles.subtitle}>Booking and cancellation</h2>
        <p className={styles.text}>
          Please notify us early for cancellations or rescheduling. Repeated no-shows may require a deposit.
        </p>
        <h2 className={styles.subtitle}>Pricing</h2>
        <p className={styles.text}>
          Published prices are starting rates and may vary depending on style complexity, hair length, and condition.
        </p>
        <h2 className={styles.subtitle}>Home service</h2>
        <p className={styles.text}>
          Home services may include extra transport and convenience charges where applicable.
        </p>
      </div>
    </section>
  )
}
