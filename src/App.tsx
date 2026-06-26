import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

import PublicLayout from './components/layout/PublicLayout'
import AdminLayout from './components/layout/AdminLayout'

import Home from './pages/vitrine/Home'
import Formations from './pages/vitrine/Formations'
import FormationDetail from './pages/vitrine/FormationDetail'
import Blog from './pages/vitrine/Blog'
import BlogPostPage from './pages/vitrine/BlogPostPage'
import Contact from './pages/vitrine/Contact'
import Questionnaire from './pages/vitrine/Questionnaire'

import AdminDashboard from './pages/admin/Dashboard'
import AdminBlog from './pages/admin/BlogAdmin'
import AdminFormations from './pages/admin/FormationsAdmin'
import AdminLeads from './pages/admin/LeadsAdmin'
import AdminReports from './pages/admin/ReportsAdmin'
import AdminAds from './pages/admin/AdsAdmin'
import AdminSettings from './pages/admin/SettingsAdmin'
import AdminLogin from './pages/admin/Login'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!authed) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public vitrine */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/formations" element={<Formations />} />
          <Route path="/formations/:slug" element={<FormationDetail />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="blog" element={<AdminBlog />} />
          <Route path="formations" element={<AdminFormations />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="ads" element={<AdminAds />} />
          <Route path="parametres" element={<AdminSettings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
