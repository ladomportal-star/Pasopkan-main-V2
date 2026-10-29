import { useState } from 'react';
import { api, type EventStaffAssignment } from '../lib/api';

/** Organizer/admin-only controls. The API rechecks ownership for every request. */
export default function EventStaffManager({ eventId, token }: { eventId: string; token: string | null }) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<EventStaffAssignment[]>([]);
  const [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() {
    const result = await api.listEventStaff(eventId, { token, throwOnError: true });
    setStaff(result.data?.staff ?? []);
  }

  async function toggle() {
    if (open) return setOpen(false);
    setError('');
    try {
      await refresh();
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load staff');
    }
  }

  async function assign(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await api.assignEventStaff(eventId, identifier.trim(), { token, throwOnError: true });
      setIdentifier('');
      await refresh();
      setMessage(result.data?.staff.user
        ? 'ມອບໝາຍ Staff ສຳເລັດ / Staff assigned'
        : 'ເພີ່ມຊື່ Staff ແລ້ວ; ຕ້ອງສ້າງບັນຊີກ່ອນສະແກນ / Staff name added; account setup is needed before scanning');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not assign staff');
    } finally {
      setBusy(false);
    }
  }

  async function revoke(assignmentId: string) {
    setBusy(true); setError(''); setMessage('');
    try {
      await api.revokeEventStaff(eventId, assignmentId, { token, throwOnError: true });
      await refresh();
      setMessage('ຖອນສິດ Staff ແລ້ວ / Access revoked');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke staff');
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-3 border-t pt-3 space-y-3">
    <button type="button" className="underline text-sm" onClick={() => void toggle()}>
      {open ? 'ປິດ / Close' : 'ຈັດການ Staff / Manage staff'}
    </button>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="text-sm text-green-700">{message}</p>}
    {open && <>
      <p className="text-sm text-slate-600">Staff ຈະສະແກນໄດ້ສະເພາະງານນີ້. ຜູ້ຖືກມອບໝາຍຕ້ອງເຂົ້າລະບົບຫຼັງການອັບເດດນີ້ກ່ອນ.</p>
      <form className="flex flex-wrap gap-2" onSubmit={(event) => void assign(event)}>
        <input type="text" required value={identifier} onChange={(event) => setIdentifier(event.target.value)}
          aria-label="Staff name or account email" placeholder="Staff name or account email" className="border rounded-lg px-3 py-2 min-w-60 flex-1" />
        <button disabled={busy} className="rounded-lg bg-orange-600 px-4 py-2 text-white disabled:opacity-50">ມອບໝາຍ / Assign</button>
      </form>
      {!staff.length && <p className="text-sm text-slate-500">ຍັງບໍ່ມີ Staff / No assigned staff</p>}
      <ul className="space-y-2">
        {staff.map((assignment) => <li key={assignment.id} className="flex items-center justify-between gap-3 rounded-lg border p-2 text-sm">
          <span className="break-all">{assignment.staffName || ([assignment.user?.firstName, assignment.user?.lastName].filter(Boolean).join(' ') || assignment.user?.authEmail)}{assignment.user?.authEmail ? ` · ${assignment.user.authEmail}` : ' · ລໍຕັ້ງຄ່າບັນຊີ / Pending account'}</span>
          <button type="button" disabled={busy} onClick={() => void revoke(assignment.id)} className="shrink-0 text-red-700 underline disabled:opacity-50">ຖອນສິດ / Revoke</button>
        </li>)}
      </ul>
    </>}
  </div>;
}
