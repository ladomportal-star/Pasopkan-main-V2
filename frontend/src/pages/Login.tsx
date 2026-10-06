import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Logo from '../components/Logo';
import SEO from '../components/SEO';

export default function Login({ registering = false }: { registering?: boolean }) {
  const { loginWithGoogle } = useAuth();
  const { lang } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lo = lang === 'lo';
  const title = registering ? (lo ? 'ສ້າງບັນຊີ' : 'Create an account') : (lo ? 'ເຂົ້າສູ່ລະບົບ' : 'Sign in');
  async function signIn() {
    setBusy(true);
    setError('');
    try { await loginWithGoogle(); }
    catch { setError(lo ? 'ບໍ່ສາມາດເຂົ້າສູ່ລະບົບໄດ້. ກະລຸນາລອງໃໝ່.' : 'Sign-in failed. Please try again.'); setBusy(false); }
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-5 py-12">
      <SEO title={title} />
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm border border-gray-100">
        <Link to="/" className="inline-block mb-8"><Logo /></Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">{title}</h1>
        <p className="text-gray-500 mb-8">{lo ? 'ໃຊ້ບັນຊີ Google ເພື່ອຈອງ ແລະຈັດການປີ້ຂອງທ່ານ.' : 'Continue with Google to book and manage your tickets.'}</p>
        {error && <p role="alert" className="text-red-600 mb-4">{error}</p>}
        <button type="button" disabled={busy} onClick={signIn} className="w-full rounded-xl border border-gray-300 px-5 py-4 font-semibold hover:bg-gray-50 disabled:opacity-50">
          {busy ? (lo ? 'ກຳລັງເຊື່ອມຕໍ່…' : 'Connecting…') : (lo ? 'ສືບຕໍ່ດ້ວຍ Google' : 'Continue with Google')}
        </button>
        <p className="mt-6 text-xs text-gray-500">
          <Link to="/terms" className="underline">{lo ? 'ຂໍ້ກຳນົດການໃຊ້ງານ' : 'Terms of service'}</Link>
          {' · '}<Link to="/privacy" className="underline">{lo ? 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ' : 'Privacy policy'}</Link>
        </p>
      </section>
    </main>
  );
}
