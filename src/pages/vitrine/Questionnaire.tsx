import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import {
  CheckCircle, ArrowRight, ArrowLeft, Loader2, Sparkles,
  GraduationCap, Wallet, FileText, Phone, Mail,
} from 'lucide-react'
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
  { id: 'financement_connu', question: 'Avez-vous déjà entendu parler de ces dispositifs ?', subtitle: 'Sélectionnez tout ce qui vous concerne (plusieurs choix possibles)', type: 'multiselect', field: 'financement_connu', options: ['OPCO (via mon employeur)', 'France Travail (AIF)', 'Aide Région Réunion', 'Transitions Pro', 'Je ne connais aucun dispositif', 'Autre'] },
  { id: 'disponibilite', question: 'Quand souhaitez-vous commencer ?', type: 'select', field: 'disponibilite', options: ['Dès maintenant', 'Dans le mois qui vient', 'Dans 2 à 3 mois', 'Je ne sais pas encore'] },
]

type FormData = Record<string, string | string[]>
type Phase = 'form' | 'generating' | 'result' | 'fallback'

// Structure du PFI renvoyé par la fonction generate-pfi (content_json).
type PfiFormation = { titre: string; justification: string; adaptation?: string; duree?: string; priorite?: string }
type PfiFinancement = { nom: string; description: string; probabilite?: string; montant?: string; reste_a_charge?: string; demarches?: string }
type PfiPlanFinancement = { financeur_probable?: string; justification?: string; reste_a_charge_estime?: string }
type PfiData = {
  titre?: string
  introduction?: string
  formations_recommandees?: PfiFormation[]
  plan_financement?: PfiPlanFinancement
  financements?: PfiFinancement[]
  prochaines_etapes?: string
  note_conseiller?: string
}

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
  const [phase, setPhase] = useState<Phase>('form')
  const [pfi, setPfi] = useState<PfiData | null>(null)
  const [error, setError] = useState('')

  const step = STEPS[currentStep]
  const currentValue = formData[step.field] ?? ''
  const submitting = phase === 'generating'

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
    setError('')
    setPhase('generating')

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
      setPhase('form')
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
      setPhase('form')
      return
    }

    // Génération automatique du PFI par l'IA. La fonction renvoie le rapport
    // complet dans sa réponse (content_json) : on peut l'afficher directement
    // sans lecture DB (pfi_reports est en RLS admin-only). En cas d'échec ou de
    // délai trop long, on bascule sur un écran rassurant — le lead est déjà
    // enregistré et un conseiller pourra générer le PFI manuellement.
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 75_000)
      )
      const invoke = supabase.functions.invoke('generate-pfi', { body: { lead_id: leadId } })
      const { data, error: fnErr } = await Promise.race([invoke, timeout]) as Awaited<typeof invoke>

      if (fnErr || !data?.success || !data?.report?.content_json) {
        setPhase('fallback')
        return
      }
      setPfi(data.report.content_json as PfiData)
      setPhase('result')
    } catch {
      setPhase('fallback')
    }
  }

  if (phase === 'generating') {
    return <GeneratingScreen prenom={(formData.prenom as string) || ''} />
  }

  if (phase === 'result' && pfi) {
    return <PfiResult data={pfi} prenom={(formData.prenom as string) || ''} email={(formData.email as string) || ''} />
  }

  if (phase === 'fallback') {
    return <FallbackScreen email={(formData.email as string) || ''} />
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
            {currentStep === STEPS.length - 1 ? (
              <>Générer mon PFI <Sparkles className="w-4 h-4" /></>
            ) : (
              <>Suivant <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* --------------------------- Écran d'attente --------------------------- */

const GEN_STEPS = [
  { icon: Sparkles, label: 'Analyse de votre profil par notre IA' },
  { icon: GraduationCap, label: 'Sélection des formations les plus adaptées' },
  { icon: Wallet, label: 'Recherche des dispositifs de financement' },
  { icon: FileText, label: 'Rédaction de votre plan personnalisé' },
]

function GeneratingScreen({ prenom }: { prenom: string }) {
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(6)

  // Fait avancer la check-list étape par étape (sans jamais valider la dernière
  // tant que la vraie réponse n'est pas arrivée) pour donner un sentiment de
  // progression pendant les ~15-40s de génération.
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setActive(a => (a < GEN_STEPS.length - 1 ? a + 1 : a))
    }, 4000)
    // Barre de progression qui s'approche doucement de 95 % puis s'arrête.
    const progTimer = setInterval(() => {
      setProgress(p => (p < 95 ? p + Math.max(0.5, (95 - p) * 0.04) : p))
    }, 350)
    return () => { clearInterval(stepTimer); clearInterval(progTimer) }
  }, [])

  return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4 pt-16">
      <div className="max-w-lg w-full text-center animate-fade-in">
        {/* Orbe animé */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-brand-600/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-brand-600/30 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {prenom ? `${prenom}, nous préparons votre PFI…` : 'Nous préparons votre PFI…'}
        </h1>
        <p className="text-neutral-400 mb-8 text-sm">
          Notre IA construit votre Plan de Formation Individualisé sur mesure. Cela prend environ 30 secondes — merci de patienter, ne fermez pas cette page.
        </p>

        {/* Barre de progression */}
        <div className="w-full bg-dark-600 rounded-full h-2 mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-600 to-brand-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 95)}%` }} />
        </div>

        {/* Check-list animée */}
        <div className="bg-dark-700 border border-white/5 rounded-2xl p-5 text-left space-y-3">
          {GEN_STEPS.map((s, i) => {
            const state = i < active ? 'done' : i === active ? 'active' : 'todo'
            return (
              <div key={i} className={cn(
                'flex items-center gap-3 text-sm transition-all duration-300',
                state === 'todo' ? 'opacity-40' : 'opacity-100'
              )}>
                <span className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors',
                  state === 'done' ? 'bg-emerald-500/20 text-emerald-400'
                    : state === 'active' ? 'bg-brand-600/20 text-brand-400'
                    : 'bg-white/5 text-neutral-500'
                )}>
                  {state === 'done'
                    ? <CheckCircle className="w-4 h-4" />
                    : state === 'active'
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <s.icon className="w-4 h-4" />}
                </span>
                <span className={cn(
                  'font-medium',
                  state === 'done' ? 'text-neutral-300' : state === 'active' ? 'text-white' : 'text-neutral-500'
                )}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ Résultat PFI ------------------------------ */

const PROBA_COLORS: Record<string, string> = {
  élevée: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  moyenne: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
  faible: 'bg-white/5 text-neutral-400 border-white/10',
}

function PfiResult({ data, prenom, email }: { data: PfiData; prenom: string; email: string }) {
  return (
    <div className="min-h-screen bg-dark-800 px-4 py-16">
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* En-tête succès */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="text-brand-500 text-xs font-semibold tracking-widest uppercase mb-2">Plan de Formation Individualisé</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            {prenom ? `${prenom}, votre PFI est prêt !` : 'Votre PFI est prêt !'}
          </h1>
          {email && (
            <p className="text-neutral-400 text-sm flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" /> Une copie sera adressée à <span className="text-neutral-200">{email}</span>
            </p>
          )}
        </div>

        {/* Corps du PFI */}
        <div className="bg-dark-700 border border-white/5 rounded-2xl p-6 sm:p-8 space-y-7">
          {data.introduction && (
            <p className="text-neutral-300 leading-relaxed">{data.introduction}</p>
          )}

          {data.formations_recommandees && data.formations_recommandees.length > 0 && (
            <Section icon={GraduationCap} title="Formations recommandées">
              <div className="space-y-3">
                {data.formations_recommandees.map((f, i) => (
                  <div key={i} className="bg-brand-600/10 border border-brand-600/20 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-white">{f.titre}</div>
                      {f.priorite && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-600/30 text-brand-200 shrink-0 capitalize">
                          {f.priorite}
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-400 text-sm mt-1.5 leading-relaxed">{f.justification}</p>
                    {f.adaptation && (
                      <p className="text-neutral-300 text-xs mt-2 bg-white/5 rounded-lg px-3 py-2">
                        <span className="font-semibold text-brand-300">Sur mesure : </span>{f.adaptation}
                      </p>
                    )}
                    {f.duree && <div className="text-xs text-neutral-500 mt-2">Durée indicative : {f.duree}</div>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {data.plan_financement?.financeur_probable && (
            <Section icon={Wallet} title="Financement le plus probable">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <div className="font-semibold text-emerald-300">{data.plan_financement.financeur_probable}</div>
                {data.plan_financement.justification && (
                  <p className="text-neutral-400 text-sm mt-1 leading-relaxed">{data.plan_financement.justification}</p>
                )}
                {data.plan_financement.reste_a_charge_estime && (
                  <div className="text-xs text-emerald-300 font-medium mt-2">
                    Reste à charge estimé : {data.plan_financement.reste_a_charge_estime}
                  </div>
                )}
              </div>
            </Section>
          )}

          {data.financements && data.financements.length > 0 && (
            <Section icon={Wallet} title="Dispositifs de financement mobilisables">
              <div className="space-y-2">
                {data.financements.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-sm">{f.nom}</span>
                        {f.probabilite && (
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold border', PROBA_COLORS[f.probabilite] ?? PROBA_COLORS.faible)}>
                            {f.probabilite}
                          </span>
                        )}
                      </div>
                      <p className="text-neutral-400 text-sm mt-0.5 leading-relaxed">{f.description}</p>
                      {f.montant && <div className="text-xs text-emerald-300 font-medium mt-1">Prise en charge : {f.montant}</div>}
                      {f.demarches && <p className="text-neutral-500 text-xs mt-1">Démarches : {f.demarches}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {data.prochaines_etapes && (
            <Section icon={ArrowRight} title="Prochaines étapes">
              <p className="text-neutral-300 leading-relaxed text-sm">{data.prochaines_etapes}</p>
            </Section>
          )}

          {data.note_conseiller && (
            <div className="border-t border-white/5 pt-5">
              <p className="text-neutral-400 leading-relaxed text-sm italic">{data.note_conseiller}</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-6 bg-gradient-to-br from-brand-600/15 to-brand-600/5 border border-brand-600/20 rounded-2xl p-6 text-center">
          <h3 className="text-white font-bold text-lg mb-1">Prêt à concrétiser votre projet ?</h3>
          <p className="text-neutral-400 text-sm mb-5">Un conseiller AFR vous accompagne gratuitement pour finaliser votre dossier de financement et votre inscription.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors">
              <Phone className="w-4 h-4" /> Être recontacté
            </Link>
            <Link to="/formations" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 font-medium rounded-xl transition-colors">
              Voir les formations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 font-bold text-white mb-3">
        <Icon className="w-4 h-4 text-brand-400" /> {title}
      </h3>
      {children}
    </div>
  )
}

/* ---------------------- Écran de repli (génération KO) ---------------------- */

function FallbackScreen({ email }: { email: string }) {
  return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center px-4 pt-16">
      <div className="max-w-lg w-full text-center animate-fade-in">
        <div className="w-20 h-20 bg-brand-600/10 border border-brand-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-brand-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">C'est enregistré, merci !</h1>
        <p className="text-neutral-400 mb-6">
          Votre demande a bien été prise en compte. Notre équipe finalise votre Plan de Formation Individualisé
          {email ? <> et vous l'envoie à <span className="text-neutral-200">{email}</span></> : null} très rapidement, accompagné des solutions de financement adaptées.
        </p>
        <div className="bg-dark-700 border border-white/5 rounded-2xl p-6 text-left space-y-2 mb-8">
          <div className="text-xs text-neutral-500 mb-3 font-semibold uppercase tracking-widest">Ce qui arrive ensuite</div>
          {['Analyse de votre profil par notre équipe', 'Identification des formations adaptées', 'Recherche des dispositifs de financement', 'Envoi de votre PFI et prise de contact'].map((s, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-neutral-300">
              <span className="w-5 h-5 bg-brand-600/20 text-brand-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors">
          Retour au site
        </Link>
      </div>
    </div>
  )
}
