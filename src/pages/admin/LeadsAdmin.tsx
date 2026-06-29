import { useEffect, useState } from 'react'
import { supabase, type Lead } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'
import { Search, Eye, Trash2, FileBarChart, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const STATUS_OPTS = ['nouveau', 'qualifié', 'converti', 'perdu']
const STATUS_COLORS: Record<string, string> = {
  nouveau: 'bg-blue-100 text-blue-700',
  qualifié: 'bg-emerald-100 text-emerald-700',
  converti: 'bg-brand-100 text-brand-700',
  perdu: 'bg-neutral-100 text-neutral-600',
}

type LeadWithQuestionnaire = Lead & {
  questionnaire_responses?: {
    domaine_interesse: string | null
    objectif_formation: string | null
    situation_emploi: string | null
    financement_connu: string[] | null
    disponibilite: string | null
  }[]
}

export default function LeadsAdmin() {
  const [leads, setLeads] = useState<LeadWithQuestionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<LeadWithQuestionnaire | null>(null)
  const navigate = useNavigate()

  const load = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*, questionnaire_responses(*)')
      .order('created_at', { ascending: false })
    setLeads(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce prospect ?')) return
    await supabase.from('leads').delete().eq('id', id)
    setSelected(null)
    load()
  }

  const filtered = leads.filter(l => {
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    const matchSearch = !search || `${l.nom} ${l.email} ${l.localite ?? ''}`.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Prospects</h1>
        <p className="text-neutral-500 text-sm">{leads.length} prospect{leads.length !== 1 ? 's' : ''} au total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email…"
            className="w-full pl-9 pr-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm bg-white">
          <option value="all">Tous les statuts</option>
          {STATUS_OPTS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-neutral-50 rounded-lg animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-sm">Aucun prospect trouvé.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-neutral-600 text-xs">Nom</th>
                  <th className="px-5 py-3 text-left font-semibold text-neutral-600 text-xs">Email</th>
                  <th className="hidden md:table-cell px-5 py-3 text-left font-semibold text-neutral-600 text-xs">Localité</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-left font-semibold text-neutral-600 text-xs">Source</th>
                  <th className="px-5 py-3 text-left font-semibold text-neutral-600 text-xs">Statut</th>
                  <th className="hidden md:table-cell px-5 py-3 text-left font-semibold text-neutral-600 text-xs">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-neutral-900">{lead.nom}{lead.prenom ? ` ${lead.prenom}` : ''}</td>
                    <td className="px-5 py-3.5 text-neutral-500">{lead.email}</td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-neutral-500">{lead.localite ?? '—'}</td>
                    <td className="hidden sm:table-cell px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs">{lead.source}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <select value={lead.status} onChange={e => handleStatusChange(lead.id, e.target.value)}
                        className={cn('px-2 py-1 rounded-full text-xs font-semibold border-0 focus:outline-none cursor-pointer', STATUS_COLORS[lead.status] ?? STATUS_COLORS.nouveau)}>
                        {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-white text-neutral-900 capitalize">{s}</option>)}
                      </select>
                    </td>
                    <td className="hidden md:table-cell px-5 py-3.5 text-neutral-400 text-xs">{formatDate(lead.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelected(lead)} className="p-1.5 text-neutral-400 hover:text-brand-600 rounded hover:bg-brand-50 transition-colors"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => navigate(`/admin/reports?lead=${lead.id}`)} className="p-1.5 text-neutral-400 hover:text-brand-600 rounded hover:bg-brand-50 transition-colors" title="Générer PFI"><FileBarChart className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(lead.id)} className="p-1.5 text-neutral-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <h2 className="font-bold text-neutral-900">{selected.nom}</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Email', selected.email],
                  ['Téléphone', selected.telephone ?? '—'],
                  ['Type', selected.type_client ?? '—'],
                  ['Formation / Produit', selected.formation_produit ?? '—'],
                  ['Adresse', selected.adresse ?? '—'],
                  ['Représentant', selected.representant ?? '—'],
                  ['Fonction représentant', selected.fonction_representant ?? '—'],
                  ['Localité', selected.localite ?? '—'],
                  ['Situation', selected.situation_pro ?? '—'],
                  ['Source', selected.source],
                  ['Date', formatDate(selected.created_at)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-xs text-neutral-400 mb-0.5">{k}</div>
                    <div className="text-neutral-900 font-medium">{v}</div>
                  </div>
                ))}
              </div>
              {selected.questionnaire_responses && selected.questionnaire_responses.length > 0 && (
                <div className="border-t border-neutral-100 pt-4">
                  <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Questionnaire</div>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Domaine', selected.questionnaire_responses[0].domaine_interesse],
                      ['Objectif', selected.questionnaire_responses[0].objectif_formation],
                      ['Situation emploi', selected.questionnaire_responses[0].situation_emploi],
                      ['Disponibilité', selected.questionnaire_responses[0].disponibilite],
                    ].map(([k, v]) => v && (
                      <div key={k} className="flex justify-between">
                        <span className="text-neutral-500">{k}</span>
                        <span className="text-neutral-900 font-medium text-right max-w-xs">{v}</span>
                      </div>
                    ))}
                    {selected.questionnaire_responses[0].financement_connu && (
                      <div>
                        <span className="text-neutral-500">Financements connus</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selected.questionnaire_responses[0].financement_connu.map(f => (
                            <span key={f} className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selected.notes && (
                <div className="border-t border-neutral-100 pt-4">
                  <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Notes</div>
                  <p className="text-sm text-neutral-700">{selected.notes}</p>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-neutral-100 flex justify-end gap-2">
              <button onClick={() => navigate(`/admin/reports?lead=${selected.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-colors">
                <FileBarChart className="w-4 h-4" /> Générer PFI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
