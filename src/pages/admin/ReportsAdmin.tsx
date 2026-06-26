import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, type Lead, type PfiReport } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { Wand2, Loader2, FileText, Download, Send, Eye, X, CheckCircle } from 'lucide-react'

type LeadOption = Pick<Lead, 'id' | 'nom' | 'email'> & { questionnaire_responses: unknown[] }

export default function ReportsAdmin() {
  const [searchParams] = useSearchParams()
  const preselectedLeadId = searchParams.get('lead')

  const [leads, setLeads] = useState<LeadOption[]>([])
  const [reports, setReports] = useState<(PfiReport & { leads?: { nom: string; email: string } | null })[]>([])
  const [selectedLead, setSelectedLead] = useState(preselectedLeadId ?? '')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<PfiReport | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [leadsRes, reportsRes] = await Promise.all([
      supabase.from('leads').select('id, nom, email, questionnaire_responses(id)').order('created_at', { ascending: false }),
      supabase.from('pfi_reports').select('*, leads(nom, email)').order('created_at', { ascending: false }),
    ])
    setLeads((leadsRes.data as LeadOption[]) ?? [])
    setReports((reportsRes.data ?? []) as (PfiReport & { leads?: { nom: string; email: string } | null })[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleGenerate = async () => {
    if (!selectedLead) return
    setGenerating(true)
    setError('')

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('generate-pfi', {
        body: { lead_id: selectedLead },
      })
      if (fnErr || !data?.success) {
        setError(data?.error ?? 'Erreur lors de la génération. Vérifiez la configuration de la clé API.')
        setGenerating(false)
        return
      }
      await load()
      const newReport = reports.find(r => r.lead_id === selectedLead)
      if (newReport) setPreview(newReport)
    } catch (_) {
      setError('Erreur de connexion à la fonction IA.')
    }
    setGenerating(false)
  }

  const STATUS_COLORS: Record<string, string> = {
    brouillon: 'bg-neutral-100 text-neutral-600',
    généré: 'bg-emerald-100 text-emerald-700',
    envoyé: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Rapports PFI</h1>
        <p className="text-neutral-500 text-sm">Plan de Formation Individualisé — génération automatique par IA</p>
      </div>

      {/* Generator */}
      <div className="bg-gradient-to-br from-dark-800 to-dark-700 rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-brand-600/10 border border-brand-600/20 rounded-xl flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-white font-bold">Générer un PFI</h2>
            <p className="text-neutral-500 text-xs">L'IA analyse le profil et crée un rapport personnalisé</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedLead}
            onChange={e => setSelectedLead(e.target.value)}
            className="flex-1 px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm"
          >
            <option value="">Sélectionner un prospect…</option>
            {leads.map(l => (
              <option key={l.id} value={l.id}>
                {l.nom} — {l.email}
                {(l.questionnaire_responses?.length ?? 0) > 0 ? ' ✓' : ' (pas de questionnaire)'}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedLead}
            className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors shrink-0"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {generating ? 'Génération…' : 'Générer le PFI'}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3">
            <X className="w-4 h-4 shrink-0" />{error}
          </div>
        )}
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-2xl border border-neutral-100">
        <div className="px-5 py-4 border-b border-neutral-50 flex items-center justify-between">
          <h2 className="font-bold text-neutral-900 text-sm">Rapports générés</h2>
          <span className="text-xs text-neutral-400">{reports.length} rapport{reports.length !== 1 ? 's' : ''}</span>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-neutral-50 rounded-lg animate-pulse" />)}</div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-sm">Aucun rapport généré pour l'instant.</div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {reports.map(report => (
              <div key={report.id} className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors">
                <div>
                  <div className="font-medium text-neutral-900 text-sm">{report.titre ?? 'PFI sans titre'}</div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-400">
                    <span>{(report.leads as { nom: string; email: string } | null)?.nom ?? 'Prospect inconnu'}</span>
                    <span>·</span>
                    <span>{formatDate(report.created_at)}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[report.status] ?? STATUS_COLORS.brouillon}`}>{report.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPreview(report)} className="p-2 text-neutral-400 hover:text-brand-600 rounded hover:bg-brand-50 transition-colors"><Eye className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-4">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <h2 className="font-bold text-neutral-900">{preview.titre ?? 'PFI'}</h2>
              <button onClick={() => setPreview(null)} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {preview.content_json ? (
                <PfiContent data={preview.content_json as Record<string, unknown>} />
              ) : (
                <p className="text-neutral-500 text-sm">Contenu non disponible.</p>
              )}
            </div>
            <div className="p-5 border-t border-neutral-100 flex justify-end gap-2">
              <button onClick={() => setPreview(null)} className="px-4 py-2 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-xl hover:bg-neutral-50 transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type PfiFormation = { titre: string; justification: string; duree?: string; prix?: string; priorite?: string }
type PfiFinancement = { nom: string; description: string; montant?: string; demarches?: string }
type PfiData = {
  introduction?: string
  formations_recommandees?: PfiFormation[]
  financements?: PfiFinancement[]
  prochaines_etapes?: string
  note_conseiller?: string
}

function PfiContent({ data }: { data: Record<string, unknown> }) {
  const d = data as PfiData
  return (
    <div className="space-y-6 text-sm">
      {d.introduction && (
        <div>
          <h3 className="font-bold text-neutral-900 mb-2">Introduction</h3>
          <p className="text-neutral-600 leading-relaxed">{d.introduction}</p>
        </div>
      )}
      {d.formations_recommandees && d.formations_recommandees.length > 0 && (
        <div>
          <h3 className="font-bold text-neutral-900 mb-3">Formations recommandées</h3>
          <div className="space-y-3">
            {d.formations_recommandees.map((f, i) => (
              <div key={i} className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                <div className="font-semibold text-brand-900">{f.titre}</div>
                <p className="text-neutral-600 text-xs mt-1">{f.justification}</p>
                {f.duree && <div className="text-xs text-neutral-400 mt-1">Durée : {f.duree}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {d.financements && d.financements.length > 0 && (
        <div>
          <h3 className="font-bold text-neutral-900 mb-3">Dispositifs de financement identifiés</h3>
          <div className="space-y-2">
            {d.financements.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-xl">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-900 text-sm">{f.nom}</div>
                  <p className="text-neutral-600 text-xs mt-0.5">{f.description}</p>
                  {f.montant && <div className="text-xs text-emerald-700 font-medium mt-1">Montant max : {f.montant}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {d.prochaines_etapes && (
        <div>
          <h3 className="font-bold text-neutral-900 mb-2">Prochaines étapes</h3>
          <p className="text-neutral-600 leading-relaxed">{d.prochaines_etapes}</p>
        </div>
      )}
    </div>
  )
}
