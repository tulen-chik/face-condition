"use client"

import copy from "copy-to-clipboard"
import { motion } from "framer-motion"
import { ArrowLeft, Calendar, Check, Clock, Copy, Tag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  FacebookIcon, FacebookShareButton, LinkedinIcon, LinkedinShareButton, TelegramIcon, TelegramShareButton, TwitterIcon, TwitterShareButton, WhatsappIcon,
  WhatsappShareButton,
} from "react-share"

import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useBlogAdmin as useBlog } from "@/contexts/BlogAdminContext"
import BlogContent from "../BlogContent"

// --- ОБНОВЛЕННЫЙ ДИЗАЙН КОМПОНЕНТА "НЕ НАЙДЕНО" ---
const NotFoundState = () => (
  <div className="min-h-screen bg-black flex items-center justify-center text-white">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-white mb-4">Статья не найдена</h1>
      <p className="text-gray-400 mb-6">Возможно, она была удалена или ссылка неверна.</p>
      <Link href="/blog" className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Вернуться ко всем статьям
      </Link>
    </div>
  </div>
);

export default function BlogPostPage() {
  // --- ВСЯ ЛОГИКА ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ ---
  const params = useParams()
  const slug = params.slug as string 

  const { posts, categories, loading, loadAll } = useBlog();

  const [currentUrl, setCurrentUrl] = useState("")
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!posts.length && !loading) {
      loadAll();
    }
  }, [loadAll, posts.length, loading]);

  const post = useMemo(() => {
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
  // ----------------------------------------------------

  if (loading && !post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!loading && !post) {
    return <NotFoundState />;
  }
  
  if (!category) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    // --- ОБНОВЛЕННЫЙ ДИЗАЙН СТРАНИЦЫ ---
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <section className="py-12 bg-black border-b border-gray-800">
        <div className="container mx-auto px-4">
          <motion.div className="flex items-center gap-4 mb-6" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <Link href="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300">
              <ArrowLeft className="w-4 h-4" />
              Назад к блогу
            </Link>
          </motion.div>
          <motion.div className="max-w-4xl mx-auto text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-full mb-6">
              <Tag className="w-4 h-4" />
              <span className="text-sm font-semibold">{category.name}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">{post?.title}</h1>
            <div className="flex items-center justify-center gap-6 text-gray-400 mb-8 flex-wrap">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{new Date(post?.publishedAt || "20.06.2000").toLocaleDateString("ru-RU")}</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>{post?.readTime} мин чтения</span></div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Image */}
      <section className="py-8 bg-black">
        <div className="container mx-auto px-4">
          <motion.div className="max-w-4xl mx-auto" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
            <div className="relative h-96 rounded-lg overflow-hidden border border-gray-800">
              <Image src={post?.image || "/placeholder.svg"} alt={post?.title || "not found"} fill className="object-cover" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
              <motion.div className="lg:col-span-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
                {/* Компонент BlogContent должен быть стилизован для темного фона */}
                <BlogContent content={post?.content as any[]} />
                
                <div className="mt-12 pt-8 border-t border-gray-800">
                  <h3 className="text-lg font-bold text-white mb-4">Теги:</h3>
                  <div className="flex flex-wrap gap-2">
                    {post?.tags.map((tag) => (<span key={tag} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">#{tag}</span>))}
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Поделиться статьей:</h3>
                    <div className="flex items-center gap-3">
                      <FacebookShareButton url={currentUrl} title={post?.title}><FacebookIcon size={32} round /></FacebookShareButton>
                      <TwitterShareButton url={currentUrl} title={post?.title}><TwitterIcon size={32} round /></TwitterShareButton>
                      <LinkedinShareButton url={currentUrl} title={post?.title}><LinkedinIcon size={32} round /></LinkedinShareButton>
                      <TelegramShareButton url={currentUrl} title={post?.title}><TelegramIcon size={32} round /></TelegramShareButton>
                      <WhatsappShareButton url={currentUrl} title={post?.title} separator=":: "><WhatsappIcon size={32} round /></WhatsappShareButton>
                      <button onClick={handleCopy} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition-colors duration-300" title="Скопировать ссылку">
                        {isCopied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <motion.aside className="lg:col-span-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
                {relatedPosts.length > 0 && (
                  <div className="bg-black rounded-lg p-6 border border-gray-800 sticky top-24">
                    <h4 className="font-bold text-white mb-4">Похожие статьи</h4>
                    <div className="space-y-4">
                      {relatedPosts.map((relatedPost) => (
                        <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`} className="block group">
                          <div className="flex gap-3">
                            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                              <Image src={relatedPost.image || "/placeholder.svg"} alt={relatedPost.title} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <div className="flex-1">
                              <h5 className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors duration-300 line-clamp-2 mb-1">{relatedPost.title}</h5>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </motion.aside>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}