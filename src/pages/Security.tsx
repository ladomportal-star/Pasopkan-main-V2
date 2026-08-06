import { ArrowLeft, Shield, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../LanguageContext';

const translations = {
  en: {
    backToAccount: 'Back to Account',
    securityPrivacy: 'Security & Privacy',
    updatePassword: 'Update Password',
    passwordDesc: 'Ensure your account is using a long, random password to stay secure.',
    updateNow: 'Update Now'
  },
  lo: {
    backToAccount: 'ກັບຄືນໄປໜ້າບັນຊີ',
    securityPrivacy: 'ຄວາມປອດໄພ ແລະ ຄວາມເປັນສ່ວນຕົວ',
    updatePassword: 'ອັບເດດລະຫັດຜ່ານ',
    passwordDesc: 'ໃຫ້ແນ່ໃຈວ່າບັນຊີຂອງທ່ານໃຊ້ລະຫັດຜ່ານທີ່ມີຄວາມຍາວ ແລະ ສຸ່ມເພື່ອຄວາມປອດໄພ.',
    updateNow: 'ອັບເດດດຽວນີ້'
  }
};

export default function Security() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-4 md:py-6">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <button 
          onClick={() => navigate(-1)}
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
          {/* Update Password Section */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-adv-orange shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-adv-slate mb-1">{t.updatePassword}</h3>
                  <p className="text-sm text-gray-400 font-medium">{t.passwordDesc}</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/security/password')}
                className="shrink-0 px-8 py-4 rounded-2xl bg-adv-slate text-white text-sm font-bold hover:bg-black transition-all w-full sm:w-auto shadow-lg shadow-gray-100"
              >
                {t.updateNow}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
