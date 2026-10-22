import { useMemo, useState } from "react";
import { CalendarDays, Download, Ticket, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

export type AdminAnalytics = {
  daily: { day: string; tickets: number; revenueKip: number }[];
  categories: { name: string; count: number }[];
  recentSales: {
    id: string;
    title: string;
    tickets: number;
    amountKip: number;
    verifiedAt: string;
  }[];
};

type Summary = {
  verifiedPayments: { grossKip: number };
  orders: { confirmed: number };
  events: { published: number; pendingReview: number };
  refunds: { refundedKip: number };
};

const colors = [
  "#FF5B00",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#e11d48",
];
const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);
const laosDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Vientiane",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export default function AdminLiveOverview({
  summary,
  analytics,
}: {
  summary: Summary;
  analytics: AdminAnalytics | null;
}) {
  const [days, setDays] = useState(30);
  const series = useMemo(() => {
    if (!analytics) return [];
    const byDay = new Map(analytics.daily.map((row) => [row.day, row]));
    const today = new Date(`${laosDay.format(new Date())}T00:00:00Z`);
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() - (days - index - 1));
      const day = date.toISOString().slice(0, 10);
      return byDay.get(day) ?? { day, tickets: 0, revenueKip: 0 };
    });
  }, [analytics, days]);
  const totalCategories =
    analytics?.categories.reduce((sum, row) => sum + row.count, 0) ?? 0;

  function exportCsv() {
    const rows = [
      "date,verified_tickets,revenue_lak",
      ...series.map((row) => `${row.day},${row.tickets},${row.revenueKip}`),
    ];
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([rows.join("\r\n")], { type: "text/csv;charset=utf-8" }),
    );
    link.download = `pasopkan-verified-sales-${days}d.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="space-y-5">
      <section
        aria-label="ພາບລວມ"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {[
          {
            label: "ລາຍຮັບທີ່ຢືນຢັນ",
            value: `${formatNumber(summary.verifiedPayments.grossKip)} ₭`,
            note: "ຈາກ payment ທີ່ຢືນຢັນ",
            icon: "₭",
          },
          {
            label: "ອໍເດີທີ່ຢືນຢັນ",
            value: formatNumber(summary.orders.confirmed),
            note: "Confirmed orders",
            icon: "▣",
          },
          {
            label: "Event ທີ່ເຜີຍແຜ່",
            value: formatNumber(summary.events.published),
            note: `${summary.events.pendingReview} ລໍຖ້າກວດ`,
            icon: "▤",
          },
          {
            label: "ຈຳນວນຄືນເງິນ",
            value: `${formatNumber(summary.refunds.refundedKip)} ₭`,
            note: "Provider-confirmed refunds",
            icon: "↗",
          },
        ].map((card) => (
          <article
            key={card.label}
            className="relative overflow-hidden rounded-2xl border border-orange-100 bg-orange-50/30 p-5 min-h-28"
          >
            <span
              aria-hidden
              className="absolute right-4 top-3 text-5xl font-light text-orange-100"
            >
              {card.icon}
            </span>
            <p className="relative text-[11px] font-bold text-slate-400">
              {card.label}
            </p>
            <p className="relative mt-2 text-2xl font-black text-slate-950">
              {card.value}
            </p>
            <p className="relative mt-1 text-xs font-semibold text-orange-600">
              {card.note}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-black text-slate-900">
                <Ticket className="h-4 w-4 text-orange-600" />{" "}
                ແນວໂນ້ມການຂາຍປີ້ປະຈຳວັນ
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                ສະເພາະການຊຳລະທີ່ provider ຢືນຢັນ
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-xl bg-slate-100 p-1">
                {[7, 14, 30, 90].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setDays(range)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${days === range ? "bg-orange-600 text-white" : "text-slate-500"}`}
                  >
                    {range}D
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={exportCsv}
                disabled={!analytics}
                className="inline-flex items-center gap-1 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-orange-600" /> ປີ້ທີ່ຂາຍໄດ້{" "}
            <span className="h-2 w-2 rounded-full bg-emerald-500" />{" "}
            ຂໍ້ມູນຈິງຈາກ API
          </div>
          <div className="mt-3 rounded-2xl bg-orange-50/30 px-4 py-3 text-xs text-slate-500">
            ປີ້ຢືນຢັນຊ່ວງ {days} ວັນ:{" "}
            <strong className="text-orange-600">
              {formatNumber(series.reduce((sum, row) => sum + row.tickets, 0))}{" "}
              ໃບ
            </strong>
          </div>
          {analytics ? (
            <div
              className="mt-5 h-64 w-full"
              role="img"
              aria-label="ກຣາຟປີ້ຂາຍລາຍວັນ"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={series}
                  margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(day: string) => day.slice(5)}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={14}
                  />
                  <YAxis
                    allowDecimals={false}
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) =>
                      `${formatNumber(Number(value ?? 0))} ໃບ`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="tickets"
                    stroke="#FF5B00"
                    strokeWidth={2.5}
                    dot={days <= 30 ? { r: 2.5 } : false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-20 text-center text-sm text-slate-400">
              ບໍ່ສາມາດໂຫຼດຂໍ້ມູນກຣາຟຈາກ API ໄດ້
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="flex items-center justify-between text-sm font-black">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Live
              Sales Counter
            </span>
            <span className="rounded-full bg-slate-50 px-2 py-1 text-[9px] text-slate-400">
              REAL DATA
            </span>
          </h2>
          <div className="mt-4 max-h-80 space-y-2 overflow-auto">
            {analytics?.recentSales.length ? (
              analytics.recentSales.map((sale) => (
                <article
                  key={sale.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-800">
                      {sale.title}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {sale.tickets} ປີ້
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-orange-600">
                      {formatNumber(sale.amountKip)} ₭
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(sale.verifiedAt).toLocaleString("lo-LA")}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <p className="py-16 text-center text-xs text-slate-400">
                ຍັງບໍ່ມີຍອດຂາຍທີ່ຢືນຢັນ
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-black">
            <TrendingUp className="h-4 w-4 text-blue-500" /> Category
            Distribution
          </h2>
          {totalCategories ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.categories}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                  >
                    {analytics?.categories.map((row, index) => (
                      <Cell
                        key={row.name}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-20 text-center text-xs text-slate-400">
              ຍັງບໍ່ມີໝວດ Event
            </p>
          )}
        </section>
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-black">
            <CalendarDays className="h-4 w-4 text-orange-500" /> Event
            Categories Overview
          </h2>
          {totalCategories ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {analytics?.categories.map((row, index) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />{" "}
                    {row.name}
                  </span>
                  <span className="text-slate-500">
                    {row.count} ·{" "}
                    {Math.round((row.count / totalCategories) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-20 text-center text-xs text-slate-400">
              ຍັງບໍ່ມີ Event ໃນ database
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
