"use client"

import copy from "copy-to-clipboard"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar, Check, Clock, Copy, Tag, Paperclip } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  FacebookIcon, FacebookShareButton, LinkedinIcon, LinkedinShareButton, TelegramIcon, TelegramShareButton, TwitterIcon, TwitterShareButton, WhatsappIcon,
  WhatsappShareButton,
} from "react-share"

import { useBlogAdmin as useBlog } from "@/contexts/BlogAdminContext"
import BlogContent from "../BlogContent"

// --- REDESIGNED UI COMPONENTS ---

const ThemedLoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <svg className="animate-spin h-10 w-10 text-[#009f5a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
);

const NotFoundState = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center text-gray-900 p-4">
    <div className="text-center">
      <Paperclip className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Статья не найдена</h1>
      <p className="text-gray-600 mb-6">Возможно, она была удалена или ссылка неверна.</p>
      <Link href="/blog" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00ff90] text-gray-900 font-bold rounded-lg hover:bg-[#00e682] transition-colors shadow-lg shadow-[#00ff90]/30">
        <ArrowLeft className="w-4 h-4" />
        Вернуться ко всем статьям
      </Link>
    </div>
  </div>
);

export default function BlogPostPage() {
  // --- Business logic remains unchanged ---
  const params = useParams()
  const slug = params.id as string 

  const { posts, categories, loading, loadAll } = useBlog();

  const [currentUrl, setCurrentUrl] = useState("")
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!posts.length && !loading) {
      loadAll();
    }
    console.log(posts)
  }, [loadAll, posts.length, loading]);

  const post = useMemo(() => {
    console.log(slug)
    if (!slug || !posts.length) return null;
    return posts.find(p => p.slug === slug) || posts.find(p => p.id === slug);
  }, [slug, posts]);

  const category = useMemo(() => {
    if (!post || !categories.length) return null;
    return categories.find(c => c.id === post.categoryId);
  }, [post, categories]);

  const relatedPosts = useMemo(() => {
    if (!post || !posts.length) return [];
    return posts
      .filter(p => p.categoryId === post.categoryId && p.id !== post.id && p.status === 'published')
      .slice(0, 3);
  }, [post, posts]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href)
    }
  }, []);

  const handleCopy = () => {
    copy(currentUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }
  // --- End of business logic ---

  if (loading && !post) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ThemedLoadingSpinner />
      </div>
    );
  }

  if (!loading && !post) {
    return <NotFoundState />;
  }
  
  if (!category) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ThemedLoadingSpinner />
      </div>
    );
  }

  return (
    // --- REDESIGN: Light theme with decorative blurs ---
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-gray-900 font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#45969b]/10 rounded-full filter blur-3xl opacity-70 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00ff90]/10 rounded-full filter blur-3xl opacity-70 animate-pulse animation-delay-4000"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div className="mb-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <Link href="/blog" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-300 font-semibold">
                <ArrowLeft className="w-4 h-4" />
                Назад к блогу
              </Link>
            </motion.div>
            <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00ff90]/20 text-[#009f5a] rounded-full mb-6 font-bold text-sm">
                <Tag className="w-4 h-4" />
                <span>{category.name}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{post?.title}</h1>
              <div className="flex items-center justify-center gap-6 text-gray-500 flex-wrap">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{new Date(post?.publishedAt || "20.06.2000").toLocaleDateString("ru-RU")}</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>{post?.readTime} мин чтения</span></div>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Featured Image */}
        <section className="pb-8">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
                <Image src={post?.image || "/placeholder.svg"} alt={post?.title || "not found"} fill className="object-cover" priority />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            {/* <div className="grid grid-cols-1 lg:grid-cols-12 gap-12"> */}
              <motion.main className="lg:col-span-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
                <BlogContent content={post?.content as any[]} />
                
                {/* <div className="mt-12 pt-8 border-t border-slate-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Теги:</h3>
                  <div className="flex flex-wrap gap-2">
                    {post?.tags.map((tag) => (<span key={tag} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200">#{tag}</span>))}
                  </div>
                </div> */}
                
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-gray-900 flex-shrink-0">Поделиться статьей:</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <FacebookShareButton url={currentUrl} title={post?.title}><FacebookIcon size={36} round /></FacebookShareButton>
                      <TwitterShareButton url={currentUrl} title={post?.title}><TwitterIcon size={36} round /></TwitterShareButton>
                      <LinkedinShareButton url={currentUrl} title={post?.title}><LinkedinIcon size={36} round /></LinkedinShareButton>
                      <TelegramShareButton url={currentUrl} title={post?.title}><TelegramIcon size={36} round /></TelegramShareButton>
                      <WhatsappShareButton url={currentUrl} title={post?.title} separator=":: "><WhatsappIcon size={36} round /></WhatsappShareButton>
                      <button onClick={handleCopy} className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors duration-300 border border-slate-200" title="Скопировать ссылку">
                        {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.main>
              
              {/* <motion.aside className="lg:col-span-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
                {relatedPosts.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-lg p-6 sticky top-24">
                    <h4 className="font-bold text-gray-900 mb-4 text-xl">Похожие статьи</h4>
                    <div className="space-y-4">
                      {relatedPosts.map((relatedPost) => (
                        <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`} className="block group">
                          <div className="flex gap-4 items-center">
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                              <Image src={relatedPost.image || "/placeholder.svg"} alt={relatedPost.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                            <div className="flex-1">
                              <h5 className="text-sm font-semibold text-gray-800 group-hover:text-[#009f5a] transition-colors duration-300 line-clamp-3">{relatedPost.title}</h5>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </motion.aside> */}
            {/* </div> */}
          </div>
        </section>
      </div>
    </div>
  )
}