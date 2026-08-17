import { useEffect } from 'react'

// SEO par page : title, description, canonical, Open Graph/Twitter et JSON-LD
// sont posés dans le <head> via le DOM. Le pré-rendu (scripts/prerender.mjs)
// capture le document après exécution, donc ces balises se retrouvent dans le
// HTML statique servi aux robots et aux IA.

export const SITE_URL = 'https://afr-formation.fr'
export const SITE_NAME = 'AFR OI CFA'
export const DEFAULT_TITLE = "AFR OI CFA — La technologie au service de l'humain"
export const DEFAULT_DESCRIPTION =
  'AFR OI CFA - Organisme de formation professionnelle à La Réunion. Titres professionnels certifiants, financement OPCO, France Travail, Région. 100% distanciel, accessible partout sur l\'île.'
export const DEFAULT_IMAGE = `${SITE_URL}/image.png`

export type SeoProps = {
  title?: string
  description?: string | null
  /** Chemin canonique de la page, ex. "/formations/gestionnaire-paie" */
  path?: string
  image?: string | null
  type?: 'website' | 'article'
  jsonLd?: object | object[] | null
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/** Tronque une description aux ~160 caractères sans couper un mot. */
export function truncate(text: string, max = 160): string {
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return clean.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'
}

export function useSeo({ title, description, path, image, type = 'website', jsonLd }: SeoProps) {
  // Pas de double suffixe si le titre fourni (ex. seo_title en base) contient déjà la marque.
  const fullTitle = !title ? DEFAULT_TITLE : title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
  const desc = description || DEFAULT_DESCRIPTION
  const canonical = SITE_URL + (path ?? window.location.pathname).replace(/\/+$/, '')
  const img = image || DEFAULT_IMAGE
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : ''

  useEffect(() => {
    document.title = fullTitle
    upsertMeta('name', 'description', desc)
    upsertLink('canonical', canonical)

    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:locale', 'fr_FR')
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', desc)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('property', 'og:image', img)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', desc)
    upsertMeta('name', 'twitter:image', img)

    let script = document.head.querySelector<HTMLScriptElement>('script[data-seo-jsonld]')
    if (jsonLdText) {
      if (!script) {
        script = document.createElement('script')
        script.type = 'application/ld+json'
        script.setAttribute('data-seo-jsonld', '')
        document.head.appendChild(script)
      }
      script.textContent = jsonLdText
    } else if (script) {
      script.remove()
    }
  }, [fullTitle, desc, canonical, img, type, jsonLdText])
}

/** Schéma Organization commun (accueil). */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_IMAGE,
    description: DEFAULT_DESCRIPTION,
    areaServed: 'La Réunion, France',
    address: { '@type': 'PostalAddress', addressRegion: 'La Réunion', addressCountry: 'FR' },
  }
}
