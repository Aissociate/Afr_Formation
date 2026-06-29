import { useEffect, useState } from 'react'
import { supabase, type Formation } from '../../lib/supabase'
import { slugify } from '../../lib/utils'
import { Plus, Edit2, Trash2, X, Save, Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

type EditState = Partial<Formation> & { isNew?: boolean }

const CATEGORIES = ['Comptabilité & Gestion', 'Ressources Humaines & Paie', 'Assistanat & Direction', 'Formation & Insertion', 'Management']
const NIVEAUX = ['Bac (niveau 4)', 'Bac+2 (niveau 5)', 'Tous niveaux']

export default function FormationsAdmin() {
  const [items, setItems] = useState<Formation[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('formations').select('*').order('created_at', { ascending: false })
    setItems(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const startNew = () => setEditing({ isNew: true, title: '', slug: '', niveau: 'Bac+2 (niveau 5)', is_published: true, categorie: 'Comptabilité & Gestion' })

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    const payload = {
      title: editing.title ?? '',
      slug: editing.slug ?? slugify(editing.title ?? ''),
      description: editing.description,
      objectifs: editing.objectifs,
      duree: editing.duree,
      niveau: editing.niveau ?? 'Tous niveaux',
      prix: editing.prix,
      categorie: editing.categorie,
      image_url: editing.image_url,
      is_published: editing.is_published ?? true,
    }
    if (editing.isNew) {
      await supabase.from('formations').insert(payload)
    } else {
      await supabase.from('formations').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id!)
    }
    setSaving(false)
    setEditing(null)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette formation ?')) return
    await supabase.from('formations').delete().eq('id', id)
    load()
  }

  if (editing) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">{editing.isNew ? 'Nouvelle formation' : 'Modifier la formation'}</h1>
          <button onClick={() => setEditing(null)} className="p-2 text-neutral-400 hover:text-neutral-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Titre *</label>
            <input value={editing.title ?? ''} onChange={e => setEditing({ ...editing, title: e.target.value, slug: slugify(e.target.value) })}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm" placeholder="Titre de la formation" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Catégorie</label>
            <select value={editing.categorie ?? ''} onChange={e => setEditing({ ...editing, categorie: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm bg-white">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Niveau</label>
            <select value={editing.niveau ?? ''} onChange={e => setEditing({ ...editing, niveau: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm bg-white">
              {NIVEAUX.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Durée</label>
            <input value={editing.duree ?? ''} onChange={e => setEditing({ ...editing, duree: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm" placeholder="Ex: 35 heures" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Prix (€)</label>
            <input type="number" value={editing.prix ?? ''} onChange={e => setEditing({ ...editing, prix: parseFloat(e.target.value) || undefined })}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm" placeholder="1200" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
            <textarea value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })}
              rows={3} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm resize-none" placeholder="Description courte de la formation" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Objectifs (séparés par virgule)</label>
            <textarea value={editing.objectifs ?? ''} onChange={e => setEditing({ ...editing, objectifs: e.target.value })}
              rows={3} className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm resize-none" placeholder="Objectif 1, Objectif 2, Objectif 3" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Image (URL)</label>
            <input value={editing.image_url ?? ''} onChange={e => setEditing({ ...editing, image_url: e.target.value })}
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-brand-400 text-sm" placeholder="https://images.pexels.com/…" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editing.is_published ?? true} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} className="rounded" />
              <span className="text-sm text-neutral-700">Formation publiée</span>
            </label>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving || !editing.title}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Formations</h1>
          <p className="text-neutral-500 text-sm">{items.length} formation{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={startNew} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors text-sm">
          <Plus className="w-4 h-4" /> Nouvelle formation
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-neutral-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors">
              <div className="flex-1 min-w-0 mr-4">
                <div className="font-medium text-neutral-900 text-sm">{item.title}</div>
                <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-3">
                  <span className="px-1.5 py-0.5 bg-brand-50 text-brand-600 rounded text-[10px] font-medium">{item.categorie}</span>
                  <span>{item.duree}</span>
                  <span>{item.prix?.toLocaleString('fr-FR')} €</span>
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', item.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500')}>
                    {item.is_published ? 'Publié' : 'Masqué'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(item)} className="p-2 text-neutral-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
