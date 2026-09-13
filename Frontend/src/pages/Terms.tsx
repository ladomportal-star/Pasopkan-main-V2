import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Terms() {
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
          {lang === 'lo' ? 'ເງື່ອນໄຂການບໍລິການ' : 'Terms & Conditions'}
        </h1>
        <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-zinc-400 space-y-4">
          <p>
            {lang === 'lo' 
              ? 'ຍິນດີຕ້ອນຮັບສູ່ແອັບພລິເຄຊັນຂອງພວກເຮົາ. ການນໍາໃຊ້ບໍລິການຂອງພວກເຮົາ ໝາຍຄວາມວ່າທ່ານຍອມຮັບເງື່ອນໄຂເຫຼົ່ານີ້.' 
              : 'Welcome to our application. By using our services, you agree to these terms. Please read them carefully.'}
          </p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-6">1. Acceptance of Terms</h2>
          <p>By accessing or using our platform, you confirm your agreement to be bound by these Terms.</p>
          
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-6">2. User Responsibilities</h2>
          <p>You are responsible for safeguarding your account, and you agree not to disclose your password to any third party.</p>
        </div>
      </div>
    </div>
  );
}
