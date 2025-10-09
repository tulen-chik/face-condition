"use client"

import { motion } from "framer-motion"
import { ArrowRight, Calendar, Clock, Search, Compass, Globe, Star, BookOpen } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useBlogAdmin as useBlog } from "@/contexts/BlogAdminContext"
import type { BlogCategory } from "@/types/database"

export default function BlogPage() {
  // --- ВСЯ ЛОГИКА ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ ---
  const { posts, categories, loading, loadAll } = useBlog();

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const postsPerPage = 6

  useEffect(() => {
    if (!posts.length && !loading) {
      loadAll();
    }
  }, []);

  const publishedPosts = useMemo(() => posts.filter((p) => p.status === "published"), [posts]);

  const allCategories = useMemo(() => [
    { id: "all", name: "Все статьи", count: publishedPosts.length },
    ...categories.map((cat) => ({
      ...cat,
      count: publishedPosts.filter((p) => p.categoryId === cat.id).length,
    })),
  ], [categories, publishedPosts]);

  const featuredPosts = useMemo(() => publishedPosts.filter(p => p.featured), [publishedPosts]);

  const filteredPosts = useMemo(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      return publishedPosts.filter(post =>
        post.title.toLowerCase().includes(lowercasedQuery) ||
        post.excerpt.toLowerCase().includes(lowercasedQuery) ||
        post.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery))
      );
    }
    if (selectedCategory !== "all") {
      return publishedPosts.filter(post => post.categoryId === selectedCategory);
    }
    return publishedPosts;
  }, [publishedPosts, searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage)
  const startIndex = (currentPage - 1) * postsPerPage
  const currentPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage)

  const getCategoryById = (categoryId: string): BlogCategory | undefined => {
    return categories.find(c => c.id === categoryId);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
  };
  // ----------------------------------------------------

  if (loading && posts.length === 0) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-black">
            <LoadingSpinner />
        </div>
    );
  }

  return (
    // --- ОБНОВЛЕННЫЙ ДИЗАЙН ---
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      {/* <section className="py-20 bg-black relative overflow-hidden border-b border-gray-800">
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-full mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-300 tracking-wide">Наш Блог</span>
          </motion.div>
          <motion.h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white" initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            Горизонты Впечатлений
          </motion.h1>
          <motion.p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
            Истории от хозяев и гостей, советы по бюджетным путешествиям и гиды по городам от местных жителей.
          </motion.p>
        </div>
      </section> */}

      {/* Search and Filters */}
      <section className="py-12 bg-black border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            <motion.div className="relative flex-1 w-full max-w-md" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input type="text" placeholder="Поиск статей..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-white transition-all duration-300 text-white" />
            </motion.div>
            <motion.div className="flex flex-wrap gap-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              {allCategories.map((category) => (
                <button key={category.id} onClick={() => { setSelectedCategory(category.id); setCurrentPage(1); setSearchQuery(""); }} 
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedCategory === category.id ? "bg-white text-black" : "bg-black text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-700"}`}>
                  {category.name}
                  <span className="ml-2 text-xs opacity-75">({category.count})</span>
                </button>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {selectedCategory === "all" && !searchQuery && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div className="flex items-center gap-3 mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="p-2 bg-gray-800 rounded-lg"><Star className="w-6 h-6 text-white" /></div>
              <h2 className="text-3xl font-bold text-white">Рекомендуемые статьи</h2>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredPosts.slice(0, 3).map((post, index) => {
                const category = getCategoryById(post.categoryId);
                return (
                  <motion.article key={post.id} className="group relative bg-black rounded-lg overflow-hidden border border-gray-800" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }} whileHover={{ y: -8 }}>
                    <div className="relative h-48 overflow-hidden">
                      <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-4 left-4"><span className="px-3 py-1 bg-white text-black text-xs font-bold rounded-full">{category?.name}</span></div>
                      <div className="absolute top-4 right-4"><div className="p-2 bg-black/70 backdrop-blur-sm rounded-full border border-gray-700"><Star className="w-4 h-4 text-white" /></div></div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3 transition-colors duration-300">{post.title}</h3>
                      <p className="text-gray-400 mb-4 leading-relaxed">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>{new Date(post.publishedAt).toLocaleDateString("ru-RU")}</span></div>
                          <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{post.readTime} мин</span></div>
                        </div>
                      </div>
                      <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-white hover:text-gray-300 font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                        Читать <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div className="flex items-center justify-between mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="text-3xl font-bold text-white">{searchQuery ? `Результаты поиска: "${searchQuery}"` : selectedCategory === "all" ? "Все статьи" : getCategoryById(selectedCategory)?.name}</h2>
            <div className="text-gray-400">Найдено: {filteredPosts.length}</div>
          </motion.div>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" animate="visible">
            {currentPosts.map((post) => {
              const category = getCategoryById(post.categoryId);
              return (
                <motion.article key={post.id} className="group bg-black rounded-lg overflow-hidden border border-gray-800" variants={itemVariants} whileHover={{ y: -5 }}>
                  <div className="relative h-48 overflow-hidden">
                    <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4"><span className="px-3 py-1 bg-white text-black text-xs font-bold rounded-full">{category?.name}</span></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-white mb-3 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-400 mb-4 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /><span>{new Date(post.publishedAt).toLocaleDateString("ru-RU")}</span></div>
                        <div className="flex items-center gap-1.5"><Clock className="w-3 h-3" /><span>{post.readTime} мин</span></div>
                      </div>
                    </div>
                    <Link href={`/blog/${post.slug}`} className="mt-4 inline-flex items-center gap-2 text-white hover:text-gray-300 font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                      Читать далее <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.article>
              )
            })}
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div className="flex justify-center items-center gap-2 mt-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-black border border-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-gray-400">Назад</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-10 h-10 rounded-lg transition-all duration-300 font-semibold ${currentPage === page ? "bg-white text-black" : "bg-black border border-gray-700 hover:bg-gray-800 text-gray-400"}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 bg-black border border-gray-700 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-gray-400">Вперед</button>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}