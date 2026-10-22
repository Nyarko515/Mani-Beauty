import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { defaultMeta, pageMeta, siteUrl } from './seo-data'

function upsertMeta(name, content, attr = 'name') {
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`)

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

function upsertJsonLd(json) {
  const id = 'mani-beauty-structured-data'
  let tag = document.head.querySelector(`script[id="${id}"]`)

  if (!tag) {
    tag = document.createElement('script')
    tag.id = id
    tag.type = 'application/ld+json'
    document.head.appendChild(tag)
  }

  tag.textContent = JSON.stringify(json)
}

function upsertCanonical(url) {
  let tag = document.head.querySelector('link[rel="canonical"]')

  if (!tag) {
    tag = document.createElement('link')
    tag.rel = 'canonical'
    document.head.appendChild(tag)
  }

  tag.href = url
}

export function PageSEO() {
  const location = useLocation()

  useEffect(() => {
    const meta = pageMeta[location.pathname] || defaultMeta

    const localBusinessSchema = {
      '@context': 'https://schema.org',
      '@type': 'BeautySalon',
      name: 'Mani Beauty',
      description: meta.description,
      url: siteUrl,
      telephone: '+233558812020',
      email: 'manibeautygh@gmail.com',
      image: `${siteUrl}/images/logo.jpeg`,
      areaServed: ['Haatso', 'Atomic', 'Legon', 'Madina', 'Accra', 'Ghana'],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Atomic Junction Roundabout',
        addressLocality: 'Accra',
        addressCountry: 'GH',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '08:00',
          closes: '19:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Sunday',
          opens: '13:00',
          closes: '19:00',
        },
      ],
      priceRange: '$$-$$$',
      keywords: meta.keywords,
      sameAs: [
        'https://www.instagram.com/manibeautylounge/',
        'https://www.tiktok.com/@manibeautygh',
        'https://www.youtube.com/results?search_query=Mani+Beauty+Lounge',
      ]
    }

    document.title = meta.title
    const canonicalPath = meta.canonicalPath || location.pathname
    upsertCanonical(`${siteUrl}${canonicalPath === '/' ? '/' : canonicalPath}`)
    upsertMeta('description', meta.description)
    upsertMeta('keywords', meta.keywords)
    upsertMeta('robots', meta.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
    upsertMeta('og:title', meta.title, 'property')
    upsertMeta('og:description', meta.description, 'property')
    upsertMeta('og:type', 'website', 'property')
    upsertMeta('og:url', `${siteUrl}${location.pathname === '/' ? '' : location.pathname}`, 'property')
    upsertMeta('og:site_name', 'Mani Beauty', 'property')
    upsertMeta('og:image', `${siteUrl}/images/logo.jpeg`, 'property')
    upsertMeta('og:image:alt', 'Mani Beauty salon logo', 'property')
    upsertMeta('twitter:card', 'summary_large_image', 'name')
    upsertMeta('twitter:title', meta.title, 'name')
    upsertMeta('twitter:description', meta.description, 'name')
    upsertMeta('twitter:image', `${siteUrl}/images/logo.jpeg`, 'name')
    upsertJsonLd(localBusinessSchema)
  }, [location.pathname])

  return null
}
