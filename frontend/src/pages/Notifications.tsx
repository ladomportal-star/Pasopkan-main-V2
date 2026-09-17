import { useState } from 'react';
import { ArrowLeft, Bell, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';

const translations = {
  en: {
    backToAccount: 'Back to Account',
    notifications: 'Notifications',
    emailNotif: 'Email Notifications',
    emailNotifDesc: 'Receive updates about your upcoming events.',
    pushNotif: 'Push Notifications',
    pushNotifDesc: 'Get alerts on your device for event reminders.',
    marketingNotif: 'Marketing Emails',
    marketingNotifDesc: 'Receive news, special offers, and promotions.',
    settingsUpdated: 'Settings updated'
  },
  lo: {
    backToAccount: 'ກັບຄືນໄປໜ້າບັນຊີ',
    notifications: 'ການແຈ້ງເຕືອນ',
    emailNotif: 'ການແຈ້ງເຕືອນຜ່ານອີເມວ',
    emailNotifDesc: 'ຮັບຂໍ້ມູນອັບເດດກ່ຽວກັບກິດຈະກຳທີ່ຈະມາເຖິງຂອງທ່ານ.',
    pushNotif: 'ການແຈ້ງເຕືອນໃນມືຖື',
    pushNotifDesc: 'ຮັບການແຈ້ງເຕືອນໃນອຸປະກອນຂອງທ່ານສຳລັບການເຕືອນກິດຈະກຳ.',
    marketingNotif: 'ອີເມວການຕະຫຼາດ',
    marketingNotifDesc: 'ຮັບຂ່າວສານ, ຂໍ້ສະເໜີພິເສດ, ແລະ ໂປຣໂມຊັ່ນ.',
    settingsUpdated: 'ອັບເດດການຕັ້ງຄ່າສຳເລັດແລ້ວ'
  }
};

export default function Notifications() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
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

  const handleToggleSetting = () => {
    triggerToast(t.settingsUpdated);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-4 md:py-6">
      <SEO
        title={`${t.notifications} | Pasopkan`}
        description="Configure notification preferences on Pasopkan."
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
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-adv-slate">{t.notifications}</h1>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-sm"
        >
          <div className="flex items-center justify-between gap-4 md:gap-6">
            <div>
              <h3 className="text-base md:text-lg font-bold text-adv-slate">{t.emailNotif}</h3>
              <p className="text-xs md:text-sm text-gray-400 font-medium">{t.emailNotifDesc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input type="checkbox" className="sr-only peer" defaultChecked onChange={handleToggleSetting} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-adv-orange"></div>
            </label>
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
            className="fixed bottom-24 sm:bottom-12 pointer-events-none sm:bottom-12 left-1/2 bg-adv-slate text-black px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 z-50 border border-white/10 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-adv-orange" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
