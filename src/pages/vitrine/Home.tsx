import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle, ChevronRight, Zap, Map, BookOpen, Award, Users, Star } from 'lucide-react'
import { supabase, type Formation } from '../../lib/supabase'

const pillars = [
  {
    icon: Zap,
    title: 'Rapide & concret',
    desc: 'Chaque module vise une compétence réelle, appliquée dès le jour 1. Templates, checklists, exemples pratiques inclus.',
  },
  {
    icon: Map,
    title: 'Clarté & structure',
    desc: 'On remet de l\'ordre : étapes, priorités, actions concrètes. Fini les doutes — place au plan.',
  },
  {
    icon: Award,
    title: 'Titres reconnus',
    desc: 'Des Titres Professionnels délivrés par le Ministère du Travail, reconnus par l\'État et les employeurs.',
  },
  {
    icon: Users,
    title: 'Suivi individualisé',
    desc: 'Accompagnement tutoré à distance, coaching méthodologique et ressources prêtes à l\'emploi.',
  },
]

const domains = [
  {
    title: 'Gestion, Comptabilité & Finance',
    formations: ['Comptable Assistant(e)', 'Gestionnaire de Paie'],
    img: 'https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=600',
    slug: 'comptable-assistant',
  },
  {
    title: 'Commerce, Vente & Distribution',
    formations: ['Conseiller(ère) de Vente', 'Manager d\'Unité Marchande'],
    img: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=600',
    slug: 'conseiller-vente',
  },
  {
    title: 'Formation & Insertion',
    formations: ['Formateur(trice) Professionnel(le) d\'Adultes', 'Conseiller(ère) en Insertion Professionnelle'],
    img: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=600',
    slug: 'formateur-professionnel-adultes',
  },
]

const testimonials = [
  {
    quote: 'J\'ai enfin compris la structure attendue. En quelques jours, mon dossier est passé de flou à pro.',
    name: 'Camille R.',
    role: 'Dossier professionnel',
  },
  {
    quote: 'AFR est hyper concret. J\'ai évité des erreurs qui m\'auraient coûté cher dans mon activité.',
    name: 'Yanis B.',
    role: 'Création & gestion',
  },
  {
    quote: 'J\'ai aimé le côté outil + action. On sort avec un plan clair et on avance vraiment.',
    name: 'Sarah M.',
    role: 'Entrepreneuriat',
  },
]

const steps = [
  { num: '01', title: 'Remplissez le questionnaire', desc: 'Quelques questions sur votre situation, vos objectifs et votre disponibilité.' },
  { num: '02', title: 'Analyse IA de votre profil', desc: 'Notre IA identifie la formation et le financement adaptés à votre situation.' },
  { num: '03', title: 'Recevez votre PFI', desc: 'Un Plan de Formation Individualisé complet, gratuit, prêt à soumettre à votre OPCO ou Pôle Emploi.' },
  { num: '04', title: 'Démarrez votre parcours', desc: 'Accédez à la plateforme et progressez à votre rythme, partout à La Réunion.' },
]

export default function Home() {
  const [formations, setFormations] = useState<Formation[]>([])

  useEffect(() => {
    supabase.from('formations').select('*').eq('is_published', true).limit(3)
      .then(({ data }) => setFormations(data ?? []))
  }, [])

  return (
    <div className="bg-white">

      {/* ─── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen bg-dark-900 flex items-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '36px 36px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(72,154,48,0.2),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(240,124,32,0.08),transparent_55%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/15 border border-brand-600/25 text-brand-400 text-xs font-semibold tracking-wider mb-6 animate-fade-in">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
              Organisme certifié — La Réunion
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.08] mb-6 animate-slide-up">
              Activez vos talents.<br />
              <span className="text-warm-500">Élevez</span> vos savoirs.
            </h1>

            <p className="text-lg text-neutral-400 leading-relaxed mb-8 max-w-lg">
              Des formations certifiantes (Titres Professionnels) hybrides — pratiques, finançables et accessibles partout à La Réunion.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12 animate-slide-up">
              <Link
                to="/questionnaire"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-brand-600/30 hover:-translate-y-0.5"
              >
                Obtenir mon PFI gratuit <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/formations"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold rounded-xl transition-colors"
              >
                Voir le catalogue
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4">
              {['Titres Professionnels du Ministère du Travail', 'Éligible CPF & OPCO', 'Présentiel · Distanciel · Mixte'].map(badge => (
                <div key={badge} className="flex items-center gap-2 text-neutral-400 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                  {badge}
                </div>
              ))}
            </div>
          </div>

          {/* Stats panel */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { value: '16', label: 'Formations certifiantes', sub: 'Titres Professionnels reconnus État' },
              { value: '6', label: 'Domaines métiers', sub: 'Commerce · RH · Médico-social…' },
              { value: 'CPF', label: 'Financement', sub: 'Zéro reste à charge possible' },
              { value: '100%', label: 'Flexible', sub: 'À votre rythme, où que vous soyez' },
            ].map(s => (
              <div key={s.value} className="bg-white/5 border border-white/8 rounded-2xl p-5 hover:border-brand-500/30 transition-colors">
                <div className="text-3xl font-bold text-warm-500 mb-1">{s.value}</div>
                <div className="text-white font-semibold text-sm mb-0.5">{s.label}</div>
                <div className="text-neutral-500 text-xs leading-snug">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-neutral-600 mx-auto animate-bounce" />
        </div>
      </section>

      {/* ─── MÉTHODE ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-block text-brand-600 text-xs font-semibold tracking-widest uppercase mb-3 border-b-2 border-brand-600 pb-1">La méthode AFR</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mt-2">
              Un accompagnement structuré,<br className="hidden sm:block" /> des résultats mesurables
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p, i) => (
              <div key={p.title} className="group relative bg-white rounded-2xl border border-neutral-100 p-7 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-50 transition-all">
                <div className="absolute top-5 right-5 text-neutral-100 font-bold text-4xl select-none">{String(i + 1).padStart(2, '0')}</div>
                <div className="w-11 h-11 bg-brand-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-brand-100 transition-colors">
                  <p.icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="font-bold text-neutral-900 mb-2 text-sm">{p.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ─────────────────────────────────────────── */}
      <section className="py-20 bg-dark-800 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-block text-warm-500 text-xs font-semibold tracking-widest uppercase mb-3 border-b-2 border-warm-500 pb-1">Comment ça marche</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">
              De votre idée à votre formation,<br className="hidden sm:block" /> en 4 étapes
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div key={step.num} className="relative">
                <div className="bg-dark-700 border border-white/5 rounded-2xl p-6 h-full hover:border-brand-600/30 transition-colors">
                  <div className="text-warm-500 font-bold text-3xl mb-4 font-display">{step.num}</div>
                  <h3 className="text-white font-semibold text-sm mb-2">{step.title}</h3>
                  <p className="text-neutral-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-2.5 -translate-y-1/2 z-10 text-brand-700">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/questionnaire"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all hover:shadow-2xl hover:shadow-brand-600/30 hover:-translate-y-1"
            >
              Démarrer le questionnaire <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-neutral-600 text-xs mt-3">Gratuit · Sans engagement · Résultat en quelques minutes</p>
          </div>
        </div>
      </section>

      {/* ─── DOMAINES ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="inline-block text-brand-600 text-xs font-semibold tracking-widest uppercase mb-3 border-b-2 border-brand-600 pb-1">Nos formations</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 mt-2">
                Des parcours qui<br className="hidden sm:block" /> changent tout.
              </h2>
              <p className="text-neutral-500 text-sm mt-3 max-w-md leading-relaxed">
                Titres Professionnels du Ministère du Travail — certifiants, finançables CPF/OPCO, accessibles depuis toute La Réunion.
              </p>
            </div>
            <Link to="/formations" className="inline-flex items-center gap-2 text-brand-600 font-semibold hover:gap-3 transition-all text-sm shrink-0">
              Voir toutes les formations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {domains.map(d => (
              <Link
                key={d.title}
                to={`/formations/${d.slug}`}
                className="group rounded-2xl overflow-hidden border border-neutral-100 hover:border-brand-200 hover:shadow-xl transition-all"
              >
                <div className="h-48 relative overflow-hidden">
                  <img src={d.img} alt={d.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/85 via-dark-900/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-xs text-warm-400 font-semibold mb-1">Titre Professionnel</div>
                    <h3 className="text-white font-bold text-sm leading-snug">{d.title}</h3>
                  </div>
                </div>
                <div className="bg-white p-5">
                  <ul className="space-y-2">
                    {d.formations.map(f => (
                      <li key={f} className="flex items-center gap-2 text-neutral-600 text-sm">
                        <CheckCircle className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center gap-1.5 text-brand-600 text-xs font-semibold group-hover:gap-2.5 transition-all">
                    Voir le détail <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Highlight banner */}
          <div className="mt-10 rounded-2xl bg-neutral-50 border border-neutral-100 p-8 flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <img
                src="https://img.over-blog-kiwi.com/1/40/67/00/20200317/ob_e8c10c_1200px-logo-du-ministere-du-travail.png"
                alt="Ministère du Travail"
                className="h-10 object-contain opacity-80"
              />
              <div>
                <div className="font-bold text-neutral-900 text-sm">Certifications reconnues par l'État</div>
                <div className="text-neutral-500 text-xs mt-0.5">Titres Professionnels du Ministère du Travail · 6 domaines métiers</div>
              </div>
            </div>
            <Link
              to="/formations"
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-dark-800 hover:bg-dark-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Voir les 16 formations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FORMATIONS FEATURED (DB) ──────────────────────────────────── */}
      {formations.length > 0 && (
        <section className="py-16 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-neutral-900">Formations en avant</h2>
              <p className="text-neutral-500 text-sm mt-2">Quelques-uns de nos parcours les plus demandés</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {formations.map(f => (
                <Link
                  key={f.id}
                  to={`/formations/${f.slug}`}
                  className="group bg-white rounded-2xl border border-neutral-100 hover:border-brand-200 hover:shadow-xl overflow-hidden transition-all"
                >
                  <div className="h-2 bg-brand-600 group-hover:bg-brand-500 transition-colors" />
                  <div className="p-6">
                    <div className="inline-block px-2 py-0.5 bg-brand-50 text-brand-700 text-xs font-semibold rounded mb-3">{f.categorie}</div>
                    <h3 className="font-bold text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors leading-snug">{f.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-neutral-400 mb-4">
                      <span>{f.duree}</span>
                      <span>·</span>
                      <span>{f.niveau}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Éligible CPF
                      </div>
                      <span className="text-brand-600 text-xs font-semibold flex items-center gap-1">
                        En savoir plus <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── TÉMOIGNAGES ───────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-block text-brand-600 text-xs font-semibold tracking-widest uppercase mb-3 border-b-2 border-brand-600 pb-1">Avis & retours</div>
            <h2 className="text-3xl font-bold text-neutral-900 mt-2">Une expérience premium,<br className="hidden sm:block" /> sans blabla.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-neutral-50 rounded-2xl border border-neutral-100 p-7 hover:border-brand-100 hover:shadow-lg transition-all">
                <div className="flex items-center gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-warm-500 text-warm-500" />
                  ))}
                </div>
                <p className="text-neutral-700 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-neutral-900 text-sm">{t.name}</div>
                  <div className="text-neutral-400 text-xs mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-dark-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(72,154,48,0.14),transparent_65%)]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '36px 36px' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600/15 border border-brand-600/25 rounded-full text-brand-400 text-xs font-semibold mb-6">
            <BookOpen className="w-3.5 h-3.5" />
            Plan de Formation Individualisé — gratuit
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Prêt à démarrer votre parcours ?
          </h2>
          <p className="text-neutral-400 mb-8 leading-relaxed">
            Répondez à quelques questions. Notre IA analyse votre profil et identifie la formation et le financement qui vous correspondent.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/questionnaire"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-all hover:shadow-2xl hover:shadow-brand-600/30 hover:-translate-y-1 text-lg"
            >
              Démarrer le questionnaire <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold rounded-xl transition-colors"
            >
              Nous contacter
            </Link>
          </div>
          <p className="text-neutral-600 text-xs mt-5">Gratuit · Sans engagement · Réponse en quelques minutes</p>
        </div>
      </section>

    </div>
  )
}
