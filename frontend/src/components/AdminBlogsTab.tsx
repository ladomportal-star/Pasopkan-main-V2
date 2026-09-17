import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Eye, 
  Check, 
  X, 
  Calendar, 
  Sparkles, 
  CheckCircle2,
  FileText,
  UploadCloud,
  Image as ImageIcon,
  Link as LinkIcon,
  List,
  Quote,
  Heading,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { BlogPost, getBlogs, addBlog, updateBlog, deleteBlog, toggleBlogPublish } from '../data/blogs';
import { useLanguage } from '../context/LanguageContext';
import { compressImage } from '../lib/imageCompression';

const PRESET_COVERS = [
  { label: 'Concert & Festival', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Creative Workshop', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Cultural Celebration', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Night Market & Food', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Outdoor & Adventure', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Conference & Stage', url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80' }
];

export default function AdminBlogsTab() {
  const { lang } = useLanguage();
  const isLao = lang !== 'en';

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogToDelete, setBlogToDelete] = useState<BlogPost | null>(null);
  const [previewBlog, setPreviewBlog] = useState<BlogPost | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: PRESET_COVERS[0].url,
    isPublished: true
  });

  // Editor State
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploadingContentImg, setIsUploadingContentImg] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);

  const loadBlogs = () => {
    setBlogs(getBlogs());
  };

  useEffect(() => {
    loadBlogs();
    const handleUpdate = () => loadBlogs();
    window.addEventListener('pasopkan_blogs_updated', handleUpdate);
    return () => window.removeEventListener('pasopkan_blogs_updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingBlogId(null);
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      coverImage: PRESET_COVERS[0].url,
      isPublished: true
    });
    setShowUrlInput(false);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (blog: BlogPost) => {
    setEditingBlogId(blog.id);
    setFormData({
      title: (isLao && blog.titleLao) ? blog.titleLao : blog.title,
      excerpt: (isLao && blog.excerptLao) ? blog.excerptLao : blog.excerpt,
      content: (isLao && blog.contentLao) ? blog.contentLao : blog.content,
      coverImage: blog.coverImage,
      isPublished: blog.isPublished ?? true
    });
    setShowUrlInput(false);
    setIsEditorOpen(true);
  };

  const handleCoverFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(isLao ? 'ກະລຸນາເລືອກໄຟລ໌ຮູບພາບ' : 'Please select a valid image file.');
      return;
    }
    setIsUploadingCover(true);
    try {
      const compressed = await compressImage(file, 1280, 1280, 0.8);
      if (compressed) {
        setFormData(prev => ({ ...prev, coverImage: compressed }));
        showToast(isLao ? 'ອັບໂຫຼດຮູບປົກສຳເລັດແລ້ວ' : 'Cover image uploaded successfully!');
      }
    } catch (err) {
      console.error('Failed to compress/upload cover image:', err);
      alert(isLao ? 'ເກີດຂໍ້ຜິດພາດໃນການປະມວນຜົນຮູບພາບ' : 'Failed to process image. Please try again.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleContentImageUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingContentImg(true);
    try {
      const compressed = await compressImage(file, 1080, 1080, 0.75);
      if (compressed) {
        const imageMarkdown = `\n\n![Article Photo](${compressed})\n\n`;
        setFormData(prev => ({
          ...prev,
          content: prev.content + imageMarkdown
        }));
        showToast(isLao ? 'ແຊກຮູບພາບລົງໃນບົດຄວາມແລ້ວ' : 'Image inserted into article body!');
      }
    } catch (err) {
      console.error('Failed to insert inline content image:', err);
    } finally {
      setIsUploadingContentImg(false);
    }
  };

  const insertFormatting = (prefix: string, suffix = '', placeholder = '') => {
    const addition = `${prefix}${placeholder}${suffix}`;
    setFormData(prev => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${addition}` : addition
    }));
  };

  const handleSaveBlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert(isLao ? 'ກະລຸນາປ້ອນຫົວຂໍ້ ແລະ ເນື້ອຫາບົດຄວາມ' : 'Please provide a title and article content.');
      return;
    }

    const payload: Partial<BlogPost> = {
      title: formData.title,
      titleLao: formData.title,
      slug: (formData.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `post-${Date.now()}`,
      excerpt: formData.excerpt || formData.content.slice(0, 160) + '...',
      excerptLao: formData.excerpt || formData.content.slice(0, 160) + '...',
      content: formData.content,
      contentLao: formData.content,
      coverImage: formData.coverImage,
      author: {
        name: 'Pasopkan Admin',
        role: 'Administrator'
      },
      isPublished: true,
      tags: editingBlogId ? (blogs.find(b => b.id === editingBlogId)?.tags || []) : []
    };

    if (editingBlogId) {
      updateBlog(editingBlogId, payload);
      showToast(isLao ? 'ອັບເດດບົດຄວາມສຳເລັດແລ້ວ' : 'Blog post updated successfully!');
    } else {
      addBlog(payload);
      showToast(isLao ? 'ສ້າງບົດຄວາມໃໝ່ສຳເລັດແລ້ວ' : 'New blog post published!');
    }

    setIsEditorOpen(false);
    loadBlogs();
  };

  const handleDeleteConfirm = () => {
    if (!blogToDelete) return;
    deleteBlog(blogToDelete.id);
    showToast(isLao ? 'ລຶບບົດຄວາມສຳເລັດແລ້ວ' : 'Blog post removed.');
    setBlogToDelete(null);
    loadBlogs();
  };

  const handleToggle = (id: string) => {
    const updated = toggleBlogPublish(id);
    if (updated) {
      showToast(updated.isPublished ? 'Blog published to Home Page' : 'Blog moved to Drafts');
      loadBlogs();
    }
  };

  const filteredBlogs = blogs
    .filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.titleLao && b.titleLao.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;
      if (statusFilter === 'published') return b.isPublished;
      if (statusFilter === 'draft') return !b.isPublished;
      return true;
    });

  const totalCount = blogs.length;
  const publishedCount = blogs.filter(b => b.isPublished).length;
  const draftCount = blogs.filter(b => !b.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <div className="fixed bottom-24 sm:bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug">{toastMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-adv-orange text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isLao ? 'ຈັດການບົດຄວາມເວັບໄຊ' : 'Home Blog Section Manager'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-adv-slate">
            {isLao ? 'ບົດຄວາມ ແລະ ຂ່າວສານໜ້າຫຼັກ' : 'Blog Articles & Stories'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {isLao
              ? 'ສ້າງ, ແກ້ໄຂ ແລະ ເຜີຍແຜ່ບົດຄວາມທີ່ຈະສະແດງໃນໜ້າຫຼັກ'
              : 'Create, edit, and publish blogs that appear on the home page.'}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-adv-orange text-white text-xs font-black uppercase tracking-wider hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isLao ? 'ສ້າງບົດຄວາມໃໝ່' : 'New Blog Post'}</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-adv-orange flex items-center justify-center font-black">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-adv-slate">{totalCount}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{isLao ? 'ບົດຄວາມທັງໝົດ' : 'Total Blogs'}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{publishedCount}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{isLao ? 'ເຜີຍແຜ່ແລ້ວ' : 'Live on Home'}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center font-black">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-600">{draftCount}</div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{isLao ? 'ສະບັບຮ່າງ' : 'Drafts'}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Cleaned: No Category / Views filter buttons) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isLao ? 'ຄົ້ນຫາບົດຄວາມ...' : 'Search blogs by title...'}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:border-adv-orange font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: 'all' as const, label: isLao ? 'ທັງໝົດ' : 'All' },
            { id: 'published' as const, label: isLao ? 'ສະແດງ' : 'Live' },
            { id: 'draft' as const, label: isLao ? 'ຮ່າງ' : 'Drafts' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                statusFilter === f.id
                  ? 'bg-adv-slate text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Blog List Table (Cleaned: No Category, Views, or Read Time columns) */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-400 uppercase text-[10px] font-black tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-2.5 px-6">{isLao ? 'ບົດຄວາມ' : 'Article'}</th>
                <th className="py-2.5 px-6">{isLao ? 'ວັນທີ' : 'Published Date'}</th>
                <th className="py-2.5 px-6 text-center">{isLao ? 'ສະຖານະ' : 'Status'}</th>
                <th className="py-2.5 px-6 text-right">{isLao ? 'ຈັດການ' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    <BookOpen className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-bold text-sm text-gray-500">
                      {isLao ? 'ບໍ່ພົບບົດຄວາມທີ່ກົງກັບເງື່ອນໄຂ' : 'No blog articles found.'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isLao ? 'ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ກົດ "ສ້າງບົດຄວາມໃໝ່"' : 'Try changing your search or click "New Blog Post" to add one.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBlogs.map(blog => (
                  <tr key={blog.id} className="even:bg-gray-50/30 hover:bg-orange-50/30 transition-colors group">
                    {/* Cover & Title */}
                    <td className="py-2.5 px-6">
                      <div className="flex items-center gap-3.5 min-w-[280px]">
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="w-16 h-12 rounded-xl object-cover border border-gray-200 shrink-0 bg-gray-100"
                        />
                        <div className="min-w-0">
                          <div className="font-black text-adv-slate text-sm line-clamp-1 hover:text-adv-orange cursor-pointer" onClick={() => setPreviewBlog(blog)}>
                            {blog.title}
                          </div>
                          {blog.titleLao && (
                            <div className="text-[11px] text-gray-400 line-clamp-1">
                              {blog.titleLao}
                            </div>
                          )}
                          <div className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">
                            {blog.excerpt}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 whitespace-nowrap text-gray-500">
                      <div>{blog.publishedAt}</div>
                    </td>

                    {/* Live Toggle */}
                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(blog.id)}
                        className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-1.5 ${
                          blog.isPublished
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                        }`}
                        title={blog.isPublished ? 'Click to set as Draft' : 'Click to Publish to Home'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${blog.isPublished ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        {blog.isPublished ? (isLao ? 'ເຜີຍແຜ່' : 'Live') : (isLao ? 'ສະບັບຮ່າງ' : 'Draft')}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewBlog(blog)}
                          className="p-2 rounded-xl text-gray-400 hover:text-adv-slate hover:bg-gray-100 transition-colors"
                          title="Preview Article"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(blog)}
                          className="p-2 rounded-xl text-gray-400 hover:text-adv-orange hover:bg-orange-50 transition-colors"
                          title="Edit Article"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setBlogToDelete(blog)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal (Upgraded: Upload Image Button, Live Preview, Language Tabs, Auto-Excerpt) */}
      <AnimatePresence>
        {isEditorOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-white rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col my-auto max-h-[92vh]"
            >
              {/* Modal Top Bar */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 text-adv-orange flex items-center justify-center font-bold shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-adv-slate">
                      {editingBlogId ? (isLao ? 'ແກ້ໄຂບົດຄວາມ' : 'Edit Blog Article') : (isLao ? 'ສ້າງບົດຄວາມໃໝ່' : 'Create New Article')}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {isLao ? 'ບົດຄວາມນີ້ຈະສະແດງໃນໜ້າຫຼັກຂອງເວັບໄຊ' : 'This article will be displayed on the website.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-adv-slate hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSaveBlog} className="overflow-y-auto p-6 space-y-5 flex-1">
                {/* 1. Cover Image Section with Upload Button & Dropzone */}
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-adv-slate flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-adv-orange" />
                      <span>{isLao ? 'ຮູບໜ້າປົກບົດຄວາມ (Cover Image)' : 'Article Cover Image'} *</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] font-bold text-gray-500 hover:text-adv-orange px-2 py-0.5 rounded-lg hover:bg-gray-200/60 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>{showUrlInput ? (isLao ? 'ເຊື່ອງ URL' : 'Hide URL input') : (isLao ? 'ໃສ່ URL ໂດຍກົງ' : 'Paste Image URL')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Image Thumbnail & Drop Zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingCover(true); }}
                      onDragLeave={() => setIsDraggingCover(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingCover(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleCoverFileUpload(file);
                      }}
                      className={`sm:col-span-5 relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        isDraggingCover
                          ? 'border-adv-orange bg-orange-50 ring-4 ring-orange-100'
                          : 'border-gray-200 bg-gray-100'
                      }`}
                    >
                      <img
                        src={formData.coverImage}
                        alt="Article Cover"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PRESET_COVERS[0].url;
                        }}
                      />

                      {isUploadingCover && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs font-bold gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-adv-orange" />
                          <span>{isLao ? 'ກຳລັງອັບໂຫຼດຮູບ...' : 'Compressing & uploading...'}</span>
                        </div>
                      )}

                      {!isUploadingCover && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-white text-adv-slate text-[11px] font-bold shadow-md hover:bg-orange-50 hover:text-adv-orange transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5 text-adv-orange" />
                            <span>{isLao ? 'ປ່ຽນຮູບ' : 'Change Image'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Upload Controls & Actions */}
                    <div className="sm:col-span-7 flex flex-col gap-2">
                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCoverFileUpload(file);
                          e.target.value = '';
                        }}
                      />

                      {/* Primary Upload Button */}
                      <button
                        type="button"
                        disabled={isUploadingCover}
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2.5 px-4 rounded-xl bg-adv-orange hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isUploadingCover ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{isLao ? 'ກຳລັງປະມວນຜົນຮູບ...' : 'Uploading & Compressing...'}</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" />
                            <span>{isLao ? 'ອັບໂຫຼດຮູບພາບຈາກເຄື່ອງ' : 'Upload Cover Image'}</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                        <span>{isLao ? 'ຮອງຮັບ JPG, PNG, WEBP ຫຼື ລາກໄຟລ໌ມາໃສ່' : 'Supports JPG, PNG, WEBP (Auto-optimized)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* URL Input (if toggled) */}
                  {showUrlInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2 border-t border-gray-200/80"
                    >
                      <input
                        type="url"
                        value={formData.coverImage}
                        onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-adv-slate font-mono focus:border-adv-orange focus:outline-none"
                      />
                    </motion.div>
                  )}
                </div>

                {/* 2. Article Title */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
                    {isLao ? 'ຫົວຂໍ້ບົດຄວາມ' : 'Article Title'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder={isLao ? 'ປ້ອນຫົວຂໍ້ບົດຄວາມ...' : 'e.g. Vang Vieng Music Fest 2026: Survival & Packing Guide'}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 font-bold text-sm text-adv-slate focus:bg-white focus:outline-none focus:border-adv-orange shadow-2xs"
                  />
                </div>

                {/* 3. Short Summary / Excerpt */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-500 mb-1">
                    {isLao ? 'ບົດສະຫຼຸບຫຍໍ້' : 'Short Summary / Excerpt'}
                  </label>
                  <textarea
                    rows={2}
                    value={formData.excerpt}
                    onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder={isLao ? 'ບົດສະຫຼຸບສັ້ນໆ 1-2 ປະໂຫຍກສະແດງໃນກາດ...' : 'Brief 1-2 sentence preview shown on cards...'}
                    className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-adv-slate focus:bg-white focus:outline-none focus:border-adv-orange shadow-2xs"
                  />
                </div>

                {/* 4. Article Body Content with Toolbar & Photo Upload */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-gray-500">
                      {isLao ? 'ເນື້ອໃນບົດຄວາມ' : 'Article Body Content'} <span className="text-red-500">*</span>
                    </label>

                    {/* Hidden inline content image file input */}
                    <input
                      ref={contentFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleContentImageUpload(file);
                        e.target.value = '';
                      }}
                    />

                    {/* Quick Toolbar */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => insertFormatting('### ', '\n', isLao ? 'ຫົວຂໍ້ຍ່ອຍ' : 'Section Heading')}
                        className="p-1 px-2 text-[10px] font-bold text-gray-600 hover:text-adv-orange hover:bg-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title={isLao ? 'ເພີ່ມຫົວຂໍ້ຍ່ອຍ' : 'Add Subheading'}
                      >
                        <Heading className="w-3 h-3" />
                        <span>{isLao ? 'ຫົວຂໍ້' : 'Heading'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting('- ', '\n', isLao ? 'ລາຍການ' : 'List item')}
                        className="p-1 px-2 text-[10px] font-bold text-gray-600 hover:text-adv-orange hover:bg-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title={isLao ? 'ເພີ່ມລາຍການ' : 'Add Bullet point'}
                      >
                        <List className="w-3 h-3" />
                        <span>{isLao ? 'ລາຍການ' : 'Bullet'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => insertFormatting('> ', '\n', isLao ? 'ຂໍ້ຄວາມອ້າງອີງ' : 'Quote text here')}
                        className="p-1 px-2 text-[10px] font-bold text-gray-600 hover:text-adv-orange hover:bg-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title={isLao ? 'ເພີ່ມຄຳເວົ້າ' : 'Add Quote'}
                      >
                        <Quote className="w-3 h-3" />
                        <span>{isLao ? 'ຄຳເວົ້າ' : 'Quote'}</span>
                      </button>

                      {/* Insert Inline Image Button */}
                      <button
                        type="button"
                        disabled={isUploadingContentImg}
                        onClick={() => contentFileInputRef.current?.click()}
                        className="p-1 px-2 text-[10px] font-bold bg-white text-adv-orange shadow-2xs hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title={isLao ? 'ອັບໂຫຼດຮູບແຊກໃສ່ເນື້ອຫາ' : 'Upload and insert an image directly into the article body'}
                      >
                        {isUploadingContentImg ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UploadCloud className="w-3 h-3" />
                        )}
                        <span>{isLao ? 'ແຊກຮູບ' : 'Insert Photo'}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={10}
                    required
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    placeholder={isLao ? 'ຂຽນເນື້ອໃນບົດຄວາມຂອງທ່ານທີ່ນີ້...' : 'Write your article story here. You can use markdown like ### Subheadings, - bullet points, or click the buttons above to format...'}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-xs leading-relaxed text-adv-slate focus:bg-white focus:outline-none focus:border-adv-orange font-sans shadow-2xs"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    {isLao ? 'ຍົກເລີກ' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-adv-orange text-white text-xs font-black uppercase tracking-wider hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isLao ? 'ບັນທຶກບົດຄວາມ' : 'Save & Publish'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {blogToDelete && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-adv-slate">
                {isLao ? 'ຢືນຢັນການລຶບບົດຄວາມ?' : 'Delete this blog post?'}
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-5">
                "{blogToDelete.title}"
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBlogToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200"
                >
                  {isLao ? 'ຍົກເລີກ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-wider hover:bg-red-700 shadow-md shadow-red-600/20"
                >
                  {isLao ? 'ລຶບອອກ' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Preview Modal (Cleaned: No Category, Read Time, or Views) */}
      <AnimatePresence>
        {previewBlog && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 my-8 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <span className="text-xs font-black uppercase tracking-wider text-adv-orange">
                  Preview on Pasopkan
                </span>
                <button onClick={() => setPreviewBlog(null)} className="p-1.5 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-4 bg-gray-100">
                <img src={previewBlog.coverImage} alt={previewBlog.title} className="w-full h-full object-cover" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-adv-slate mt-2 mb-4">
                {isLao && previewBlog.titleLao ? previewBlog.titleLao : previewBlog.title}
              </h2>
              <div className="text-xs leading-relaxed text-gray-700 whitespace-pre-line border-t border-gray-100 pt-4">
                {isLao && previewBlog.contentLao ? previewBlog.contentLao : previewBlog.content}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
