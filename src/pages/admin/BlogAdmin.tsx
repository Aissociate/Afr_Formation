import { useEffect, useState } from 'react'
import { supabase, type BlogPost } from '../../lib/supabase'
import { formatDate, slugify } from '../../lib/utils'
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Save, Loader2, Wand2, Sparkles, Image as ImageIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

type EditState = Partial<BlogPost> & { isNew?: boolean }

export default function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [autoCount, setAutoCount] = useState(3)
  const [autoBusy, setAutoBusy] = useState(false)
  const [autoMsg, setAutoMsg] = useState('')

  const load = async () => {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const startNew = () => setEditing({
    isNew: true, title: '', slug: '', excerpt: '', content: '', author: 'AFR OI CFA',
    tags: [], is_published: false, seo_title: '', seo_description: '',
  })

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    const payload = {
      title: editing.title ?? '',
      slug: editing.slug ?? slugify(editing.title ?? ''),
      excerpt: editing.excerpt,
      content: editing.content,
      cover_image: editing.cover_image,
      author: editing.author ?? 'AFR OI CFA',
      tags: editing.tags,
      seo_title: editing.seo_title,
      seo_description: editing.seo_description,
      is_published: editing.is_published ?? false,
      published_at: editing.is_published ? (editing.published_at ?? new Date().toISOString()) : null,
    }
    if (editing.isNew) {
      await supabase.from('blog_posts').insert(payload)
    } else {
      await supabase.from('blog_posts').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id!)
    }
    setSaving(false)
    setEditing(null)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return
    await supabase.from('blog_posts').delete().eq('id', id)
    load()
  }

  const togglePublish = async (post: BlogPost) => {
    await supabase.from('blog_posts').update({
      is_published: !post.is_published,
      published_at: !post.is_published ? new Date().toISOString() : null,
    }).eq('id', post.id)
    load()
  }

  const generateWithAI = async () => {
    if (!editing?.title) return
    setGenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-post', {
        body: { title: editing.title, keywords: editing.tags?.join(', ') },
      })
      if (!error && data) {
        setEditing(prev => ({
          ...prev,
          content: data.content ?? prev?.content,
          excerpt: data.excerpt ?? prev?.excerpt,
          cover_image: data.cover_image ?? prev?.cover_image,
          seo_title: data.seo_title ?? prev?.seo_title,
          seo_description: data.seo_description ?? prev?.seo_description,
        }))
      }
    } catch (_) {
      // ignore
    }
    setGenerating(false)
  }

  // Extrait le vrai message d'erreur renvoyé par une fonction edge (corps JSON).
  const fnError = async (error: unknown): Promise<string> => {
    const e = error as { message?: string; context?: Response }
    try {
      const body = await e.context?.clone().json()
      if (body?.error) return body.error as string
    } catch (_) { /* ignore */ }
    return e?.message ?? 'Erreur inconnue'
  }

  // Génère un lot d'articles en brouillon : sujets auto → article + couverture.
  const generateAuto = async () => {
    setAutoBusy(true)
    setAutoMsg('Recherche de sujets…')
    try {
      const { data: topicsRes, error: topicsErr } = await supabase.functions.invoke('suggest-blog-topics', {
        body: { count: autoCount },
      })
      if (topicsErr) {
        setAutoMsg('Erreur (sujets) : ' + (await fnError(topicsErr)))
        setAutoBusy(false)
        return
      }
      const topics: { title: string; keywords: string }[] = topicsRes?.topics ?? []
      if (topics.length === 0) {
        setAutoMsg('Aucun sujet généré. Vérifiez la configuration IA.')
        setAutoBusy(false)
        return
      }
      let created = 0
      let lastError = ''
      for (const [i, t] of topics.entries()) {
        setAutoMsg(`Génération ${i + 1}/${topics.length} : ${t.title}`)
        const { data, error: genErr } = await supabase.functions.invoke('generate-blog-post', {
          body: { title: t.title, keywords: t.keywords },
        })
        if (genErr) { lastError = await fnError(genErr); continue }
        if (!data?.success) { lastError = data?.error ?? 'échec'; continue }
        const tags = (t.keywords || '').split(',').map(s => s.trim()).filter(Boolean)
        const base = {
          title: t.title,
          excerpt: data.excerpt ?? null,
          content: data.content ?? null,
          cover_image: data.cover_image ?? null,
          author: 'AFR OI CFA',
          tags,
          seo_title: data.seo_title ?? null,
          seo_description: data.seo_description ?? null,
          is_published: false,
        }
        // slug unique : on retente avec un suffixe en cas de collision.
        let { error } = await supabase.from('blog_posts').insert({ ...base, slug: slugify(t.title) })
        if (error) {
          await supabase.from('blog_posts').insert({ ...base, slug: `${slugify(t.title)}-${crypto.randomUUID().slice(0, 4)}` })
        }
        created++
      }
      setAutoMsg(
        created > 0
          ? `${created}/${topics.length} brouillon(s) créé(s).` + (lastError ? ` (dernière erreur : ${lastError})` : '')
          : 'Aucun article créé. ' + (lastError || 'Vérifiez la configuration IA.'),
      )
      await load()
    } catch (e) {
      setAutoMsg('Erreur : ' + (e instanceof Error ? e.message : String(e)))
    }
    setAutoBusy(false)
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-900">{editing.isNew ? 'Nouvel article' : 'Modifier l\'article'}</h1>
          <button onClick={() => setEditing(null)} className="p-2 text-neutral-400 hover:text-neutral-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Titre *</label>
              <input
                value={editing.title ?? ''}
                onChange={e => setEditing({ ...editing, title: e.target.value, slug: slugify(e.target.value) })}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 text-sm"
                placeholder="Titre de l'article"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-neutral-700">Extrait</label>
              </div>
              <textarea
                value={editing.excerpt ?? ''}
                onChange={e => setEditing({ ...editing, excerpt: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 text-sm resize-none"
                placeholder="Résumé de l'article (affiché en listing)"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-neutral-700">Contenu HTML</label>
                <button
                  onClick={generateWithAI}
                  disabled={generating || !editing.title}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                >
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                  Générer avec IA
                </button>
              </div>
              <textarea
                value={editing.content ?? ''}
                onChange={e => setEditing({ ...editing, content: e.target.value })}
                rows={16}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 text-sm font-mono resize-none"
                placeholder="<h2>Titre</h2><p>Contenu HTML…</p>"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-neutral-50 rounded-2xl p-4 space-y-4">
              <h3 className="font-semibold text-neutral-900 text-sm">Paramètres</h3>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Image de couverture</label>
                {editing.cover_image ? (
                  <img src={editing.cover_image} alt="" className="w-full h-32 object-cover rounded-lg mb-2 border border-neutral-200" />
                ) : (
                  <div className="w-full h-32 rounded-lg mb-2 border border-dashed border-neutral-200 flex items-center justify-center text-neutral-300">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <input
                  value={editing.cover_image ?? ''}
                  onChange={e => setEditing({ ...editing, cover_image: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-brand-400"
                  placeholder="URL de l'image (générée automatiquement avec l'IA)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Slug (URL)</label>
                <input
                  value={editing.slug ?? ''}
                  onChange={e => setEditing({ ...editing, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Auteur</label>
                <input
                  value={editing.author ?? ''}
                  onChange={e => setEditing({ ...editing, author: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-brand-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Tags (virgule séparés)</label>
                <input
                  value={(editing.tags ?? []).join(', ')}
                  onChange={e => setEditing({ ...editing, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-brand-400"
                  placeholder="formation, titre professionnel, Réunion"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.is_published ?? false} onChange={e => setEditing({ ...editing, is_published: e.target.checked })} className="rounded" />
                <span className="text-sm text-neutral-700">Publié</span>
              </label>
            </div>

            <div className="bg-neutral-50 rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-neutral-900 text-sm">SEO</h3>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Meta title</label>
                <input
                  value={editing.seo_title ?? ''}
                  onChange={e => setEditing({ ...editing, seo_title: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs focus:outline-none focus:border-brand-400"
                  placeholder="Titre SEO — max 60 caractères"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Meta description</label>
                <textarea
                  value={editing.seo_description ?? ''}
                  onChange={e => setEditing({ ...editing, seo_description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs resize-none focus:outline-none focus:border-brand-400"
                  placeholder="Description SEO — max 160 caractères"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !editing.title}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Blog</h1>
          <p className="text-neutral-500 text-sm">{posts.length} article{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-xl pl-3 pr-1.5 py-1">
            <input
              type="number" min={1} max={10} value={autoCount}
              onChange={e => setAutoCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-10 text-sm text-center focus:outline-none"
              title="Nombre d'articles à générer"
            />
            <button
              onClick={generateAuto}
              disabled={autoBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-warm-400 hover:bg-warm-500 disabled:opacity-50 text-dark-900 font-semibold rounded-lg transition-colors text-sm"
            >
              {autoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Générer auto
            </button>
          </div>
          <button onClick={startNew} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors text-sm">
            <Plus className="w-4 h-4" /> Nouvel article
          </button>
        </div>
      </div>

      {(autoBusy || autoMsg) && (
        <div className="flex items-center gap-2 text-sm bg-brand-50 text-brand-800 rounded-xl px-4 py-2.5 border border-brand-100">
          {autoBusy && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
          {autoMsg}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-neutral-100 rounded-xl animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Aucun article. Créez-en un !</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-100 divide-y divide-neutral-50">
          {posts.map(post => (
            <div key={post.id} className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors">
              <div className="flex-1 min-w-0 mr-4">
                <div className="font-medium text-neutral-900 text-sm truncate">{post.title}</div>
                <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-3">
                  <span>{formatDate(post.created_at)}</span>
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', post.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500')}>
                    {post.is_published ? 'Publié' : 'Brouillon'}
                  </span>
                  {post.tags?.slice(0, 2).map(t => <span key={t} className="bg-neutral-100 px-1.5 py-0.5 rounded text-[10px]">{t}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => togglePublish(post)} className="p-2 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors" title={post.is_published ? 'Dépublier' : 'Publier'}>
                  {post.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditing(post)} className="p-2 text-neutral-400 hover:text-brand-600 rounded-lg hover:bg-brand-50 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(post.id)} className="p-2 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FileText({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>
    </svg>
  )
}
