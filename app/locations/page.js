import { Link } from '../../src/router'

export const metadata = {
  title: 'Beauty Salons Near Me | Mani Beauty',
  description: 'Find Mani Beauty in Haatso, Atomic, Legon and Madina for braids, hair extensions, wigs and beauty services.',
}

export default function LocationsOverviewPage() {
  const locations = [
    { name: 'Haatso', href: '/locations/haatso' },
    { name: 'Atomic', href: '/locations/atomic' },
    { name: 'Legon', href: '/locations/legon' },
    { name: 'Madina', href: '/locations/madina' },
  ]

  return (
    <main style={{ paddingTop: '7rem', background: '#fffaf7' }}>
      <section style={{ padding: '2rem 0 4rem' }}>
        <div className="container">
          <div className="card" style={{ maxWidth: '980px', margin: '0 auto' }}>
            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Mani Beauty salon locations</h1>
            <p>Mani Beauty serves clients in Haatso, Atomic, Legon and Madina with braids, hair extensions, wigs and beauty products.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
              {locations.map((location) => (
                <Link key={location.name} href={location.href} className="btn btn-primary" style={{ textAlign: 'center' }}>
                  {location.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
