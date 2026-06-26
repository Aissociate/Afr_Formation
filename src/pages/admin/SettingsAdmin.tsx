import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Settings, Save, Loader2, Eye, EyeOff, Check, AlertCircle,
  Key, Sparkles, Megaphone, FileText, FileBarChart, Zap,
} from 'lucide-react'

type AiConfig = {
  provider: string
  base_url: string
  api_key: string
  model: string
  temperature: number
  max_tokens: number
  prompt_blog: string
  prompt_ads: string
  prompt_pfi: string
}

const DEFAULTS: AiConfig = {
  provider: 'openrouter',
  base_url: 'https://openrouter.ai/api/v1',
  api_key: '',
  model: 'anthropic/claude-3.5-sonnet',
  temperature: 0.7,
  max_tokens: 2000,
  prompt_blog: '',
  prompt_ads: '',
  prompt_pfi: '',
}

const MODEL_SUGGESTIONS = [
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3.7-sonnet',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-large',
]

const PROMPTS: { key: 'prompt_blog' | 'prompt_ads' | 'prompt_pfi'; label: string; icon: typeof FileText; desc: string; vars: string[] }[] = [
  {
    key: 'prompt_blog',
    label: 'Génération d’article de blog',
    icon: FileText,
    desc: 'Utilisé par le générateur d’articles (Blog).',
    vars: ['title', 'keywords'],
  },
  {
    key: 'prompt_ads',
    label: 'Génération de publicités',
    icon: Megaphone,
    desc: 'Utilisé par le générateur de campagnes (Publicités IA).',
    vars: ['titre', 'platform_guide', 'tone', 'target_audience', 'formation_block'],
  },
  {
    key: 'prompt_pfi',
    label: 'Génération de PFI',
    icon: FileBarChart,
    desc: 'Plan de Formation Individualisé (Rapports PFI).',
    vars: ['nom', 'localite', 'situation_pro', 'situation_emploi', 'niveau_etudes', 'revenus_foyer', 'domaine_interesse', 'objectif_formation', 'disponibilite', 'financement_connu', 'commentaires', 'formations_catalogue', 'financements_disponibles'],
  },
]

const inputCls =
  'w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm transition'

export default function SettingsAdmin() {
  const [form, setForm] = useState<AiConfig>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [testState, setTestState] = useState<{ status: 'idle' | 'testing' | 'ok' | 'err'; msg: string }>({ status: 'idle', msg: '' })

  useEffect(() => {
    supabase
      .from('ai_config')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm({ ...DEFAULTS, ...data, temperature: Number(data.temperature), max_tokens: Number(data.max_tokens) })
        setLoading(false)
      })
  }, [])

  const update = <K extends keyof AiConfig>(key: K, value: AiConfig[K]) => {
    setForm(f => ({ ...f, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    const { error: err } = await supabase.from('ai_config').upsert({
      id: 1,
      provider: form.provider,
      base_url: form.base_url.trim() || DEFAULTS.base_url,
      api_key: form.api_key.trim(),
      model: form.model.trim() || DEFAULTS.model,
      temperature: Number(form.temperature),
      max_tokens: Number(form.max_tokens),
      prompt_blog: form.prompt_blog,
      prompt_ads: form.prompt_ads,
      prompt_pfi: form.prompt_pfi,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleTest = async () => {
    setTestState({ status: 'testing', msg: '' })
    try {
      const base = (form.base_url.trim() || DEFAULTS.base_url).replace(/\/+$/, '')
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${form.api_key.trim()}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AFR OI CFA',
        },
        body: JSON.stringify({
          model: form.model.trim() || DEFAULTS.model,
          messages: [{ role: 'user', content: 'Réponds simplement: OK' }],
          max_tokens: 5,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setTestState({ status: 'err', msg: data?.error?.message ?? `Erreur ${res.status}` })
        return
      }
      const txt = data?.choices?.[0]?.message?.content ?? ''
      setTestState({ status: 'ok', msg: `Connexion réussie — modèle "${form.model}" a répondu : ${String(txt).slice(0, 40)}` })
    } catch (e) {
      setTestState({ status: 'err', msg: e instanceof Error ? e.message : 'Erreur de connexion' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-brand-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Paramètres IA</h1>
          <p className="text-neutral-500 text-sm">Configuration du modèle (OpenRouter) et des prompts de génération</p>
        </div>
      </div>

      {/* Model configuration */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <h2 className="font-bold text-neutral-900 text-sm">Modèle & connexion</h2>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide bg-brand-50 text-brand-700 px-2 py-0.5 rounded">OpenRouter</span>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-500 mb-1.5">Clé API OpenRouter</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showKey ? 'text' : 'password'}
                value={form.api_key}
                onChange={e => update('api_key', e.target.value)}
                className={inputCls + ' pl-9 pr-10 font-mono'}
                placeholder="sk-or-v1-…"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" onClick={() => setShowKey(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleTest}
              disabled={testState.status === 'testing' || !form.api_key.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 border border-neutral-200 text-neutral-700 text-sm font-medium rounded-xl hover:bg-neutral-50 disabled:opacity-40 transition-colors shrink-0"
            >
              {testState.status === 'testing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Tester
            </button>
          </div>
          <p className="text-xs text-neutral-400 mt-1.5">
            Obtenez une clé sur <span className="font-medium text-neutral-500">openrouter.ai/keys</span>. Stockée de façon privée (non accessible au public).
          </p>
          {testState.status === 'ok' && (
            <div className="mt-2 flex items-start gap-2 text-emerald-700 text-xs bg-emerald-50 rounded-lg px-3 py-2">
              <Check className="w-4 h-4 shrink-0 mt-px" />{testState.msg}
            </div>
          )}
          {testState.status === 'err' && (
            <div className="mt-2 flex items-start gap-2 text-red-600 text-xs bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" />{testState.msg}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Modèle</label>
            <input
              list="model-suggestions"
              value={form.model}
              onChange={e => update('model', e.target.value)}
              className={inputCls + ' font-mono'}
              placeholder="anthropic/claude-3.5-sonnet"
              spellCheck={false}
            />
            <datalist id="model-suggestions">
              {MODEL_SUGGESTIONS.map(m => <option key={m} value={m} />)}
            </datalist>
            <p className="text-xs text-neutral-400 mt-1.5">Identifiant de modèle OpenRouter (provider/modèle).</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Température</label>
            <input
              type="number" step="0.1" min="0" max="2"
              value={form.temperature}
              onChange={e => update('temperature', parseFloat(e.target.value))}
              className={inputCls}
            />
            <p className="text-xs text-neutral-400 mt-1.5">0 = factuel · 1 = créatif</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">Tokens max</label>
            <input
              type="number" step="100" min="100" max="8000"
              value={form.max_tokens}
              onChange={e => update('max_tokens', parseInt(e.target.value))}
              className={inputCls}
            />
            <p className="text-xs text-neutral-400 mt-1.5">Longueur max de la réponse</p>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5">URL de base (API)</label>
            <input
              value={form.base_url}
              onChange={e => update('base_url', e.target.value)}
              className={inputCls + ' font-mono'}
              placeholder="https://openrouter.ai/api/v1"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Prompts */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-500" />
          <h2 className="font-bold text-neutral-900 text-sm">Prompts de génération</h2>
        </div>
        <p className="text-xs text-neutral-500 -mt-3">
          Les variables <code className="text-brand-700 bg-brand-50 px-1 rounded">{'{{exemple}}'}</code> sont remplacées automatiquement par les données réelles au moment de la génération.
        </p>

        {PROMPTS.map(p => (
          <div key={p.key}>
            <div className="flex items-center gap-2 mb-1.5">
              <p.icon className="w-4 h-4 text-neutral-400" />
              <label className="text-sm font-semibold text-neutral-800">{p.label}</label>
            </div>
            <p className="text-xs text-neutral-400 mb-2">{p.desc}</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {p.vars.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update(p.key, form[p.key] + `{{${v}}}`)}
                  title="Insérer la variable"
                  className="text-[11px] font-mono bg-neutral-100 hover:bg-brand-50 hover:text-brand-700 text-neutral-500 px-1.5 py-0.5 rounded transition-colors"
                >
                  {`{{${v}}}`}
                </button>
              ))}
            </div>
            <textarea
              value={form[p.key]}
              onChange={e => update(p.key, e.target.value)}
              rows={10}
              className={inputCls + ' font-mono text-xs leading-relaxed resize-y'}
              spellCheck={false}
            />
          </div>
        ))}
      </div>

      {/* Save bar */}
      <div className="flex items-center gap-3 sticky bottom-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/20 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium bg-white px-3 py-2 rounded-xl border border-emerald-100">
            <Check className="w-4 h-4" /> Paramètres enregistrés
          </span>
        )}
        {error && (
          <span className="flex items-center gap-1.5 text-red-600 text-sm font-medium bg-white px-3 py-2 rounded-xl border border-red-100">
            <AlertCircle className="w-4 h-4" /> {error}
          </span>
        )}
      </div>
    </div>
  )
}
