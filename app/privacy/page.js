import styles from './page.module.css'

export const metadata = {
  title: 'Privacy Policy - Mani Beauty',
  description: "Mani Beauty's privacy policy covering how we handle customer data.",
  robots: 'noindex, follow',
}

export default function PrivacyPage() {
  return (
    <section className={styles.page}>
      <div className="container">
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.text}>
          We collect only the information required to manage your bookings and provide salon services.
          We do not sell personal data to third parties.
        </p>
        <h2 className={styles.subtitle}>What we collect</h2>
        <p className={styles.text}>
          Name, phone number, email, requested service, preferred date/time, and notes you submit.
        </p>
        <h2 className={styles.subtitle}>How we use data</h2>
        <p className={styles.text}>
          Data is used for appointment management, support communication, and service improvements.
        </p>
        <h2 className={styles.subtitle}>Your rights</h2>
        <p className={styles.text}>
          You may request correction or deletion of your details by contacting us at{' '}
          <a href="mailto:manibeautygh@gmail.com">manibeautygh@gmail.com</a>.
        </p>
      </div>
    </section>
  )
}
