import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import { isValidLaoMobilePhone, normalizeLaoPhone } from '../lib/phone';
import OtpInput from '../components/OtpInput';
import CreateEvent from './CreateEvent';

type Eligibility = { role: 'user' | 'organizer' | 'admin'; phoneVerified: boolean; phone: string | null; canCreateEvent: boolean };
type Application = { id: string; status: string; name: string; rejectionReason?: string | null };

/** Route gate. The backend independently enforces both phone verification and role. */
export default function OrganizerEntry() {
  const { user, token, loading: authLoading } = useAuth();
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [sentPhone, setSentPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const refresh = useCallback(async () => {
    if (!token) return;
    const opts = { token, throwOnError: true };
    const [eligibilityResult, applicationResult] = await Promise.all([
      api.get<Eligibility>('/organizer/eligibility', opts),
      api.get<{ applications: Application[] }>('/organizer-applications/mine', opts),
    ]);
    setEligibility(eligibilityResult.data);
    setApplications(applicationResult.data?.applications ?? []);
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    refresh().catch(err => { if (active) setError(err instanceof Error ? err.message : 'Could not load eligibility'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, user?.id, token, refresh]);

  async function sendCode(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeLaoPhone(phone);
    if (!isValidLaoMobilePhone(normalized)) { setError('ກະລຸນາໃສ່ເບີມືຖືລາວທີ່ຖືກຕ້ອງ / Enter a valid Lao mobile number'); return; }
    setBusy(true); setError(''); setSentPhone(''); setCode('');
    try {
      // Phone change keeps the Google identity; signInWithOtp would create/switch accounts.
      const { error: authError } = await supabase.auth.updateUser({ phone: normalized });
      if (authError) throw authError;
      setSentPhone(normalized);
      setCode('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not send SMS OTP'); }
    finally { setBusy(false); }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code) || !sentPhone || !user) return;
    setBusy(true); setError('');
    try {
      const { error: authError } = await supabase.auth.verifyOtp({ phone: sentPhone, token: code, type: 'phone_change' });
      if (authError) throw authError;
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || data.user?.id !== user.id || data.user.phone !== sentPhone)
        throw new Error('Phone was not verified on this account. Please contact support.');
      await refresh();
      setCode(''); setSentPhone('');
    } catch (err) { setError(err instanceof Error ? err.message : 'OTP verification failed'); }
    finally { setBusy(false); }
  }

  async function apply(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      await api.post('/organizer-applications', { name: name.trim(), description: description.trim() }, { token, throwOnError: true });
      await refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Application failed'); }
    finally { setBusy(false); }
  }

  if (authLoading || loading) return <main className="min-h-screen grid place-items-center">ກຳລັງກວດສອບສິດ… / Checking access…</main>;
  if (!user || !token) return <main className="min-h-screen grid place-items-center p-6"><div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-bold">ສ້າງກິດຈະກຳ / Create event</h1><p className="my-4">ກະລຸນາເຂົ້າລະບົບກ່ອນ / Sign in first</p><Link to="/login" className="text-orange-600 underline">Sign in</Link></div></main>;
  if (eligibility?.canCreateEvent) return <CreateEvent />;

  const latest = applications[0];
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
    <div className="mx-auto max-w-xl space-y-6 rounded-3xl border bg-white p-6 shadow-sm sm:p-10">
      <Link to="/" className="text-sm text-orange-700 underline">← ກັບໜ້າຫຼັກ / Home</Link>
      <div className="flex items-center gap-3"><span className="rounded-2xl bg-orange-50 p-3 text-orange-600"><ShieldCheck size={28} /></span><div><h1 className="text-2xl font-bold">ສະໝັກເປັນ Organizer</h1><p className="text-sm text-slate-500">Verify phone → Apply → Admin approval → Create event</p></div></div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {!eligibility && <button type="button" onClick={() => { setError(''); setLoading(true); refresh().catch(err => setError(String(err))).finally(() => setLoading(false)); }} className="text-orange-700 underline">ລອງໃໝ່ / Retry</button>}
      {eligibility && !eligibility.phoneVerified && <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Smartphone size={20} /> 1. ຢືນຢັນເບີໂທ / Verify your phone</h2>
        <p className="text-sm text-slate-600">ໃຊ້ເບີມືຖືລາວຂອງທ່ານ. OTP ຈະຖືກສົ່ງໂດຍ Supabase Auth ໄປຫາເບີນີ້; ລະຫັດ demo ໃຊ້ບໍ່ໄດ້.</p>
        <form onSubmit={e => void sendCode(e)} className="flex gap-2"><input type="tel" autoComplete="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="020 XXXXXXXX" aria-label="Lao mobile number" className="min-w-0 flex-1 rounded-lg border p-3" /><button disabled={busy} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">ສົ່ງ OTP</button></form>
        {sentPhone && <form onSubmit={e => void verifyCode(e)} className="space-y-3 rounded-xl bg-slate-50 p-4"><p className="text-sm">OTP ສົ່ງໄປທີ່ {sentPhone}. ປ້ອນລະຫັດ 6 ຫຼັກ.</p><OtpInput value={code} onChange={setCode} /><button disabled={busy || code.length !== 6} className="w-full rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-50">ຢືນຢັນເບີໂທ / Verify</button></form>}
      </section>}
      {eligibility?.phoneVerified && !eligibility.canCreateEvent && <section className="space-y-4">
        <p className="rounded-lg bg-green-50 p-3 text-green-800">✓ ເບີໂທຢືນຢັນແລ້ວ: {eligibility.phone}</p>
        {latest?.status === 'pending' ? <p className="rounded-lg bg-amber-50 p-4 text-amber-900">ຄຳຂໍ Organizer ກຳລັງລໍຖ້າ Admin ອະນຸມັດ. ທ່ານຈະສ້າງ Event ໄດ້ຫຼັງການອະນຸມັດ.</p> : <form onSubmit={e => void apply(e)} className="space-y-3"><h2 className="text-lg font-semibold">2. ສະໝັກ Organizer / Apply</h2>{latest?.status === 'rejected' && <p className="text-red-700">ຄຳຂໍເກົ່າຖືກປະຕິເສດ: {latest.rejectionReason}</p>}<label className="block text-sm">ຊື່ຜູ້ຈັດງານ / Organizer name<input required maxLength={200} value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label><label className="block text-sm">ລາຍລະອຽດ / Description<textarea maxLength={5000} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border p-3" /></label><button disabled={busy} className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-50">ສົ່ງຄຳຂໍໃຫ້ Admin / Submit</button></form>}
        <button type="button" onClick={() => refresh().catch(err => setError(String(err)))} className="text-sm text-orange-700 underline">ກວດສະຖານະໃໝ່ / Refresh status</button>
      </section>}
    </div>
  </main>;
}
