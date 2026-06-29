import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Menu, X, ChevronRight, Phone, Mail, ExternalLink } from 'lucide-react'
import { cn } from '../../lib/utils'
import { QUALIOPI_CERT_URL, QUALIOPI_LOGO } from '../../lib/config'

const navLinks = [
  { label: 'Accueil', href: '/' },
  { label: 'Formations', href: '/formations' },
  { label: 'Devis', href: '/devis' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]

const footerDomains = [
  'Comptabilité & Gestion',
  'Ressources Humaines & Paie',
  'Assistanat & Direction',
  'Formation & Insertion',
  'Management',
]

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const headerSolid = !isHome || scrolled

  return (
    <div className="min-h-screen flex flex-col">
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        headerSolid
          ? 'bg-dark-900/97 backdrop-blur-md border-b border-white/5 shadow-xl shadow-black/30'
          : 'bg-transparent'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/image.png"
              alt="AFR Formation"
              className="h-14 w-14 object-contain rounded-lg bg-white/5 p-0.5"
            />
            <div className="leading-none">
              <div className="text-white font-bold text-base tracking-wide">AFR Formation</div>
              <div className="text-neutral-400 text-[10px] tracking-wider uppercase">Accompagnement · Réussite</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  location.pathname === link.href
                    ? 'text-white bg-white/10'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/questionnaire"
              className="ml-3 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-brand-900/40"
            >
              Mon PFI gratuit <ChevronRight className="w-4 h-4" />
            </Link>
          </nav>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-dark-900 border-t border-white/5 px-4 py-4 space-y-1 animate-slide-up">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'block px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                  location.pathname === link.href
                    ? 'bg-white/10 text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/questionnaire"
              className="block mt-3 px-4 py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl text-center transition-colors"
            >
              Mon PFI gratuit
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="bg-dark-900 border-t border-white/5 text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

            {/* Brand column */}
            <div className="md:col-span-4">
              <div className="flex items-center gap-3 mb-4">
                <img src="/image.png" alt="AFR" className="h-16 w-16 object-contain rounded-xl bg-white/5 p-0.5" />
                <div>
                  <div className="text-white font-bold text-base">AFR Formation</div>
                  <div className="text-neutral-500 text-[10px] tracking-wider uppercase">Accompagnement · Réussite</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed max-w-xs mb-5">
                Activateur des talents & élévateur des savoirs. Formations certifiantes hybrides à La Réunion — pratiques, finançables, accessibles.
              </p>
              <div className="space-y-2 text-xs mb-5">
                <div className="flex items-start gap-2">
                  <span className="text-neutral-600 shrink-0 mt-0.5">📍</span>
                  <span>30 rue des topazes, Rivière des Roches<br />97412 Bras-Panon — La Réunion</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                  <a href="tel:+262692574591" className="hover:text-white transition-colors">+262 692 57 45 91</a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                  <a href="mailto:contact@afr-formation.fr" className="hover:text-white transition-colors">contact@afr-formation.fr</a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.facebook.com/Accompform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Facebook
                </a>
                <a
                  href="https://www.linkedin.com/in/petiaye-johnny-4a65b3b2/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> LinkedIn
                </a>
              </div>

              {/* Certifications */}
              <div className="mt-6 flex items-center gap-4">
                <a
                  href={QUALIOPI_CERT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Voir le certificat Qualiopi"
                  className="bg-white rounded-lg p-2 hover:opacity-90 transition-opacity"
                >
                  <img src={QUALIOPI_LOGO} alt="Certification Qualiopi" className="h-12 object-contain" />
                </a>
                <img
                  src="https://img.over-blog-kiwi.com/1/40/67/00/20200317/ob_e8c10c_1200px-logo-du-ministere-du-travail.png"
                  alt="Ministère du Travail"
                  className="h-12 object-contain bg-white rounded-lg p-2"
                />
              </div>
            </div>

            {/* Formations column */}
            <div className="md:col-span-4">
              <h4 className="text-white font-semibold text-sm mb-4">Domaines de formation</h4>
              <ul className="space-y-2 text-xs">
                {footerDomains.map(d => (
                  <li key={d}>
                    <Link to="/formations" className="hover:text-white transition-colors flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-brand-500 rounded-full shrink-0" />
                      {d}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Navigation + info column */}
            <div className="md:col-span-4 grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold text-sm mb-4">Navigation</h4>
                <ul className="space-y-2 text-xs">
                  {navLinks.map(l => (
                    <li key={l.href}>
                      <Link to={l.href} className="hover:text-white transition-colors">{l.label}</Link>
                    </li>
                  ))}
                  <li>
                    <Link to="/questionnaire" className="hover:text-white transition-colors">Mon PFI gratuit</Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm mb-4">Informations</h4>
                <ul className="space-y-2 text-xs">
                  <li>SIRET : 995 220 407 00010</li>
                  <li>NDA : 04 97 37547 97</li>
                  <li className="pt-2 text-neutral-500">Lun–Ven : 09h–18h</li>
                  <li className="text-neutral-500">Sam : sur rendez-vous</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <span>© {new Date().getFullYear()} AFR — Accompagnement Formation Réussite · Tous droits réservés</span>
            <div className="flex gap-4">
              <Link to="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
              <Link to="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
