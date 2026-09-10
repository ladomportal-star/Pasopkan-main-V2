import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';

const translations = {
  en: {
    backToAccount: 'Back to Account',
    languageSettings: 'Language Settings',
    english: 'English',
    lao: 'Lao',
    settingsUpdated: 'Language updated'
  },
  lo: {
    backToAccount: 'ກັບຄືນໄປໜ້າບັນຊີ',
    languageSettings: 'ຕັ້ງຄ່າພາສາ',
    english: 'ພາສາອັງກິດ',
    lao: 'ພາສາລາວ',
    settingsUpdated: 'ອັບເດດພາສາສຳເລັດແລ້ວ'
  }
};

export default function LanguageSettings() {
  const navigate = useNavigate();
  const { lang, toggleLanguage } = useLanguage();
  const t = translations[lang];
  
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-4 md:py-6">
      <SEO
        title={`${t.languageSettings} | Pasopkan`}
        description="Configure language settings on Pasopkan."
        noindex={true}
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-adv-slate transition-colors mb-4 group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">{t.backToAccount}</span>
        </button>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-adv-orange shadow-sm">
            <Globe className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-adv-slate">{t.languageSettings}</h1>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                if (lang !== 'en') {
                  toggleLanguage();
                  triggerToast(t.settingsUpdated);
                }
              }}
              className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                lang === 'en' 
                  ? 'border-adv-orange bg-adv-orange/5 text-adv-orange' 
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <span className="font-bold">{t.english}</span>
              {lang === 'en' && <CheckCircle2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => {
                if (lang !== 'lo') {
                  toggleLanguage();
                  triggerToast(t.settingsUpdated);
                }
              }}
              className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                lang === 'lo' 
                  ? 'border-adv-orange bg-adv-orange/5 text-adv-orange' 
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <span className="font-bold">{t.lao} (Lao)</span>
              {lang === 'lo' && <CheckCircle2 className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-24 sm:bottom-12 left-1/2 bg-adv-slate text-white px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 z-50 border border-white/10 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-adv-orange" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
