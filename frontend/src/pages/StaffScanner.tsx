import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, QrCode, RefreshCw, ShieldCheck, Ticket, XCircle } from 'lucide-react';
import { api, type BackendCheckIn, type ScannerEvent } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

type LookupTicket = NonNullable<Awaited<ReturnType<typeof api.lookupTicket>>['data']>['ticket'];
const Scanner = lazy(() => import('@yudiel/react-qr-scanner').then((module) => ({ default: module.Scanner })));

/** All check-ins and authorization come from the backend; never local browser storage. */
export default function StaffScanner() {
  const [params, setParams] = useSearchParams();
  const { user, token, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<ScannerEvent[]>([]);
  const [eventId, setEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [code, setCode] = useState('');
  const [gate, setGate] = useState(params.get('gate') || 'Main gate');
  const [ticket, setTicket] = useState<LookupTicket | null>(null);
  const [checkins, setCheckins] = useState<BackendCheckIn[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const lastScan = useRef<{ code: string; at: number }>({ code: '', at: 0 });

  useEffect(() => {
    if (authLoading || !user || !token) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    api.listScannerEvents({ token }).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setError(result.error || 'Could not load assigned events');
        setEvents([]);
        return;
      }
      const allowed = result.data?.events ?? [];
      setError('');
      setEvents(allowed);
      const requested = params.get('eventId');
      setEventId(allowed.find((event) => event.id === requested)?.id || allowed[0]?.id || '');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, user?.id, token]);

  async function refreshCheckins(selectedEventId: string) {
    const result = await api.listCheckins(selectedEventId, { token });
    if (!result.ok) {
      setError(result.error || 'Could not load check-ins');
      setCheckins([]);
      return;
    }
    setError('');
    setCheckins(result.data?.checkIns ?? []);
  }

  useEffect(() => {
    setTicket(null);
    setCode('');
    setCheckins([]);
    setMessage('');
    if (!eventId || !token) return;
    let active = true;
    api.listCheckins(eventId, { token }).then((result) => {
      if (!active) return;
      if (result.ok) setCheckins(result.data?.checkIns ?? []);
      else setError(result.error || 'Could not load check-ins');
    });
    return () => { active = false; };
  }, [eventId, token]);

  function selectEvent(id: string) {
    setEventId(id);
    setCameraOpen(false);
    setError('');
    setParams(id ? { eventId: id } : {});
  }

  async function lookup(rawCode: string) {
    const normalized = rawCode.trim();
    if (!normalized || !eventId || busy) return;
    setBusy(true); setError(''); setMessage(''); setTicket(null);
    try {
      const result = await api.lookupTicket(normalized, { token, throwOnError: true });
      const found = result.data?.ticket;
      if (!found) throw new Error('Ticket not found');
      if (found.eventId !== eventId) throw new Error('This ticket belongs to another event');
      setTicket(found);
      setCode(found.ticketCode);
      setCameraOpen(false);
      if (found.alreadyCheckedIn) setMessage('ປີ້ນີ້ເຊັກອິນແລ້ວ / Already checked in');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ticket lookup failed');
    } finally {
      setBusy(false);
    }
  }

  async function confirmCheckIn() {
    if (!ticket || !eventId || busy || ticket.alreadyCheckedIn) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api.scanCheckin({
        eventId,
        ticketCode: ticket.ticketCode,
        gate: gate.trim() || undefined,
      }, { token, throwOnError: true });
      if (!result.data?.checkIn) throw new Error('Server did not confirm the check-in');
      setTicket({ ...ticket, alreadyCheckedIn: true, checkedInAt: result.data.checkIn.checkedInAt });
      setMessage(result.data.status === 'checked_in'
        ? 'ຢືນຢັນເຂົ້າງານສຳເລັດ / Check-in confirmed by server'
        : 'ປີ້ນີ້ເຊັກອິນແລ້ວ / Already checked in');
      await refreshCheckins(eventId);
    } catch (err) {
      // Never show success or write a local check-in when the API rejects a scan.
      setError(err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setBusy(false);
    }
  }

  const selectedEvent = events.find((event) => event.id === eventId);
  const ticketIsValid = ticket?.orderStatus === 'confirmed' && ticket.itemStatus === 'valid' && !ticket.alreadyCheckedIn;

  if (authLoading || loading) return <main className="min-h-screen grid place-items-center">ກຳລັງໂຫຼດ / Loading…</main>;
  if (!user || !token) return <main className="min-h-screen grid place-items-center p-6"><div className="text-center space-y-3"><h1 className="text-2xl font-bold">Staff check-in</h1><p>ກະລຸນາເຂົ້າລະບົບກ່ອນສະແກນປີ້.</p><Link to="/login" className="text-orange-600 underline">ເຂົ້າລະບົບ / Sign in</Link></div></main>;

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <SEO title="Staff ticket check-in | Pasopkan" description="Verify event tickets securely at the gate." />
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-orange-600"><ArrowLeft size={16} /> ກັບໜ້າຫຼັກ / Home</Link>
          <h1 className="mt-3 text-3xl font-extrabold">ກວດປີ້ເຂົ້າງານ <span className="text-orange-600">/ Staff scanner</span></h1>
          <p className="mt-1 text-sm text-slate-600">ສິດແລະຜົນເຊັກອິນຢືນຢັນໂດຍ Backend ເທົ່ານັ້ນ.</p></div>
        <ShieldCheck className="text-orange-600" size={32} aria-hidden="true" />
      </header>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800"><XCircle className="inline mr-2" size={18} />{error}</p>}

      {!events.length ? <section className="rounded-2xl border bg-white p-6"><h2 className="font-bold">ຍັງບໍ່ມີງານທີ່ມີສິດສະແກນ</h2><p className="mt-2 text-sm text-slate-600">ກະລຸນາໃຫ້ Organizer ຫຼື Admin ມອບໝາຍທ່ານເປັນ Staff ສຳລັບງານ.</p></section> : <>
        <section className="rounded-2xl border bg-white p-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">ງານທີ່ມີສິດ / Assigned event
            <select value={eventId} onChange={(event) => selectEvent(event.target.value)} className="mt-2 w-full rounded-xl border px-3 py-3 bg-white">
              {events.map((event) => <option key={event.id} value={event.id}>{event.title} ({event.status})</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">ປະຕູ / Gate
            <input value={gate} onChange={(event) => setGate(event.target.value)} maxLength={100} className="mt-2 w-full rounded-xl border px-3 py-3" />
          </label>
          <p className="sm:col-span-2 text-sm text-slate-500">{selectedEvent?.venueName || '—'}{selectedEvent?.startDate ? ` · ${new Date(selectedEvent.startDate).toLocaleDateString()}` : ''}</p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-white p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold"><QrCode className="text-orange-600" /> ສະແກນ ຫຼື ປ້ອນລະຫັດ</h2>
            {cameraOpen ? <div className="overflow-hidden rounded-xl bg-slate-950">
              <Suspense fallback={<div className="grid min-h-48 place-items-center text-white">ກຳລັງເປີດກ້ອງ…</div>}><Scanner onScan={(results) => {
                const scanned = results[0]?.rawValue;
                if (!scanned) return;
                const now = Date.now();
                if (lastScan.current.code === scanned && now - lastScan.current.at < 3000) return;
                lastScan.current = { code: scanned, at: now };
                void lookup(scanned);
              }} onError={(err) => setCameraError(err?.message || 'Camera unavailable')} /></Suspense>
            </div> : <div className="grid place-items-center rounded-xl bg-slate-900 text-white min-h-48"><Camera size={42} aria-hidden="true" /></div>}
            {cameraError && <p role="alert" className="text-sm text-red-700">{cameraError}</p>}
            <button type="button" onClick={() => { setCameraError(''); setCameraOpen(!cameraOpen); }} className="rounded-xl border px-4 py-2 font-semibold">{cameraOpen ? 'ປິດກ້ອງ / Close camera' : 'ເປີດກ້ອງ / Open camera'}</button>
            <form onSubmit={(event) => { event.preventDefault(); void lookup(code); }} className="flex gap-2">
              <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Ticket code" aria-label="Ticket code" className="min-w-0 flex-1 rounded-xl border px-3 py-3 font-mono text-sm" />
              <button disabled={busy || !code.trim()} className="rounded-xl bg-orange-600 px-4 py-3 text-white font-semibold disabled:opacity-50">ກວດສອບ</button>
            </form>
          </section>

          <section className="rounded-2xl border bg-white p-5 space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Ticket className="text-orange-600" /> ຜົນກວດປີ້ / Ticket result</h2>
            {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-800"><CheckCircle2 className="inline mr-2" size={18} />{message}</p>}
            {!ticket && <p className="text-slate-500">ສະແກນ QR ຫຼື ປ້ອນລະຫັດປີ້ເພື່ອກວດສອບ.</p>}
            {ticket && <div className="space-y-3 text-sm">
              <p className="break-all font-mono text-slate-500">{ticket.ticketCode}</p>
              <p className="text-xl font-bold">{ticket.attendeeName || 'Guest'}</p>
              <p>{ticket.tierName} · {ticket.unitPriceKip.toLocaleString()} LAK</p>
              <p>Order: <strong>{ticket.orderStatus}</strong> · Ticket: <strong>{ticket.itemStatus}</strong></p>
              {ticket.alreadyCheckedIn && <p className="text-amber-700 font-semibold">ເຊັກອິນແລ້ວ {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleString() : ''}</p>}
              {ticket.orderStatus !== 'confirmed' && <p className="text-red-700">ຍັງບໍ່ໄດ້ຢືນຢັນການຊຳລະເງິນ.</p>}
              <button type="button" disabled={!ticketIsValid || busy} onClick={() => void confirmCheckIn()} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-white font-bold disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? 'ກຳລັງຢືນຢັນ…' : 'ຢືນຢັນເຂົ້າງານ / Confirm check-in'}
              </button>
            </div>}
          </section>
        </div>

        <section className="rounded-2xl border bg-white p-5 space-y-4">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-bold">ເຊັກອິນແລ້ວ / Recent check-ins ({checkins.length})</h2>
            <button type="button" onClick={() => void refreshCheckins(eventId)} className="inline-flex items-center gap-1 text-sm text-orange-700"><RefreshCw size={15} /> Refresh</button></div>
          {!checkins.length && <p className="text-sm text-slate-500">ຍັງບໍ່ມີການເຊັກອິນ.</p>}
          <ul className="divide-y">{checkins.map((row) => <li key={row.id} className="py-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span><strong>{row.attendeeName || 'Guest'}</strong> · {row.ticketType}<br /><span className="font-mono text-xs text-slate-500 break-all">{row.ticketCode}</span></span>
            <span className="text-slate-500">{new Date(row.checkedInAt).toLocaleString()} · {row.checkedInBy}</span>
          </li>)}</ul>
        </section>
      </>}
    </div>
  </main>;
}
