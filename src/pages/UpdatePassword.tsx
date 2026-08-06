import React, { useState } from 'react';
import { ArrowLeft, Key, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../LanguageContext';

const translations = {
  en: {
    backToSecurity: 'Back to Security',
    updatePassword: 'Update Password',
    passwordDesc: 'Ensure your account is using a long, random password to stay secure.',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm New Password',
    enterCurrent: 'Enter current password',
    enterNew: 'Enter new password',
    confirmNew: 'Confirm new password',
    savePassword: 'Save Password',
    saving: 'Saving...',
    saved: 'Saved!',
    successMessage: 'Password updated successfully'
  },
  lo: {
    backToSecurity: 'ກັບໄປໜ້າຄວາມປອດໄພ',
    updatePassword: 'ອັບເດດລະຫັດຜ່ານ',
    passwordDesc: 'ໃຫ້ແນ່ໃຈວ່າບັນຊີຂອງທ່ານໃຊ້ລະຫັດຜ່ານທີ່ມີຄວາມຍາວ ແລະ ສຸ່ມເພື່ອຄວາມປອດໄພ.',
    currentPassword: 'ລະຫັດຜ່ານປັດຈຸບັນ',
    newPassword: 'ລະຫັດຜ່ານໃໝ່',
    confirmPassword: 'ຢືນຢັນລະຫັດຜ່ານໃໝ່',
    enterCurrent: 'ປ້ອນລະຫັດຜ່ານປັດຈຸບັນ',
    enterNew: 'ປ້ອນລະຫັດຜ່ານໃໝ່',
    confirmNew: 'ຢືນຢັນລະຫັດຜ່ານໃໝ່',
    savePassword: 'ບັນທຶກລະຫັດຜ່ານ',
    saving: 'ກຳລັງບັນທຶກ...',
    saved: 'ບັນທຶກແລ້ວ!',
    successMessage: 'ອັບເດດລະຫັດຜ່ານສຳເລັດແລ້ວ'
  }
};

export default function UpdatePassword() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-4 md:py-6">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-adv-slate transition-colors mb-4 group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">{t.backToSecurity}</span>
        </button>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-adv-orange shadow-sm">
            <Key className="w-5 h-5" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-adv-slate">{t.updatePassword}</h1>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
          <p className="text-sm text-gray-400 font-medium mb-8">{t.passwordDesc}</p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">{t.currentPassword}</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full bg-[#F9FAFB] border border-gray-100 rounded-2xl px-6 py-4 text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                  placeholder={t.enterCurrent}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-adv-orange transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">{t.newPassword}</label>
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full bg-[#F9FAFB] border border-gray-100 rounded-2xl px-6 py-4 text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                placeholder={t.enterNew}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">{t.confirmPassword}</label>
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full bg-[#F9FAFB] border border-gray-100 rounded-2xl px-6 py-4 text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                placeholder={t.confirmNew}
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSaving || showSuccess}
                className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-adv-slate text-white font-bold hover:bg-black transition-all disabled:opacity-70 flex items-center justify-center gap-3 shadow-xl shadow-gray-100"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : showSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-adv-orange" />
                ) : (
                  <Key className="w-5 h-5 text-adv-orange" />
                )}
                {isSaving ? t.saving : showSuccess ? t.saved : t.savePassword}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-adv-slate text-white px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 z-50 border border-white/10"
          >
            <CheckCircle2 className="w-5 h-5 text-adv-orange" />
            {t.successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
