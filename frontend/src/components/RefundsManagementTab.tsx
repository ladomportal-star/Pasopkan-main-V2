import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { api } from "../lib/api";

interface RefundRecord {
  id: string;
  paymentId: string;
  amountKip: number;
  currency: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface RefundsManagementTabProps {
  lang: "en" | "lo";
  t: Record<string, string>;
  addActivityLog?: (action: string, details: string) => void;
}

export default function RefundsManagementTab({
  lang,
}: RefundsManagementTabProps) {
  const isLao = lang === "lo";
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.get<{ refunds: RefundRecord[] }>(
        "/admin/refunds",
        { throwOnError: true },
      );
      if (!result.data) throw new Error("Empty response");
      setRefunds(result.data.refunds);
    } catch {
      setError(
        isLao ? "ໂຫຼດລາຍການຄືນເງິນບໍ່ສຳເລັດ" : "Could not load refund records",
      );
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  }, [isLao]);

  useEffect(() => {
    void loadRefunds().catch(() => {
      setError(
        isLao ? "ໂຫຼດລາຍການຄືນເງິນບໍ່ສຳເລັດ" : "Could not load refund records",
      );
      setRefunds([]);
      setLoading(false);
    });
  }, [loadRefunds]);

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isLao ? "ລາຍການຂໍຄືນເງິນ" : "Refund requests"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isLao
              ? "ສະແດງສະເພາະຂໍ້ມູນຈາກ backend database."
              : "Only records returned by the backend database are shown."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadRefunds()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {isLao ? "ໂຫຼດໃໝ່" : "Refresh"}
        </button>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {isLao
              ? "ການອະນຸມັດໃນລະບົບບໍ່ໄດ້ໂອນເງິນຄືນ. ການຄືນເງິນຈິງຍັງຕ້ອງດຳເນີນຜ່ານ payment provider ຫຼືທະນາຄານ."
              : "An approval here does not transfer money. Actual refunds still require execution through the payment provider or bank."}
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <p className="p-6 text-sm text-slate-500">
            {isLao ? "ກຳລັງໂຫຼດ..." : "Loading…"}
          </p>
        ) : refunds.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">
            {isLao
              ? "ບໍ່ມີລາຍການຄືນເງິນຈິງໃນ database."
              : "No refund records in the database."}
          </p>
        ) : (
          <div className="divide-y">
            {refunds.map((refund) => (
              <article
                key={refund.id}
                className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    {refund.status === "succeeded" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-600" />
                    )}
                    {new Intl.NumberFormat(isLao ? "lo-LA" : "en-US").format(
                      refund.amountKip,
                    )}{" "}
                    {refund.currency}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">
                      {refund.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {isLao ? "ການຈ່າຍ:" : "Payment:"} {refund.paymentId}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{refund.reason}</p>
                </div>
                <time className="text-xs text-slate-500">
                  {new Date(refund.createdAt).toLocaleString(
                    isLao ? "lo-LA" : "en-US",
                  )}
                </time>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
