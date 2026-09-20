import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Ticket, Phone, Key, ArrowRight, ArrowLeft, Globe, Loader2, AlertCircle, Smartphone, Lock, X, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';
import OtpInput from '../components/OtpInput';
import { safeStorage } from '../lib/storage';
import SEO from '../components/SEO';
import { 
  getTermsSettings, 
  getPrivacySettings,
  TermsSettings, 
  PrivacySettings, 
  DEFAULT_TERMS_SETTINGS, 
  DEFAULT_PRIVACY_SETTINGS
} from '../lib/siteSettings';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAnonymously, loginWithGoogle } = useAuth();
  const { lang, toggleLanguage } = useLanguage();
  const { theme } = useTheme();
  const [step, setStep] = useState<'phone' | 'otp' | '2fa'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [termsSettings, setTermsSettings] = useState<TermsSettings>(DEFAULT_TERMS_SETTINGS);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const termsData = await getTermsSettings();
        const privacyData = await getPrivacySettings();
        if (isMounted) {
          setTermsSettings(termsData);
          setPrivacySettings(privacyData);
        }
      } catch (err) {
        console.warn('Error loading settings:', err);
      }
    };
    loadSettings();
    return () => { isMounted = false; };
  }, []);

  const translations = {
    en: {
      back: 'Back',
      signInTitle: 'Sign in',
      verifyTitle: 'Enter verification code',
      or: 'Or',
      sentCode: 'We sent a code to',
      phoneLabel: 'Phone number',
      phonePlaceholder: '20 XXXXXXXX',
      sendCodeBtn: 'Send Code',
      verifyLabel: 'Verification Code',
      verifyPlaceholder: '123456',
      verifyBtn: 'Verify & Sign In',
      backToPhone: 'Back to phone number',
      orContinue: 'Or continue with',
      googleSignIn: 'Sign in with Google',
      resendCode: 'Resend Code',
      resendIn: 'Resend in',
      codeResent: 'A new verification code has been sent!',
      otpRequired: 'Please enter the verification code',
      incorrectOtp: 'Incorrect verification code',
      twoFactorTitle: '2FA Authenticator Security Lock',
      twoFactorPrompt: '2FA is enabled on your account. Please enter the 6-digit code from your Google Authenticator or Authy app.',
      twoFactorLabel: '2FA Authenticator Code',
      verify2faBtn: 'Verify 2FA & Log In',
      termsText1: 'By creating an account you agree to our',
      termsLink: 'Terms & Conditions',
      termsText2: 'and',
      privacyLink: 'Privacy Policy',
      terms: 'Terms & Conditions',
      privacy: 'Privacy Policy'
    },
    lo: {
      back: 'ກັບຄືນ',
      signInTitle: 'ເຂົ້າສູ່ລະບົບ',
      verifyTitle: 'ໃສ່ລະຫັດຢືນຢັນ',
      or: 'ຫຼື',
      sentCode: 'ພວກເຮົາໄດ້ສົ່ງລະຫັດໄປທີ່',
      phoneLabel: 'ເບີໂທລະສັບ',
      phonePlaceholder: '20 XXXXXXXX',
      sendCodeBtn: 'ສົ່ງລະຫັດ',
      verifyLabel: 'ລະຫັດຢືນຢັນ',
      verifyPlaceholder: '123456',
      verifyBtn: 'ຢືນຢັນ & ເຂົ້າສູ່ລະບົບ',
      backToPhone: 'ກັບຄືນໄປຫາເບີໂທລະສັບ',
      orContinue: 'ຫຼື ສືບຕໍ່ດ້ວຍ',
      googleSignIn: 'ເຂົ້າສູ່ລະບົບດ້ວຍ Google',
      resendCode: 'ສົ່ງລະຫັດອີກຄັ້ງ',
      resendIn: 'ສົ່ງອີກຄັ້ງໃນ',
      codeResent: 'ສົ່ງລະຫັດຢືນຢັນໃໝ່ແລ້ວ!',
      otpRequired: 'ກະລຸນາໃສ່ລະຫັດຢືນຢັນ',
      incorrectOtp: 'ລະຫັດຢືນຢັນບໍ່ຖືກຕ້ອງ',
      twoFactorTitle: 'ການຢືນຢັນ 2FA ເພື່ອຄວາມປອດໄພ',
      twoFactorPrompt: 'ບັນຊີຂອງທ່ານເປີດໃຊ້ 2FA ຢູ່. ກະລຸນາປ້ອນລະຫັດ 6 ຫຼັກຈາກແອັບ Google Authenticator ຫຼື Authy ຂອງທ່ານ.',
      twoFactorLabel: 'ລະຫັດ 2FA Authenticator',
      verify2faBtn: 'ຢືນຢັນ 2FA & ເຂົ້າສູ່ລະບົບ',
      termsText1: 'ໂດຍການສ້າງບັນຊີທ່ານເຫັນດີກັບ',
      termsLink: 'ຂໍ້ກຳນົດ & ເງື່ອນໄຂ',
      termsText2: 'ແລະ',
      privacyLink: 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ',
      terms: 'ຂໍ້ກຳນົດ & ເງື່ອນໄຂ',
      privacy: 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ'
    }
  };

  const t = translations[lang];

  const finishLoginAndRedirect = () => {
    const state = location.state as any;
    if (state?.returnTo) {
      navigate(state.returnTo, { state: state.checkoutState });
    } else {
      navigate('/');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const digits = phoneNumber.replace(/\D/g, '');
    if (!digits.startsWith('856') && !digits.startsWith('020') && !digits.startsWith('20')) {
      setError(lang === 'en' ? 'Phone number must start with 856, 20 or 020' : 'ເບີໂທລະສັບຕ້ອງຂຶ້ນຕົ້ນດ້ວຍ 856, 20 ຫຼື 020');
      return;
    }
    if (digits.startsWith('856')) {
      if (!digits.startsWith('85620') && !digits.startsWith('856020')) {
        setError(lang === 'en' ? '856 country code must be followed by 20 or 020' : 'ລະຫັດປະເທດ 856 ຕ້ອງຕາມດ້ວຍ 20 ຫຼື 020');
        return;
      }
      if (digits.startsWith('856020') && digits.length !== 14) {
        setError(lang === 'en' ? 'Phone number starting with 856020 must have 14 digits' : 'ເບີໂທລະສັບທີ່ຂຶ້ນຕົ້ນດ້ວຍ 856020 ຕ້ອງມີ 14 ຕົວເລກ');
        return;
      }
      if (digits.startsWith('85620') && !digits.startsWith('856020') && digits.length !== 13) {
        setError(lang === 'en' ? 'Phone number starting with 85620 must have 13 digits' : 'ເບີໂທລະສັບທີ່ຂຶ້ນຕົ້ນດ້ວຍ 85620 ຕ້ອງມີ 13 ຕົວເລກ');
        return;
      }
    } else if (digits.startsWith('020')) {
      if (digits.length !== 11) {
        setError(lang === 'en' ? 'Phone number starting with 020 must have 11 digits' : 'ເບີໂທລະສັບທີ່ຂຶ້ນຕົ້ນດ້ວຍ 020 ຕ້ອງມີ 11 ຕົວເລກ');
        return;
      }
    } else if (digits.startsWith('20')) {
      if (digits.length !== 10) {
        setError(lang === 'en' ? 'Phone number starting with 20 must have 10 digits' : 'ເບີໂທລະສັບທີ່ຂຶ້ນຕົ້ນດ້ວຍ 20 ຕ້ອງມີ 10 ຕົວເລກ');
        return;
      }
    }

    
    let formattedPhone = digits;
    if (formattedPhone.startsWith('856020')) {
      formattedPhone = '85620' + formattedPhone.substring(6);
    } else if (formattedPhone.startsWith('020')) {
      formattedPhone = '85620' + formattedPhone.substring(3);
    } else if (formattedPhone.startsWith('20')) {
      formattedPhone = '85620' + formattedPhone.substring(2);
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      setStep('otp');
      setCountdown(60);
      setResendMessage(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const handleResendOtp = async () => {
    if (countdown > 0 || isLoading) return;
    setIsLoading(true);
    setError(null);
    setResendMessage(null);
    try {
      const digits = phoneNumber.replace(/\D/g, '');
      let formattedPhone = digits;
      if (formattedPhone.startsWith('856020')) formattedPhone = '85620' + formattedPhone.substring(6);
      else if (formattedPhone.startsWith('020')) formattedPhone = '85620' + formattedPhone.substring(3);
      else if (formattedPhone.startsWith('20')) formattedPhone = '85620' + formattedPhone.substring(2);

      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');
      setCountdown(60);
      setResendMessage(t.codeResent);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.trim() === '') {
      setError(t.otpRequired);
      return;
    }
    if (otp.length < 6) {
      setError(lang === 'en' ? 'Please enter the 6-digit verification code' : 'ກະລຸນາໃສ່ລະຫັດຢືນຢັນ 6 ຕົວເລກ');
      return;
    }
    setIsLoading(true);
    try {
      const digits = phoneNumber.replace(/\D/g, '');
      let formattedPhone = digits;
      if (formattedPhone.startsWith('856020')) formattedPhone = '85620' + formattedPhone.substring(6);
      else if (formattedPhone.startsWith('020')) formattedPhone = '85620' + formattedPhone.substring(3);
      else if (formattedPhone.startsWith('20')) formattedPhone = '85620' + formattedPhone.substring(2);

      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, code: otp })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(t.incorrectOtp);
        setIsLoading(false);
        return;
      }

      await loginAnonymously();
      
      // Link phone number in local profile and sync
      const savedProfileStr = localStorage.getItem('pasopkan_user_profile');
      let localProfile = {
        firstName: 'Sirithida',
        lastName: 'Souksavat',
        email: 'sirithida.ssv@gmail.com',
        phone: phoneNumber,
        gender: '',
        dob: '',
      };
      if (savedProfileStr) {
        try {
          localProfile = { ...localProfile, ...JSON.parse(savedProfileStr), phone: phoneNumber };
        } catch (e) {}
      }
      localStorage.setItem('pasopkan_user_profile', JSON.stringify(localProfile));

      if (safeStorage.getItem('user_2fa_enabled') === 'true') {
        setStep('2fa');
        setIsLoading(false);
        return;
      }

      finishLoginAndRedirect();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!twoFactorCode || twoFactorCode.trim().length < 6) {
      setError(lang === 'en' ? 'Please enter the 6-digit verification code' : 'ກະລຸນາໃສ່ລະຫັດຢືນຢັນ 6 ຕົວເລກ');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      finishLoginAndRedirect();
    }, 600);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
      className={`flex-1 flex flex-col justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 relative transition-colors duration-300 min-h-screen ${
        theme === 'dark' ? 'bg-zinc-950' : 'bg-white'
      }`}
    >
      <SEO
        title={t.signInTitle || (lang === 'lo' ? 'ເຂົ້າສູ່ລະບົບ Pasopkan' : 'Sign in to Pasopkan')}
        description="Sign in to your Pasopkan account to manage event tickets, registrations, and organizer dashboards."
        noindex={true}
      />
      {/* Header with Back and Language Switch */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center w-full max-w-7xl mx-auto">
        <button 
          onClick={() => navigate('/')} 
          className={`flex items-center gap-2 transition-colors px-3 py-2 rounded-lg ${
            theme === 'dark' 
              ? 'text-zinc-400 hover:text-white hover:bg-white/5' 
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{t.back}</span>
        </button>
        <button 
          onClick={toggleLanguage}
          className={`flex items-center justify-center w-10 h-10 transition-colors rounded-lg ${
            theme === 'dark' 
              ? 'text-zinc-400 hover:text-white hover:bg-white/5' 
              : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
          }`}
        >
          <span className="text-sm font-bold uppercase tracking-wider">{lang === 'en' ? 'EN' : 'LA'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-4 sm:mt-4">
        <div className="flex flex-col items-center justify-center">
          <Link to="/" className="flex items-center justify-center transition-transform duration-500 ease-out hover:scale-105 cursor-pointer mb-0">
            <img 
              src="/pasopkan_logo.png" 
              alt="Pasopkan Logo" 
              className="h-36 sm:h-48 md:h-56 w-auto object-contain transition-transform duration-300 hover:scale-[1.03]" 
              referrerPolicy="no-referrer"
            />
          </Link>
        </div>
        <h2 className={`mt-1 sm:mt-1 text-center text-2xl sm:text-3xl font-extrabold tracking-wide ${
          theme === 'dark' ? 'text-white' : 'text-adv-slate'
        }`}>
          {step === 'phone' ? t.signInTitle : t.verifyTitle}
        </h2>
        <p className={`mt-2 text-center text-sm ${
          theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
        }`}>
          {step === 'phone' ? null : (
            <>
              {t.sentCode} <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>{phoneNumber}</span>
            </>
          )}
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`py-6 px-4 sm:py-8 sm:px-10 transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-transparent sm:bg-zinc-900 sm:border sm:border-white/10 sm:shadow-2xl sm:rounded-3xl' 
            : 'bg-transparent sm:bg-white sm:border sm:border-gray-150 sm:shadow-2xl sm:rounded-3xl'
        }`}>
          {step === 'phone' ? (
            <form className="space-y-5" onSubmit={handleSendOtp}>
              {error && (
                <div className="flex items-start gap-3 p-3.5 rounded-2xl border bg-rose-500/10 border-rose-500/20 text-rose-500 text-xs sm:text-sm font-medium animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label htmlFor="phone" className={`block text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'
                }`}>
                  {t.phoneLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none gap-2">
                    <Phone className={`h-4 w-4 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                    <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'}`}>+856</span>
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    required
                    maxLength={
                      phoneNumber.startsWith('856020') ? 14 :
                      phoneNumber.startsWith('85620') ? 13 :
                      phoneNumber.startsWith('856') ? 14 :
                      phoneNumber.startsWith('020') ? 11 : 10
                    }
                    value={phoneNumber}
                    onChange={(e) => {
                      setError(null);
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      const maxLen = 
                        digitsOnly.startsWith('856020') ? 14 :
                        digitsOnly.startsWith('85620') ? 13 :
                        digitsOnly.startsWith('856') ? 14 :
                        digitsOnly.startsWith('020') ? 11 : 10;
                      setPhoneNumber(digitsOnly.slice(0, maxLen));
                    }}
                    className={`block w-full pl-[88px] border rounded-xl py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                      theme === 'dark' 
                        ? 'bg-zinc-950 border-white/10 text-white placeholder-zinc-600' 
                        : 'bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                    }`}
                    placeholder={t.phonePlaceholder}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-teal-400 hover:via-emerald-400 hover:to-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-zinc-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      {t.sendCodeBtn}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              {error && (
                <div className="flex items-start gap-3 p-3.5 rounded-2xl border bg-rose-500/10 border-rose-500/20 text-rose-500 text-xs sm:text-sm font-medium animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className={`block text-xs sm:text-sm font-bold uppercase tracking-wider text-center mb-4 ${
                  theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'
                }`}>
                  {t.verifyLabel}
                </label>
                <div className="flex justify-center">
                  <OtpInput
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      setError(null);
                    }}
                    length={6}
                  />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-2 text-xs sm:text-sm">
                {countdown > 0 ? (
                  <p className={`${theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'}`}>
                    {t.resendIn} <span className="font-bold text-emerald-500">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-emerald-500 hover:text-emerald-600 font-bold hover:underline bg-transparent border-none cursor-pointer focus:outline-none transition-colors disabled:opacity-50"
                  >
                    {t.resendCode}
                  </button>
                )}
                {resendMessage && (
                  <p className="text-emerald-500 font-medium text-center text-xs">
                    {resendMessage}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-teal-400 hover:via-emerald-400 hover:to-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-zinc-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      {t.verifyBtn}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border rounded-xl text-sm font-semibold transition-colors focus:outline-none ${
                    theme === 'dark' 
                      ? 'border-white/10 text-zinc-300 bg-transparent hover:bg-white/5' 
                      : 'border-gray-200 text-gray-700 bg-transparent hover:bg-gray-50'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.backToPhone}
                </button>
              </div>
            </form>
          )}

          {step === '2fa' && (
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="text-center sm:text-left mb-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-adv-orange flex items-center justify-center mb-3 mx-auto sm:mx-0 shadow-xs">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-adv-slate'}`}>
                  {t.twoFactorTitle}
                </h2>
                <p className="text-xs text-gray-400 font-medium leading-relaxed mt-1">
                  {t.twoFactorPrompt}
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                  {t.twoFactorLabel}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    autoFocus
                    className={`w-full border rounded-2xl px-6 py-4 text-adv-slate font-mono font-black text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all ${
                      theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-[#F9FAFB] border-gray-200'
                    }`}
                  />
                  <Lock className="w-5 h-5 text-gray-300 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading || twoFactorCode.length < 6}
                  className="w-full py-4 rounded-2xl bg-adv-slate hover:bg-black text-white font-bold text-sm transition-all shadow-xl shadow-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-adv-orange" />
                  ) : (
                    <Smartphone className="w-5 h-5 text-adv-orange" />
                  )}
                  <span>{t.verify2faBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border rounded-xl text-sm font-semibold transition-colors focus:outline-none ${
                    theme === 'dark' 
                      ? 'border-white/10 text-zinc-300 bg-transparent hover:bg-white/5' 
                      : 'border-gray-200 text-gray-700 bg-transparent hover:bg-gray-50'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.backToPhone}
                </button>
              </div>
            </form>
          )}

          {step === 'phone' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-150'}`} />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className={`px-3 font-bold uppercase tracking-widest ${
                    theme === 'dark' 
                      ? 'bg-zinc-950 sm:bg-zinc-900 text-zinc-500' 
                      : 'bg-white sm:bg-white text-gray-400'
                  }`}>{t.orContinue}</span>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={async () => {
                    setError(null);
                    setIsLoading(true);
                    try {
                      await loginWithGoogle();
                      if (safeStorage.getItem('user_2fa_enabled') === 'true') {
                        setStep('2fa');
                        setIsLoading(false);
                        return;
                      }
                      finishLoginAndRedirect();
                    } catch (err: any) {
                      setError(err.message || 'Google login failed');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-3 py-3.5 px-4 border rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer ${
                    theme === 'dark' 
                      ? 'border-white/10 bg-zinc-950 text-zinc-300 hover:bg-zinc-850 hover:text-white' 
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {t.googleSignIn}
                </button>
              </div>
            </div>
          )}

          <div className={`mt-8 text-center text-[10px] sm:text-xs leading-relaxed ${
            theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'
          }`}>
            {t.termsText1}{' '}
            <button onClick={() => setIsTermsOpen(true)} className="underline hover:text-adv-orange transition-colors cursor-pointer">
              {t.termsLink}
            </button>{' '}
            {t.termsText2}{' '}
            <button onClick={() => setIsPrivacyOpen(true)} className="underline hover:text-adv-orange transition-colors cursor-pointer">
              {t.privacyLink}
            </button>
          </div>
        </div>
      </div>
      
      {/* Terms Modal */}
      <AnimatePresence>
        {isTermsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTermsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-adv-orange">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-adv-slate tracking-tight">{t.terms}</h3>
                </div>
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 text-sm text-gray-500 leading-relaxed font-sans text-left">
                {termsSettings.sections && termsSettings.sections.map((section, idx) => (
                  <div key={idx}>
                    <h4 className="font-bold text-adv-slate text-base mb-2">
                      {lang === 'en' ? section.title_en : section.title_lo}
                    </h4>
                    <p className="whitespace-pre-wrap">
                      {lang === 'en' ? section.content_en : section.content_lo}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="px-5 py-2 rounded-xl bg-adv-orange hover:bg-orange-600 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'I Understand' : 'ຂ້ອຍເຂົ້າໃຈແລ້ວ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacyOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-adv-orange">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-adv-slate tracking-tight">{t.privacy}</h3>
                </div>
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 text-sm text-gray-500 leading-relaxed font-sans text-left">
                {privacySettings.sections && privacySettings.sections.map((section, idx) => (
                  <div key={idx}>
                    <h4 className="font-bold text-adv-slate text-base mb-2">
                      {lang === 'en' ? section.title_en : section.title_lo}
                    </h4>
                    <p className="whitespace-pre-wrap">
                      {lang === 'en' ? section.content_en : section.content_lo}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="px-5 py-2 rounded-xl bg-adv-orange hover:bg-orange-600 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'I Understand' : 'ຂ້ອຍເຂົ້າໃຈແລ້ວ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
