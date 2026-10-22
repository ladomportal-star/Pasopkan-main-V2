import { ArrowLeft, Shield, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';

const translations = {
  en: {
    backToAccount: 'Back to Account',
    securityPrivacy: 'Security & Privacy',
    twoFactorAuth: '2FA Authenticator',
    twoFactorDesc: 'Protect your account with Two-Factor Authentication (2FA) using Google Authenticator or Authy.',
    setupNow: 'Set Up 2FA'
  },
  lo: {
    backToAccount: 'ກັບຄືນໄປໜ້າບັນຊີ',
    securityPrivacy: 'ຄວາມປອດໄພ ແລະ ຄວາມເປັນສ່ວນຕົວ',
    twoFactorAuth: '2FA Authenticator',
    twoFactorDesc: 'ປົກປ້ອງບັນຊີຂອງທ່ານດ້ວຍການຢືນຢັນຕົວຕົນ 2 ຂັ້ນຕອນ (2FA) ຜ່ານແອັບ Google Authenticator ຫຼື Authy.',
    setupNow: 'ຕັ້ງຄ່າ 2FA'
  }
};

export default function Security() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-4 md:py-6">
      <SEO
        title={t.securityPrivacy || 'Security & Privacy'}
        description="Manage your account security, two-factor authentication, and privacy settings on Pasopkan."
        noindex={true}
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <button 
          onClick={() => navigate('/account')}
          className="flex items-center gap-2 text-gray-500 hover:text-adv-slate transition-colors mb-4 group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">{t.backToAccount}</span>
        </button>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-adv-orange shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-adv-slate">{t.securityPrivacy}</h1>
        </div>

        <div className="space-y-6">
          {/* 2FA Authenticator Section */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-adv-orange shrink-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-adv-slate mb-1">{t.twoFactorAuth}</h3>
                  <p className="text-sm text-gray-400 font-medium">{t.twoFactorDesc}</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/security/2fa')}
                className="shrink-0 px-8 py-4 rounded-2xl bg-adv-slate text-white text-sm font-bold hover:bg-black transition-all w-full sm:w-auto shadow-lg shadow-gray-100 cursor-pointer"
              >
                {t.setupNow}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
