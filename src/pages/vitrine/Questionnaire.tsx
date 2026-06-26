import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

type Step = {
  id: string
  question: string
  subtitle?: string
  type: 'text' | 'email' | 'tel' | 'select' | 'multiselect'
  options?: string[]
  field: string
  required?: boolean
}

const STEPS: Step[] = [
  { id: 'nom', question: 'Quel est votre prénom ?', type: 'text', field: 'prenom', required: true },
  { id: 'email', question: 'Votre adresse email', subtitle: 'Pour recevoir votre PFI personnalisé', type: 'email', field: 'email', required: true },
  { id: 'telephone', question: 'Votre numéro de téléphone', subtitle: 'Optionnel — pour vous rappeler si besoin', type: 'tel', field: 'telephone' },
  { id: 'localite', question: 'Dans quelle zone habitez-vous ?', type: 'select', field: 'localite', options: ['Saint-Denis / Nord', 'Est (Bras-Panon, Saint-André…)', 'Sud (Saint-Pierre, Le Tampon…)', 'Ouest (Saint-Paul, Saint-Leu…)', 'Les Hauts (Cilaos, Salazie, Mafate…)', 'Autre'] },
  { id: 'situation_emploi', question: 'Quelle est votre situation actuelle ?', type: 'select', field: 'situation_emploi', options: ['Salarié(e) en poste', 'Demandeur(euse) d\'emploi', 'Auto-entrepreneur / Indépendant(e)', 'En reconversion professionnelle', 'Autre'] },
  { id: 'domaine_interesse', question: 'Quel domaine vous intéresse ?', type: 'select', field: 'domaine_interesse', options: ['Numérique & IA', 'Bureautique & Data', 'Marketing & Communication', 'Gestion & Comptabilité', 'Entrepreneuriat', 'Développement personnel', 'Je ne sais pas encore'] },
  { id: 'objectif_formation', question: 'Quel est votre principal objectif ?', type: 'select', field: 'objectif_formation', options: ['Monter en compétences dans mon poste', 'Changer de métier / reconversion', 'Créer ou développer mon activité', 'Améliorer mon employabilité', 'Obtenir une certification', 'Autre'] },
  { id: 'financement_connu', question: 'Avez-vous déjà entendu parler de ces dispositifs ?', subtitle: 'Sélectionnez tout ce qui vous concerne (plusieurs choix possibles)', type: 'multiselect', field: 'financement_connu', options: ['CPF (Compte Personnel de Formation)', 'OPCO (via mon employeur)', 'Aide Région Réunion', 'France Travail / Pôle Emploi', 'Je ne connais aucun dispositif', 'Autre'] },
  { id: 'disponibilite', question: 'Quand souhaitez-vous commencer ?', type: 'select', field: 'disponibilite', options: ['Dès maintenant', 'Dans le mois qui vient', 'Dans 2 à 3 mois', 'Je ne sais pas encore'] },
]

type FormData = Record<string, string | string[]>

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="w-full bg-neutral-100 rounded-full h-1.5">
      <div
        className="bg-brand-600 h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${((current + 1) / total) * 100}%` }}
      />
    </div>
  )
}

export default function Questionnaire() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const step = STEPS[currentStep]

  const currentValue = formData[step.field] ?? ''

  const setValue = (val: string) => {
    if (step.type === 'multiselect') {
      const current = (formData[step.field] as string[]) ?? []
      const updated = current.includes(val) ? current.filter(v => v !== val) : [...current, val]
      setFormData({ ...formData, [step.field]: updated })
    } else {
      setFormData({ ...formData, [step.field]: val })
    }
  }

  const canNext = step.required
    ? step.type === 'multiselect'
      ? ((formData[step.field] as string[]) ?? []).length > 0
      : !!currentValue
    : true

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(s => s + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    // On génère l'id côté client : la table `leads` n'a pas de policy SELECT
    // publique, donc un `.insert().select()` (INSERT ... RETURNING) serait
    // filtré par RLS et renverrait une ligne vide. En fournissant l'id, on
    // n'a plus besoin du RETURNING pour enchaîner sur le questionnaire.
    const leadId = crypto.randomUUID()

    const { error: leadErr } = await supabase
      .from('leads')
      .insert({
        id: leadId,
        nom: (formData.prenom as string) ?? 'Non renseigné',
        prenom: formData.prenom as string,
        email: formData.email as string,
        telephone: (formData.telephone as string) || null,
        localite: (formData.localite as string) || null,
        situation_pro: (formData.situation_emploi as string) || null,
        source: 'questionnaire',
      })

    if (leadErr) {
      console.error('Erreur insertion lead:', leadErr)
      setError('Une erreur est survenue. Veuillez réessayer.')
      setSubmitting(false)
      return
    }

    const { error: qErr } = await supabase.from('questionnaire_responses').insert({
      lead_id: leadId,
      objectif_formation: (formData.objectif_formation as string) || null,
      domaine_interesse: (formData.domaine_interesse as string) || null,
      situation_emploi: (formData.situation_emploi as string) || null,
      financement_connu: (formData.financement_connu as string[]) || null,
      disponibilite: (formData.disponibilite as string) || null,
    })

    if (qErr) {
      console.error('Erreur insertion questionnaire:', qErr)
      setError('Une erreur est survenue. Veuillez réessayer.')
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4 pt-16">
        <div className="max-w-lg w-full text-center animate-fade-in">
          <div className="w-20 h-20 bg-brand-600/10 border border-brand-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-brand-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Votre PFI est en cours de génération !</h1>
          <p className="text-neutral-400 mb-6">Notre IA analyse votre profil et va identifier la formation et le montage financier les plus adaptés à votre situation. Vous recevrez votre Plan de Formation Individualisé par email sous peu.</p>
          <div className="bg-dark-700 border border-white/5 rounded-2xl p-6 text-left space-y-2 mb-8">
            <div className="text-xs text-neutral-500 mb-3 font-semibold uppercase tracking-widest">Ce qui arrive ensuite</div>
            {['Analyse de votre profil par notre IA', 'Identification des formations adaptées', 'Recherche des dispositifs de financement', 'Génération de votre PFI personnalisé', 'Envoi par email'].map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                <span className="w-5 h-5 bg-brand-600/20 text-brand-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
          <a href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors">
            Retour au site
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4 pt-16">
      <div className="max-w-lg w-full animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-brand-500 text-xs font-semibold tracking-widest uppercase mb-2">Plan de Formation Individualisé</div>
          <h1 className="text-2xl font-bold text-white">Votre PFI gratuit en quelques questions</h1>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <ProgressBar current={currentStep} total={STEPS.length} />
          <div className="flex justify-between mt-2 text-xs text-neutral-500">
            <span>Question {currentStep + 1} sur {STEPS.length}</span>
            <span>{Math.round(((currentStep + 1) / STEPS.length) * 100)}%</span>
          </div>
        </div>

        {/* Question card */}
        <div className="bg-dark-700 border border-white/5 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white mb-1">{step.question}</h2>
          {step.subtitle && <p className="text-neutral-500 text-sm mb-6">{step.subtitle}</p>}
          {!step.subtitle && <div className="mb-6" />}

          {(step.type === 'text' || step.type === 'email' || step.type === 'tel') && (
            <input
              type={step.type}
              value={currentValue as string}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canNext && handleNext()}
              className="w-full px-4 py-3.5 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-brand-500 transition-colors"
              placeholder={step.type === 'email' ? 'votre@email.re' : step.type === 'tel' ? '06 XX XX XX XX' : 'Votre réponse…'}
              autoFocus
            />
          )}

          {step.type === 'select' && step.options && (
            <div className="space-y-2">
              {step.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => setValue(opt)}
                  className={cn(
                    'w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all',
                    currentValue === opt
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-dark-600 border-white/10 text-neutral-300 hover:border-brand-500/50 hover:text-white'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {step.type === 'multiselect' && step.options && (
            <div className="space-y-2">
              {step.options.map(opt => {
                const selected = ((formData[step.field] as string[]) ?? []).includes(opt)
                return (
                  <button
                    key={opt}
                    onClick={() => setValue(opt)}
                    className={cn(
                      'w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-3',
                      selected
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'bg-dark-600 border-white/10 text-neutral-300 hover:border-brand-500/50 hover:text-white'
                    )}
                  >
                    <span className={cn('w-4 h-4 rounded border-2 flex items-center justify-center shrink-0', selected ? 'border-white bg-white' : 'border-neutral-500')}>
                      {selected && <CheckCircle className="w-3 h-3 text-brand-600" />}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          )}

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Précédent
          </button>
          <button
            onClick={handleNext}
            disabled={!canNext || submitting}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Génération…</>
            ) : currentStep === STEPS.length - 1 ? (
              <>Générer mon PFI <CheckCircle className="w-4 h-4" /></>
            ) : (
              <>Suivant <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
