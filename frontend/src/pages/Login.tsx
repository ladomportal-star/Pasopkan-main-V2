import { useState } from 'react';
import { ArrowLeft, CheckCircle2, Globe2, Loader2, ShieldCheck, Sparkles, TicketCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import SEO from '../components/SEO';

const GoogleMark = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
    <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.8-2.4l-3.3-2.6c-.9.6-2.1 1-3.5 1a6 6 0 0 1-5.6-4.1H3v2.7A10.3 10.3 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.4H3A10 10 0 0 0 3 16.6l3.4-2.7Z" />
    <path fill="#EA4335" d="M12 6c1.5 0 2.9.5 3.9 1.5l3-3A10 10 0 0 0 3 7.4l3.4 2.7A6 6 0 0 1 12 6Z" />
  </svg>
);

export default function Login({ registering = false }: { registering?: boolean }) {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const { lang, toggleLanguage } = useLanguage();
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lo = lang === 'lo';
  const dark = theme === 'dark';

  const copy = {
    title: registering
      ? (lo ? 'ເລີ່ມຕົ້ນກັບ Pasopkan' : 'Start with Pasopkan')
      : (lo ? 'ຍິນດີຕ້ອນຮັບກັບຄືນ' : 'Welcome back'),
    subtitle: registering
      ? (lo ? 'ສ້າງບັນຊີຢ່າງປອດໄພດ້ວຍ Google' : 'Create your secure account with Google')
      : (lo ? 'ເຂົ້າລະບົບເພື່ອຈອງ ແລະຈັດການປີ້ຂອງທ່ານ' : 'Sign in to book and manage your tickets'),
    button: registering
      ? (lo ? 'ສ້າງບັນຊີດ້ວຍ Google' : 'Create account with Google')
      : (lo ? 'ສືບຕໍ່ດ້ວຍ Google' : 'Continue with Google'),
  };

  async function signIn() {
    setBusy(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch {
      setError(lo
        ? 'ບໍ່ສາມາດເຊື່ອມຕໍ່ Google ໄດ້. ກະລຸນາກວດການຕັ້ງຄ່າ ແລ້ວລອງໃໝ່.'
        : 'Could not connect to Google. Check the authentication setup and try again.');
      setBusy(false);
    }
  }

  return (
    <main className={`relative min-h-screen overflow-hidden transition-colors duration-300 ${
      dark ? 'bg-zinc-950 text-white' : 'bg-[#fffaf6] text-adv-slate'
    }`}>
      <SEO
        title={registering ? (lo ? 'ສ້າງບັນຊີ Pasopkan' : 'Create a Pasopkan account') : (lo ? 'ເຂົ້າສູ່ Pasopkan' : 'Sign in to Pasopkan')}
        description="Sign in securely with Google to discover experiences and manage Pasopkan tickets."
        noindex
      />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-28 -top-36 h-96 w-96 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="absolute -bottom-44 right-[-7rem] h-[30rem] w-[30rem] rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.035] texture-bg" />
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
            dark ? 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white' : 'bg-white/75 text-slate-600 shadow-sm ring-1 ring-black/5 hover:bg-white hover:text-slate-950'
          }`}
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          {lo ? 'ກັບໜ້າຫຼັກ' : 'Back home'}
        </button>
        <button
          type="button"
          onClick={toggleLanguage}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all ${
            dark ? 'bg-white/5 text-zinc-300 hover:bg-white/10' : 'bg-white/75 text-slate-600 shadow-sm ring-1 ring-black/5 hover:bg-white'
          }`}
          aria-label={lo ? 'Switch to English' : 'ປ່ຽນເປັນພາສາລາວ'}
        >
          <Globe2 className="h-4 w-4 text-adv-orange" />
          {lo ? 'ລາວ' : 'EN'}
        </button>
      </header>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-7xl items-center gap-10 px-5 pb-10 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:pb-20">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:block"
        >
          <Link to="/" className="inline-flex">
            <img src="/pasopkan_logo.png" alt="Pasopkan" className="h-28 w-auto object-contain" />
          </Link>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
            <Sparkles className="h-4 w-4" />
            {lo ? 'ປະສົບການດີໆ ເລີ່ມຕົ້ນທີ່ນີ້' : 'Great experiences start here'}
          </div>
          <h1 className={`mt-6 max-w-2xl text-5xl font-black leading-[1.13] tracking-[-0.045em] xl:text-6xl ${dark ? 'text-white' : 'text-slate-950'}`}>
            {lo ? 'ຄົ້ນພົບ ຈອງ ແລະສ້າງຄວາມຊົງຈຳ' : 'Discover, book, and make memories.'}
          </h1>
          <p className={`mt-6 max-w-xl text-lg leading-8 ${dark ? 'text-zinc-400' : 'text-slate-600'}`}>
            {lo
              ? 'ລວມກິດຈະກຳ ງານບຸນ ແລະປະສົບການທີ່ໜ້າຈື່ຈຳທົ່ວປະເທດລາວ ໄວ້ໃນບ່ອນດຽວ.'
              : 'Events, festivals, and memorable experiences across Laos—carefully gathered in one place.'}
          </p>
          <div className="mt-9 grid max-w-xl gap-4 sm:grid-cols-3">
            {[
              [TicketCheck, lo ? 'ປີ້ດິຈິຕອນ' : 'Digital tickets'],
              [ShieldCheck, lo ? 'ປອດໄພ' : 'Secure access'],
              [CheckCircle2, lo ? 'ໃຊ້ງານງ່າຍ' : 'Easy booking'],
            ].map(([Icon, label]) => (
              <div key={String(label)} className={`rounded-2xl border p-4 ${dark ? 'border-white/10 bg-white/[0.035]' : 'border-white bg-white/70 shadow-sm'}`}>
                <Icon className="h-5 w-5 text-adv-orange" />
                <p className={`mt-3 text-sm font-bold ${dark ? 'text-zinc-200' : 'text-slate-800'}`}>{label as string}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 22, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={`mx-auto w-full max-w-[31rem] overflow-hidden rounded-[2rem] border p-6 shadow-2xl sm:p-9 ${
            dark ? 'border-white/10 bg-zinc-900/85 shadow-black/30 backdrop-blur-xl' : 'border-white/90 bg-white/90 shadow-orange-950/10 backdrop-blur-xl'
          }`}
        >
          <div className="mb-7 flex justify-center lg:hidden">
            <Link to="/"><img src="/pasopkan_logo.png" alt="Pasopkan" className="h-24 w-auto object-contain" /></Link>
          </div>

          <div className="flex items-center justify-between">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
              dark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {lo ? 'ປອດໄພດ້ວຍ Supabase' : 'Secured by Supabase'}
            </span>
          </div>

          <h2 className={`mt-7 text-3xl font-black tracking-[-0.035em] sm:text-4xl ${dark ? '!text-white' : '!text-slate-950'}`}>{copy.title}</h2>
          <p className={`mt-3 text-sm leading-6 sm:text-base ${dark ? 'text-zinc-400' : 'text-slate-500'}`}>{copy.subtitle}</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700"
            >
              {error}
            </motion.div>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={signIn}
            className={`group mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-4 text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/15 disabled:cursor-not-allowed disabled:opacity-60 ${
              dark
                ? 'border-white/10 bg-white text-slate-900 hover:bg-zinc-100'
                : 'border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg'
            }`}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin text-adv-orange" /> : <GoogleMark />}
            <span>{busy ? (lo ? 'ກຳລັງເຊື່ອມຕໍ່…' : 'Connecting…') : copy.button}</span>
          </button>

          <div className={`mt-6 flex items-start gap-3 rounded-2xl px-4 py-3.5 ${dark ? 'bg-white/[0.035]' : 'bg-slate-50'}`}>
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <p className={`text-xs leading-5 ${dark ? 'text-zinc-400' : 'text-slate-500'}`}>
              {lo
                ? 'Pasopkan ບໍ່ເຫັນ ຫຼືເກັບລະຫັດຜ່ານ Google ຂອງທ່ານ.'
                : 'Pasopkan never sees or stores your Google password.'}
            </p>
          </div>

          <p className={`mt-7 text-center text-xs leading-5 ${dark ? 'text-zinc-500' : 'text-slate-500'}`}>
            {lo ? 'ການສືບຕໍ່ໝາຍເຖິງທ່ານຍອມຮັບ' : 'By continuing, you agree to our'}{' '}
            <Link to="/terms" className="font-semibold text-adv-orange underline decoration-orange-300 underline-offset-4 hover:text-orange-600">
              {lo ? 'ຂໍ້ກຳນົດ' : 'Terms'}
            </Link>
            {' '}{lo ? 'ແລະ' : 'and'}{' '}
            <Link to="/privacy" className="font-semibold text-adv-orange underline decoration-orange-300 underline-offset-4 hover:text-orange-600">
              {lo ? 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ' : 'Privacy Policy'}
            </Link>
          </p>

          <div className={`mt-8 border-t pt-5 text-center text-sm ${dark ? 'border-white/10 text-zinc-400' : 'border-slate-100 text-slate-500'}`}>
            {registering ? (lo ? 'ມີບັນຊີແລ້ວ?' : 'Already have an account?') : (lo ? 'ຍັງບໍ່ມີບັນຊີ?' : 'New to Pasopkan?')}{' '}
            <Link to={registering ? '/login' : '/register'} className="font-bold text-adv-orange hover:text-orange-600">
              {registering ? (lo ? 'ເຂົ້າລະບົບ' : 'Sign in') : (lo ? 'ສ້າງບັນຊີ' : 'Create account')}
            </Link>
          </div>
        </motion.section>
      </div>
    </main>
  );
}
