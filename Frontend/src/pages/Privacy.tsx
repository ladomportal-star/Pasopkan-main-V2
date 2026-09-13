import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Privacy() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { theme } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'} py-8 px-4`}>
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-zinc-800">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {lang === 'lo' ? 'ກັບຄືນ' : 'Back'}
        </button>
        <h1 className="text-2xl font-bold mb-4">
          {lang === 'lo' ? 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ' : 'Privacy Policy'}
        </h1>
        <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-zinc-400 space-y-4">
          <p>
            {lang === 'lo'
              ? 'ຄວາມເປັນສ່ວນຕົວຂອງທ່ານເປັນສິ່ງສໍາຄັນສໍາລັບພວກເຮົາ. ມັນເປັນນະໂຍບາຍຂອງພວກເຮົາທີ່ຈະເຄົາລົບຄວາມເປັນສ່ວນຕົວຂອງທ່ານກ່ຽວກັບຂໍ້ມູນໃດໆທີ່ພວກເຮົາອາດຈະເກັບກໍາຈາກທ່ານ.'
              : 'Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect from you across our application.'}
          </p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-6">1. Information We Collect</h2>
          <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.</p>
          
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-6">2. Use of Information</h2>
          <p>We use the information we collect in various ways, including to provide, operate, and maintain our application.</p>
        </div>
      </div>
    </div>
  );
}
