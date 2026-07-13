import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, type Formation } from '../../lib/supabase'
import { Clock, CheckCircle, ArrowLeft, ChevronRight, Award, Users, BookOpen, Laptop } from 'lucide-react'

const IMG_MAP: Record<string, string> = {
  'Commerce, Vente & Distribution':       'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Gestion, Comptabilité & Finance':      'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Administratif, Secrétariat & Support': 'https://images.pexels.com/photos/669615/pexels-photo-669615.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Ressources Humaines & Paie':           'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Médico-social & Services à domicile':  'https://images.pexels.com/photos/3985163/pexels-photo-3985163.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Formation, Insertion & Accompagnement':'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800',
}

export default function FormationDetail() {
  const { slug } = useParams()
  const [formation, setFormation] = useState<Formation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    supabase.from('formations').select('*').eq('slug', slug).maybeSingle()
      .then(({ data }) => { setFormation(data); setLoading(false) })
  }, [slug])

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-16">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!formation) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center pt-16 gap-4">
      <div className="text-5xl">🔍</div>
      <p className="text-neutral-500 font-medium">Formation introuvable.</p>
      <Link to="/formations" className="text-brand-600 font-semibold hover:underline">Retour au catalogue</Link>
    </div>
  )

  const img = formation.image_url || IMG_MAP[formation.categorie ?? ''] || 'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800'

  let objectifs: string[] = []
  if (formation.objectifs) {
    try {
      const parsed = typeof formation.objectifs === 'string' ? JSON.parse(formation.objectifs) : formation.objectifs
      objectifs = Array.isArray(parsed) ? parsed : String(formation.objectifs).split(',').map(s => s.trim())
    } catch {
      objectifs = String(formation.objectifs).split(',').map(s => s.trim())
    }
  }

  // Pré-requis dérivés du niveau du diplôme visé : le niveau requis à l'entrée
  // correspond au niveau juste en dessous du diplôme (ex. Titre Pro niveau 5 → niveau 4 requis).
  const niveauMatch = formation.niveau?.match(/niveau\s*(\d)/i)
  const diplomaLevel = niveauMatch ? parseInt(niveauMatch[1], 10) : null
  const prereqLevel = diplomaLevel ? diplomaLevel - 1 : null
  const prerequis = [
    ...(prereqLevel ? [`Niveau ${prereqLevel} minimum`] : []),
    'Connexion internet',
    'Ordinateur',
  ]

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-dark-900 pt-24 pb-0 overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '36px 36px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.14),transparent_55%)]" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <Link to="/formations" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-8 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Retour au catalogue
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
            <div className="lg:col-span-3">
              {formation.categorie && (
                <div className="inline-block text-brand-400 text-xs font-semibold tracking-widest uppercase mb-4 border-b-2 border-brand-500 pb-1">
                  {formation.categorie}
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">{formation.title}</h1>
              <p className="text-neutral-400 leading-relaxed mb-6">{formation.description}</p>

              <div className="flex flex-wrap items-center gap-4">
                {formation.duree && (
                  <div className="flex items-center gap-2 text-sm text-neutral-300 bg-white/5 border border-white/8 rounded-full px-4 py-2">
                    <Clock className="w-4 h-4 text-brand-400" />{formation.duree}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-neutral-300 bg-white/5 border border-white/8 rounded-full px-4 py-2">
                  <Award className="w-4 h-4 text-brand-400" />{formation.niveau}
                </div>
                <div className="flex items-center gap-2 text-sm text-teal-300 bg-teal-400/10 border border-teal-400/20 rounded-full px-4 py-2">
                  <CheckCircle className="w-4 h-4" />Financement possible
                </div>
              </div>
            </div>

            {/* Hero image (desktop) */}
            <div className="hidden lg:block lg:col-span-2">
              <div className="rounded-2xl overflow-hidden h-52 relative">
                <img src={img} alt={formation.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content + sidebar */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main content */}
          <div className="lg:col-span-2 space-y-10">

            {/* Objectifs */}
            {objectifs.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-neutral-900 mb-5 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-600" />
                  Objectifs de la formation
                </h2>
                <ul className="space-y-3">
                  {objectifs.map((obj, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-700 text-sm leading-relaxed">
                      <span className="w-5 h-5 bg-brand-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-brand-600" />
                      </span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Modalités */}
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-5 flex items-center gap-2">
                <Laptop className="w-5 h-5 text-brand-600" />
                Modalités pédagogiques
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Laptop, title: '80% E-learning', desc: 'Accédez aux modules depuis n\'importe où, à votre rythme, sur la plateforme distancielle.' },
                  { icon: Users, title: '20% Classes virtuelles', desc: 'Séances synchrones avec le formateur, échanges et mises en situation professionnelles.' },
                  { icon: BookOpen, title: 'Ressources incluses', desc: 'Modèles, checklists, guides pratiques et outils métiers prêts à l\'emploi.' },
                  { icon: Award, title: 'Certification finale', desc: 'Titre Professionnel du Ministère du Travail — reconnu par l\'État et les employeurs.' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 text-sm mb-0.5">{item.title}</div>
                      <div className="text-neutral-500 text-xs leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pré-requis */}
            <div>
              <h2 className="text-xl font-bold text-neutral-900 mb-5 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-brand-600" />
                Pré-requis
              </h2>
              <ul className="space-y-3">
                {prerequis.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-neutral-700 text-sm leading-relaxed">
                    <span className="w-5 h-5 bg-brand-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-brand-600" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Certification */}
            <div className="flex items-center gap-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-100">
              <img
                src="https://img.over-blog-kiwi.com/1/40/67/00/20200317/ob_e8c10c_1200px-logo-du-ministere-du-travail.png"
                alt="Ministère du Travail"
                className="h-12 object-contain opacity-70 shrink-0"
              />
              <div>
                <div className="font-bold text-neutral-900 text-sm">Certification reconnue par l'État</div>
                <div className="text-neutral-500 text-xs mt-0.5 leading-relaxed">Titre Professionnel délivré par le Ministère du Travail, du Plein Emploi et de l'Insertion.</div>
              </div>
            </div>
          </div>

          {/* Sticky sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-dark-900 rounded-2xl p-6 sticky top-20 border border-white/5">
              <div className="text-neutral-400 text-xs mb-1">Tarif</div>
              <div className="text-3xl font-bold text-white mb-1">Sur devis</div>
              <div className="text-teal-300 text-xs font-medium mb-6">Financement possible — OPCO, France Travail (AIF), Région, CSP…</div>

              <Link
                to="/questionnaire"
                className="flex items-center justify-center gap-2 w-full px-4 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-brand-600/30 mb-3"
              >
                Financer cette formation <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                to="/contact"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10 font-medium rounded-xl transition-colors text-sm"
              >
                Poser une question
              </Link>

              <div className="mt-6 pt-5 border-t border-white/8 space-y-3 text-xs">
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Durée</span>
                  <span className="text-neutral-200 font-medium">{formation.duree}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Niveau</span>
                  <span className="text-neutral-200 font-medium">{formation.niveau}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Format</span>
                  <span className="text-neutral-200 font-medium">Hybride</span>
                </div>
                <div className="flex items-center justify-between text-neutral-500">
                  <span>Certification</span>
                  <span className="text-neutral-200 font-medium">Titre Pro. Min. Travail</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Back link */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
        <Link to="/formations" className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:gap-3 transition-all text-sm">
          <ArrowLeft className="w-4 h-4" /> Retour au catalogue
        </Link>
      </div>
    </div>
  )
}
