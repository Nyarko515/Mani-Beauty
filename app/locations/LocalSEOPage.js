'use client'

import { Link } from '../../src/router'

export default function LocalSEOPage({
  title,
  subtitle,
  description,
  locationName,
  branchText,
  faqItems = [],
}) {
  return (
    <main style={{ paddingTop: '7rem', background: '#fffaf7' }}>
      <section style={{ padding: '2rem 0 1rem' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, rgba(19,88,78,0.05), rgba(232,167,184,0.1))',
            border: '1px solid rgba(19,88,78,0.12)',
            borderRadius: '24px',
            padding: '2rem',
            maxWidth: '980px',
            margin: '0 auto',
          }}>
            <span style={{
              display: 'inline-block',
              fontSize: '0.8rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#13584E',
              fontWeight: 700,
              marginBottom: '1rem',
            }}>
              Mani Beauty
            </span>
            <h1 style={{ marginBottom: '1rem', fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>{title}</h1>
            <p style={{ fontSize: '1.08rem', color: '#504a46', maxWidth: '760px', marginBottom: '1.5rem' }}>{subtitle}</p>
            <p style={{ fontSize: '1rem', color: '#504a46', marginBottom: '2rem' }}>{description}</p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', marginBottom: '1rem' }}>
              <Link href="/contact" className="btn btn-primary">Contact the salon</Link>
              <Link href="/booking" className="btn btn-secondary">Book an appointment</Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '1rem 0 2rem' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="card">
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.8rem' }}>Why clients choose Mani Beauty</h2>
              <p>Mani Beauty is a trusted beauty salon offering braids, hair extensions, wigs, beauty products and salon care for people looking for a polished, comfortable, and professional finish.</p>
              <p>{branchText}</p>
            </div>

            <div className="card">
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.8rem' }}>Popular services</h2>
              <ul style={{ paddingLeft: '1.1rem', color: '#2F2925', lineHeight: '1.8' }}>
                <li>Knotless braids and protective styles</li>
                <li>Hair extensions and styling</li>
                <li>Wig installation and customization</li>
                <li>Beauty products and hair care essentials</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '1rem 0 4rem' }}>
        <div className="container">
          <h2 style={{ marginBottom: '1.5rem' }}>Frequently asked questions</h2>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {faqItems.map((item) => (
              <div key={item.question} className="card" style={{ padding: '1.25rem 1.4rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{item.question}</h3>
                <p style={{ marginBottom: 0 }}>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 4rem' }}>
        <div className="container">
          <div className="card" style={{ textAlign: 'center', maxWidth: '860px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Visit Mani Beauty</h2>
            <p style={{ maxWidth: '650px', margin: '0 auto 1.5rem' }}>
              Whether you are searching for a salon near {locationName}, a beauty salon in the area, or hair extensions and braids services nearby, Mani Beauty is ready to help you book your next look.
            </p>
            <Link href="/contact" className="btn btn-primary">Find our location</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
