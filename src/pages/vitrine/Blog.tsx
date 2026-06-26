import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, type BlogPost } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'
import { ArrowRight } from 'lucide-react'

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('is_published', true).order('published_at', { ascending: false })
      .then(({ data }) => { setPosts(data ?? []); setLoading(false) })
  }, [])

  const [featured, ...rest] = posts

  return (
    <div className="bg-white">
      <section className="bg-dark-800 pt-24 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-brand-500 text-xs font-semibold tracking-widest uppercase mb-3">— Blog</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ressources & Conseils</h1>
          <p className="text-neutral-400 max-w-xl">Formation professionnelle, financement, IA et numérique — les actualités qui vous concernent à La Réunion.</p>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-neutral-100 overflow-hidden animate-pulse">
                  <div className="h-52 bg-neutral-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-neutral-100 rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-neutral-400">Aucun article publié pour l'instant.</div>
          ) : (
            <>
              {/* Featured */}
              {featured && (
                <Link
                  to={`/blog/${featured.slug}`}
                  className="group mb-8 grid grid-cols-1 lg:grid-cols-2 gap-0 bg-dark-700 rounded-2xl overflow-hidden hover:shadow-2xl transition-shadow"
                >
                  <div className="h-64 lg:h-auto bg-neutral-900 relative overflow-hidden">
                    {featured.cover_image ? (
                      <img src={featured.cover_image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-dark-600 to-brand-950 flex items-center justify-center">
                        <span className="text-6xl font-black text-white/5">{featured.title[0]}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-dark-700/50 hidden lg:block" />
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {featured.tags?.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-brand-600/10 text-brand-400 text-xs rounded-full">{tag}</span>
                      ))}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-brand-300 transition-colors">{featured.title}</h2>
                    {featured.excerpt && <p className="text-neutral-400 text-sm leading-relaxed mb-4 line-clamp-3">{featured.excerpt}</p>}
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-neutral-600 text-xs">{featured.published_at ? formatDate(featured.published_at) : ''}</span>
                      <span className="text-brand-400 text-sm font-medium flex items-center gap-1">Lire <ArrowRight className="w-4 h-4" /></span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Rest */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map(post => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="group bg-white rounded-2xl border border-neutral-100 hover:border-brand-200 hover:shadow-xl overflow-hidden transition-all"
                    >
                      <div className="h-44 bg-neutral-100 relative overflow-hidden">
                        {post.cover_image ? (
                          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-dark-700 to-dark-500" />
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-brand-50 text-brand-600 text-xs rounded">{tag}</span>
                          ))}
                        </div>
                        <h2 className="font-bold text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors line-clamp-2">{post.title}</h2>
                        {post.excerpt && <p className="text-neutral-500 text-sm line-clamp-2 mb-3">{post.excerpt}</p>}
                        <div className="flex items-center justify-between text-xs text-neutral-400">
                          <span>{post.published_at ? formatDate(post.published_at) : ''}</span>
                          <span className="text-brand-600 font-medium flex items-center gap-1">Lire <ArrowRight className="w-3 h-3" /></span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
