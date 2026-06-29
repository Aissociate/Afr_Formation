import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type Formation } from '../../lib/supabase'
import { CheckCircle, Loader2, FileText, ArrowRight } from 'lucide-react'

type Form = {
  nom: string
  formation_produit: string
  telephone: string
  adresse: string
  email: string
  type_client: 'particulier' | 'entreprise'
  representant: string
  fonction_representant: string
}

const EMPTY: Form = {
  nom: '',
  formation_produit: '',
  telephone: '',
  adresse: '',
  email: '',
  type_client: 'particulier',
  representant: '',
  fonction_representant: '',
}

const inputCls =
  'w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm transition'

export default function Devis() {
  const [form, setForm] = useState<Form>(EMPTY)
  const [formations, setFormations] = useState<Formation[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('formations').select('title').eq('is_published', true).order('title')
      .then(({ data }) => setFormations((data as Formation[]) ?? []))
  }, [])

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm(f => ({ ...f, [key]: value }))
  }

  const isEntreprise = form.type_client === 'entreprise'
  const canSubmit =
    form.nom.trim() && form.formation_produit.trim() && form.telephone.trim() &&
    form.adresse.trim() && form.email.trim() &&
    (!isEntreprise || form.representant.trim())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError('')

    const leadId = crypto.randomUUID()
    const { error: err } = await supabase.from('leads').insert({
      id: leadId,
      nom: form.nom.trim(),
      email: form.email.trim(),
      telephone: form.telephone.trim() || null,
      adresse: form.adresse.trim() || null,
      formation_produit: form.formation_produit.trim() || null,
      type_client: form.type_client,
      representant: isEntreprise ? form.representant.trim() || null : null,
      fonction_representant: isEntreprise ? form.fonction_representant.trim() || null : null,
      source: 'devis',
    })

    if (err) {
      console.error('Erreur insertion devis:', err)
      setError('Une erreur est survenue. Veuillez réessayer.')
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    setDone(true)
  }

  if (done) {
    return (
      <section className="min-h-screen bg-dark-900 flex items-center justify-center px-4 pt-20">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-teal-500/15 border-2 border-teal-400/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Demande de devis envoyée !</h1>
          <p className="text-neutral-400 leading-relaxed mb-8">
            Merci {form.nom.split(' ')[0]}. Notre équipe revient vers vous très vite avec votre devis personnalisé.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors"
          >
            Retour à l'accueil <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-dark-900 pt-24 pb-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.16),transparent_60%)]" />
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-600/15 border border-brand-600/25 text-brand-300 text-xs font-semibold mb-5">
          <FileText className="w-3.5 h-3.5" /> Demande de devis
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Demandez votre devis</h1>
        <p className="text-neutral-400 mb-8 leading-relaxed">
          Quelques informations suffisent pour établir votre devis personnalisé. Réponse rapide par notre équipe.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 space-y-5">
          <Field label="Nom complet" required>
            <input className={inputCls} placeholder="Écrivez le nom complet" value={form.nom} onChange={e => set('nom', e.target.value)} />
          </Field>

          <Field label="Formation / Produit" required>
            <input
              list="formations-list"
              className={inputCls}
              placeholder="Écrivez le nom de la formation/produit"
              value={form.formation_produit}
              onChange={e => set('formation_produit', e.target.value)}
            />
            <datalist id="formations-list">
              {formations.map(f => <option key={f.title} value={f.title} />)}
            </datalist>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Téléphone" required>
              <input className={inputCls} type="tel" placeholder="Écrivez le numéro de téléphone" value={form.telephone} onChange={e => set('telephone', e.target.value)} />
            </Field>
            <Field label="Email" required>
              <input className={inputCls} type="email" placeholder="Écrivez l'email" value={form.email} onChange={e => set('email', e.target.value)} />
            </Field>
          </div>

          <Field label="Adresse" required>
            <input className={inputCls} placeholder="Écrivez l'adresse" value={form.adresse} onChange={e => set('adresse', e.target.value)} />
          </Field>

          <Field label="Particulier ou Entreprise ?" required>
            <div className="flex gap-3">
              {(['particulier', 'entreprise'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('type_client', t)}
                  className={
                    'flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors capitalize ' +
                    (form.type_client === t
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-brand-300')
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          {isEntreprise && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in">
              <Field label="Représenté par qui ?" required hint="Nom à faire figurer sur le devis">
                <input className={inputCls} placeholder="Écrivez le représentant" value={form.representant} onChange={e => set('representant', e.target.value)} />
              </Field>
              <Field label="Fonction du représentant">
                <input className={inputCls} placeholder="Ex : Gérant, DRH…" value={form.fonction_representant} onChange={e => set('fonction_representant', e.target.value)} />
              </Field>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold rounded-xl transition-colors"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {submitting ? 'Envoi…' : 'Demander mon devis'}
          </button>
          <p className="text-center text-neutral-400 text-xs">
            Besoin d'un accompagnement sur le financement ?{' '}
            <Link to="/questionnaire" className="text-brand-600 font-medium hover:underline">Obtenez votre PFI gratuit</Link>
          </p>
        </form>
      </div>
    </section>
  )
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-neutral-800 mb-1.5">
        {label}{required && <span className="text-brand-600">*</span>}
        {hint && <span className="font-normal text-neutral-400 text-xs ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  )
}
