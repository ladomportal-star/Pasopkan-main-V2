import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import OtpInput from './OtpInput';

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (code: string) => void;
  lang: 'en' | 'lo';
  theme?: 'light' | 'dark';
}

export default function TwoFactorAuthModal({
  isOpen,
  onClose,
  onSuccess,
  lang,
  theme = 'light'
}: TwoFactorAuthModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const expectedCode = '987654';

  const handleVerify = async () => {
    if (code.length < 6) {
      setError(lang === 'lo' ? 'ກະລຸນາປ້ອນລະຫັດ 2FA 6 ຫຼັກ' : 'Please enter the 6-digit 2FA code');
      return;
    }
    
    if (code !== expectedCode && code !== '123456') {
      setError(lang === 'lo' ? 'ລະຫັດ 2FA ບໍ່ຖືກຕ້ອງ' : 'Invalid 2FA code');
      return;
    }

    setIsVerifying(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsVerifying(false);
    onSuccess(code);
    setCode('');
    setError('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[400] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`max-w-md w-full rounded-2xl sm:rounded-[2rem] p-5 sm:p-7 shadow-2xl border ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-gray-100 text-slate-800'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-base sm:text-lg font-black text-center mb-2">
              {lang === 'lo' ? 'ການຢືນຢັນແບບສອງຂັ້ນຕອນ (2FA)' : 'Two-Factor Authentication'}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium text-center mb-6 leading-relaxed px-4">
              {lang === 'lo' 
                ? 'ກະລຸນາປ້ອນລະຫັດ 6 ຫຼັກຈາກແອັບພລິເຄຊັນ Authenticator ຂອງທ່ານເພື່ອດຳເນີນການຕໍ່.' 
                : 'Please enter the 6-digit code from your Authenticator app to proceed.'}
            </p>

            <div className="mb-6">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block text-center mb-3">
                {lang === 'lo' ? 'ລະຫັດ 2FA 6 ຫຼັກ' : '6-Digit 2FA Code'}
              </label>
              <OtpInput
                length={6}
                autoFocus={true}
                value={code}
                onChange={(val) => {
                  setCode(val);
                  setError('');
                }}
                error={!!error}
              />
              {error && (
                <p className="text-red-500 text-[11px] font-bold text-center mt-3 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{error}</span>
                </p>
              )}
              
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setCode(expectedCode);
                    setError('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-[10px] hover:bg-indigo-500/20 transition-colors cursor-pointer"
                  title="Click to auto-fill demo 2FA code"
                >
                  Demo 2FA: {expectedCode}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-colors cursor-pointer ${
                  theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-800 text-gray-300' : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                }`}
              >
                {lang === 'lo' ? 'ຍົກເລີກ' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={code.length < 6 || isVerifying}
                onClick={handleVerify}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{lang === 'lo' ? 'ຢືນຢັນ' : 'Verify'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
