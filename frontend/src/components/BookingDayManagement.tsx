import type { LaoEvent } from "../data/events";

interface BookingDayManagementProps {
  event: LaoEvent;
  attendees: unknown[];
  onToggleCheckin: (ticketIdOrId: string, currentStatus: boolean, staffLabel?: string) => void;
  onAddAttendee: (attendee: Record<string, unknown>) => void;
  onRescheduleAttendee?: (ticketIdOrId: string, newDate: string, newTimeSlot: string) => void;
  theme: "dark" | "light";
  lang: "en" | "lo";
  onOpenScanner?: () => void;
}

/** This legacy local-only booking tool is disabled; use the server-backed ticket and scanner APIs. */
export default function BookingDayManagement({ lang, theme }: BookingDayManagementProps) {
  return (
    <section className={`rounded-2xl border p-6 ${theme === "dark" ? "border-zinc-800 bg-zinc-900 text-white" : "border-amber-200 bg-amber-50 text-slate-800"}`}>
      <h2 className="font-bold">
        {lang === "lo" ? "ການຈັດການຈອງຍັງບໍ່ພ້ອມ" : "Booking management is unavailable"}
      </h2>
      <p className="mt-2 text-sm opacity-80">
        {lang === "lo"
          ? "ລະບົບຈະເປີດສ່ວນນີ້ເມື່ອມີ API ທີ່ບັນທຶກການຈອງ ແລະການເຊັກອິນໃນ database."
          : "This tool is disabled until bookings and check-ins are fully server-backed."}
      </p>
    </section>
  );
}
