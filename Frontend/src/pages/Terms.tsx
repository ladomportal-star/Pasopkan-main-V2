import React, { useEffect, useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getTermsSettings, TermsSettings, DEFAULT_TERMS_SETTINGS } from '../lib/siteSettings';

export default function Terms() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const [termsSettings, setTermsSettings] = useState<TermsSettings>(DEFAULT_TERMS_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadSettings = async () => {
      try {
        const data = await getTermsSettings();
        if (data && data.sections) {
          setTermsSettings(data);
        }
      } catch (err) {
        console.warn('Error loading terms document:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'} py-6 sm:py-10 px-4`}>
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100 dark:border-zinc-800">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'lo' ? 'ກັບຄືນ' : 'Back'}
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-adv-orange">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-adv-slate dark:text-white">
            {lang === 'lo' ? 'ເງື່ອນໄຂການບໍລິການ' : 'Terms & Conditions'}
          </h1>
        </div>

        <div className="space-y-6 text-sm text-gray-600 dark:text-zinc-300 leading-relaxed font-sans">
          {termsSettings.sections && termsSettings.sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h2 className="font-bold text-adv-slate dark:text-white text-base sm:text-lg">
                {lang === 'en' ? section.title_en : section.title_lo}
              </h2>
              <p className="whitespace-pre-wrap">
                {lang === 'en' ? section.content_en : section.content_lo}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
