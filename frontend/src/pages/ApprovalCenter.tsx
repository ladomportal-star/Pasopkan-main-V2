import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Application = { id: string; name: string; status: string; rejectionReason?: string };
type Event = { id: string; title: string; status: string; rejectionReason?: string };
type Refund = { id: string; amountKip: number; status: string; reason: string; paymentId: string };

/** All decisions persist through authorized backend endpoints; no local approval state. */
export default function ApprovalCenter({ admin = false }: { admin?: boolean }) {
  const { user, loading, token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const allowed = !!user && (!admin || user.role === 'admin');
  const refresh = useCallback(async () => {
    const opts = { token, throwOnError: true };
    const a = await api.get<{ applications: Application[] }>(admin ? '/admin/organizer-applications' : '/organizer-applications/mine', opts);
    const e = await api.get<{ events: Event[] }>(admin ? '/admin/events' : '/events?mine=true', opts);
    const r = admin ? await api.get<{ refunds: Refund[] }>('/admin/refunds', opts) : null;
    setApplications(a.data?.applications ?? []);
    setEvents(e.data?.events ?? []);
    setRefunds(r?.data?.refunds ?? []);
  }, [admin, token]);
  useEffect(() => { if (allowed) refresh().catch(e => setError(String(e.message))); }, [allowed, refresh]);
  async function act(path: string, body?: unknown, put = false) {
    setBusy(true); setError(''); setMessage('');
    try {
      const opts = { token, throwOnError: true };
      if (put) await api.put(path, body, opts); else await api.post(path, body, opts);
      setMessage('ບັນທຶກສຳເລັດ / Saved');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Request failed'); }
    finally { setBusy(false); }
  }
  if (loading) return <p className="p-8">Loading…</p>;
  if (!user) return <div className="p-8"><Link to="/login">ກະລຸນາເຂົ້າລະບົບ / Sign in</Link></div>;
  if (!allowed) return <p className="p-8" role="alert">Admins only / ສຳລັບ Admin ເທົ່ານັ້ນ</p>;
  return <main className="max-w-4xl mx-auto w-full p-6 space-y-6">
    <Link to="/account" className="underline">← ບັນຊີ / Account</Link>
    <h1 className="text-2xl font-bold">{admin ? 'ສູນອະນຸມັດ / Admin review' : 'ຜູ້ຈັດງານ / Organizer'}</h1>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {message && <p role="status" className="text-green-700">{message}</p>}
    <button disabled={busy} onClick={() => refresh().catch(e => setError(e.message))} className="underline">Refresh / ໂຫຼດໃໝ່</button>
    {!admin && <form className="border rounded-xl p-4 space-y-3" onSubmit={e => { e.preventDefault(); void act('/organizer-applications', { name, description }); }}>
      <h2 className="font-bold">ສະໝັກເປັນຜູ້ຈັດງານ / Apply</h2>
      <label className="block">Name<input required maxLength={200} value={name} onChange={e => setName(e.target.value)} className="border rounded p-2 w-full" /></label>
      <label className="block">Description<textarea maxLength={5000} value={description} onChange={e => setDescription(e.target.value)} className="border rounded p-2 w-full" /></label>
      <button disabled={busy || applications.some(a => ['pending', 'approved'].includes(a.status))} className="border rounded p-2 disabled:opacity-40">Submit / ສົ່ງຄຳຂໍ</button>
    </form>}
    <section className="space-y-3"><h2 className="text-xl font-bold">Applications / ຄຳຂໍ</h2>
      {!applications.length && <p>No applications / ບໍ່ມີຄຳຂໍ</p>}
      {applications.map(a => <article key={a.id} className="border rounded-xl p-4 space-y-2"><h3>{a.name}</h3><p>{a.status} {a.rejectionReason}</p>
        {admin && <><input aria-label="Rejection reason" placeholder="Rejection reason / ເຫດຜົນ" value={reasons[a.id] ?? ''} onChange={e => setReasons({ ...reasons, [a.id]: e.target.value })} className="border p-2 w-full" />
          <button disabled={busy} className="border p-2 mr-2" onClick={() => act(`/admin/organizer-applications/${a.id}/review`, { approve: true })}>Approve</button>
          <button disabled={busy || !reasons[a.id]?.trim()} className="border p-2" onClick={() => act(`/admin/organizer-applications/${a.id}/review`, { approve: false, reason: reasons[a.id] })}>Reject</button></>}
      </article>)}
    </section>
    <section className="space-y-3"><h2 className="text-xl font-bold">Events / ກິດຈະກຳ</h2>
      {!admin && <Link className="underline" to="/create">Create event / ສ້າງກິດຈະກຳ</Link>}
      {!events.length && <p>No events / ບໍ່ມີກິດຈະກຳ</p>}
      {events.map(e => <article key={e.id} className="border rounded-xl p-4 space-y-2"><Link className="underline" to={`/event/${e.id}`}>{e.title}</Link><p>{e.status} {e.rejectionReason}</p>
        {admin ? <><input aria-label="Event rejection reason" placeholder="Rejection reason" value={reasons[e.id] ?? ''} onChange={v => setReasons({ ...reasons, [e.id]: v.target.value })} className="border p-2 w-full" />
          <button disabled={busy} className="border p-2 mr-2" onClick={() => act(`/events/${e.id}`, { status: 'published' }, true)}>Publish</button>
          <button disabled={busy || !reasons[e.id]?.trim()} className="border p-2" onClick={() => act(`/events/${e.id}`, { status: 'rejected', rejectionReason: reasons[e.id] }, true)}>Reject</button></>
          : ['draft', 'rejected'].includes(e.status) && <button disabled={busy} className="border p-2" onClick={() => act(`/events/${e.id}`, { status: 'pending_review' }, true)}>Submit for review</button>}
      </article>)}
    </section>
    {admin && <section className="space-y-3"><h2 className="text-xl font-bold">Refunds / ຄືນເງິນ</h2>
      <p>Approval only — provider transfers are not configured. ອະນຸມັດເທົ່ານັ້ນ, ຍັງບໍ່ໂອນເງິນ.</p>
      {!refunds.length && <p>No refunds</p>}
      {refunds.map(r => <article key={r.id} className="border rounded-xl p-4"><p>{r.amountKip.toLocaleString()} LAK · {r.status}</p><p>{r.reason}</p><p className="break-all text-sm">Payment: {r.paymentId}</p>
        {r.status === 'pending_approval' && <button disabled={busy} className="border p-2" onClick={() => { if (window.confirm(`Approve ${r.amountKip} LAK refund? This does not transfer money.`)) void act(`/admin/refunds/${r.id}/approve`); }}>Approve refund</button>}
      </article>)}
    </section>}
  </main>;
}
