import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Mail, Phone, MapPin, Send, CheckCircle, Clock, ArrowRight, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Contact() {
  const [form, setForm] = useState({ nom: '', email: '', telephone: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    const { error: err } = await supabase.from('leads').insert({
      nom: form.nom,
      email: form.email,
      telephone: form.telephone,
      source: 'contact',
      notes: form.message,
    })
    setSending(false)
    if (err) { setError('Une erreur est survenue. Veuillez réessayer.'); return }
    setSent(true)
  }

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-dark-900 pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '36px 36px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(72,154,48,0.12),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="inline-block text-brand-500 text-xs font-semibold tracking-widest uppercase mb-4 border-b-2 border-brand-500 pb-1">Contact</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 mt-1">Parlons de votre objectif.</h1>
          <p className="text-neutral-400 max-w-xl leading-relaxed">Notre équipe vous répond rapidement. Ou obtenez directement votre Plan de Formation Individualisé — gratuit.</p>
          <div className="mt-6">
            <Link
              to="/questionnaire"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-brand-600/30"
            >
              Obtenir mon PFI gratuit <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Info column */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-neutral-900">Nos coordonnées</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-0.5">Adresse</div>
                  <div className="text-neutral-900 font-medium text-sm leading-snug">
                    30 rue des topazes, Rivière des Roches<br />97412 Bras-Panon — La Réunion
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-0.5">Téléphone</div>
                  <a href="tel:+262692574591" className="text-neutral-900 font-medium text-sm hover:text-brand-600 transition-colors">
                    +262 692 57 45 91
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-0.5">Email</div>
                  <a href="mailto:contact@afr-formation.fr" className="text-neutral-900 font-medium text-sm hover:text-brand-600 transition-colors">
                    contact@afr-formation.fr
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <div className="text-xs text-neutral-400 mb-1">Horaires</div>
                  <div className="text-neutral-700 text-sm space-y-0.5">
                    <div>Lun–Ven : 09h00 – 18h00</div>
                    <div>Sam : sur rendez-vous</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Réseaux sociaux</h3>
              <div className="flex gap-3">
                <a
                  href="https://www.facebook.com/Accompform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 hover:bg-brand-50 border border-neutral-100 hover:border-brand-200 rounded-xl text-sm text-neutral-600 hover:text-brand-600 transition-all"
                >
                  <ExternalLink className="w-4 h-4" /> Facebook
                </a>
                <a
                  href="https://www.linkedin.com/in/petiaye-johnny-4a65b3b2/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 hover:bg-brand-50 border border-neutral-100 hover:border-brand-200 rounded-xl text-sm text-neutral-600 hover:text-brand-600 transition-all"
                >
                  <ExternalLink className="w-4 h-4" /> LinkedIn
                </a>
              </div>
            </div>

            {/* Legal */}
            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
              <div className="text-xs text-neutral-400 mb-2 font-semibold">Informations légales</div>
              <div className="text-xs text-neutral-600 space-y-1">
                <div>SIRET : 995 220 407 00010</div>
                <div>NDA : 04 97 37547 97</div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-5 border-2 border-emerald-100">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-2">Message envoyé !</h3>
                <p className="text-neutral-500 max-w-xs">Nous vous répondrons dans les plus brefs délais. En attendant, découvrez nos formations.</p>
                <Link to="/formations" className="mt-6 inline-flex items-center gap-2 text-brand-600 font-semibold text-sm hover:gap-3 transition-all">
                  Voir le catalogue <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-neutral-900 mb-6">Envoyer un message</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Nom complet *</label>
                      <input
                        required
                        type="text"
                        value={form.nom}
                        onChange={e => setForm({ ...form, nom: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 text-sm transition-all bg-white"
                        placeholder="Votre nom"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        value={form.telephone}
                        onChange={e => setForm({ ...form, telephone: e.target.value })}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 text-sm transition-all bg-white"
                        placeholder="06 92 XX XX XX"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 text-sm transition-all bg-white"
                      placeholder="votre@email.re"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Message *</label>
                    <textarea
                      required
                      rows={6}
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 text-sm resize-none transition-all bg-white"
                      placeholder="Décrivez votre situation, votre projet de formation ou votre question…"
                    />
                  </div>
                  {error && <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-brand-600/25"
                  >
                    {sending ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi en cours…</>
                    ) : (
                      <><Send className="w-4 h-4" /> Envoyer le message</>
                    )}
                  </button>
                  <p className="text-xs text-neutral-400 text-center">Vos données sont traitées dans le respect de la RGPD.</p>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
