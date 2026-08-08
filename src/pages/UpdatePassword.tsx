import React, { useState } from 'react';
import { ArrowLeft, Smartphone, CheckCircle2, Copy, Check, ShieldCheck, Lock, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '../LanguageContext';
import { safeStorage } from '../lib/storage';

const translations = {
  en: {
    backToSecurity: 'Back to Security',
    twoFactorTitle: '2FA Authenticator',
    twoFactorSubtitle: 'Two-Factor Authentication (2FA)',
    twoFactorDesc: 'Add an extra layer of security to your account using an authenticator app like Google Authenticator or Authy.',
    step1: 'Step 1: Scan QR Code or enter setup key',
    step2: 'Step 2: Enter 6-digit verification code',
    secretKeyLabel: 'Setup Key / Secret Key',
    copySecret: 'Copy Key',
    copiedSecret: 'Copied!',
    verificationCode: 'Verification Code',
    enter6Digits: 'Enter 6-digit code (e.g., 123456)',
    enable2FA: 'Enable 2FA Authenticator',
    disabling: 'Disabling...',
    enabling: 'Verifying & Enabling...',
    enabledTitle: '2FA Authenticator is Active',
    enabledDesc: 'Your account is currently protected with Two-Factor Authentication.',
    disable2FA: 'Disable 2FA',
    backupCodes: 'Backup Recovery Codes',
    backupCodesDesc: 'Keep these recovery codes in a safe place. You can use them if you lose access to your authenticator device.',
    successMessage: '2FA Authenticator enabled successfully!',
    disabledMessage: '2FA Authenticator has been disabled.'
  },
  lo: {
    backToSecurity: 'ກັບໄປໜ້າຄວາມປອດໄພ',
    twoFactorTitle: '2FA Authenticator',
    twoFactorSubtitle: 'ການຢືນຢັນຕົວຕົນ 2 ຂັ້ນຕອນ (2FA)',
    twoFactorDesc: 'ເພີ່ມຄວາມປອດໄພໃຫ້ບັນຊີຂອງທ່ານໂດຍໃຊ້ແອັບ Authenticator ເຊັ່ນ Google Authenticator ຫຼື Authy.',
    step1: 'ຂັ້ນຕອນທີ 1: ສະແກນ QR Code ຫຼື ປ້ອນລະຫັດຕັ້ງຄ່າ',
    step2: 'ຂັ້ນຕອນທີ 2: ປ້ອນລະຫັດຢືນຢັນ 6 ຫຼັກ',
    secretKeyLabel: 'ລະຫັດຕັ້ງຄ່າ / Setup Key',
    copySecret: 'ຄັດລອກລະຫັດ',
    copiedSecret: 'ຄັດລອກແລ້ວ!',
    verificationCode: 'ລະຫັດຢືນຢັນ',
    enter6Digits: 'ປ້ອນລະຫັດ 6 ຫຼັກ (ເຊັ່ນ: 123456)',
    enable2FA: 'ເປີດໃຊ້ງານ 2FA Authenticator',
    disabling: 'ກຳລັງປິດ...',
    enabling: 'ກຳລັງກວດສອບ ແລະ ເປີດໃຊ້ງານ...',
    enabledTitle: '2FA Authenticator ເປີດໃຊ້ງານຢູ່',
    enabledDesc: 'ບັນຊີຂອງທ່ານຖືກປົກປ້ອງດ້ວຍການຢືນຢັນຕົວຕົນ 2 ຂັ້ນຕອນແລ້ວ.',
    disable2FA: 'ປິດໃຊ້ງານ 2FA',
    backupCodes: 'ລະຫັດສຳຮອງສຳລັບກູ້ຄືນ',
    backupCodesDesc: 'ເກັບລະຫັດກູ້ຄືນເຫຼົ່ານີ້ໄວ້ໃນບ່ອນທີ່ປອດໄພ. ທ່ານສາມາດໃຊ້ພວກມັນໄດ້ຫາກສູນເສຍການເຂົ້າເຖິງອຸປະກອນ.',
    successMessage: 'ເປີດໃຊ້ງານ 2FA Authenticator ສຳເລັດແລ້ວ!',
    disabledMessage: 'ປິດໃຊ້ງານ 2FA Authenticator ແລ້ວ.'
  }
};

export default function UpdatePassword() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang];

  const [is2FAEnabled, setIs2FAEnabled] = useState(() => {
    return safeStorage.getItem('user_2fa_enabled') === 'true';
  });
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const secretKey = 'JBSWY3DPEHPK3PXP';
  const qrUri = `otpauth://totp/EventApp:user@example.com?secret=${secretKey}&issuer=EventApp`;
  const mockBackupCodes = ['8A4F-92K1', '3X7L-5P9M', '1Z2Y-6W8V', '9U8T-4R3Q'];

  const handleCopyKey = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleEnable = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 6) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIs2FAEnabled(true);
      safeStorage.setItem('user_2fa_enabled', 'true');
      setToastMessage(t.successMessage);
      setTimeout(() => setToastMessage(null), 3000);
    }, 1000);
  };

  const handleDisable = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIs2FAEnabled(false);
      setCode('');
      safeStorage.setItem('user_2fa_enabled', 'false');
      setToastMessage(t.disabledMessage);
      setTimeout(() => setToastMessage(null), 3000);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-4 md:py-6">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <button 
          onClick={() => navigate('/security')}
          className="flex items-center gap-2 text-gray-500 hover:text-adv-slate transition-colors mb-4 group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">{t.backToSecurity}</span>
        </button>

        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-adv-orange shadow-sm">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-adv-slate">{t.twoFactorTitle}</h1>
            <p className="text-xs text-gray-400 font-medium">{t.twoFactorSubtitle}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
          {is2FAEnabled ? (
            <div className="space-y-6">
              <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-950">{t.enabledTitle}</h3>
                  <p className="text-xs text-emerald-700 font-medium leading-relaxed mt-1">{t.enabledDesc}</p>
                </div>
              </div>

              {/* Backup Codes */}
              <div className="p-6 bg-gray-50 border border-gray-150 rounded-3xl space-y-4">
                <div>
                  <h4 className="text-sm font-extrabold text-adv-slate">{t.backupCodes}</h4>
                  <p className="text-xs text-gray-400 font-medium mt-1">{t.backupCodesDesc}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {mockBackupCodes.map((c, idx) => (
                    <div key={idx} className="p-2.5 bg-white border border-gray-200 rounded-xl text-center text-xs font-mono font-bold text-adv-slate shadow-2xs">
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDisable}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-red-50 text-red-600 border border-red-100 font-bold text-xs hover:bg-red-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? t.disabling : t.disable2FA}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <p className="text-sm text-gray-400 font-medium leading-relaxed">{t.twoFactorDesc}</p>

              {/* Step 1: QR & Secret */}
              <div className="p-6 bg-[#F9FAFB] border border-gray-100 rounded-3xl space-y-4">
                <h3 className="text-sm font-extrabold text-adv-slate">{t.step1}</h3>
                
                <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                  <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-sm shrink-0">
                    <QRCodeSVG value={qrUri} size={150} level="M" />
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.secretKeyLabel}</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs sm:text-sm font-mono font-bold text-adv-slate truncate">
                        {secretKey}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="px-4 py-3 rounded-2xl bg-adv-slate hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-adv-orange" />}
                        <span>{copiedKey ? t.copiedSecret : t.copySecret}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Verification Code Input */}
              <form onSubmit={handleEnable} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-extrabold text-adv-slate">{t.step2}</h3>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[#F9FAFB] border border-gray-200 rounded-2xl px-6 py-4 text-adv-slate font-mono font-black text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                      placeholder={t.enter6Digits}
                      required
                    />
                    <Lock className="w-5 h-5 text-gray-300 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || code.length < 6}
                    className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-adv-slate text-white font-bold hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-gray-100 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Smartphone className="w-5 h-5 text-adv-orange" />
                    )}
                    <span>{isSubmitting ? t.enabling : t.enable2FA}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-adv-slate text-white px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 z-50 border border-white/10"
          >
            <CheckCircle2 className="w-5 h-5 text-adv-orange" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
