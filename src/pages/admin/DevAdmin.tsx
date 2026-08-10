import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase, type BugTicket } from '../../lib/supabase'
import { formatDate, cn } from '../../lib/utils'
import {
  Bug, Plus, Search, X, Upload, Trash2, ImageIcon,
  CheckCircle2, Clock, AlertTriangle, Send, Loader2,
} from 'lucide-react'

const CATEGORIES = [
  { value: 'bug', label: 'Bug' },
  { value: 'amélioration', label: 'Amélioration' },
  { value: 'question', label: 'Question' },
]

const PRIORITES = [
  { value: 'basse', label: 'Basse' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'haute', label: 'Haute' },
  { value: 'critique', label: 'Critique' },
]

const STATUTS = [
  { value: 'nouveau', label: 'Nouveau' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'résolu', label: 'Résolu' },
  { value: 'fermé', label: 'Fermé' },
]

const PRIORITE_COLORS: Record<string, string> = {
  basse: 'bg-neutral-100 text-neutral-600',
  moyenne: 'bg-blue-100 text-blue-700',
  haute: 'bg-amber-100 text-amber-700',
  critique: 'bg-red-100 text-red-700',
}

const STATUT_COLORS: Record<string, string> = {
  nouveau: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-amber-100 text-amber-700',
  résolu: 'bg-emerald-100 text-emerald-700',
  fermé: 'bg-neutral-100 text-neutral-500',
}

const CAT_COLORS: Record<string, string> = {
  bug: 'bg-red-50 text-red-600',
  amélioration: 'bg-violet-50 text-violet-600',
  question: 'bg-sky-50 text-sky-600',
}

const statutLabel = (v: string) => STATUTS.find(s => s.value === v)?.label ?? v

// Upload d'une capture d'écran dans le bucket public `media`, préfixe bugs/.
async function uploadScreenshot(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
  const rand = Math.random().toString(36).slice(2, 8)
  const path = `bugs/${new Date().toISOString().slice(0, 10)}-${rand}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || 'image/png',
    upsert: false,
  })
  if (error) throw error
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}

export default function DevAdmin() {
  const [tickets, setTickets] = useState<BugTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<BugTicket | null>(null)

  const load = async () => {
    const { data } = await supabase
      .from('bug_tickets')
      .select('*')
      .order('created_at', { ascending: false })
    setTickets(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const counts = useMemo(() => ({
    total: tickets.length,
    ouverts: tickets.filter(t => t.statut === 'nouveau' || t.statut === 'en_cours').length,
    résolus: tickets.filter(t => t.statut === 'résolu').length,
    critiques: tickets.filter(t => t.priorite === 'critique' && t.statut !== 'résolu' && t.statut !== 'fermé').length,
  }), [tickets])

  const filtered = tickets.filter(t => {
    const matchStatut = statutFilter === 'all' || t.statut === statutFilter
    const matchSearch = !search ||
      `${t.titre} ${t.description ?? ''} ${t.page_url ?? ''} ${t.rapporteur ?? ''}`
        .toLowerCase().includes(search.toLowerCase())
    return matchStatut && matchSearch
  })

  const handleStatutChange = async (id: string, statut: string) => {
    const patch: Partial<BugTicket> = { statut, updated_at: new Date().toISOString() }
    if (statut === 'résolu') patch.resolved_at = new Date().toISOString()
    await supabase.from('bug_tickets').update(patch).eq('id', id)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce ticket ?')) return
    await supabase.from('bug_tickets').delete().eq('id', id)
    setSelected(null)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Bug className="w-6 h-6 text-brand-600" /> Développement
          </h1>
          <p className="text-neutral-500 text-sm">Remontée de bugs, suivi et résolution</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Signaler un bug
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.total, icon: Bug, color: 'text-neutral-700' },
          { label: 'Ouverts', value: counts.ouverts, icon: Clock, color: 'text-amber-600' },
          { label: 'Résolus', value: counts.résolus, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Critiques', value: counts.critiques, icon: AlertTriangle, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-neutral-100 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500">{s.label}</span>
              <s.icon className={cn('w-4 h-4', s.color)} />
            </div>
            <div className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un ticket…"
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm" />
        </div>
        <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)}
          className="px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm bg-white">
          <option value="all">Tous les statuts</option>
          {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-neutral-50 rounded-lg animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-sm">
            <Bug className="w-8 h-8 mx-auto mb-2 opacity-40" />
            Aucun ticket. Cliquez sur « Signaler un bug » pour en créer un.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-neutral-600 text-xs">Ticket</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-left font-semibold text-neutral-600 text-xs">Catégorie</th>
                  <th className="px-5 py-3 text-left font-semibold text-neutral-600 text-xs">Priorité</th>
                  <th className="px-5 py-3 text-left font-semibold text-neutral-600 text-xs">Statut</th>
                  <th className="hidden md:table-cell px-5 py-3 text-left font-semibold text-neutral-600 text-xs">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-neutral-50 transition-colors cursor-pointer" onClick={() => setSelected(t)}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {t.screenshot_url && <ImageIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-900 truncate max-w-[220px]">{t.titre}</div>
                          {t.page_url && <div className="text-xs text-neutral-400 truncate max-w-[220px]">{t.page_url}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3.5">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium capitalize', CAT_COLORS[t.categorie] ?? 'bg-neutral-100 text-neutral-600')}>{t.categorie}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize', PRIORITE_COLORS[t.priorite] ?? PRIORITE_COLORS.moyenne)}>{t.priorite}</span>
                    </td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <select value={t.statut} onChange={e => handleStatutChange(t.id, e.target.value)}
                        className={cn('px-2 py-1 rounded-full text-xs font-semibold border-0 focus:outline-none cursor-pointer', STATUT_COLORS[t.statut] ?? STATUT_COLORS.nouveau)}>
                        {STATUTS.map(s => <option key={s.value} value={s.value} className="bg-white text-neutral-900">{s.label}</option>)}
                      </select>
                    </td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-neutral-400 text-xs">{formatDate(t.created_at)}</td>
                    <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleDelete(t.id)} className="p-1.5 text-neutral-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <TicketForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
      {selected && <TicketDetail ticket={selected} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); load() }} onDelete={handleDelete} />}
    </div>
  )
}

/* ------------------------------- Form ------------------------------- */

function TicketForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [categorie, setCategorie] = useState('bug')
  const [priorite, setPriorite] = useState('moyenne')
  const [pageUrl, setPageUrl] = useState('')
  const [rapporteur, setRapporteur] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickFile = (f: File | null) => {
    if (!f) return
    if (!f.type.startsWith('image/')) { setError('Le fichier doit être une image.'); return }
    setError(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  // Collage direct d'une capture (Ctrl+V) — très pratique pour remonter un bug.
  const onPaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (item) pickFile(item.getAsFile())
  }

  const submit = async () => {
    if (!titre.trim()) { setError('Le titre est obligatoire.'); return }
    setSaving(true); setError(null)
    try {
      let screenshot_url: string | null = null
      if (file) screenshot_url = await uploadScreenshot(file)
      const { error } = await supabase.from('bug_tickets').insert({
        titre: titre.trim(),
        description: description.trim() || null,
        categorie, priorite,
        page_url: pageUrl.trim() || null,
        rapporteur: rapporteur.trim() || null,
        screenshot_url,
      })
      if (error) throw error
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l’enregistrement.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} onPaste={onPaste}>
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-bold text-neutral-900">Signaler un bug</h2>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Titre *">
            <input value={titre} onChange={e => setTitre(e.target.value)} autoFocus
              placeholder="Ex. Le bouton « Devis » ne fonctionne pas"
              className="input" />
          </Field>

          <Field label="Description">
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              placeholder="Décrivez le problème, les étapes pour le reproduire, le comportement attendu…"
              className="input resize-none" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Catégorie">
              <select value={categorie} onChange={e => setCategorie(e.target.value)} className="input bg-white">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Priorité">
              <select value={priorite} onChange={e => setPriorite(e.target.value)} className="input bg-white">
                {PRIORITES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Page concernée">
              <input value={pageUrl} onChange={e => setPageUrl(e.target.value)} placeholder="/formations" className="input" />
            </Field>
            <Field label="Signalé par">
              <input value={rapporteur} onChange={e => setRapporteur(e.target.value)} placeholder="Nom / email" className="input" />
            </Field>
          </div>

          <Field label="Capture d’écran">
            {preview ? (
              <div className="relative group">
                <img src={preview} alt="aperçu" className="w-full max-h-56 object-contain rounded-xl border border-neutral-200 bg-neutral-50" />
                <button onClick={() => { setFile(null); setPreview(null) }}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg text-neutral-500 hover:text-red-500 shadow">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 hover:border-brand-300 hover:text-brand-500 transition-colors">
                <Upload className="w-5 h-5" />
                <span className="text-sm">Cliquez pour choisir une image, ou collez-la (Ctrl+V)</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => pickFile(e.target.files?.[0] ?? null)} />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="p-5 border-t border-neutral-100 flex justify-end gap-2 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900">Annuler</button>
          <button onClick={submit} disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Enregistrement…' : 'Créer le ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ Detail ------------------------------ */

function TicketDetail({ ticket, onClose, onSaved, onDelete }: {
  ticket: BugTicket
  onClose: () => void
  onSaved: () => void
  onDelete: (id: string) => void
}) {
  const [statut, setStatut] = useState(ticket.statut)
  const [reponse, setReponse] = useState(ticket.reponse ?? '')
  const [saving, setSaving] = useState(false)
  const [zoom, setZoom] = useState(false)

  const save = async () => {
    setSaving(true)
    const patch: Partial<BugTicket> = {
      statut,
      reponse: reponse.trim() || null,
      updated_at: new Date().toISOString(),
    }
    if (statut === 'résolu' && !ticket.resolved_at) patch.resolved_at = new Date().toISOString()
    if (statut !== 'résolu') patch.resolved_at = null
    await supabase.from('bug_tickets').update(patch).eq('id', ticket.id)
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b border-neutral-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium capitalize', CAT_COLORS[ticket.categorie] ?? 'bg-neutral-100 text-neutral-600')}>{ticket.categorie}</span>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold capitalize', PRIORITE_COLORS[ticket.priorite])}>{ticket.priorite}</span>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', STATUT_COLORS[ticket.statut])}>{statutLabel(ticket.statut)}</span>
            </div>
            <h2 className="font-bold text-neutral-900 text-lg">{ticket.titre}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              ['Page concernée', ticket.page_url ?? '—'],
              ['Signalé par', ticket.rapporteur ?? '—'],
              ['Créé le', formatDate(ticket.created_at)],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-xs text-neutral-400 mb-0.5">{k}</div>
                <div className="text-neutral-900 font-medium break-words">{v}</div>
              </div>
            ))}
          </div>

          {ticket.description && (
            <div>
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Description</div>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {ticket.screenshot_url && (
            <div>
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Capture d’écran</div>
              <img src={ticket.screenshot_url} alt="capture" onClick={() => setZoom(true)}
                className="max-h-72 rounded-xl border border-neutral-200 cursor-zoom-in bg-neutral-50" />
            </div>
          )}

          {/* Réponse / résolution */}
          <div className="border-t border-neutral-100 pt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <Send className="w-4 h-4 text-brand-600" /> Réponse / résolution
            </div>
            <textarea value={reponse} onChange={e => setReponse(e.target.value)} rows={4}
              placeholder="Réponse au client, correctif appliqué, cause du problème…"
              className="input resize-none" />
            <div className="flex items-center gap-3">
              <select value={statut} onChange={e => setStatut(e.target.value)}
                className="input bg-white max-w-[180px]">
                {STATUTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {ticket.resolved_at && statut === 'résolu' && (
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Résolu le {formatDate(ticket.resolved_at)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-neutral-100 flex justify-between gap-2 sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={() => onDelete(ticket.id)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-500 hover:text-red-600 transition-colors">
            <Trash2 className="w-4 h-4" /> Supprimer
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900">Fermer</button>
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>

      {zoom && ticket.screenshot_url && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-6" onClick={() => setZoom(false)}>
          <img src={ticket.screenshot_url} alt="capture" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-neutral-500 mb-1 block">{label}</span>
      {children}
    </label>
  )
}
