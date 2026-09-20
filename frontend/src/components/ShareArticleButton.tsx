import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Copy, Check, Facebook, Send, MessageCircle, X, ExternalLink } from 'lucide-react';
import { BlogPost } from '../data/blogs';
import { useLanguage } from '../context/LanguageContext';

export async function copyTextToClipboard(text: string): Promise<boolean> {
  // 1. Try modern clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // 2. Reliable DOM fallback for iframes and mobile webviews
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0.01';
    // Do NOT set readonly to allow mobile Safari selection
    textArea.readOnly = false;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 99999);
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('All clipboard methods failed:', err);
    return false;
  }
}

interface ShareArticleButtonProps {
  blog: BlogPost;
  className?: string;
  showText?: boolean;
  dropUp?: boolean;
}

export default function ShareArticleButton({
  blog,
  className = '',
  showText = true,
  dropUp = false
}: ShareArticleButtonProps) {
  const { lang } = useLanguage();
  const isLao = lang !== 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getShareUrl = () => {
    try {
      const base = window.location.origin + window.location.pathname;
      return `${base}#blog-${blog.id}`;
    } catch {
      return window.location.href;
    }
  };

  const getArticleTitle = () => {
    return isLao && blog.titleLao ? blog.titleLao : blog.title;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(prev => !prev);
  };

  const executeCopy = async () => {
    const url = getShareUrl();
    const success = await copyTextToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else if (inputRef.current) {
      // If programmatic copy fails, select the visible input
      inputRef.current.focus();
      inputRef.current.select();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopyClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await executeCopy();
  };

  const handleSocialShare = (platform: 'facebook' | 'whatsapp' | 'telegram', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = encodeURIComponent(getShareUrl());
    const title = encodeURIComponent(getArticleTitle());

    let shareUrl = '';
    if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${title}%0A${url}`;
    } else if (platform === 'telegram') {
      shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
    }

    if (shareUrl) {
      try {
        const opened = window.open(shareUrl, '_blank', 'noopener,noreferrer,width=650,height=550');
        if (!opened || opened.closed || typeof opened.closed === 'undefined') {
          // Popup blocked by browser or iframe, copy the link as automatic helpful fallback
          executeCopy();
        }
      } catch {
        executeCopy();
      }
    }
    setIsOpen(false);
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (navigator.share) {
      try {
        await navigator.share({
          title: getArticleTitle(),
          text: isLao && blog.excerptLao ? blog.excerptLao : blog.excerpt,
          url: getShareUrl()
        });
        setIsOpen(false);
        return;
      } catch {
        // Fallback to copy if native share cancelled or blocked
      }
    }
    await executeCopy();
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        title={isLao ? 'ແບ່ງປັນບົດຄວາມ' : 'Share Article'}
        className={
          className ||
          'px-3 py-2 rounded-xl text-gray-600 hover:text-adv-orange hover:bg-orange-50 border border-gray-200 transition-all flex items-center gap-2 text-xs font-bold active:scale-95 cursor-pointer shadow-2xs'
        }
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-emerald-600 font-bold whitespace-nowrap">
              {isLao ? 'ຄັດລອກລິ້ງແລ້ວ!' : 'Link Copied!'}
            </span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 text-adv-orange shrink-0" />
            {showText && <span className="whitespace-nowrap">{isLao ? 'ແບ່ງປັນ' : 'Share'}</span>}
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: dropUp ? -6 : 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: dropUp ? -6 : 6 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            className={`absolute ${
              dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
            } right-0 z-[120] w-72 p-3 bg-white rounded-2xl shadow-2xl border border-gray-150 text-left text-adv-slate`}
          >
            {/* Dropdown Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 px-1">
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                {isLao ? 'ແບ່ງປັນບົດຄວາມນີ້' : 'Share This Article'}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* URL Display with 1-click Copy */}
            <div className="mb-2.5 flex items-center gap-1.5 p-1.5 bg-gray-50 rounded-xl border border-gray-200">
              <input
                ref={inputRef}
                type="text"
                readOnly
                value={getShareUrl()}
                onClick={e => (e.target as HTMLInputElement).select()}
                className="flex-1 bg-transparent text-[11px] text-gray-600 px-1.5 py-0.5 outline-none font-mono select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopyClick}
                className="px-2.5 py-1 rounded-lg bg-adv-slate text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? (isLao ? 'ແລ້ວ' : 'Copied') : (isLao ? 'ຄັດລອກ' : 'Copy')}</span>
              </button>
            </div>

            {/* Social Share Options */}
            <div className="space-y-1">
              {/* Copy Link Row */}
              <button
                type="button"
                onClick={handleCopyClick}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all hover:bg-orange-50 hover:text-adv-orange text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                  <span className={copied ? 'text-emerald-600 font-bold' : 'text-gray-700'}>
                    {copied
                      ? (isLao ? 'ຄັດລອກລິ້ງແລ້ວ!' : 'Link Copied to Clipboard!')
                      : (isLao ? 'ຄັດລອກລິ້ງ' : 'Copy Link')}
                  </span>
                </div>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={e => handleSocialShare('facebook', e)}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-[#1877F2] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Facebook className="w-4 h-4 text-[#1877F2] shrink-0" />
                  <span>Facebook</span>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-300" />
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                onClick={e => handleSocialShare('whatsapp', e)}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-[#25D366] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span>WhatsApp</span>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-300" />
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={e => handleSocialShare('telegram', e)}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-sky-50 hover:text-[#229ED9] transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-[#229ED9] shrink-0" />
                  <span>Telegram</span>
                </div>
                <ExternalLink className="w-3 h-3 text-gray-300" />
              </button>

              {/* Native Mobile Share if supported */}
              {typeof navigator !== 'undefined' && !!navigator.share && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all text-left border-t border-gray-100 mt-1 pt-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-adv-orange shrink-0" />
                  <span>{isLao ? 'ຕົວເລືອກແບ່ງປັນອື່ນໆ...' : 'More Sharing Options...'}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
