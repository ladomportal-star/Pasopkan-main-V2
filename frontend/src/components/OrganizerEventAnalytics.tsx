import type { LaoEvent } from "../data/events";

interface OrganizerEventAnalyticsProps {
  events: LaoEvent[];
  lang: "en" | "lo";
  currency?: string;
  onSelectEventForModal?: (event: LaoEvent) => void;
}

/** Analytics are unavailable until backed by persisted orders and verified check-ins. */
export function OrganizerEventAnalytics({ lang }: OrganizerEventAnalyticsProps) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-slate-800">
      <h2 className="font-bold">
        {lang === "lo" ? "ລາຍງານຍັງບໍ່ພ້ອມ" : "Analytics are not available yet"}
      </h2>
      <p className="mt-2 text-sm">
        {lang === "lo"
          ? "ຂໍ້ມູນຈະສະແດງເມື່ອມີຄຳສັ່ງຊື້ ແລະການເຊັກອິນທີ່ຢືນຢັນຈາກ server."
          : "Sales and attendance metrics will appear when verified server records are available."}
      </p>
    </section>
  );
}

export default OrganizerEventAnalytics;
