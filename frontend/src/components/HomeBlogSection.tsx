import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, X, Tag, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { BlogPost, getBlogs } from '../data/blogs';
import { useLanguage } from '../context/LanguageContext';
import ShareArticleButton from './ShareArticleButton';

const formatCardDate = (dateStr: string, isLao: boolean): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    if (isLao) {
      const laoMonths = ['ມ.ກ.', 'ກ.ພ.', 'ມີ.ນາ', 'ເມ.ສາ', 'ພ.ພ.', 'ມິ.ຖ.', 'ກ.ລ.', 'ສ.ຫ.', 'ກ.ຍ.', 'ຕ.ລ.', 'ພ.ຈ.', 'ທ.ວ.'];
      const laoDays = ['ອາທິດ', 'ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ'];
      const dayName = laoDays[d.getDay()];
      const day = String(d.getDate()).padStart(2, '0');
      const month = laoMonths[d.getMonth()];
      const year = d.getFullYear();
      return `${dayName}, ${day} ${month} ${year}`;
    }
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

export default function HomeBlogSection() {
  const { lang } = useLanguage();
  const isLao = lang !== 'en';

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [readingBlog, setReadingBlog] = useState<BlogPost | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [morePage, setMorePage] = useState(0);
  const MORE_PAGE_SIZE = 3;

  const loadBlogs = () => {
    const all = getBlogs();
    setBlogs(all.filter(b => b.isPublished));
  };

  useEffect(() => {
    loadBlogs();

    const handleUpdate = () => {
      loadBlogs();
    };

    const checkHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#blog-')) {
        const id = hash.replace('#blog-', '');
        const all = getBlogs();
        const target = all.find(b => b.id === id || b.slug === id);
        if (target) {
          setReadingBlog(target);
        }
      }
    };

    checkHash();

    window.addEventListener('pasopkan_blogs_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('hashchange', checkHash);
    return () => {
      window.removeEventListener('pasopkan_blogs_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

  const handleOpenBlog = (blog: BlogPost) => {
    setReadingBlog(blog);
  };

  const handleCloseBlog = () => {
    setReadingBlog(null);
    if (window.location.hash && window.location.hash.startsWith('#blog-')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  };

  if (blogs.length === 0) {
    return null;
  }

  // Hero post: the most recently updated or added article is the big one
  const heroBlog = blogs[0];
  // Side posts: recent articles displayed from top to under (next up to 3)
  const sideBlogs = blogs.slice(1, 4);
  // Any extra blogs beyond the top 4
  const remainingBlogs = blogs.slice(4);
  const hasMore = remainingBlogs.length > 0;
  const totalMorePages = Math.max(1, Math.ceil(remainingBlogs.length / MORE_PAGE_SIZE));
  const safeMorePage = Math.min(morePage, totalMorePages - 1);
  const currentRemainingBlogs = remainingBlogs.length > MORE_PAGE_SIZE
    ? remainingBlogs.slice(safeMorePage * MORE_PAGE_SIZE, (safeMorePage + 1) * MORE_PAGE_SIZE)
    : remainingBlogs;

  const heroTitle = isLao && heroBlog.titleLao ? heroBlog.titleLao : heroBlog.title;

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-6 sm:pt-8 md:pt-10 pb-10 sm:pb-16 border-t border-gray-100">
      {/* Header */}
      <div className="mb-6 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-adv-orange text-xs font-bold mb-2.5">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{isLao ? 'ບົດຄວາມ ແລະ ຂ່າວສານ' : 'Event Stories & Blog'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-adv-slate tracking-tight">
          {isLao ? 'ບົດຄວາມ ແລະ ເລື່ອງລາວທີ່ໜ້າສົນໃຈ' : 'Stories, Guides & Event Insights'}
        </h2>
      </div>

      {/* 2-Column Editorial Magazine Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Left Column: Big Featured Hero Card */}
        <div className="lg:col-span-7 flex">
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => handleOpenBlog(heroBlog)}
            className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-900 group cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 min-h-[320px] sm:min-h-[420px] lg:min-h-[460px] flex flex-col justify-end"
          >
            {/* Background Cover Image */}
            <img
              src={heroBlog.coverImage}
              alt={heroTitle}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />

            {/* Gradient Overlay for high text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10 transition-opacity duration-300 group-hover:from-black" />

            {/* Card Content at bottom overlay */}
            <div className="relative z-10 p-6 sm:p-8 md:p-10 flex flex-col justify-end">
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-3xl font-black text-white leading-snug sm:leading-tight tracking-tight drop-shadow-md group-hover:text-orange-100 transition-colors flex items-start gap-2.5">
                <span className="line-clamp-2">{heroTitle}</span>
              </h3>

              <div className="text-xs sm:text-sm text-gray-300 font-medium mt-3 flex items-center gap-2">
                <span>{formatCardDate(heroBlog.publishedAt, isLao)}</span>
              </div>
            </div>
          </motion.article>
        </div>

        {/* Right Column: Stack of Horizontal Article Cards */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 sm:space-y-6 lg:space-y-0">
          {sideBlogs.map((blog, idx) => {
            const displayTitle = isLao && blog.titleLao ? blog.titleLao : blog.title;

            return (
              <motion.article
                key={blog.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (idx + 1) * 0.1 }}
                onClick={() => handleOpenBlog(blog)}
                className="group cursor-pointer flex items-center gap-4 sm:gap-5 p-2 rounded-2xl hover:bg-gray-50/90 transition-all duration-200"
              >
                {/* Horizontal Thumbnail */}
                <div className="relative w-32 sm:w-44 lg:w-36 xl:w-44 aspect-[16/10] shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-100 shadow-2xs">
                  <img
                    src={blog.coverImage}
                    alt={displayTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                {/* Article Info */}
                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="text-sm sm:text-base font-black text-adv-slate group-hover:text-adv-orange transition-colors line-clamp-2 leading-snug tracking-tight">
                    {displayTitle}
                  </h4>
                  <div className="text-xs text-gray-400 font-medium mt-1.5 sm:mt-2">
                    {formatCardDate(blog.publishedAt, isLao)}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* Expanded Articles Grid (when user clicks "See More") */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-8 sm:pt-10 border-t border-gray-100 mt-8 sm:mt-10">
              {/* Animated Page Transition for current page articles */}
              <motion.div
                key={safeMorePage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {currentRemainingBlogs.map((blog, idx) => {
                  const displayTitle = isLao && blog.titleLao ? blog.titleLao : blog.title;
                  const displayExcerpt = isLao && blog.excerptLao ? blog.excerptLao : blog.excerpt;

                  return (
                    <motion.article
                      key={blog.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      onClick={() => handleOpenBlog(blog)}
                      className="group cursor-pointer bg-white rounded-2xl sm:rounded-3xl border border-gray-100 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                        <img
                          src={blog.coverImage}
                          alt={displayTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-adv-orange" />
                            <span>{formatCardDate(blog.publishedAt, isLao)}</span>
                          </div>
                          <h4 className="text-base font-black text-adv-slate group-hover:text-adv-orange transition-colors line-clamp-2 leading-snug">
                            {displayTitle}
                          </h4>
                          {displayExcerpt && (
                            <p className="text-xs text-gray-500 font-normal mt-2 line-clamp-2 leading-relaxed">
                              {displayExcerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>

              {/* Next and Previous pagination if more than 3 articles in expanded list */}
              {remainingBlogs.length > MORE_PAGE_SIZE && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-100">
                  <div className="text-xs text-gray-500 font-bold">
                    {isLao 
                      ? `ໜ້າ ${safeMorePage + 1} ຈາກທັງໝົດ ${totalMorePages} (${remainingBlogs.length} ບົດຄວາມ)` 
                      : `Page ${safeMorePage + 1} of ${totalMorePages} (${remainingBlogs.length} articles)`}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      type="button"
                      onClick={() => setMorePage(prev => Math.max(0, prev - 1))}
                      disabled={safeMorePage === 0}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        safeMorePage === 0
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-100'
                          : 'bg-white border border-gray-200 text-adv-slate hover:bg-orange-50 hover:text-adv-orange hover:border-adv-orange active:scale-95 shadow-2xs cursor-pointer'
                      }`}
                      title={isLao ? 'ໜ້າກ່ອນໜ້າ' : 'Previous page'}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>{isLao ? 'ກ່ອນໜ້າ' : 'Previous'}</span>
                    </button>

                    {/* Page Numbers Indicator */}
                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalMorePages }).map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMorePage(idx)}
                          className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            safeMorePage === idx
                              ? 'bg-adv-orange text-white shadow-2xs'
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                      type="button"
                      onClick={() => setMorePage(prev => Math.min(totalMorePages - 1, prev + 1))}
                      disabled={safeMorePage >= totalMorePages - 1}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        safeMorePage >= totalMorePages - 1
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed border border-gray-100'
                          : 'bg-white border border-gray-200 text-adv-slate hover:bg-orange-50 hover:text-adv-orange hover:border-adv-orange active:scale-95 shadow-2xs cursor-pointer'
                      }`}
                      title={isLao ? 'ໜ້າຕໍ່ໄປ' : 'Next page'}
                    >
                      <span>{isLao ? 'ຕໍ່ໄປ' : 'Next'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "See More" Button (only rendered if there are more than 4 articles) */}
      {hasMore && (
        <div className="mt-8 sm:mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => {
              if (!isExpanded) {
                setMorePage(0);
              }
              setIsExpanded(!isExpanded);
            }}
            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-white border-2 border-gray-200 hover:border-adv-orange text-adv-slate hover:text-adv-orange text-xs sm:text-sm font-black uppercase tracking-wider transition-all shadow-xs hover:shadow-md active:scale-95 group cursor-pointer"
          >
            <span>
              {isExpanded
                ? (isLao ? 'ສະແດງໜ້ອຍລົງ' : 'Show Less')
                : (isLao ? `ເບິ່ງເພີ່ມເຕີມ (${remainingBlogs.length})` : `See More (${remainingBlogs.length})`)}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform text-adv-orange" />
            ) : (
              <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform text-adv-orange" />
            )}
          </button>
        </div>
      )}

      {/* Reader Modal */}
      <AnimatePresence>
        {readingBlog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-100 my-8 flex flex-col max-h-[90vh]"
            >
              {/* Top Modal Bar */}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-adv-orange text-xs font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{isLao ? 'ບົດຄວາມ' : 'Article'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ShareArticleButton blog={readingBlog} />
                  <button
                    type="button"
                    onClick={handleCloseBlog}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Reader Content */}
              <div className="overflow-y-auto p-6 sm:p-10 space-y-6">
                {/* Cover Image */}
                <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-gray-100">
                  <img
                    src={readingBlog.coverImage}
                    alt={isLao && readingBlog.titleLao ? readingBlog.titleLao : readingBlog.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-adv-slate tracking-tight leading-tight">
                  {isLao && readingBlog.titleLao ? readingBlog.titleLao : readingBlog.title}
                </h1>

                {/* Excerpt Lead */}
                <p className="text-base sm:text-lg font-medium text-gray-700 leading-relaxed italic bg-orange-50/50 p-4 rounded-2xl border-l-4 border-adv-orange">
                  "{isLao && readingBlog.excerptLao ? readingBlog.excerptLao : readingBlog.excerpt}"
                </p>

                {/* Main Content */}
                <div className="prose prose-orange max-w-none text-gray-700 space-y-4 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {isLao && readingBlog.contentLao ? readingBlog.contentLao : readingBlog.content}
                </div>

                {/* Tags if available */}
                {readingBlog.tags && readingBlog.tags.length > 0 && (
                  <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-400 font-bold flex items-center gap-1 mr-2">
                      <Tag className="w-3.5 h-3.5" />
                      {isLao ? 'ແທັກ:' : 'Tags:'}
                    </span>
                    {readingBlog.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleCloseBlog}
                  className="px-6 py-2.5 w-full sm:w-auto rounded-xl bg-adv-slate text-white text-xs font-black uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
                >
                  {isLao ? 'ປິດໜ້າຕ່າງ' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
