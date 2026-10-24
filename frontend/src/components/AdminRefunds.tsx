import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CircleCheck,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Plus,
  RotateCcw,
  Search,
  Ticket,
  X,
} from "lucide-react";
import { api } from "../lib/api";

export type AdminRefundItem = {
  id: string;
  amountKip: number;
  currency: string;
  status: string;
  reason: string;
  createdAt: string;
  reviewedAt?: string | null;
  reviewer?: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  payment: {
    provider: string;
    providerTransactionId: string | null;
    amountKip?: number;
    order: {
      orderNumber: string;
      eventTitle: string;
      buyerName?: string | null;
      buyerEmail?: string | null;
      buyerPhone?: string | null;
      user: {
        publicId: string | null;
        email: string;
        firstName?: string | null;
        lastName?: string | null;
        phone?: string | null;
      };
      items?: {
        id: string;
        tierName: string;
        unitPriceKip: number;
        ticketCode: string;
        status: string;
      }[];
    };
  };
};

type FilterTab = "all" | "pending" | "approved" | "rejected";

const kip = (amount: number) => `${amount.toLocaleString("en-US")} ₭`;

function refundCode(refund: AdminRefundItem) {
  const year = (refund.createdAt || "").slice(0, 4) || String(new Date().getFullYear());
  const num = (parseInt(refund.id.replace(/-/g, "").slice(0, 6), 16) % 9000) + 1000;
  return `REF-${year}-${num}`;
}

function formatDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buyerDisplayName(refund: AdminRefundItem) {
  const order = refund.payment.order;
  if (order.buyerName?.trim()) return order.buyerName.trim();
  const full = [order.user.firstName, order.user.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  return order.user.email.split("@")[0] || "ຜູ້ຊື້ປີ້";
}

function tierSummary(refund: AdminRefundItem) {
  const items = refund.payment.order.items ?? [];
  if (items.length === 0) return { label: "1x Standard Ticket", count: 1, ticketCode: refund.payment.order.orderNumber };
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.tierName, (counts.get(item.tierName) ?? 0) + 1);
  }
  const label = [...counts.entries()].map(([name, qty]) => `${qty}x ${name}`).join(", ");
  return {
    label,
    count: items.length,
    ticketCode: items[0]?.ticketCode || refund.payment.order.orderNumber,
  };
}

function isApprovedStatus(status: string) {
  return ["approved", "processing", "succeeded"].includes(status);
}

function isRejectedStatus(status: string) {
  return ["rejected", "failed"].includes(status);
}

export default function AdminRefunds({
  token,
  initialRefunds,
  onUpdated,
}: {
  token: string | null;
  initialRefunds?: AdminRefundItem[];
  onUpdated?: () => void;
}) {
  const [refunds, setRefunds] = useState<AdminRefundItem[]>(initialRefunds ?? []);
  const [loading, setLoading] = useState(!initialRefunds);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");
  const [topSearch, setTopSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewing, setViewing] = useState<AdminRefundItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [newReference, setNewReference] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newReason, setNewReason] = useState("");

  const authOptions = useMemo(() => ({ token, throwOnError: true as const }), [token]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await api.get<{ refunds: AdminRefundItem[] }>("/admin/refunds", authOptions);
      setRefunds(result.data?.refunds ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load refunds");
    } finally {
      setLoading(false);
    }
  }, [authOptions, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let approvedKip = 0;
    for (const r of refunds) {
      if (r.status === "pending_approval") pending += 1;
      else if (isApprovedStatus(r.status)) {
        approved += 1;
        approvedKip += r.amountKip;
      } else if (isRejectedStatus(r.status)) rejected += 1;
    }
    return {
      total: refunds.length,
      pending,
      approved,
      rejected,
      approvedKip,
    };
  }, [refunds]);

  const visible = useMemo(() => {
    const query = `${topSearch} ${tableSearch}`.trim().toLowerCase();
    return refunds.filter((refund) => {
      if (filter === "pending" && refund.status !== "pending_approval") return false;
      if (filter === "approved" && !isApprovedStatus(refund.status)) return false;
      if (filter === "rejected" && !isRejectedStatus(refund.status)) return false;
      if (!query) return true;
      const tier = tierSummary(refund);
      const haystack = [
        refundCode(refund),
        refund.payment.order.orderNumber,
        tier.ticketCode,
        tier.label,
        buyerDisplayName(refund),
        refund.payment.order.buyerEmail,
        refund.payment.order.user.email,
        refund.payment.order.buyerPhone,
        refund.payment.order.user.phone,
        refund.payment.order.eventTitle,
        refund.reason,
        refund.payment.provider,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [filter, refunds, tableSearch, topSearch]);

  const pendingTargets = useMemo(() => {
    const selectedPending = refunds.filter(
      (r) => selectedIds.includes(r.id) && r.status === "pending_approval",
    );
    if (selectedPending.length > 0) return selectedPending;
    return refunds.filter((r) => r.status === "pending_approval");
  }, [refunds, selectedIds]);

  async function handleSingleAction(refund: AdminRefundItem, action: "approve" | "reject") {
    setBusyKey(`${action}:${refund.id}`);
    setError("");
    setMessage("");
    try {
      await api.post(`/admin/refunds/${refund.id}/${action}`, undefined, authOptions);
      setMessage(action === "approve" ? "ອະນຸມັດການຄືນເງິນແລ້ວ" : "ປະຕິເສດຄຳຮ້ອງຂໍຄືນເງິນແລ້ວ");
      setSelectedIds((prev) => prev.filter((id) => id !== refund.id));
      await load();
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not process refund");
    } finally {
      setBusyKey("");
    }
  }

  async function handleBatchAction(action: "approve" | "reject") {
    if (pendingTargets.length === 0) return;
    setBusyKey(`batch:${action}`);
    setError("");
    setMessage("");
    try {
      await api.post(
        "/admin/refunds/batch",
        { ids: pendingTargets.map((r) => r.id), action },
        authOptions,
      );
      setMessage(
        action === "approve"
          ? `ອະນຸມັດການຄືນເງິນທັງໝົດ (${pendingTargets.length}) ສຳເລັດ`
          : `ປະຕິເສດທັງໝົດ (${pendingTargets.length}) ສຳເລັດ`,
      );
      setSelectedIds([]);
      await load();
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch refund operation failed");
    } finally {
      setBusyKey("");
    }
  }

  async function handleCreateRefund(event: React.FormEvent) {
    event.preventDefault();
    if (!newReference.trim() || !newReason.trim()) {
      setError("ກະລຸນາປ້ອນລະຫັດ Order/ປີ້ ແລະເຫດຜົນ");
      return;
    }
    const parsedAmount = newAmount.trim() ? Number(newAmount.trim()) : undefined;
    if (parsedAmount !== undefined && (!Number.isInteger(parsedAmount) || parsedAmount <= 0)) {
      setError("ຍອດເງິນຄືນຕ້ອງເປັນຕົວເລກຈຳນວນເຕັມທີ່ຫຼາຍກວ່າ 0");
      return;
    }
    setBusyKey("create");
    setError("");
    setMessage("");
    try {
      await api.post(
        "/admin/refunds",
        {
          reference: newReference.trim(),
          amountKip: parsedAmount,
          reason: newReason.trim(),
        },
        authOptions,
      );
      setCreating(false);
      setNewReference("");
      setNewAmount("");
      setNewReason("");
      setMessage("ສ້າງລາຍການຄືນເງິນໃໝ່ສຳເລັດ");
      await load();
      onUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create refund");
    } finally {
      setBusyKey("");
    }
  }

  function exportCsv() {
    const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      [
        "refund_code",
        "created_at",
        "ticket_or_order",
        "buyer_name",
        "buyer_email",
        "buyer_phone",
        "provider",
        "event_title",
        "tier_summary",
        "reason",
        "amount_lak",
        "status",
      ],
      ...visible.map((refund) => {
        const tier = tierSummary(refund);
        return [
          refundCode(refund),
          formatDateTime(refund.createdAt),
          tier.ticketCode,
          buyerDisplayName(refund),
          refund.payment.order.buyerEmail || refund.payment.order.user.email,
          refund.payment.order.buyerPhone || refund.payment.order.user.phone || "",
          refund.payment.provider,
          refund.payment.order.eventTitle,
          tier.label,
          refund.reason,
          refund.amountKip,
          refund.status,
        ];
      }),
    ];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    link.download = `pasopkan-refunds-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const allVisibleSelected =
    visible.length > 0 && visible.every((item) => selectedIds.includes(item.id));

  return (
    <section className="min-h-[420px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <h2 className="text-xl font-black text-slate-950">ຈັດການການຄືນເງິນ</h2>
        <label className="relative min-w-60">
          <Search className="absolute left-3 top-3 h-4 w-4 text-orange-500" />
          <input
            value={topSearch}
            onChange={(event) => setTopSearch(event.target.value)}
            placeholder="ຄົ້ນຫາ..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-300"
          />
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}
      {message && !error && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
        >
          {message}
        </p>
      )}

      {/* 4 Summary Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-500">ຄຳຮ້ອງຂໍທັງໝົດ</p>
              <p className="mt-4 text-2xl font-black text-slate-950">{counts.total}</p>
              <p className="mt-1 text-xs text-slate-400">ລວມທຸກສະຖານະ</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-600">
              <RotateCcw className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/20 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-amber-700">ລໍຖ້າການອະນຸມັດ</p>
              <p className="mt-4 text-2xl font-black text-amber-600">{counts.pending}</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                <AlertCircle className="h-3.5 w-3.5" /> ຕ້ອງການກວດສອບ
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-700">ຄືນເງິນສຳເລັດ</p>
              <p className="mt-4 text-2xl font-black text-emerald-600">{counts.approved}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">ໂອນເງິນສຳເລັດ</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <CircleCheck className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-500">ຍອດເງິນຄືນທັງໝົດ</p>
              <p className="mt-4 text-2xl font-black text-slate-950">{kip(counts.approvedKip)}</p>
              <p className="mt-1 text-xs text-slate-400">ຄິດໄລ່ຈາກທີ່ອະນຸມັດແລ້ວ</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: "ທັງໝົດ", count: counts.total },
              { id: "pending", label: "ລໍຖ້າກວດສອບ", count: counts.pending },
              { id: "approved", label: "ອະນຸມັດແລ້ວ", count: counts.approved },
              { id: "rejected", label: "ປະຕິເສດ", count: counts.rejected },
            ] as const
          ).map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-black transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-56">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={tableSearch}
              onChange={(event) => setTableSearch(event.target.value)}
              placeholder="ຄົ້ນຫາຊື່, ລະຫັດປີ້, ເຫດຜົນ..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs font-semibold outline-none focus:border-orange-300"
            />
          </label>

          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>

          <button
            type="button"
            disabled={pendingTargets.length === 0 || Boolean(busyKey)}
            onClick={() => void handleBatchAction("approve")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white shadow-sm disabled:opacity-50"
          >
            <CircleCheck className="h-3.5 w-3.5" /> ຄືນເງິນທັງໝົດ ({pendingTargets.length})
          </button>

          <button
            type="button"
            disabled={pendingTargets.length === 0 || Boolean(busyKey)}
            onClick={() => void handleBatchAction("reject")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-black text-red-600 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" /> ປະຕິເສດທັງໝົດ ({pendingTargets.length})
          </button>

          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-adv-orange px-3.5 py-2 text-xs font-black text-white shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> ອອກຄືນເງິນໃໝ່
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500">
                <th className="w-10 px-4 py-3.5">
                  <input
                    type="checkbox"
                    aria-label="Select all refunds"
                    checked={allVisibleSelected}
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedIds(visible.map((item) => item.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3.5">ລະຫັດ / ວັນທີ</th>
                <th className="px-4 py-3.5">ຜູ້ຊື້ປີ້</th>
                <th className="px-4 py-3.5">ກິດຈະກຳ & ປີ້</th>
                <th className="px-4 py-3.5">ຍອດເງິນຄືນ</th>
                <th className="px-4 py-3.5">ສະຖານະ</th>
                <th className="px-4 py-3.5 text-right">ການຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && refunds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm font-semibold text-slate-400">
                    ກຳລັງໂຫຼດຂໍ້ມູນການຄືນເງິນ...
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm font-semibold text-slate-400">
                    ບໍ່ພົບລາຍການຄືນເງິນໃນສະຖານະນີ້.
                  </td>
                </tr>
              ) : (
                visible.map((refund) => {
                  const code = refundCode(refund);
                  const tier = tierSummary(refund);
                  const buyerName = buyerDisplayName(refund);
                  const buyerEmail =
                    refund.payment.order.buyerEmail || refund.payment.order.user.email;
                  const buyerPhone =
                    refund.payment.order.buyerPhone || refund.payment.order.user.phone;
                  const approved = isApprovedStatus(refund.status);
                  const rejected = isRejectedStatus(refund.status);
                  const pending = refund.status === "pending_approval";

                  return (
                    <tr key={refund.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-4 align-top">
                        <input
                          type="checkbox"
                          aria-label={`Select ${code}`}
                          checked={selectedIds.includes(refund.id)}
                          onChange={(event) => {
                            setSelectedIds((prev) =>
                              event.target.checked
                                ? [...prev, refund.id]
                                : prev.filter((id) => id !== refund.id),
                            );
                          }}
                          className="mt-1 h-4 w-4 rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-1.5 font-black text-slate-900">
                          <span>{code}</span>
                          <button
                            type="button"
                            title="Copy code"
                            onClick={() => void navigator.clipboard?.writeText(code)}
                            className="text-slate-300 hover:text-slate-600"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatDateTime(refund.createdAt)}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <Ticket className="h-3 w-3" /> {tier.ticketCode.slice(0, 16)}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-black text-slate-900">{buyerName}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{buyerEmail}</p>
                        {buyerPhone && (
                          <p className="mt-0.5 text-xs text-slate-400">{buyerPhone}</p>
                        )}
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          <CreditCard className="h-3 w-3 text-slate-400" />
                          {refund.payment.provider || "Bank Transfer"}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-black text-slate-900">
                          {refund.payment.order.eventTitle}
                        </p>
                        <p className="mt-0.5 text-xs font-extrabold text-orange-600">
                          {tier.label}
                        </p>
                        <p className="mt-1 text-xs italic text-slate-400">
                          "{refund.reason}"
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="font-black text-slate-950">{kip(refund.amountKip)}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{tier.count} ປີ້</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        {approved ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-600">
                            <CircleCheck className="h-3.5 w-3.5" /> ຄືນເງິນແລ້ວ
                          </span>
                        ) : rejected ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-black text-red-600">
                            <X className="h-3.5 w-3.5" /> ປະຕິເສດ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">
                            <Clock className="h-3.5 w-3.5" /> ລໍຖ້າກວດສອບ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {pending && (
                            <>
                              <button
                                type="button"
                                title="ອະນຸມັດຄືນເງິນ"
                                disabled={Boolean(busyKey)}
                                onClick={() => void handleSingleAction(refund, "approve")}
                                className="grid h-8 w-8 place-items-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                title="ປະຕິເສດ"
                                disabled={Boolean(busyKey)}
                                onClick={() => void handleSingleAction(refund, "reject")}
                                className="grid h-8 w-8 place-items-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            title="ເບິ່ງລາຍລະອຽດ"
                            onClick={() => setViewing(refund)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Refund Details Modal */}
      {viewing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  ລາຍລະອຽດການຄືນເງິນ · {refundCode(viewing)}
                </h3>
                <p className="text-xs text-slate-500">{formatDateTime(viewing.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-6 text-sm">
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4">
                <div>
                  <p className="text-xs font-bold text-slate-400">ຜູ້ຊື້ປີ້</p>
                  <p className="mt-1 font-black text-slate-900">{buyerDisplayName(viewing)}</p>
                  <p className="text-xs text-slate-500">
                    {viewing.payment.order.buyerEmail || viewing.payment.order.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400">ຍອດເງິນຄືນ</p>
                  <p className="mt-1 text-lg font-black text-emerald-600">
                    {kip(viewing.amountKip)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Provider: {viewing.payment.provider}
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-400">ກິດຈະກຳ & ລະຫັດສັ່ງຊື້</p>
                <p className="mt-1 font-black text-slate-900">
                  {viewing.payment.order.eventTitle}
                </p>
                <p className="mt-0.5 text-xs font-bold text-orange-600">
                  {tierSummary(viewing).label}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Order: {viewing.payment.order.orderNumber}
                </p>
                <p className="mt-2 text-xs italic text-slate-600">
                  ເຫດຜົນ: "{viewing.reason}"
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              {viewing.status === "pending_approval" && (
                <>
                  <button
                    type="button"
                    disabled={Boolean(busyKey)}
                    onClick={() => {
                      const target = viewing;
                      setViewing(null);
                      void handleSingleAction(target, "reject");
                    }}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-600"
                  >
                    ປະຕິເສດ
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busyKey)}
                    onClick={() => {
                      const target = viewing;
                      setViewing(null);
                      void handleSingleAction(target, "approve");
                    }}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                  >
                    ອະນຸມັດຄືນເງິນ
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600"
              >
                ປິດ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Refund Modal */}
      {creating && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <form
            onSubmit={(event) => void handleCreateRefund(event)}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-black text-slate-950">ອອກຄືນເງິນໃໝ່</h3>
                <p className="text-xs text-slate-500">ສ້າງຄຳຮ້ອງຂໍຄືນເງິນໃນລະບົບ Backend</p>
              </div>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <label className="block">
                <span className="text-xs font-bold text-slate-700">
                  ລະຫັດສັ່ງຊື້ (Order Number) ຫຼື ລະຫັດປີ້ (Ticket Code) *
                </span>
                <input
                  required
                  value={newReference}
                  onChange={(event) => setNewReference(event.target.value)}
                  placeholder="ເຊັ່ນ PSK-..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-400"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-700">
                  ຍອດເງິນຄືນ (ກີບ - ປະຫວ່າງໄວ້ເພື່ອຄືນເຕັມຈຳນວນ)
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={newAmount}
                  onChange={(event) => setNewAmount(event.target.value)}
                  placeholder="ເຊັ່ນ 150000"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-400"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-700">ເຫດຜົນການຄືນເງິນ *</span>
                <textarea
                  required
                  rows={3}
                  value={newReason}
                  onChange={(event) => setNewReason(event.target.value)}
                  placeholder="ລະບຸເຫດຜົນການຄືນເງິນ..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-orange-400"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                disabled={busyKey === "create"}
                className="rounded-xl bg-adv-orange px-4 py-2 text-xs font-black text-white disabled:opacity-50"
              >
                {busyKey === "create" ? "ກຳລັງບັນທຶກ..." : "ສ້າງລາຍການຄືນເງິນ"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
