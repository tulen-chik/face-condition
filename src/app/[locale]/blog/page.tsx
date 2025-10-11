"use client"

import { motion } from "framer-motion"
import { ArrowRight, Calendar, Clock, Search, Star, BookOpen, Paperclip } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { useBlogAdmin as useBlog } from "@/contexts/BlogAdminContext"
import type { BlogCategory } from "@/types/database"

// A custom loading spinner that matches the new theme
const ThemedLoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <svg className="animate-spin h-10 w-10 text-[#009f5a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
);


export default function BlogPage() {
  // --- Business logic remains unchanged ---
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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };
  // --- End of business logic ---

  if (loading && posts.length === 0) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
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
        {/* Header Section */}
        <section className="py-16 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                <motion.div 
                    className="inline-flex items-center justify-center w-16 h-16 bg-white border border-slate-200 rounded-full mb-6 shadow-md"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <Paperclip className="w-8 h-8 text-[#009f5a]" />
                </motion.div>
                <motion.h1 
                    className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    Наш Блог
                </motion.h1>
                <motion.p 
                    className="text-lg text-gray-600 max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    Полезные статьи о здоровье, питании и благополучии, подкрепленные научными данными и советами экспертов.
                </motion.p>
            </div>
        </section>

        {/* Search and Filters */}
        <section className="pb-12 sticky top-[65px] z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <motion.div 
              className="bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-lg p-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" placeholder="Поиск статей..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00ff90] transition text-sm" />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {allCategories.map((category) => (
                    <button key={category.id} onClick={() => { setSelectedCategory(category.id); setCurrentPage(1); setSearchQuery(""); }} 
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${selectedCategory === category.id ? "bg-[#00ff90] text-gray-900 shadow-md shadow-[#00ff90]/30" : "bg-white text-gray-700 hover:bg-slate-100 border border-slate-200"}`}>
                      {category.name}
                      <span className="ml-2 text-xs opacity-75">({category.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          {/* Featured Posts */}
          {selectedCategory === "all" && !searchQuery && featuredPosts.length > 0 && (
            <section className="mb-16">
              <motion.div className="flex items-center gap-3 mb-8" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={itemVariants}>
                <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm"><Star className="w-6 h-6 text-[#009f5a]" /></div>
                <h2 className="text-3xl font-bold text-gray-900">Рекомендуемые статьи</h2>
              </motion.div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {featuredPosts.slice(0, 3).map((post, index) => {
                  const category = getCategoryById(post.categoryId);
                  return (
                    <motion.article key={post.id} className="group" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={itemVariants} transition={{ delay: index * 0.1 }}>
                      <Link href={`/blog/${post.slug}`} className="block bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                        <div className="relative h-52 overflow-hidden">
                          <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full border border-slate-200"><Star className="w-4 h-4 text-[#009f5a]" /></div>
                        </div>
                        <div className="p-6 flex-grow flex flex-col">
                          {category && <p className="text-sm font-bold text-[#009f5a] mb-2">{category.name}</p>}
                          <h3 className="text-xl font-bold text-gray-900 mb-3 flex-grow">{post.title}</h3>
                          <p className="text-gray-600 mb-4 leading-relaxed line-clamp-3">{post.excerpt}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500 mt-auto pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>{new Date(post.publishedAt).toLocaleDateString("ru-RU")}</span></div>
                            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{post.readTime} мин</span></div>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  )
                })}
              </div>
            </section>
          )}

          {/* Blog Posts Grid */}
          <section>
            <motion.div className="flex items-center justify-between mb-8" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={itemVariants}>
              <h2 className="text-3xl font-bold text-gray-900">{searchQuery ? `Результаты поиска` : selectedCategory === "all" ? "Все статьи" : getCategoryById(selectedCategory)?.name}</h2>
              <div className="text-gray-500 text-sm font-medium">Найдено: {filteredPosts.length}</div>
            </motion.div>
            {currentPosts.length > 0 ? (
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants} initial="hidden" animate="visible">
                {currentPosts.map((post) => {
                  const category = getCategoryById(post.categoryId);
                  return (
                    <motion.article key={post.id} className="group" variants={itemVariants}>
                      <Link href={`/blog/${post.slug}`} className="block bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                        <div className="relative h-48 overflow-hidden">
                          <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-6 flex-grow flex flex-col">
                          {category && <p className="text-sm font-bold text-[#009f5a] mb-2">{category.name}</p>}
                          <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 flex-grow">{post.title}</h3>
                          <p className="text-gray-600 mb-4 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>{new Date(post.publishedAt).toLocaleDateString("ru-RU")}</span></div>
                            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{post.readTime} мин</span></div>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div className="text-center py-16 bg-white border border-slate-200 rounded-2xl" variants={itemVariants}>
                <p className="text-gray-500">Статьи не найдены. Попробуйте изменить запрос или выбрать другую категорию.</p>
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div className="flex justify-center items-center gap-2 mt-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
                <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-gray-700">Назад</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-10 h-10 rounded-lg transition font-semibold ${currentPage === page ? "bg-[#00ff90] text-gray-900 shadow-md shadow-[#00ff90]/30" : "bg-white border border-slate-300 hover:bg-slate-100 text-gray-700"}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition text-gray-700">Вперед</button>
              </motion.div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}