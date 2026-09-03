import React, { useState, useEffect } from 'react';
import { ArrowLeft, HelpCircle, Mail, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getSupportSettings, SupportSettings, DEFAULT_SUPPORT_SETTINGS } from '../lib/siteSettings';
import SEO from '../components/SEO';

const translations = {
  en: {
    back: 'Back to Account',
    liveChat: 'Live Chat',
    emailUs: 'Email Us',
    faq: 'Frequently Asked Questions',
  },
  lo: {
    back: 'ກັບຄືນໄປໜ້າບັນຊີ',
    liveChat: 'ສົນທະນາສົດ',
    emailUs: 'ສົ່ງອີເມວຫາພວກເຮົາ',
    faq: 'ຄຳຖາມທີ່ພົບເລື້ອຍ',
  }
};

export default function Help() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang as keyof typeof translations] || translations.en;

  const [settings, setSettings] = useState<SupportSettings>(DEFAULT_SUPPORT_SETTINGS);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getSupportSettings();
      setSettings(data);
    };
    loadSettings();
  }, []);

  const helpSupport = lang === 'en' ? settings.helpSupport_en : settings.helpSupport_lo;
  const whatsappLabel = lang === 'en' ? settings.whatsappLabel_en : settings.whatsappLabel_lo;
  
  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-6 pt-4 sm:pt-6">
      <SEO
        title={helpSupport || (lang === 'lo' ? 'ສູນຊ່ວຍເຫຼືອ & ຄຳຖາມທີ່ພົບເລື້ອຍ' : 'Help & Support')}
        description="Frequently Asked Questions and customer support contacts for Pasopkan ticketing platform."
        keywords={['Pasopkan Help', 'Support Laos', 'FAQ Events Tickets Laos']}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-adv-slate transition-colors mb-4 group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">{t.back}</span>
        </button>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 flex items-center justify-center text-adv-orange shadow-sm">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-adv-slate tracking-tight">{helpSupport}</h1>
            <p className="text-gray-500 text-sm font-bold">{t.faq}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {settings.whatsappNumber && (
            <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <MessageCircle className="w-8 h-8" />
              </div>
              <span className="text-adv-slate font-bold text-lg">{t.liveChat}</span>
              <span className="text-sm text-gray-400 mt-1">{whatsappLabel}</span>
            </a>
          )}
          {settings.emailAddress && (
            <a
              href={`mailto:${settings.emailAddress}`}
              className="flex flex-col items-center justify-center p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Mail className="w-8 h-8" />
              </div>
              <span className="text-adv-slate font-bold text-lg">{t.emailUs}</span>
              <span className="text-sm text-gray-400 mt-1">{settings.emailAddress}</span>
            </a>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-adv-slate mb-6 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-adv-orange rounded-full" />
            {t.faq}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {settings.faqs && settings.faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-adv-slate font-bold mb-3 text-lg">
                  {lang === 'en' ? faq.q_en : faq.q_lo}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {lang === 'en' ? faq.a_en : faq.a_lo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
