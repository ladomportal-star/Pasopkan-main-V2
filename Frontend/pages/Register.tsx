import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket, Phone, Key, ArrowRight, ArrowLeft, Globe, User, Mail, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../AuthContext';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import Logo from '../components/Logo';
import OtpInput from '../components/OtpInput';
import SEO from '../components/SEO';

export default function Register() {
  const navigate = useNavigate();
  const { loginAnonymously, loginWithGoogle } = useAuth();
  const { lang, toggleLanguage } = useLanguage();
  const { theme } = useTheme();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translations = {
    en: {
      back: 'Back',
      registerTitle: 'Create an account',
      verifyTitle: 'Enter verification code',
      or: 'Or',
      signIn: 'sign in to your account',
      sentCode: 'We sent a code to',
      nameLabel: 'Full name',
      namePlaceholder: 'John Doe',
      emailLabel: 'Email address (optional)',
      emailPlaceholder: 'you@example.com',
      phoneLabel: 'Phone number',
      phonePlaceholder: '+856 20 XXXXXXXX',
      sendCodeBtn: 'Send Code',
      verifyLabel: 'Verification Code',
      verifyPlaceholder: '123456',
      verifyBtn: 'Verify & Create Account',
      backToDetails: 'Back to details',
      orContinue: 'Or continue with',
      googleSignIn: 'Sign up with Google'
    },
    lo: {
      back: 'ກັບຄືນ',
      registerTitle: 'ສ້າງບັນຊີໃໝ່',
      verifyTitle: 'ໃສ່ລະຫັດຢືນຢັນ',
      or: 'ຫຼື',
      signIn: 'ເຂົ້າສູ່ລະບົບ',
      sentCode: 'ພວກເຮົາໄດ້ສົ່ງລະຫັດໄປທີ່',
      nameLabel: 'ຊື່ ແລະ ນາມສະກຸນ',
      namePlaceholder: 'ຈອນ ໂດ',
      emailLabel: 'ອີເມວ (ບໍ່ບັງຄັບ)',
      emailPlaceholder: 'you@example.com',
      phoneLabel: 'ເບີໂທລະສັບ',
      phonePlaceholder: '+856 20 XXXXXXXX',
      sendCodeBtn: 'ສົ່ງລະຫັດ',
      verifyLabel: 'ລະຫັດຢືນຢັນ',
      verifyPlaceholder: '123456',
      verifyBtn: 'ຢືນຢັນ & ສ້າງບັນຊີ',
      backToDetails: 'ກັບຄືນໄປແກ້ໄຂຂໍ້ມູນ',
      orContinue: 'ຫຼື ສືບຕໍ່ດ້ວຍ',
      googleSignIn: 'ລົງທະບຽນດ້ວຍ Google'
    }
  };

  const t = translations[lang];

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

    if (name.length > 0) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
      setStep('otp');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length >= 4) {
      setIsLoading(true);
      setError(null);
      try {
        // Save profile locally first so AuthContext can pick it up for the new Firebase user
        const parts = name.trim().split(/\s+/);
        const firstName = parts[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        const registrationProfile = {
          firstName,
          lastName,
          email: email || '',
          phone: phoneNumber,
          gender: '',
          dob: '',
        };
        localStorage.setItem('pasopkan_user_profile', JSON.stringify(registrationProfile));

        await loginAnonymously();
        navigate('/');
      } catch (err: any) {
        setError(err.message || 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
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
        title={t.registerTitle || (lang === 'lo' ? 'ສ້າງບັນຊີ Pasopkan' : 'Create an Account | Pasopkan')}
        description="Register for a Pasopkan account to discover, book, and organize events in Laos."
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
          {step === 'details' ? t.registerTitle : t.verifyTitle}
        </h2>
        <p className={`mt-2 text-center text-sm ${
          theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
        }`}>
          {step === 'details' ? (
            <>
              {t.or}{' '}
              <Link to="/login" className="font-semibold text-emerald-500 hover:text-emerald-600 transition-colors">
                {t.signIn}
              </Link>
            </>
          ) : (
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
          {step === 'details' ? (
            <form className="space-y-4 sm:space-y-5" onSubmit={handleSendOtp}>
              {error && (
                <div className="flex items-start gap-3 p-3.5 rounded-2xl border bg-rose-500/10 border-rose-500/20 text-rose-500 text-xs sm:text-sm font-medium animate-shake">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label htmlFor="name" className={`block text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'
                }`}>
                  {t.nameLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className={`h-5 w-5 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`block w-full pl-11 border rounded-xl py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                      theme === 'dark' 
                        ? 'bg-zinc-950 border-white/10 text-white placeholder-zinc-600' 
                        : 'bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                    }`}
                    placeholder={t.namePlaceholder}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className={`block text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'
                }`}>
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className={`h-5 w-5 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-11 border rounded-xl py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                      theme === 'dark' 
                        ? 'bg-zinc-950 border-white/10 text-white placeholder-zinc-600' 
                        : 'bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                    }`}
                    placeholder={t.emailPlaceholder}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className={`block text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 ${
                  theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'
                }`}>
                  {t.phoneLabel}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Phone className={`h-5 w-5 ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-400'}`} />
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
                    className={`block w-full pl-11 border rounded-xl py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                      theme === 'dark' 
                        ? 'bg-zinc-950 border-white/10 text-white placeholder-zinc-600' 
                        : 'bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                    }`}
                    placeholder={t.phonePlaceholder}
                  />
                </div>
              </div>

              <div className="pt-2">
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
              <div>
                <label className={`block text-xs sm:text-sm font-bold uppercase tracking-wider text-center mb-4 ${
                  theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'
                }`}>
                  {t.verifyLabel}
                </label>
                <div className="flex justify-center">
                  <OtpInput
                    value={otp}
                    onChange={(val) => setOtp(val)}
                    length={6}
                  />
                </div>
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
                  onClick={() => setStep('details')}
                  className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 border rounded-xl text-sm font-semibold transition-colors focus:outline-none ${
                    theme === 'dark' 
                      ? 'border-white/10 text-zinc-300 bg-transparent hover:bg-white/5' 
                      : 'border-gray-200 text-gray-700 bg-transparent hover:bg-gray-50'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t.backToDetails}
                </button>
              </div>
            </form>
          )}

          {step === 'details' && (
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
                      navigate('/');
                    } catch (err: any) {
                      setError(err.message || 'Google registration failed');
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
        </div>
      </div>
    </motion.div>
  );
}
