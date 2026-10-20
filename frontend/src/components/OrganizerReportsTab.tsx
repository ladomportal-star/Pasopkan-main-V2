import React from "react";
import { AlertTriangle, BarChart3 } from "lucide-react";
import type { LaoEvent } from "../data/events";

interface OrganizerReportsTabProps {
  events: LaoEvent[];
  lang: "en" | "lo";
  t: any;
  currency: string;
}

/**
 * Intentionally does not manufacture report data. A verified-payment-backed
 * organizer analytics endpoint is required before reporting revenue, buyers,
 * demographics, or payouts as facts.
 */
export const OrganizerReportsTab: React.FC<OrganizerReportsTabProps> = ({
  lang,
}) => {
  const isLao = lang === "lo";
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-slate-800 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold">
            {isLao ? "ລາຍງານຍັງບໍ່ພ້ອມ" : "Reports are not available yet"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isLao
              ? "ຂໍ້ມູນລາຍຮັບ, ຄຳສັ່ງຊື້, ຜູ້ເຂົ້າງານ ແລະ payout ຈະສະແດງເມື່ອລະບົບມີຂໍ້ມູນຈິງຈາກ backend ແລະ payment provider ທີ່ຢືນຢັນແລ້ວ. ຕອນນີ້ຈະບໍ່ສະແດງຕົວເລກຈຳລອງ."
              : "Revenue, orders, attendees and payouts will appear only when backed by persisted backend records and verified payment-provider data. No simulated figures are shown."}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span>
              {isLao
                ? "ການຈ່າຍເງິນປີ້ທີ່ມີລາຄາຖືກປິດໄວ້ຈົນກວ່າ gateway ຈະພ້ອມ."
                : "Paid checkout remains disabled until a payment gateway is configured."}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
