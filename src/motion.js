import { useEffect } from 'react'

// One observer enhances the existing page markup without making content depend on JS.
export function MotionEnhancer({ path }) {
  useEffect(() => {
    const page = document.querySelector('main.min-h-screen')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.documentElement.classList.add('site-motion-scope')
    if (!page || reducedMotion) {
      return () => document.documentElement.classList.remove('site-motion-scope')
    }

    const prepared = new Set()
    const observed = new WeakSet()
    let revealObserver
    let contentObserver
    let scanFrame = 0
    const prepare = (element, index = 0) => {
      if (!element || prepared.has(element)) return
      element.dataset.motionReveal = ''
      element.dataset.motionState = 'pending'
      element.style.setProperty('--motion-index', String(Math.min(index, 5)))
      prepared.add(element)
    }

    try {
      if (!('IntersectionObserver' in window)) {
        return () => document.documentElement.classList.remove('site-motion-scope')
      }

      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.dataset.motionState = 'visible'
          revealObserver.unobserve(entry.target)
        })
      }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' })

      const scanPage = () => {
        page.querySelectorAll('section').forEach((section) => {
          const heading = section.querySelector('h1')
          if (!heading) {
            if (section.querySelector('h2, h3, p, article, a, button')) prepare(section)
            return
          }

          // The page heading, supporting copy, and first action enter in sequence.
          prepare(heading)
          const supportingCopy = section.querySelector('p')
          if (supportingCopy) prepare(supportingCopy, 1)
          const action = section.querySelector('a.btn, button')
          if (action) prepare(action.closest('[class*="Actions"]') || action, 2)
        })

        // Compact pages may present a heading without a section.
        page.querySelectorAll('h1').forEach((heading) => {
          if (!heading.closest('section')) prepare(heading)
        })

        page.querySelectorAll('article').forEach((card) => {
          const siblings = card.parentElement
            ? Array.from(card.parentElement.children).filter((item) => item.tagName === 'ARTICLE')
            : []
          prepare(card, Math.max(0, siblings.indexOf(card)))
        })

        prepared.forEach((element) => {
          if (element.isConnected && element.dataset.motionState === 'pending' && !observed.has(element)) {
            revealObserver.observe(element)
            observed.add(element)
          }
        })
      }

      document.documentElement.classList.add('motion-enabled')
      scanPage()

      // Services and product lists can be replaced after data loads or a tab changes.
      contentObserver = new MutationObserver(() => {
        cancelAnimationFrame(scanFrame)
        scanFrame = requestAnimationFrame(scanPage)
      })
      contentObserver.observe(page, { childList: true, subtree: true })

      return () => {
        revealObserver.disconnect()
        contentObserver.disconnect()
        cancelAnimationFrame(scanFrame)
        prepared.forEach((element) => {
          delete element.dataset.motionReveal
          delete element.dataset.motionState
          element.style.removeProperty('--motion-index')
        })
        document.documentElement.classList.remove('motion-enabled')
        document.documentElement.classList.remove('site-motion-scope')
      }
    } catch {
      // If enhancement setup fails, restore the normal fully visible page.
      prepared.forEach((element) => {
        delete element.dataset.motionReveal
        delete element.dataset.motionState
        element.style.removeProperty('--motion-index')
      })
      revealObserver?.disconnect()
      contentObserver?.disconnect()
      document.documentElement.classList.remove('motion-enabled')
      document.documentElement.classList.remove('site-motion-scope')
      return undefined
    }
  }, [path])

  return null
}
