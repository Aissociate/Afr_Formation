// Pré-rendu statique post-build.
// Sert dist/ en local, visite chaque page publique dans un Chrome headless,
// découvre les liens internes (/formations/:slug, /blog/:slug) par crawl,
// puis écrit le HTML rendu dans dist/<route>/index.html + dist/sitemap.xml.
// Netlify sert ces fichiers avant le fallback SPA (_redirects), donc les
// crawlers et IA voient le contenu complet ; le JS prend ensuite le relais
// dans le navigateur comme avant.
// Le build ÉCHOUE si une page rend un <div id="root"> vide (ex. .env absent
// → le client Supabase jette au chargement) : on ne déploie jamais un site
// invisible pour les robots.
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const SITE_URL = 'https://afr-formation.fr'
const SEED_ROUTES = ['/', '/formations', '/blog', '/contact', '/questionnaire', '/devis']
const EXCLUDE = /^\/admin(\/|$)/
const PAGE_TIMEOUT_MS = 30_000
const SETTLE_MS = 700

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
}

function serveDist() {
  const server = createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
      let filePath = path.join(DIST, urlPath)
      if (!filePath.startsWith(DIST) || !existsSync(filePath) || path.extname(filePath) === '') {
        filePath = path.join(DIST, 'index.html') // fallback SPA, comme _redirects
      }
      const body = await readFile(filePath)
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end()
    }
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  })
}

async function main() {
  if (!existsSync(path.join(DIST, 'index.html'))) {
    throw new Error('dist/index.html introuvable — lancer "vite build" avant le pré-rendu.')
  }
  const { default: puppeteer } = await import('puppeteer')
  const { server, port } = await serveDist()
  const origin = `http://127.0.0.1:${port}`
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })

  const queue = [...SEED_ROUTES]
  const seen = new Set(queue)
  const snapshots = new Map()

  try {
    const page = await browser.newPage()
    page.on('pageerror', (err) => console.warn('prerender: erreur JS sur la page —', err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.warn('prerender: console.error —', msg.text())
    })
    while (queue.length > 0) {
      const route = queue.shift()
      await page.goto(origin + route, { waitUntil: 'networkidle0', timeout: PAGE_TIMEOUT_MS })
      await new Promise((r) => setTimeout(r, SETTLE_MS))

      const { html, links } = await page.evaluate(() => ({
        html: document.documentElement.outerHTML,
        links: Array.from(document.querySelectorAll('a[href]'), (a) => a.getAttribute('href')),
      }))
      const rootEmpty = await page.evaluate(() => !document.getElementById('root')?.childElementCount)
      if (rootEmpty) {
        throw new Error(
          `page ${route} rendue vide (#root sans contenu) — l'app React n'a pas monté. ` +
          `Vérifier .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) puis relancer le build.`
        )
      }
      snapshots.set(route, '<!DOCTYPE html>\n' + html)
      console.log(`prerender: ${route} (${html.length} octets)`)

      for (const href of links) {
        if (!href || !href.startsWith('/') || href.startsWith('//')) continue
        const clean = href.split(/[#?]/)[0].replace(/\/+$/, '') || '/'
        if (EXCLUDE.test(clean) || seen.has(clean)) continue
        seen.add(clean)
        queue.push(clean)
      }
    }
  } finally {
    await browser.close()
    server.close()
  }

  // Écriture après le crawl pour ne pas servir des snapshots pendant la visite.
  for (const [route, html] of snapshots) {
    const outFile = route === '/'
      ? path.join(DIST, 'index.html')
      : path.join(DIST, ...route.split('/').filter(Boolean), 'index.html')
    await mkdir(path.dirname(outFile), { recursive: true })
    await writeFile(outFile, html, 'utf-8')
  }
  // Sitemap : une entrée par page pré-rendue (les routes /admin sont exclues du crawl).
  const today = new Date().toISOString().slice(0, 10)
  const urls = [...snapshots.keys()].sort().map((route) => {
    const loc = route === '/' ? SITE_URL + '/' : SITE_URL + route
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`
  })
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
  await writeFile(path.join(DIST, 'sitemap.xml'), sitemap, 'utf-8')

  console.log(`prerender: ${snapshots.size} pages écrites dans dist/ + sitemap.xml`)
}

main().catch((err) => {
  // Échec bloquant : mieux vaut un build rouge qu'un déploiement sans contenu statique.
  console.error('prerender: échec.\n', err)
  process.exit(1)
})
