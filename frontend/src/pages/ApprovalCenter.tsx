import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import EventStaffManager from '../components/EventStaffManager';

type Application = { id: string; name: string; status: string; rejectionReason?: string };
type Event = { id: string; title: string; status: string; venueName?: string | null; description?: string | null; rejectionReason?: string };
type Refund = { id: string; amountKip: number; status: string; reason: string; paymentId: string };

/** All decisions persist through authorized backend endpoints; no local approval state. */
export default function ApprovalCenter({ admin = false }: { admin?: boolean }) {
  const { user, loading, token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTierName, setEventTierName] = useState('');
  const [eventTierPrice, setEventTierPrice] = useState('0');
  const [eventTierQuantity, setEventTierQuantity] = useState('');
  const [eventStatus, setEventStatus] = useState<'draft' | 'pending_review'>('draft');
  const [editingId, setEditingId] = useState<string | null>(null);
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
    const e = await api.get<{ events: Event[]; nextCursor?: string | null }>(admin ? '/admin/events' : '/events?mine=true', opts);
    const r = admin ? await api.get<{ refunds: Refund[] }>('/admin/refunds', opts) : null;
    setApplications(a.data?.applications ?? []);
    setEvents(e.data?.events ?? []);
    setNextCursor(admin ? e.data?.nextCursor ?? null : null);
    setRefunds(r?.data?.refunds ?? []);
  }, [admin, token]);
  async function loadMoreEvents() {
    if (!nextCursor) return;
    setBusy(true); setError('');
    try {
      const page = await api.get<{ events: Event[]; nextCursor: string | null }>(`/admin/events?cursor=${encodeURIComponent(nextCursor)}`, { token, throwOnError: true });
      setEvents(current => [...current, ...(page.data?.events ?? []).filter(row => !current.some(existing => existing.id === row.id))]);
      setNextCursor(page.data?.nextCursor ?? null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Request failed'); }
    finally { setBusy(false); }
  }
  async function saveEvent(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const opts = { token, throwOnError: true };
      if (editingId) {
        await api.updateEvent(editingId, { title: eventTitle.trim(), venueName: eventVenue.trim() || null, description: eventDescription.trim() || null }, opts);
      } else {
        const priceKip = Number(eventTierPrice);
        const quantityTotal = eventTierQuantity ? Number(eventTierQuantity) : null;
        if (eventTierName.trim() && (!Number.isSafeInteger(priceKip) || priceKip < 0 || (quantityTotal !== null && (!Number.isSafeInteger(quantityTotal) || quantityTotal < 0)))) throw new Error('Ticket price/quantity must be whole non-negative numbers');
        await api.createEvent({ title: eventTitle.trim(), venueName: eventVenue.trim() || null, description: eventDescription.trim() || null, status: eventStatus,
          tiers: eventTierName.trim() ? [{ name: eventTierName.trim(), priceKip, quantityTotal }] : [] }, opts);
      }
      setEventTitle(''); setEventVenue(''); setEventDescription(''); setEventTierName(''); setEventTierPrice('0'); setEventTierQuantity(''); setEventStatus('draft'); setEditingId(null);
      setMessage('ບັນທຶກງານສຳເລັດ / Event saved');
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Request failed'); }
    finally { setBusy(false); }
  }
  function editEvent(event: Event) {
    setEditingId(event.id);
    setEventTitle(event.title);
    setEventVenue(event.venueName ?? '');
    setEventDescription(event.description ?? '');
  }
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
      {admin && <form onSubmit={e => void saveEvent(e)} className="rounded-xl border bg-white p-4 space-y-3">
        <h3 className="font-semibold">{editingId ? 'ແກ້ໄຂງານ / Edit event' : 'ສ້າງງານໃນນາມ Admin / Create event'}</h3>
        <label className="block text-sm">ຊື່ງານ / Title<input required maxLength={200} value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="mt-1 w-full rounded border p-2" /></label>
        <label className="block text-sm">ສະຖານທີ່ / Venue<input value={eventVenue} onChange={e => setEventVenue(e.target.value)} className="mt-1 w-full rounded border p-2" /></label>
        <label className="block text-sm">ລາຍລະອຽດ / Description<textarea value={eventDescription} onChange={e => setEventDescription(e.target.value)} className="mt-1 w-full rounded border p-2" /></label>
        {!editingId && <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">ຊື່ປະເພດປີ້ / Ticket tier<input value={eventTierName} onChange={e => setEventTierName(e.target.value)} placeholder="Optional" className="mt-1 w-full rounded border p-2" /></label>
          <label className="block text-sm">ລາຄາ (LAK) / Price<input type="number" min="0" step="1" value={eventTierPrice} onChange={e => setEventTierPrice(e.target.value)} disabled={!eventTierName.trim()} className="mt-1 w-full rounded border p-2" /></label>
          <label className="block text-sm">ຈຳນວນປີ້ / Quantity<input type="number" min="0" step="1" value={eventTierQuantity} onChange={e => setEventTierQuantity(e.target.value)} disabled={!eventTierName.trim()} placeholder="Unlimited" className="mt-1 w-full rounded border p-2" /></label>
          <label className="block text-sm">ສະຖານະ / Status<select value={eventStatus} onChange={e => setEventStatus(e.target.value as 'draft' | 'pending_review')} className="mt-1 w-full rounded border p-2"><option value="draft">Draft</option><option value="pending_review">Ready for Admin review</option></select></label>
        </div>}
        <div className="flex gap-3"><button disabled={busy} className="rounded bg-orange-600 px-4 py-2 text-white disabled:opacity-50">{editingId ? 'Save changes' : 'Create event'}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setEventTitle(''); setEventVenue(''); setEventDescription(''); }} className="underline">Cancel edit</button>}</div>
      </form>}
      {!admin && <Link className="underline" to="/create">Create event / ສ້າງກິດຈະກຳ</Link>}
      {!events.length && <p>No events / ບໍ່ມີກິດຈະກຳ</p>}
      {events.map(e => <article key={e.id} className="border rounded-xl p-4 space-y-2"><Link className="underline" to={`/event/${e.id}`}>{e.title}</Link><p>{e.status} {e.rejectionReason}</p>
        {admin ? <><button type="button" disabled={busy || ['cancelled', 'completed'].includes(e.status)} className="border p-2 mr-2 disabled:opacity-40" onClick={() => editEvent(e)}>Edit / ແກ້ໄຂ</button>
          {['draft', 'rejected'].includes(e.status) && <button disabled={busy} className="border p-2 mr-2" onClick={() => act(`/events/${e.id}`, { status: 'pending_review' }, true)}>Submit for review</button>}
          {e.status === 'pending_review' && <button disabled={busy} className="border p-2 mr-2" onClick={() => act(`/events/${e.id}`, { status: 'published' }, true)}>Publish</button>}
          {e.status === 'pending_review' && <><input aria-label="Event rejection reason" placeholder="Rejection reason" value={reasons[e.id] ?? ''} onChange={v => setReasons({ ...reasons, [e.id]: v.target.value })} className="border p-2 w-full" />
            <button disabled={busy || !reasons[e.id]?.trim()} className="border p-2" onClick={() => act(`/events/${e.id}`, { status: 'rejected', rejectionReason: reasons[e.id] }, true)}>Reject</button></>}</>
          : ['draft', 'rejected'].includes(e.status) && <button disabled={busy} className="border p-2" onClick={() => act(`/events/${e.id}`, { status: 'pending_review' }, true)}>Submit for review</button>}
        <EventStaffManager eventId={e.id} token={token} />
      </article>)}
      {admin && nextCursor && <button type="button" disabled={busy} onClick={() => void loadMoreEvents()} className="rounded border px-4 py-2 disabled:opacity-50">Load more events / ໂຫຼດເພີ່ມ</button>}
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
