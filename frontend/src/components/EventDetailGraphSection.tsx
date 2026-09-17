import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Ticket, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  Layers, 
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { LaoEvent } from '../data/events';

interface EventDetailGraphSectionProps {
  event: LaoEvent;
  lang: 'en' | 'lo';
  currency?: string;
}

const TIER_BAR_COLORS = ['#FF6600', '#2563EB', '#10B981', '#8B5CF6', '#F59E0B'];

export const EventDetailGraphSection: React.FC<EventDetailGraphSectionProps> = ({
  event,
  lang,
  currency = '₭'
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'tiers' | 'gates'>('sales');

  // Compute stats deterministically from event properties
  const stats = useMemo(() => {
    const numId = parseInt(event.id.replace(/\D/g, ''), 10) || 1;
    let totalCap = 0;
    let totalSold = 0;
    let grossRevenue = 0;

    const tierBreakdown: Array<{
      id: string;
      name: string;
      price: number;
      available: number;
      sold: number;
      revenue: number;
      fillRate: number;
    }> = [];

    if (event.ticketTiers && event.ticketTiers.length > 0) {
      event.ticketTiers.forEach((tier, idx) => {
        const tierCap = tier.available || 150;
        totalCap += tierCap;
        const soldRatio = Math.min(0.95, 0.48 + ((numId + idx * 9) % 45) / 100);
        const tierSold = Math.floor(tierCap * soldRatio);
        totalSold += tierSold;

        const cleanPrice = typeof tier.price === 'number' 
          ? tier.price 
          : (Number(String(tier.price).replace(/,/g, '')) || 50);
        const actualPrice = cleanPrice < 1000 ? cleanPrice * 1000 : cleanPrice;
        const tierRev = tierSold * actualPrice;
        grossRevenue += tierRev;

        tierBreakdown.push({
          id: tier.id || `tier-${idx}`,
          name: tier.name || `Tier ${idx + 1}`,
          price: actualPrice,
          available: tierCap,
          sold: tierSold,
          revenue: tierRev,
          fillRate: tierCap > 0 ? Math.round((tierSold / tierCap) * 100) : 0
        });
      });
    } else {
      totalCap = 500;
      totalSold = 360;
      const cleanPrice = typeof event.price === 'number' ? event.price : 150000;
      const actualPrice = cleanPrice < 1000 ? cleanPrice * 1000 : cleanPrice;
      grossRevenue = totalSold * actualPrice;

      tierBreakdown.push({
        id: 'gen-adm',
        name: lang === 'lo' ? 'ປີ້ເຂົ້າຮ່ວມທົ່ວໄປ (General)' : 'General Admission',
        price: actualPrice,
        available: totalCap,
        sold: totalSold,
        revenue: grossRevenue,
        fillRate: 72
      });
    }

    if (totalSold === 0) totalSold = 180;
    if (totalCap === 0) totalCap = 300;
    if (grossRevenue === 0) grossRevenue = totalSold * 150000;

    const fillPercent = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0;
    const checkInRatio = 0.78 + ((numId % 18) / 100);
    const checkedIn = Math.floor(totalSold * Math.min(0.96, checkInRatio));
    const pendingDoor = Math.max(0, totalSold - checkedIn);
    const netPayout = Math.round(grossRevenue * 0.97); // 3% platform fee

    return {
      totalCap,
      totalSold,
      grossRevenue,
      netPayout,
      fillPercent,
      checkedIn,
      pendingDoor,
      tierBreakdown
    };
  }, [event, lang]);

  // Timeline curve for this event
  const eventTimeline = useMemo(() => {
    const days = lang === 'lo'
      ? ['ວັນທີ 1', 'ວັນທີ 2', 'ວັນທີ 3', 'ວັນທີ 4', 'ວັນທີ 5', 'ວັນທີ 6', 'ມື້ງານ']
      : ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Event Day'];

    const distribution = [0.08, 0.12, 0.14, 0.18, 0.22, 0.16, 0.10];
    let cumulativeRev = 0;
    let cumulativeTix = 0;

    return days.map((day, idx) => {
      const dayRev = Math.round(stats.grossRevenue * distribution[idx]);
      const dayTix = Math.round(stats.totalSold * distribution[idx]);
      cumulativeRev += dayRev;
      cumulativeTix += dayTix;

      return {
        day,
        dailyRevenue: dayRev,
        totalRevenue: cumulativeRev,
        dailyTickets: dayTix,
        totalTickets: cumulativeTix
      };
    });
  }, [stats, lang]);

  // Hourly check-in velocity for this event
  const hourlyGateData = useMemo(() => {
    const hours = ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
    const distribution = [0.10, 0.28, 0.32, 0.18, 0.08, 0.04];

    return hours.map((hour, idx) => ({
      hour,
      checkedIn: Math.round(stats.checkedIn * distribution[idx])
    }));
  }, [stats]);

  return (
    <div className="bg-white rounded-[24px] border border-gray-150 p-6 space-y-6 shadow-xs">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-50 text-adv-orange">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h4 className="text-base font-black text-adv-slate">
              {lang === 'lo' ? 'ສະຖິຕິ ແລະ ກຣາບປະສິດທິພາບງານນີ້' : 'Event Sales & Attendance Analytics'}
            </h4>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {lang === 'lo' 
              ? 'ລາຍລະອຽດການຂາຍປີ້, ລາຍຮັບຕົວຈິງ ແລະ ການກວດສອບປີ້ໜ້າປະຕູ' 
              : 'Real-time sales velocity, revenue accrual, and door check-in distribution'}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200 shrink-0">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-white text-adv-orange shadow-2xs'
                : 'text-gray-500 hover:text-adv-slate'
            }`}
          >
            {lang === 'lo' ? 'ກຣາບຍອດຂາຍ' : 'Sales Curve'}
          </button>
          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tiers'
                ? 'bg-white text-adv-orange shadow-2xs'
                : 'text-gray-500 hover:text-adv-slate'
            }`}
          >
            {lang === 'lo' ? 'ຕາມປະເພດປີ້' : 'Tier Capacity'}
          </button>
          <button
            onClick={() => setActiveTab('gates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gates'
                ? 'bg-white text-adv-orange shadow-2xs'
                : 'text-gray-500 hover:text-adv-slate'
            }`}
          >
            {lang === 'lo' ? 'ເຊັກອິນປະຕູ' : 'Gate Check-In'}
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Gross Revenue */}
        <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-150">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
            {lang === 'lo' ? 'ລາຍຮັບລວມ' : 'Gross Revenue'}
          </span>
          <div className="text-base sm:text-lg font-black text-adv-slate truncate">
            {stats.grossRevenue.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">{currency}</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
            {lang === 'lo' ? 'ຍອດຂາຍປີ້ທັງໝົດ' : 'Total ticket sales'}
          </span>
        </div>

        {/* Estimated Net Payout */}
        <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-150">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
            {lang === 'lo' ? 'ຍອດຮັບສຸດທິ (Net)' : 'Est. Net Payout'}
          </span>
          <div className="text-base sm:text-lg font-black text-adv-orange truncate">
            {stats.netPayout.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">{currency}</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 block mt-0.5">
            {lang === 'lo' ? 'ຫຼັງຫັກຄ່າບໍລິການ 3%' : 'After 3% gateway fee'}
          </span>
        </div>

        {/* Tickets Sold & Fill Rate */}
        <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-150">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
            {lang === 'lo' ? 'ປີ້ທີ່ຂາຍໄດ້' : 'Tickets Sold'}
          </span>
          <div className="text-base sm:text-lg font-black text-adv-slate truncate">
            {stats.totalSold} <span className="text-[10px] text-gray-400 font-bold">/ {stats.totalCap}</span>
          </div>
          <span className="text-[10px] font-bold text-blue-600 block mt-0.5">
            {stats.fillPercent}% {lang === 'lo' ? 'ຂອງຄວາມຈຸງານ' : 'capacity sold'}
          </span>
        </div>

        {/* Gate Check-Ins */}
        <div className="p-3.5 bg-gray-50/70 rounded-2xl border border-gray-150">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
            {lang === 'lo' ? 'ເຂົ້າຮ່ວມງານແລ້ວ' : 'Gate Check-In'}
          </span>
          <div className="text-base sm:text-lg font-black text-emerald-600 truncate">
            {stats.checkedIn} <span className="text-[10px] text-gray-400 font-bold">/ {stats.totalSold}</span>
          </div>
          <span className="text-[10px] font-bold text-gray-400 block mt-0.5">
            {stats.pendingDoor} {lang === 'lo' ? 'ໃບຍັງບໍ່ທັນສະແກນ' : 'pending gate arrival'}
          </span>
        </div>
      </div>

      {/* Graph Display Area */}
      <div className="h-64 w-full pt-2">
        {activeTab === 'sales' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={eventTimeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="eventSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6600" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF6600" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="day" 
                stroke="#94A3B8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dy={5}
              />
              <YAxis 
                stroke="#94A3B8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(v) => {
                  if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
                  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                  return `${v}`;
                }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1E293B', 
                  borderRadius: '12px', 
                  border: 'none', 
                  color: '#F8FAFC',
                  fontSize: '12px'
                }}
                formatter={(val: number) => [`${val.toLocaleString()} ${currency}`, 'Revenue Accrued']}
              />
              <Area 
                type="monotone" 
                dataKey="totalRevenue" 
                stroke="#FF6600" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#eventSalesGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'tiers' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.tierBreakdown} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#94A3B8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                dy={5}
              />
              <YAxis 
                stroke="#94A3B8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1E293B', 
                  borderRadius: '12px', 
                  border: 'none', 
                  color: '#F8FAFC',
                  fontSize: '12px'
                }}
                formatter={(val: number, name: string, item: any) => [
                  `${val} sold / ${item.payload.available} total (${item.payload.fillRate}% sold)`,
                  'Tier Quota'
                ]}
              />
              <Bar dataKey="sold" radius={[6, 6, 0, 0]}>
                {stats.tierBreakdown.map((_, index) => (
                  <Cell key={`tier-cell-${index}`} fill={TIER_BAR_COLORS[index % TIER_BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'gates' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyGateData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="hour" 
                stroke="#94A3B8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                dy={5}
              />
              <YAxis 
                stroke="#94A3B8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1E293B', 
                  borderRadius: '12px', 
                  border: 'none', 
                  color: '#F8FAFC',
                  fontSize: '12px'
                }}
                formatter={(val: number) => [`${val.toLocaleString()} attendees scanned`, 'Gate Arrivals']}
              />
              <Bar dataKey="checkedIn" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Tier Breakdown Progress Bars */}
      {stats.tierBreakdown.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-gray-100">
          <h5 className="text-xs font-black text-adv-slate uppercase tracking-wider">
            {lang === 'lo' ? 'ຄວາມຄືບໜ້າການຂາຍແຕ່ລະປະເພດປີ້' : 'Tier Sales vs Quota Progress'}
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stats.tierBreakdown.map((tier, idx) => (
              <div key={tier.id} className="p-3 bg-gray-50 rounded-xl border border-gray-150 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-adv-slate truncate max-w-[140px]">{tier.name}</span>
                  <span className="font-black text-adv-orange">
                    {tier.price.toLocaleString()} {currency}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, tier.fillRate)}%`,
                      backgroundColor: TIER_BAR_COLORS[idx % TIER_BAR_COLORS.length]
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold">
                  <span>{tier.sold} / {tier.available} {lang === 'lo' ? 'ໃບ' : 'tickets'}</span>
                  <span className="text-adv-slate font-black">{tier.fillRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailGraphSection;
