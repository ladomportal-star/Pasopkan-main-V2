import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreditCard, DollarSign, Download, RefreshCw, Search, UploadCloud } from "lucide-react";
import { api } from "../lib/api";

type Payout = {
  eventId: string;
  eventTitle: string;
  eventStatus: string;
  organizer: {
    id: string;
    name: string;
    bankName: string | null;
    accountNumber: string | null;
    accountHolder: string | null;
  };
  grossKip: number;
  feePercent: number;
  feeKip: number;
  payoutKip: number;
  status: "pending" | "paid";
  hasBill: boolean;
  paidAt: string | null;
};

type Filter = "all" | "pending" | "paid";

const MAX_BILL_BYTES = 5 * 1024 * 1024;
const kip = (amount: number) => `${amount.toLocaleString("en-US")} ₭`;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image file"));
    reader.readAsDataURL(file);
  });
}

/** Admin payouts: per-event organizer payout with editable fee and bill upload (real backend API). */
export default function AdminPayouts({ token }: { token: string | null }) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feeDraft, setFeeDraft] = useState("");
  const fileInput = useRef<HTMLInputElement | null>(null);
  const uploadTarget = useRef<string | null>(null);

  const options = useMemo(() => ({ token, throwOnError: true as const }), [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.get<{ payouts: Payout[] }>("/admin/payouts", options);
      setPayouts(result.data?.payouts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load payouts");
    } finally {
      setLoading(false);
    }
  }, [options, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return payouts.filter(
      (payout) =>
        (filter === "all" || payout.status === filter) &&
        (!needle ||
          [payout.eventTitle, payout.organizer.name]
            .some((value) => value.toLowerCase().includes(needle))),
    );
  }, [filter, payouts, search]);

  const totalProfitKip = visible.reduce((sum, payout) => sum + payout.feeKip, 0);

  async function saveFee(payout: Payout) {
    const feePercent = Number(feeDraft);
    if (!Number.isInteger(feePercent) || feePercent < 0 || feePercent > 100) {
      setError("ຄ່າທຳນຽມຕ້ອງເປັນຕົວເລກເຕັມ 0–100");
      return;
    }
    setBusyKey(`fee:${payout.eventId}`);
    setError("");
    try {
      await api.patch(`/admin/payouts/${payout.eventId}`, { feePercent }, options);
      setEditingId(null);
      setMessage("ບັນທຶກຄ່າທຳນຽມແລ້ວ");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the fee");
    } finally {
      setBusyKey("");
    }
  }

  async function uploadBill(eventId: string, file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("ຮອງຮັບສະເພາະຮູບ PNG, JPEG ຫຼື WebP");
      return;
    }
    if (file.size > MAX_BILL_BYTES) {
      setError("ຮູບຕ້ອງບໍ່ເກີນ 5 MB");
      return;
    }
    setBusyKey(`bill:${eventId}`);
    setError("");
    try {
      const dataUrl = await readAsDataUrl(file);
      await api.post(`/admin/payouts/${eventId}/bill`, { dataUrl }, options);
      setMessage("ອັບໂຫຼດບິນແລ້ວ — ສະຖານະເປັນ ຈ່າຍແລ້ວ");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bill upload failed");
    } finally {
      setBusyKey("");
    }
  }

  async function viewBill(eventId: string) {
    setBusyKey(`view:${eventId}`);
    setError("");
    try {
      const result = await api.get<{ url: string }>(`/admin/payouts/${eventId}/bill`, options);
      if (!result.data?.url) throw new Error("Bill image is unavailable");
      window.open(result.data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open the bill");
    } finally {
      setBusyKey("");
    }
  }

  function exportCsv() {
    const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["event", "organizer", "bank", "account_holder", "account_number", "gross_lak", "fee_percent", "fee_lak", "payout_lak", "status", "paid_at"],
      ...visible.map((payout) => [
        payout.eventTitle,
        payout.organizer.name,
        payout.organizer.bankName,
        payout.organizer.accountHolder,
        payout.organizer.accountNumber,
        payout.grossKip,
        payout.feePercent,
        payout.feeKip,
        payout.payoutKip,
        payout.status,
        payout.paidAt,
      ]),
    ];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    link.download = `pasopkan-payouts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <section className="min-h-[420px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          const target = uploadTarget.current;
          event.target.value = "";
          if (file && target) void uploadBill(target, file);
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <h2 className="text-xl font-black text-slate-950">ການເບີກຈ່າຍເງິນ</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> ຣີເຟຣຊ</button>
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-bold text-white"><Download className="h-4 w-4" /> ສົ່ງອອກ CSV</button>
          <label className="relative min-w-52"><Search className="absolute left-3 top-3 h-4 w-4 text-orange-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ຄົ້ນຫາ..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-300" /></label>
        </div>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
      {message && !error && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-orange-50 text-orange-500"><DollarSign className="h-6 w-6" /></span>
          <div>
            <p className="text-xs font-bold text-slate-500">ກຳໄລທັງໝົດ</p>
            <p className="text-2xl font-black text-slate-950">{kip(totalProfitKip)}</p>
          </div>
        </div>
        <div className="flex rounded-xl bg-slate-50 p-1" role="tablist" aria-label="Payout status">
          {(["all", "pending", "paid"] as const).map((item) => (
            <button key={item} type="button" role="tab" aria-selected={filter === item} onClick={() => setFilter(item)} className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wide ${filter === item ? "bg-white text-orange-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{item}</button>
          ))}
        </div>
      </div>

      {loading && payouts.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center text-sm font-semibold text-slate-500">ກຳລັງໂຫຼດ...</p>
      ) : visible.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center text-sm font-semibold text-slate-500">ບໍ່ພົບຂໍ້ມູນການຈ່າຍເງິນ.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {visible.map((payout) => {
            const paid = payout.status === "paid";
            const editing = editingId === payout.eventId;
            return (
              <article key={payout.eventId} className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_280px]">
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-black text-slate-950">{payout.eventTitle}</h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">ຜູ້ຈັດງານ: <span className="text-orange-600">{payout.organizer.name}</span></p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-black ${paid ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-orange-200 bg-orange-50 text-orange-600"}`}>{paid ? "ຈ່າຍແລ້ວ" : "ລໍຖ້າຈ່າຍ"}</span>
                  </div>
                  <div className="mt-4 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
                    <div><p className="text-[11px] font-bold text-slate-500">ລາຍຮັບທັງໝົດ</p><p className="mt-1 text-lg font-black text-slate-950">{kip(payout.grossKip)}</p></div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-500">ຄ່າທຳນຽມລະບົບ (%) {!paid && !editing && <button type="button" onClick={() => { setEditingId(payout.eventId); setFeeDraft(String(payout.feePercent)); }} className="ml-1 font-black text-orange-600">Edit</button>}</p>
                      {editing ? (
                        <div className="mt-1 flex items-center gap-1.5">
                          <input aria-label="Fee percent" type="number" min={0} max={100} step={1} value={feeDraft} onChange={(event) => setFeeDraft(event.target.value)} className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-sm font-bold" />
                          <span className="text-sm font-bold text-slate-500">%</span>
                          <button type="button" onClick={() => void saveFee(payout)} disabled={busyKey === `fee:${payout.eventId}`} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-black text-white disabled:opacity-50">ບັນທຶກ</button>
                          <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-black text-slate-500">ຍົກເລີກ</button>
                        </div>
                      ) : (
                        <p className="mt-1 text-lg font-black text-red-500">-{kip(payout.feeKip)} ({payout.feePercent}%)</p>
                      )}
                    </div>
                    <div><p className="text-[11px] font-bold uppercase text-orange-600">Payout amount</p><p className="mt-1 text-lg font-black text-emerald-600">{kip(payout.payoutKip)}</p></div>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <p className="flex items-center gap-2 text-sm font-black text-slate-950"><CreditCard className="h-4 w-4 text-orange-500" /> ຂໍ້ມູນການຮັບເງິນ (Payout)</p>
                  <dl className="mt-3 space-y-1.5 rounded-xl border border-orange-100 bg-orange-50/50 p-3 text-xs">
                    <div className="flex justify-between gap-3"><dt className="text-slate-500">ຊື່ບັນຊີທະນາຄານ:</dt><dd className="font-black text-slate-900">{payout.organizer.bankName || "—"}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-500">ຊື່:</dt><dd className="font-black text-slate-900">{payout.organizer.accountHolder || "—"}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-slate-500">ໝາຍເລກບັນຊີ:</dt><dd className="font-mono font-black text-slate-900">{payout.organizer.accountNumber || "—"}</dd></div>
                  </dl>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <button type="button" onClick={() => { uploadTarget.current = payout.eventId; fileInput.current?.click(); }} disabled={busyKey === `bill:${payout.eventId}`} className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-orange-600 disabled:opacity-50"><UploadCloud className="h-4 w-4" /> {busyKey === `bill:${payout.eventId}` ? "Uploading..." : "Upload bill image"}</button>
                    {payout.hasBill && <button type="button" onClick={() => void viewBill(payout.eventId)} disabled={busyKey === `view:${payout.eventId}`} className="text-[11px] font-black uppercase tracking-wide text-slate-500 underline disabled:opacity-50">ເບິ່ງບິນ</button>}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
