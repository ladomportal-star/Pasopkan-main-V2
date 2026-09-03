import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Copy, Check, Facebook, Send, MessageCircle, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface ShareEventButtonProps {
  eventId: string;
  eventTitle: string;
  eventDescription?: string;
  className?: string;
  iconClassName?: string;
}

const translations = {
  en: {
    shareEvent: 'Share Event',
    copyLink: 'Copy Link',
    copied: 'Link Copied!',
    facebook: 'Facebook',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    moreOptions: 'More Options'
  },
  lo: {
    shareEvent: 'ແບ່ງປັນກິດຈະກຳ',
    copyLink: 'ຄັດລອກລິ້ງ',
    copied: 'ຄັດລອກລິ້ງແລ້ວ!',
    facebook: 'ເຟສບຸກ (Facebook)',
    whatsapp: 'ວັອດແອບ (WhatsApp)',
    telegram: 'ເທເລແກຣມ (Telegram)',
    moreOptions: 'ຕົວເລືອກອື່ນໆ'
  }
};

export default function ShareEventButton({
  eventId,
  eventTitle,
  eventDescription = '',
  className = '',
  iconClassName = ''
}: ShareEventButtonProps) {
  const { lang } = useLanguage();
  const t = translations[lang] || translations.en;

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getShareUrl = () => {
    return `${window.location.origin}/event/${eventId}`;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
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
    setIsOpen(!isOpen);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = getShareUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const handleSocialShare = (platform: 'facebook' | 'whatsapp' | 'telegram', e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = encodeURIComponent(getShareUrl());
    const title = encodeURIComponent(eventTitle);
    
    let shareUrl = '';
    if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${title}%20${url}`;
    } else if (platform === 'telegram') {
      shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
    }
    setIsOpen(false);
  };

  const handleNativeShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = getShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventTitle,
          text: eventDescription || eventTitle,
          url: url
        });
        setIsOpen(false);
      } catch (err) {
        // User cancelled or share failed silently
      }
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        title={t.shareEvent}
        aria-label={t.shareEvent}
        className={className || "p-2 rounded-full bg-white/90 backdrop-blur-md text-adv-slate hover:bg-adv-orange hover:text-white shadow-md border border-white/40 transition-all duration-200 z-20 cursor-pointer active:scale-90"}
      >
        <Share2 className={iconClassName || "w-3.5 h-3.5 sm:w-4 sm:h-4"} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className="absolute top-full right-0 mt-2 z-50 w-52 p-2.5 bg-white rounded-2xl shadow-xl border border-gray-150 text-left text-adv-slate overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 px-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t.shareEvent}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setIsOpen(false); }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              {/* Copy Link Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all hover:bg-orange-50 hover:text-adv-orange text-left"
              >
                <div className="flex items-center gap-2">
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  )}
                  <span className={copied ? "text-emerald-600" : ""}>
                    {copied ? t.copied : t.copyLink}
                  </span>
                </div>
              </button>

              {/* Facebook Share */}
              <button
                type="button"
                onClick={(e) => handleSocialShare('facebook', e)}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-[#1877F2] transition-all text-left"
              >
                <Facebook className="w-3.5 h-3.5 text-[#1877F2] shrink-0" />
                <span>{t.facebook}</span>
              </button>

              {/* WhatsApp Share */}
              <button
                type="button"
                onClick={(e) => handleSocialShare('whatsapp', e)}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-emerald-50 hover:text-[#25D366] transition-all text-left"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                <span>{t.whatsapp}</span>
              </button>

              {/* Telegram Share */}
              <button
                type="button"
                onClick={(e) => handleSocialShare('telegram', e)}
                className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-sky-50 hover:text-[#229ED9] transition-all text-left"
              >
                <Send className="w-3.5 h-3.5 text-[#229ED9] shrink-0" />
                <span>{t.telegram}</span>
              </button>

              {/* Native Web Share API if supported */}
              {typeof navigator !== 'undefined' && !!navigator.share && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all text-left border-t border-gray-100 mt-1 pt-2"
                >
                  <Share2 className="w-3.5 h-3.5 text-adv-orange shrink-0" />
                  <span>{t.moreOptions}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
