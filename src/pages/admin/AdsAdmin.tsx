import { useEffect, useState } from 'react'
import { supabase, type AdCampaign, type Formation } from '../../lib/supabase'
import { Wand2, Loader2, Plus, Eye, Trash2, X, Image, FileText } from 'lucide-react'
import { cn } from '../../lib/utils'
import { formatDate } from '../../lib/utils'

export default function AdsAdmin() {
  const [campaigns, setCampaigns] = useState<(AdCampaign & { formations?: { title: string } | null })[]>([])
  const [formations, setFormations] = useState<Formation[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<AdCampaign | null>(null)

  const [form, setForm] = useState({
    titre: '',
    formation_id: '',
    target_audience: '',
    tone: 'professionnel',
    platform: 'facebook',
  })

  const load = async () => {
    const [campsRes, formsRes] = await Promise.all([
      supabase.from('ad_campaigns').select('*, formations(title)').order('created_at', { ascending: false }),
      supabase.from('formations').select('id, title').eq('is_published', true),
    ])
    setCampaigns((campsRes.data ?? []) as (AdCampaign & { formations?: { title: string } | null })[])
    setFormations((formsRes.data ?? []) as Formation[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleGenerate = async () => {
    if (!form.titre) return
    setGenerating(true)
    setError('')

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('generate-ads', {
        body: {
          titre: form.titre,
          formation_id: form.formation_id || null,
          target_audience: form.target_audience,
          tone: form.tone,
          platform: form.platform,
        },
      })

      if (fnErr || !data?.success) {
        setError(data?.error ?? 'Erreur lors de la génération.')
        setGenerating(false)
        return
      }

      setForm({ titre: '', formation_id: '', target_audience: '', tone: 'professionnel', platform: 'facebook' })
      await load()
    } catch (_) {
      setError('Erreur de connexion.')
    }
    setGenerating(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette campagne ?')) return
    await supabase.from('ad_campaigns').delete().eq('id', id)
    load()
  }

  const STATUS_COLORS: Record<string, string> = {
    brouillon: 'bg-neutral-100 text-neutral-600',
    actif: 'bg-emerald-100 text-emerald-700',
    archivé: 'bg-neutral-100 text-neutral-500',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Publicités IA</h1>
        <p className="text-neutral-500 text-sm">Générateur de variantes texte et image pour vos campagnes</p>
      </div>

      {/* Generator form */}
      <div className="bg-gradient-to-br from-dark-800 to-dark-700 rounded-2xl p-6 border border-white/5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-brand-600/10 border border-brand-600/20 rounded-xl flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-white font-bold">Nouvelle campagne publicitaire</h2>
            <p className="text-neutral-500 text-xs">L'IA génère plusieurs variantes de textes et un prompt image</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Nom de la campagne *</label>
            <input
              value={form.titre}
              onChange={e => setForm({ ...form, titre: e.target.value })}
              className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-brand-500 text-sm"
              placeholder="Ex: Campagne rentrée IA septembre"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Formation associée</label>
            <select
              value={form.formation_id}
              onChange={e => setForm({ ...form, formation_id: e.target.value })}
              className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm"
            >
              <option value="">Toutes les formations</option>
              {formations.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Plateforme</label>
            <select
              value={form.platform}
              onChange={e => setForm({ ...form, platform: e.target.value })}
              className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm"
            >
              <option value="facebook">Facebook / Instagram</option>
              <option value="google">Google Ads</option>
              <option value="linkedin">LinkedIn</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Ton</label>
            <select
              value={form.tone}
              onChange={e => setForm({ ...form, tone: e.target.value })}
              className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm"
            >
              <option value="professionnel">Professionnel</option>
              <option value="motivant">Motivant & inspirant</option>
              <option value="urgent">Urgent & direct</option>
              <option value="bienveillant">Bienveillant & accessible</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Audience cible</label>
            <input
              value={form.target_audience}
              onChange={e => setForm({ ...form, target_audience: e.target.value })}
              className="w-full px-4 py-3 bg-dark-600 border border-white/10 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-brand-500 text-sm"
              placeholder="Ex: Demandeurs d'emploi des Hauts"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3">
            <X className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating || !form.titre}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {generating ? 'Génération en cours…' : 'Générer les variantes'}
        </button>
      </div>

      {/* Campaigns list */}
      <div className="bg-white rounded-2xl border border-neutral-100">
        <div className="px-5 py-4 border-b border-neutral-50">
          <h2 className="font-bold text-neutral-900 text-sm">Campagnes créées</h2>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-neutral-50 rounded-lg animate-pulse" />)}</div>
        ) : campaigns.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 text-sm">Aucune campagne créée.</div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {campaigns.map(camp => (
              <div key={camp.id} className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors">
                <div>
                  <div className="font-medium text-neutral-900 text-sm">{camp.titre}</div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-400">
                    <span>{(camp.formations as { title: string } | null)?.title ?? 'Toutes formations'}</span>
                    <span>·</span>
                    <span className="capitalize">{camp.platform}</span>
                    <span>·</span>
                    <span>{formatDate(camp.created_at)}</span>
                    <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', STATUS_COLORS[camp.status] ?? STATUS_COLORS.brouillon)}>{camp.status}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPreview(camp)} className="p-2 text-neutral-400 hover:text-brand-600 rounded hover:bg-brand-50 transition-colors"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(camp.id)} className="p-2 text-neutral-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
              <h2 className="font-bold text-neutral-900">{preview.titre}</h2>
              <button onClick={() => setPreview(null)} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Text variants */}
              {Array.isArray(preview.ad_text_variants) && (preview.ad_text_variants as unknown[]).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-3">
                    <FileText className="w-4 h-4 text-brand-500" /> Variantes de texte
                  </div>
                  <div className="space-y-3">
                    {(preview.ad_text_variants as Record<string, string>[]).map((v, i) => (
                      <div key={i} className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-neutral-400 uppercase">Variante {i + 1}</span>
                          {v.hook && <span className="text-xs bg-brand-50 text-brand-600 px-2 py-0.5 rounded font-medium">{v.hook}</span>}
                        </div>
                        {v.titre && <div className="font-bold text-neutral-900 text-sm mb-1">{v.titre}</div>}
                        {v.texte && <p className="text-neutral-600 text-sm">{v.texte}</p>}
                        {v.cta && <div className="mt-2 inline-block px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-lg">{v.cta}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image prompt */}
              {preview.image_prompt && (
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-3">
                    <Image className="w-4 h-4 text-brand-500" /> Prompt image (DALL·E / Midjourney)
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                    <p className="text-neutral-600 text-sm font-mono leading-relaxed">{preview.image_prompt}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-neutral-100 flex justify-end">
              <button onClick={() => setPreview(null)} className="px-4 py-2 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-xl hover:bg-neutral-50 transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
