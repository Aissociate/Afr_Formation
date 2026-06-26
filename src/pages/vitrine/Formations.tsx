import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type Formation } from '../../lib/supabase'
import { Search, Clock, CheckCircle, ChevronRight, Award } from 'lucide-react'
import { cn } from '../../lib/utils'

const CATEGORIES = [
  'Toutes',
  'Commerce, Vente & Distribution',
  'Gestion, Comptabilité & Finance',
  'Administratif, Secrétariat & Support',
  'Ressources Humaines & Paie',
  'Médico-social & Services à domicile',
  'Formation, Insertion & Accompagnement',
]

const IMG_MAP: Record<string, string> = {
  'Commerce, Vente & Distribution':       'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Gestion, Comptabilité & Finance':      'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Administratif, Secrétariat & Support': 'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Ressources Humaines & Paie':           'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Médico-social & Services à domicile':  'https://images.pexels.com/photos/3985163/pexels-photo-3985163.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Formation, Insertion & Accompagnement':'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=600',
}

export default function Formations() {
  const [formations, setFormations] = useState<Formation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('Toutes')

  useEffect(() => {
    supabase.from('formations').select('*').eq('is_published', true).order('categorie')
      .then(({ data }) => {
        setFormations(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = formations.filter(f => {
    const matchCat = activeCategory === 'Toutes' || f.categorie === activeCategory
    const matchSearch = !search || f.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-dark-900 pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '36px 36px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(72,154,48,0.14),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="inline-block text-brand-500 text-xs font-semibold tracking-widest uppercase mb-4 border-b-2 border-brand-500 pb-1">Catalogue</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 mt-1">Nos formations certifiantes</h1>
          <p className="text-neutral-400 max-w-xl mb-3 leading-relaxed">
            Titres Professionnels du Ministère du Travail · Hybrides · Finançables CPF/OPCO · Accessibles partout à La Réunion
          </p>

          <div className="flex items-center gap-3 mt-4 mb-8">
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <Award className="w-3.5 h-3.5 text-brand-500" />
              16 Titres Professionnels reconnus État
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Éligible CPF & OPCO
            </div>
          </div>

          <div className="relative max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Rechercher une formation…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-brand-500/60 focus:bg-white/8 text-sm transition-colors"
            />
          </div>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-semibold transition-all',
                  activeCategory === cat
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Count */}
          {!loading && (
            <p className="text-xs text-neutral-400 mb-6">
              {filtered.length} formation{filtered.length > 1 ? 's' : ''} {activeCategory !== 'Toutes' ? `dans "${activeCategory}"` : 'disponibles'}
            </p>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden animate-pulse">
                  <div className="h-44 bg-neutral-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-neutral-100 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-neutral-500 font-medium">Aucune formation trouvée.</p>
              <button onClick={() => { setSearch(''); setActiveCategory('Toutes') }} className="mt-3 text-brand-600 text-sm font-semibold hover:underline">
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(f => (
                <Link
                  key={f.id}
                  to={`/formations/${f.slug}`}
                  className="group bg-white rounded-2xl border border-neutral-100 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-50 overflow-hidden transition-all"
                >
                  <div className="h-44 bg-neutral-100 overflow-hidden relative">
                    <img
                      src={f.image_url || IMG_MAP[f.categorie ?? ''] || 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=600'}
                      alt={f.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-900/75 via-dark-900/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <span className="px-2 py-1 bg-brand-600 text-white text-[10px] font-semibold rounded">{f.niveau}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] text-brand-600 font-semibold uppercase tracking-wider mb-2">{f.categorie}</div>
                    <h2 className="font-bold text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors leading-snug text-sm">{f.title}</h2>
                    {f.description && (
                      <p className="text-neutral-500 text-xs line-clamp-2 mb-3 leading-relaxed">{f.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-neutral-400 mb-4">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{f.duree}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-neutral-50">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Éligible CPF
                      </div>
                      <span className="text-brand-600 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        En savoir plus <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 bg-dark-900 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(234,54,12,0.12),transparent_60%)]" />
            <div className="relative">
              <h3 className="text-white font-bold text-xl mb-1">Pas sûr de votre financement ?</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">Notre IA identifie le dispositif adapté à votre situation en quelques minutes — CPF, OPCO, AIF, CSP…</p>
            </div>
            <Link
              to="/questionnaire"
              className="relative shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-brand-600/30"
            >
              Obtenir mon PFI gratuit <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
