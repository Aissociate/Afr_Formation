import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, type BlogPost } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { ArrowLeft, Calendar, User } from 'lucide-react'

export default function BlogPostPage() {
  const { slug } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    supabase.from('blog_posts').select('*').eq('slug', slug).maybeSingle()
      .then(({ data }) => { setPost(data); setLoading(false) })
  }, [slug])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!post) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-16">
      <p className="text-neutral-500 mb-4">Article introuvable.</p>
      <Link to="/blog" className="text-brand-600 font-semibold">Retour au blog</Link>
    </div>
  )

  return (
    <div className="bg-white">
      {/* Hero */}
      <div className="bg-dark-800 pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link to="/blog" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Blog
          </Link>
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags?.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-brand-600/10 text-brand-400 text-xs rounded-full">{tag}</span>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{post.title}</h1>
          <div className="flex items-center gap-5 text-sm text-neutral-500">
            <span className="flex items-center gap-2"><User className="w-4 h-4" />{post.author}</span>
            {post.published_at && <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(post.published_at)}</span>}
          </div>
        </div>
      </div>

      {/* Cover image */}
      {post.cover_image && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6">
          <img src={post.cover_image} alt={post.title} className="w-full h-64 object-cover rounded-xl shadow-2xl" />
        </div>
      )}

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div
          className="prose prose-neutral max-w-none prose-headings:font-bold prose-headings:text-neutral-900 prose-a:text-brand-600 prose-strong:text-neutral-900"
          dangerouslySetInnerHTML={{ __html: post.content ?? '<p>Contenu bientôt disponible.</p>' }}
        />
      </div>

      {/* CTA */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-14">
        <div className="bg-dark-700 rounded-2xl p-8">
          <h3 className="text-white font-bold text-xl mb-2">Prêt à vous former ?</h3>
          <p className="text-neutral-400 text-sm mb-5">Obtenez votre Plan de Formation Individualisé gratuit et découvrez comment financer votre formation.</p>
          <Link to="/questionnaire" className="inline-flex items-center gap-2 px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors">
            Obtenir mon PFI gratuit
          </Link>
        </div>
      </div>
    </div>
  )
}
