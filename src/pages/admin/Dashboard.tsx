import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Users, FileText, GraduationCap, FileBarChart, TrendingUp, Clock } from 'lucide-react'
import { formatDate } from '../../lib/utils'

type Stats = { leads: number; blog: number; formations: number; reports: number }
type RecentLead = { id: string; nom: string; email: string; status: string; created_at: string }

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ leads: 0, blog: 0, formations: 0, reports: 0 })
  const [recentLeads, setRecentLeads] = useState<RecentLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
      supabase.from('formations').select('*', { count: 'exact', head: true }),
      supabase.from('pfi_reports').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('id, nom, email, status, created_at').order('created_at', { ascending: false }).limit(5),
    ]).then(([l, b, f, r, rl]) => {
      setStats({ leads: l.count ?? 0, blog: b.count ?? 0, formations: f.count ?? 0, reports: r.count ?? 0 })
      setRecentLeads(rl.data ?? [])
      setLoading(false)
    })
  }, [])

  const statCards = [
    { label: 'Prospects', value: stats.leads, icon: Users, href: '/admin/leads', color: 'text-blue-500 bg-blue-50' },
    { label: 'Articles blog', value: stats.blog, icon: FileText, href: '/admin/blog', color: 'text-violet-500 bg-violet-50' },
    { label: 'Formations', value: stats.formations, icon: GraduationCap, href: '/admin/formations', color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Rapports PFI', value: stats.reports, icon: FileBarChart, href: '/admin/reports', color: 'text-brand-500 bg-brand-50' },
  ]

  const STATUS_COLORS: Record<string, string> = {
    nouveau: 'bg-blue-100 text-blue-700',
    qualifié: 'bg-emerald-100 text-emerald-700',
    converti: 'bg-brand-100 text-brand-700',
    perdu: 'bg-neutral-100 text-neutral-600',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Tableau de bord</h1>
        <p className="text-neutral-500 text-sm">Vue d'ensemble de votre activité</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Link key={card.label} to={card.href} className="bg-white rounded-2xl border border-neutral-100 p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4" />
              </div>
              <TrendingUp className="w-4 h-4 text-neutral-200 group-hover:text-neutral-300 transition-colors" />
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              {loading ? <div className="h-7 bg-neutral-100 rounded animate-pulse w-12" /> : card.value}
            </div>
            <div className="text-sm text-neutral-500 mt-0.5">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/reports" className="bg-brand-600 hover:bg-brand-500 rounded-2xl p-5 transition-colors group">
          <FileBarChart className="w-8 h-8 text-white mb-3" />
          <div className="text-white font-bold mb-1">Générer un PFI</div>
          <div className="text-brand-100 text-sm">Rapport de formation IA</div>
        </Link>
        <Link to="/admin/ads" className="bg-dark-700 hover:bg-dark-600 rounded-2xl p-5 transition-colors border border-white/5">
          <TrendingUp className="w-8 h-8 text-brand-400 mb-3" />
          <div className="text-white font-bold mb-1">Créer une publicité</div>
          <div className="text-neutral-500 text-sm">Générateur texte + image IA</div>
        </Link>
        <Link to="/admin/blog" className="bg-white rounded-2xl border border-neutral-100 hover:shadow-md p-5 transition-all">
          <FileText className="w-8 h-8 text-violet-500 mb-3" />
          <div className="text-neutral-900 font-bold mb-1">Nouvel article blog</div>
          <div className="text-neutral-500 text-sm">Rédaction assistée par IA</div>
        </Link>
      </div>

      {/* Recent leads */}
      <div className="bg-white rounded-2xl border border-neutral-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-50">
          <h2 className="font-bold text-neutral-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-400" /> Derniers prospects
          </h2>
          <Link to="/admin/leads" className="text-brand-600 text-xs font-semibold hover:underline">Voir tous</Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-neutral-50 rounded-lg animate-pulse" />)}
          </div>
        ) : recentLeads.length === 0 ? (
          <div className="p-8 text-center text-neutral-400 text-sm">Aucun prospect pour l'instant.</div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {recentLeads.map(lead => (
              <div key={lead.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50 transition-colors">
                <div>
                  <div className="font-medium text-neutral-900 text-sm">{lead.nom}</div>
                  <div className="text-neutral-400 text-xs">{lead.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] ?? STATUS_COLORS.nouveau}`}>
                    {lead.status}
                  </span>
                  <span className="text-neutral-400 text-xs">{formatDate(lead.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
