import React from 'react';
import { Instagram, Youtube, Facebook, Globe } from 'lucide-react';

export interface SocialLinks {
  instagram?: string;
  x?: string;
  youtube?: string;
  tiktok?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
}

interface SocialLinksFormProps {
  value?: SocialLinks;
  onChange: (value: SocialLinks) => void;
  lang?: 'en' | 'lo';
  theme?: 'light' | 'dark';
  title?: string;
  compact?: boolean;
}

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-2.901 2.879 2.896 2.896 0 0 1-2.895-2.879 2.896 2.896 0 0 1 2.895-2.879c.307 0 .605.05.882.144V9.458a6.326 6.326 0 0 0-.882-.062c-3.528 0-6.388 2.839-6.388 6.335 0 3.497 2.86 6.336 6.388 6.336 3.527 0 6.387-2.839 6.387-6.336V8.927a8.21 8.21 0 0 0 4.739 1.488V6.97a4.847 4.847 0 0 1-1.008-.284z"/>
  </svg>
);

export default function SocialLinksForm({
  value = {},
  onChange,
  lang = 'en',
  theme = 'dark',
  title,
  compact = false
}: SocialLinksFormProps) {
  const isDark = theme === 'dark';

  const handleFieldChange = (key: keyof SocialLinks, val: string) => {
    let cleanVal = val.trim();
    if (key === 'instagram') {
      cleanVal = cleanVal.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, '');
    } else if (key === 'x') {
      cleanVal = cleanVal.replace(/^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\//i, '');
    } else if (key === 'youtube') {
      cleanVal = cleanVal.replace(/^(https?:\/\/)?(www\.)?youtube\.com\/@?/i, '');
    } else if (key === 'tiktok') {
      cleanVal = cleanVal.replace(/^(https?:\/\/)?(www\.)?tiktok\.com\/@?/i, '');
    } else if (key === 'facebook') {
      cleanVal = cleanVal.replace(/^(https?:\/\/)?(www\.)?facebook\.com\//i, '');
    }

    onChange({
      ...value,
      [key]: cleanVal
    });
  };

  const fields = [
    {
      key: 'instagram' as keyof SocialLinks,
      icon: <Instagram className="w-4 h-4" />,
      prefix: 'instagram.com/',
      placeholder: 'username'
    },
    {
      key: 'x' as keyof SocialLinks,
      icon: <XIcon className="w-4 h-4" />,
      prefix: 'x.com/',
      placeholder: 'username'
    },
    {
      key: 'youtube' as keyof SocialLinks,
      icon: <Youtube className="w-4 h-4" />,
      prefix: 'youtube.com/@',
      placeholder: 'username'
    },
    {
      key: 'tiktok' as keyof SocialLinks,
      icon: <TikTokIcon className="w-4 h-4" />,
      prefix: 'tiktok.com/@',
      placeholder: 'username'
    },
    {
      key: 'facebook' as keyof SocialLinks,
      icon: <Facebook className="w-4 h-4" />,
      prefix: 'facebook.com/',
      placeholder: 'username'
    },
    {
      key: 'website' as keyof SocialLinks,
      icon: <Globe className="w-4 h-4" />,
      prefix: null,
      placeholder: 'Your website'
    }
  ];

  return (
    <div className={`${compact ? 'p-3.5 sm:p-4.5 rounded-xl' : 'p-5 sm:p-6 rounded-2xl'} border transition-all ${
      isDark ? 'bg-[#121316] border-[#222327] text-white' : 'bg-white border-gray-200 text-adv-slate shadow-sm'
    }`}>
      <h3 className={`${compact ? 'text-xs font-semibold mb-2.5' : 'text-sm sm:text-base font-bold mb-4'} tracking-tight ${
        isDark ? 'text-zinc-100' : 'text-adv-slate'
      }`}>
        {title || (lang === 'lo' ? 'ລີ້ງໂຊຊຽວມີເດຍ (Social Links)' : 'Social Links')}
      </h3>

      <div className={`grid ${compact ? 'grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5' : 'grid-cols-1 gap-3.5 sm:gap-4'}`}>
        {fields.map((f) => (
          <div key={f.key} className="flex items-center gap-2 group">
            {/* Social Icon */}
            <div className={`shrink-0 ${compact ? 'w-5' : 'w-6'} flex items-center justify-center transition-colors ${
              isDark ? 'text-zinc-400 group-focus-within:text-zinc-100' : 'text-gray-400 group-focus-within:text-adv-orange'
            }`}>
              {f.icon}
            </div>

            {/* Split Input Pill Box */}
            <div className={`flex items-center flex-1 min-w-0 ${compact ? 'rounded-lg text-xs' : 'rounded-xl text-xs sm:text-sm'} border overflow-hidden transition-all ${
              isDark
                ? 'bg-[#18191d] border-[#2a2b30] focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500/30'
                : 'bg-[#F9FAFB] border-gray-200 focus-within:border-adv-orange focus-within:bg-white focus-within:ring-2 focus-within:ring-adv-orange/10'
            }`}>
              {f.prefix && (
                <div className={`${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm'} font-medium select-none shrink-0 border-r ${
                  isDark
                    ? 'bg-[#212328] text-zinc-300 border-[#2a2b30]'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {f.prefix}
                </div>
              )}

              <input
                type="text"
                value={value[f.key] || ''}
                onChange={(e) => handleFieldChange(f.key, e.target.value)}
                placeholder={f.placeholder}
                className={`w-full flex-1 min-w-0 bg-transparent ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm'} focus:outline-none font-medium ${
                  isDark
                    ? 'text-zinc-100 placeholder:text-zinc-600'
                    : 'text-adv-slate placeholder:text-gray-400'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
