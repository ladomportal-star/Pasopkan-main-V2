import React, { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Ticket,
  Users,
  Layers,
  Download,
  CheckCircle2,
  ChevronDown,
  Eye,
} from "lucide-react";
import { LaoEvent } from "../data/events";
import { api, OrganizerAnalyticsEvent } from "../lib/api";

interface OrganizerEventAnalyticsProps {
  events: LaoEvent[];
  lang: "en" | "lo";
  currency?: string;
  onSelectEventForModal?: (event: LaoEvent) => void;
}

const TIER_COLORS = [
  "#FF6600",
  "#2563EB",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
];

const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES_LO = ["ອາທິດ", "ຈັນ", "ອັງຄານ", "ພຸດ", "ພະຫັດ", "ສຸກ", "ເສົາ"];

export const OrganizerEventAnalytics: React.FC<
  OrganizerEventAnalyticsProps
> = ({ events, lang, currency = "₭", onSelectEventForModal }) => {
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [activeMetricTab, setActiveMetricTab] = useState<"revenue" | "tickets">(
    "revenue",
  );
  const [activeChartType, setActiveChartType] = useState<
    "timeline" | "tiers" | "checkin" | "buyTime"
  >("timeline");
  const [backendEvents, setBackendEvents] = useState<OrganizerAnalyticsEvent[]>(
    [],
  );
  const [showRefreshToast, setShowRefreshToast] = useState(false);

  const loadAnalytics = useCallback(async (notifyToast = false) => {
    const res = await api.getOrganizerAnalytics();
    if (res.ok && res.data) {
      setBackendEvents(res.data.events);
      if (notifyToast) {
        setShowRefreshToast(true);
      }
    }
  }, []);

  useEffect(() => {
    void loadAnalytics(false);
    const interval = setInterval(() => {
      void loadAnalytics(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  useEffect(() => {
    if (!showRefreshToast) return;
    const timer = setTimeout(() => setShowRefreshToast(false), 3500);
    return () => clearTimeout(timer);
  }, [showRefreshToast]);

  const backendMap = useMemo(() => {
    const map = new Map<string, OrganizerAnalyticsEvent>();
    backendEvents.forEach((ev) => map.set(String(ev.id), ev));
    return map;
  }, [backendEvents]);

  const selectedEvent = useMemo(() => {
    if (selectedEventId === "all") return null;
    return events.find((e) => String(e.id) === String(selectedEventId)) || null;
  }, [selectedEventId, events]);

  const activeBackendRecords = useMemo(() => {
    if (selectedEventId !== "all") {
      const single = backendMap.get(String(selectedEventId));
      return single ? [single] : [];
    }
    return backendEvents;
  }, [selectedEventId, backendMap, backendEvents]);

  const currentMetrics = useMemo(() => {
    let totalRevenue = 0;
    let totalSold = 0;
    let totalCapacity = 0;
    let totalCheckIns = 0;

    for (const rec of activeBackendRecords) {
      totalRevenue += rec.grossRevenue;
      totalSold += rec.ticketsSold;
      totalCapacity += rec.totalCapacity;
      totalCheckIns += rec.checkInCount;
    }

    const fillRate = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;
    const checkInRate = totalSold > 0 ? (totalCheckIns / totalSold) * 100 : 0;
    const avgPrice = totalSold > 0 ? totalRevenue / totalSold : 0;

    return {
      totalRevenue,
      totalSold,
      totalCapacity,
      fillRate: fillRate.toFixed(1),
      checkInCount: totalCheckIns,
      checkInRate: checkInRate.toFixed(1),
      avgPrice: Math.round(avgPrice),
      activeCount: selectedEvent ? 1 : events.length,
    };
  }, [activeBackendRecords, selectedEvent, events.length]);

  const timelineData = useMemo(() => {
    const dayNames = lang === "lo" ? DAY_NAMES_LO : DAY_NAMES_EN;
    if (activeBackendRecords.length > 0 && activeBackendRecords[0].dailySales.length > 0) {
      const len = activeBackendRecords[0].dailySales.length;
      return Array.from({ length: len }, (_, idx) => {
        const refDay = activeBackendRecords[0].dailySales[idx];
        let revenue = 0;
        let cumulativeRevenue = 0;
        let tickets = 0;
        let cumulativeTickets = 0;
        for (const rec of activeBackendRecords) {
          const d = rec.dailySales[idx];
          if (d) {
            revenue += d.revenue;
            cumulativeRevenue += d.cumulativeRevenue;
            tickets += d.tickets;
            cumulativeTickets += d.cumulativeTickets;
          }
        }
        return {
          name: dayNames[refDay.dayOfWeek] ?? refDay.date.slice(5),
          revenue,
          cumulativeRevenue,
          tickets,
          cumulativeTickets,
        };
      });
    }

    const fallbackDays =
      lang === "lo"
        ? ["ຈັນ", "ອັງຄານ", "ພຸດ", "ພະຫັດ", "ສຸກ", "ເສົາ", "ອາທິດ"]
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return fallbackDays.map((day) => ({
      name: day,
      revenue: 0,
      cumulativeRevenue: 0,
      tickets: 0,
      cumulativeTickets: 0,
    }));
  }, [activeBackendRecords, lang]);

  const tierData = useMemo(() => {
    if (selectedEvent) {
      const rec = backendMap.get(String(selectedEvent.id));
      if (rec && rec.tierBreakdown.length > 0) {
        return rec.tierBreakdown.map((tier, idx) => ({
          name: tier.name,
          value: tier.sold,
          revenue: tier.revenue,
          capacity: tier.available,
          price: tier.price,
          color: TIER_COLORS[idx % TIER_COLORS.length],
        }));
      }
    }

    // Aggregate tiers by name across all active backend events
    const grouped = new Map<string, { sold: number; revenue: number; capacity: number }>();
    for (const rec of activeBackendRecords) {
      for (const tier of rec.tierBreakdown) {
        const key = tier.name || "Standard";
        const cur = grouped.get(key) ?? { sold: 0, revenue: 0, capacity: 0 };
        cur.sold += tier.sold;
        cur.revenue += tier.revenue;
        cur.capacity += tier.available;
        grouped.set(key, cur);
      }
    }

    if (grouped.size === 0) {
      return [
        {
          name: lang === "lo" ? "ຍັງບໍ່ມີປະເພດປີ້" : "No Ticket Tiers",
          value: 0,
          revenue: 0,
          color: TIER_COLORS[0],
        },
      ];
    }

    return Array.from(grouped.entries())
      .slice(0, 6)
      .map(([name, val], idx) => ({
        name,
        value: val.sold,
        revenue: val.revenue,
        capacity: val.capacity,
        color: TIER_COLORS[idx % TIER_COLORS.length],
      }));
  }, [selectedEvent, backendMap, activeBackendRecords, lang]);

  const checkinHourlyData = useMemo(() => {
    const hours = [15, 16, 17, 18, 19, 20, 21, 22];
    const sum24 = Array<number>(24).fill(0);
    for (const rec of activeBackendRecords) {
      for (let h = 0; h < 24; h++) {
        sum24[h] += rec.hourlyCheckins24[h] || 0;
      }
    }
    return hours.map((h, idx) => {
      let checkedIn = sum24[h] || 0;
      if (idx === 0) {
        for (let early = 0; early < 15; early++) checkedIn += sum24[early] || 0;
      }
      if (idx === hours.length - 1) {
        checkedIn += sum24[23] || 0;
      }
      return {
        hour: `${String(h).padStart(2, "0")}:00`,
        checkedIn,
      };
    });
  }, [activeBackendRecords]);

  const buyTimeHourlyData = useMemo(() => {
    const buckets = [
      { label: "08:00", from: 0, to: 9 },
      { label: "10:00", from: 10, to: 11 },
      { label: "12:00", from: 12, to: 13 },
      { label: "14:00", from: 14, to: 15 },
      { label: "16:00", from: 16, to: 17 },
      { label: "18:00", from: 18, to: 19 },
      { label: "20:00", from: 20, to: 21 },
      { label: "22:00", from: 22, to: 23 },
    ];
    const sum24 = Array<number>(24).fill(0);
    for (const rec of activeBackendRecords) {
      for (let h = 0; h < 24; h++) {
        sum24[h] += rec.hourlyPurchases24[h] || 0;
      }
    }
    return buckets.map((b) => {
      let ticketsBought = 0;
      for (let h = b.from; h <= b.to; h++) {
        ticketsBought += sum24[h] || 0;
      }
      return {
        hour: b.label,
        ticketsBought,
      };
    });
  }, [activeBackendRecords]);

  const handleExportCSV = () => {
    const rows = events.map((e) => {
      const rec = backendMap.get(String(e.id));
      const sold = rec?.ticketsSold ?? 0;
      const cap = rec?.totalCapacity ?? 0;
      const gross = rec?.grossRevenue ?? 0;
      const checkins = rec?.checkInCount ?? 0;
      const fillPct = cap > 0 ? ((sold / cap) * 100).toFixed(1) : "0.0";
      return {
        Event_ID: e.id,
        Event_Title: `"${(e.title || "").replace(/"/g, '""')}"`,
        Date: e.date,
        Category: e.category,
        Venue: `"${(e.venue || "").replace(/"/g, '""')}"`,
        Tickets_Sold: sold,
        Total_Capacity: cap,
        Revenue_Before_Fee_LAK: gross,
        Check_Ins: checkins,
        Fill_Rate_Percent: `${fillPct}%`,
      };
    });

    if (!rows.length) return;
    const header = Object.keys(rows[0]).join(",");
    const csvContent =
      "\uFEFF" + header + "\n" + rows.map((r) => Object.values(r).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `event_sales_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const genderData = useMemo(() => {
    let male = 0;
    let female = 0;
    for (const rec of activeBackendRecords) {
      male += rec.demographics.gender.male;
      female += rec.demographics.gender.female;
    }
    const knownTotal = male + female;
    const malePct = knownTotal > 0 ? Math.round((male / knownTotal) * 100) : 0;
    const femalePct = knownTotal > 0 ? 100 - malePct : 0;
    return [
      {
        name: lang === "lo" ? "ຊາຍ" : "Male",
        value: malePct,
        rawCount: male,
        color: "#3B82F6",
      },
      {
        name: lang === "lo" ? "ຍິງ" : "Female",
        value: femalePct,
        rawCount: female,
        color: "#EC4899",
      },
    ];
  }, [activeBackendRecords, lang]);

  const ageData = useMemo(() => {
    const groups = ["18-24", "25-34", "35-44", "45+"];
    return groups.map((age) => {
      let male = 0;
      let female = 0;
      for (const rec of activeBackendRecords) {
        const match = rec.demographics.ageGroups.find((g) => g.age === age);
        if (match) {
          male += match.male;
          female += match.female;
        }
      }
      return { age, male, female };
    });
  }, [activeBackendRecords]);

  return (
    <div className="space-y-6 relative">
      {/* Floating Real-Time Update Toast */}
      <AnimatePresence>
        {showRefreshToast && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
          >
            <div className="bg-white text-black px-5 py-2.5 rounded-full shadow-2xl border border-gray-200 backdrop-blur-md flex items-center gap-3 pointer-events-auto">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wide text-black">
                  {lang === "lo" ? "ອັບເດດ Real-Time" : "Update Real-Time"}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {lang === "lo" ? "ສົດ" : "Live"}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Filter & Selector Bar */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base sm:text-lg font-black text-adv-slate">
              {lang === "lo"
                ? "ການວິເຄາະ ແລະ ສະຖິຕິກຣາບກິດຈະກຳ"
                : "Event Analytics & Graph Intelligence"}
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            {lang === "lo"
              ? "ຕິດຕາມຍອດຂາຍປີ້, ລາຍຮັບກ່ອນຫັກຄ່າທຳນຽມ, ແລະ ອັດຕາການເຂົ້າຮ່ວມງານແບບລະອຽດ"
              : "Real-time sales velocity, revenue before fee trajectory, and check-in flow"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Event Selector Dropdown */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <select
              id="organizer-event-graph-filter"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full appearance-none bg-gray-50 hover:bg-gray-100/80 border border-gray-200 text-adv-slate text-xs font-bold rounded-xl pl-3.5 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-adv-orange/30 cursor-pointer transition-colors"
            >
              <option value="all">
                {lang === "lo"
                  ? "📊 ທຸກກິດຈະກຳລວມກັນ (All Events)"
                  : "📊 All Events Combined"}
              </option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {selectedEvent && onSelectEventForModal && (
            <button
              type="button"
              onClick={() => onSelectEventForModal(selectedEvent)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-adv-orange rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{lang === "lo" ? "ເບິ່ງລາຍລະອຽດ" : "Event Details"}</span>
            </button>
          )}

          {/* Export Report */}
          <button
            type="button"
            onClick={handleExportCSV}
            id="export-organizer-analytics-csv"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200 hover:border-adv-orange text-gray-700 hover:text-adv-orange rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
            title={lang === "lo" ? "ດາວໂຫຼດ CSV" : "Export CSV"}
          >
            <Download className="w-3.5 h-3.5 text-adv-orange" />
            <span className="hidden sm:inline">
              {lang === "lo" ? "ສົ່ງອອກ CSV" : "Export CSV"}
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Revenue Before Fee Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs transition-all hover:border-gray-250"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              {lang === "lo" ? "ລາຍຮັບກ່ອນຫັກຄ່າທຳນຽມ" : "Revenue Before Fee"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-adv-orange flex items-center justify-center font-black text-sm">
              {currency}
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-adv-slate truncate">
            {currentMetrics.totalRevenue.toLocaleString()}{" "}
            <span className="text-xs font-bold text-gray-400">{currency}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>
              {lang === "lo"
                ? `ສະເລ່ຍ ${currentMetrics.avgPrice.toLocaleString()} ${currency} / ໃບ`
                : `Avg ${currentMetrics.avgPrice.toLocaleString()} ${currency} / ticket`}
            </span>
          </div>
        </motion.div>

        {/* Tickets Sold Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs transition-all hover:border-gray-250"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              {lang === "lo" ? "ປີ້ທີ່ຂາຍໄດ້" : "Total Tickets Sold"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-adv-slate">
            {currentMetrics.totalSold.toLocaleString()}{" "}
            <span className="text-xs font-bold text-gray-400">
              / {currentMetrics.totalCapacity.toLocaleString()}
            </span>
          </div>
          <div className="mt-2.5 space-y-1">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-adv-orange h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Number(currentMetrics.fillRate))}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400">
              <span>{lang === "lo" ? "ອັດຕາການຂາຍ" : "Fill Rate"}</span>
              <span className="text-adv-orange">
                {currentMetrics.fillRate}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Check-In Attendance Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs transition-all hover:border-gray-250"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              {lang === "lo" ? "ການເຊັກອິນໜ້າປະຕູ" : "Gate Check-In Rate"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-adv-slate">
            {currentMetrics.checkInCount.toLocaleString()}{" "}
            <span className="text-xs font-bold text-gray-400">
              {lang === "lo" ? "ຄົນ" : "attendees"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-emerald-600">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>
              {currentMetrics.checkInRate}%{" "}
              {lang === "lo" ? "ເຂົ້າຮ່ວມແລ້ວ" : "attendance rate"}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Primary Graphs Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Main Chart Area (8 cols) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
            <div>
              <h4 className="text-sm font-black text-adv-slate flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-adv-orange" />
                {activeChartType === "timeline" &&
                  (lang === "lo"
                    ? "ທ່າອ່ຽງຍອດຂາຍປະຈຳວັນ (Sales Trajectory)"
                    : "Daily Sales Trajectory & Volume")}
                {activeChartType === "tiers" &&
                  (lang === "lo"
                    ? "ການແບ່ງສັດສ່ວນຕາມປະເພດປີ້ (Tier Breakdown)"
                    : "Sales Breakdown by Ticket Tier")}
                {activeChartType === "checkin" &&
                  (lang === "lo"
                    ? "ຄວາມໜາແໜ້ນການເຊັກອິນຕໍ່ຊົ່ວໂມງ (Gate Flow)"
                    : "Hourly Gate Check-In Velocity")}
                {activeChartType === "buyTime" &&
                  (lang === "lo"
                    ? "ເວລາຊື້ປີ້ (Purchase Time)"
                    : "Hourly Ticket Purchase Time")}
              </h4>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                {selectedEvent
                  ? selectedEvent.title
                  : lang === "lo"
                    ? "ສະແດງຂໍ້ມູນລວມທຸກກິດຈະກຳ"
                    : "Aggregated performance across all events"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-gray-50 border border-gray-200/80 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveChartType("timeline")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartType === "timeline"
                    ? "bg-white text-adv-orange shadow-2xs"
                    : "text-gray-500 hover:text-adv-slate"
                }`}
              >
                {lang === "lo" ? "ກຣາບຍອດຂາຍ" : "Timeline"}
              </button>
              <button
                type="button"
                onClick={() => setActiveChartType("tiers")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartType === "tiers"
                    ? "bg-white text-adv-orange shadow-2xs"
                    : "text-gray-500 hover:text-adv-slate"
                }`}
              >
                {lang === "lo" ? "ສັດສ່ວນປີ້" : "Tier Mix"}
              </button>
              <button
                type="button"
                onClick={() => setActiveChartType("checkin")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartType === "checkin"
                    ? "bg-white text-adv-orange shadow-2xs"
                    : "text-gray-500 hover:text-adv-slate"
                }`}
              >
                {lang === "lo" ? "ຄວາມໜາແໜ້ນ" : "Check-In"}
              </button>
              <button
                type="button"
                onClick={() => setActiveChartType("buyTime")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartType === "buyTime"
                    ? "bg-white text-adv-orange shadow-2xs"
                    : "text-gray-500 hover:text-adv-slate"
                }`}
              >
                {lang === "lo" ? "ເວລາຊື້ປີ້" : "Buy Time"}
              </button>
            </div>
          </div>

          {activeChartType === "timeline" && (
            <div className="flex items-center justify-end gap-2 mb-2">
              <span className="text-[11px] font-bold text-gray-400">
                {lang === "lo" ? "ສະແດງ:" : "Metric:"}
              </span>
              <button
                type="button"
                onClick={() => setActiveMetricTab("revenue")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  activeMetricTab === "revenue"
                    ? "bg-orange-50 text-adv-orange border border-orange-200/60"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {lang === "lo" ? "ລາຍຮັບ (LAK)" : "Revenue (₭)"}
              </button>
              <button
                type="button"
                onClick={() => setActiveMetricTab("tickets")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  activeMetricTab === "tickets"
                    ? "bg-blue-50 text-blue-600 border border-blue-200/60"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {lang === "lo" ? "ຈຳນວນປີ້" : "Tickets Sold"}
              </button>
            </div>
          )}

          <div className="h-72 w-full pt-2">
            {activeChartType === "timeline" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6600" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#FF6600" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      value > 1000 ? `${(value / 1000).toFixed(0)}k` : value
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      borderRadius: "12px",
                      border: "none",
                      color: "#F8FAFC",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                    }}
                    itemStyle={{ fontWeight: "bold" }}
                  />
                  <Area
                    type="monotone"
                    dataKey={activeMetricTab === "revenue" ? "revenue" : "tickets"}
                    stroke={activeMetricTab === "revenue" ? "#FF6600" : "#2563EB"}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#${activeMetricTab === "revenue" ? "colorRevenue" : "colorTickets"})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeChartType === "buyTime" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={buyTimeHourlyData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorBuyTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      borderRadius: "12px",
                      border: "none",
                      color: "#F8FAFC",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ticketsBought"
                    name={lang === "lo" ? "ປີ້ທີ່ຂາຍ" : "Tickets Bought"}
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorBuyTime)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeChartType === "tiers" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tierData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      borderRadius: "12px",
                      border: "none",
                      color: "#F8FAFC",
                      fontSize: "12px",
                    }}
                    formatter={(val: number, _name: string, item: { payload?: { revenue?: number } }) => [
                      `${val.toLocaleString()} sold (${(item?.payload?.revenue || 0).toLocaleString()} ${currency})`,
                      "Tier Performance",
                    ]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {tierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChartType === "checkin" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={checkinHourlyData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      borderRadius: "12px",
                      border: "none",
                      color: "#F8FAFC",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                    }}
                    cursor={{ fill: "#F8FAFC" }}
                  />
                  <Bar
                    dataKey="checkedIn"
                    name={lang === "lo" ? "ເຊັກອິນ" : "Checked In"}
                    fill="#FF6600"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Right Side: Tier Distribution Breakdown (4 cols) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <h4 className="text-sm font-black text-adv-slate flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-adv-orange" />
                {lang === "lo" ? "ສັດສ່ວນປະເພດປີ້" : "Ticket Tier Ratio"}
              </h4>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {tierData.length} {lang === "lo" ? "ລະດັບ" : "tiers"}
              </span>
            </div>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      currentMetrics.totalSold > 0
                        ? tierData
                        : [{ name: "Empty", value: 1, color: "#E2E8F0" }]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={currentMetrics.totalSold > 0 ? 3 : 0}
                    dataKey="value"
                  >
                    {(currentMetrics.totalSold > 0
                      ? tierData
                      : [{ name: "Empty", value: 1, color: "#E2E8F0" }]
                    ).map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  {currentMetrics.totalSold > 0 && (
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        borderRadius: "10px",
                        border: "none",
                        color: "#fff",
                        fontSize: "11px",
                      }}
                      formatter={(val: number) => [
                        `${val.toLocaleString()} tix`,
                        "Volume",
                      ]}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-adv-slate leading-none">
                  {currentMetrics.totalSold.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-gray-400 mt-0.5">
                  {lang === "lo" ? "ປີ້ທີ່ຂາຍ" : "Sold"}
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-2">
              {tierData.map((tier, idx) => {
                const pct =
                  currentMetrics.totalSold > 0
                    ? ((tier.value / currentMetrics.totalSold) * 100).toFixed(0)
                    : "0";
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tier.color }}
                      />
                      <span className="font-bold text-adv-slate truncate max-w-[120px]">
                        {tier.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-adv-slate">
                        {tier.value.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-150">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Demographics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6"
      >
        {/* Age Demographics (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h4 className="text-sm font-black text-adv-slate flex items-center gap-2">
                <Users className="w-4 h-4 text-adv-orange" />
                {lang === "lo"
                  ? "ຊ່ວງອາຍຸຜູ້ເຂົ້າຮ່ວມ"
                  : "Attendee Age Demographics"}
              </h4>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                {lang === "lo"
                  ? "ການກະຈາຍຕົວຂອງອາຍຸ ແລະ ເພດ"
                  : "Age distribution breakdown by gender"}
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ageData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="age"
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={5}
                />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    borderRadius: "12px",
                    border: "none",
                    color: "#F8FAFC",
                    fontSize: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                  }}
                  cursor={{ fill: "#F8FAFC" }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    paddingTop: "10px",
                  }}
                />
                <Bar
                  dataKey="male"
                  name={lang === "lo" ? "ຊາຍ" : "Male"}
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="female"
                  name={lang === "lo" ? "ຍິງ" : "Female"}
                  fill="#EC4899"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div>
              <h4 className="text-sm font-black text-adv-slate flex items-center gap-2">
                <Users className="w-4 h-4 text-adv-orange" />
                {lang === "lo" ? "ສັດສ່ວນເພດ" : "Gender Distribution"}
              </h4>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                {lang === "lo"
                  ? "ພາບລວມເພດຜູ້ເຂົ້າຮ່ວມ"
                  : "Overall gender split"}
              </p>
            </div>
          </div>

          <div className="relative h-48 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    genderData[0].value + genderData[1].value > 0
                      ? genderData
                      : [{ name: "Empty", value: 1, color: "#E2E8F0" }]
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={genderData[0].value + genderData[1].value > 0 ? 5 : 0}
                  dataKey="value"
                  stroke="none"
                >
                  {(genderData[0].value + genderData[1].value > 0
                    ? genderData
                    : [{ name: "Empty", value: 1, color: "#E2E8F0" }]
                  ).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                {genderData[0].value + genderData[1].value > 0 && (
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      borderRadius: "10px",
                      border: "none",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                    formatter={(val: number) => [`${val}%`, ""]}
                  />
                )}
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-adv-slate leading-none">
                {genderData[0].value + genderData[1].value > 0 ? "100%" : "0%"}
              </span>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {genderData.map((gender, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: gender.color }}
                  />
                  <span className="font-bold text-adv-slate truncate">
                    {gender.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-adv-slate">
                    {gender.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrganizerEventAnalytics;
