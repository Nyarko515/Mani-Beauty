import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pageMeta, siteUrl } from '../src/seo-data.js'

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const distRoot = path.join(projectRoot, 'dist')
const template = await readFile(path.join(distRoot, 'index.html'), 'utf8')

function escapeAttribute(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

function upsertMeta(html, attribute, key, content) {
  const tagPattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${key}["'])[^>]*>`, 'i')
  const safeContent = escapeAttribute(content)
  const existing = html.match(tagPattern)?.[0]
  if (existing) {
    const contentPattern = /\bcontent=(['"])[\s\S]*?\1/i
    const updated = contentPattern.test(existing)
      ? existing.replace(contentPattern, `content="${safeContent}"`)
      : existing.replace(/\s*\/?>(\s*)$/, ` content="${safeContent}">$1`)
    return html.replace(existing, updated)
  }

  return html.replace('</head>', `  <meta ${attribute}="${key}" content="${safeContent}" />\n  </head>`)
}

function renderHead(route, metadata) {
  const canonicalPath = metadata.canonicalPath || route
  const canonical = `${siteUrl}${canonicalPath === '/' ? '/' : canonicalPath}`
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttribute(metadata.title)}</title>`)
  html = html.replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\/?\s*>/i, `<link rel="canonical" href="${escapeAttribute(canonical)}" />`)
  html = upsertMeta(html, 'name', 'description', metadata.description)
  html = upsertMeta(html, 'name', 'keywords', metadata.keywords || '')
  html = upsertMeta(html, 'name', 'robots', metadata.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
  html = upsertMeta(html, 'property', 'og:title', metadata.title)
  html = upsertMeta(html, 'property', 'og:description', metadata.description)
  html = upsertMeta(html, 'property', 'og:url', canonical)
  html = upsertMeta(html, 'name', 'twitter:title', metadata.title)
  html = upsertMeta(html, 'name', 'twitter:description', metadata.description)
  return html
}

for (const [route, metadata] of Object.entries(pageMeta)) {
  const routeHtml = renderHead(route, metadata)
  if (route === '/') {
    await writeFile(path.join(distRoot, 'index.html'), routeHtml)
    continue
  }

  const routeFile = route.slice(1).replaceAll('/', '--') || 'home'
  const seoDirectory = path.join(distRoot, '_seo')
  await mkdir(seoDirectory, { recursive: true })
  await writeFile(path.join(seoDirectory, `${routeFile}.html`), routeHtml)
}

console.log(`Generated route-specific SEO HTML for ${Object.keys(pageMeta).length} routes.`)
