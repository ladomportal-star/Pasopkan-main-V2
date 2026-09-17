import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Ticket, 
  Users, 
  Calendar, 
  DollarSign, 
  Layers, 
  Clock, 
  Download,
  Filter,
  CheckCircle2,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { LaoEvent } from '../data/events';

interface OrganizerEventAnalyticsProps {
  events: LaoEvent[];
  lang: 'en' | 'lo';
  currency?: string;
  onSelectEventForModal?: (event: LaoEvent) => void;
}

interface EventPerformanceStats {
  id: string;
  title: string;
  ticketsSold: number;
  totalCapacity: number;
  grossRevenue: number;
  checkInCount: number;
  date: string;
  category: string;
}

const TIER_COLORS = ['#FF6600', '#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];

// Deterministic sales generator based on event ID, with slight increase based on refreshTick
function getEventStats(event: LaoEvent, refreshTick: number = 0): EventPerformanceStats {
  // Use event ID as seed
  const numId = parseInt(event.id.replace(/\D/g, ''), 10) || 1;
  const multiplier = ((numId * 17) % 30) + 10; // 10 to 39
  
  // Calculate capacity from ticket tiers or default
  let totalCapacity = 0;
  let estimatedSold = 0;
  let grossRevenue = 0;

  if (event.ticketTiers && event.ticketTiers.length > 0) {
    event.ticketTiers.forEach((tier, idx) => {
      const tierCap = tier.available || 150;
      totalCapacity += tierCap;
      const baseRatio = Math.min(0.95, 0.45 + ((numId + idx * 7) % 45) / 100);
      const soldRatio = Math.min(0.99, baseRatio + (refreshTick * 0.015));
      const tierSold = Math.floor(tierCap * soldRatio);
      estimatedSold += tierSold;
      const cleanPrice = typeof tier.price === 'number' 
        ? tier.price 
        : (Number(String(tier.price).replace(/,/g, '')) || 50);
      // If price is small (< 1000), consider it in thousands of LAK
      const actualPrice = cleanPrice < 1000 ? cleanPrice * 1000 : cleanPrice;
      grossRevenue += tierSold * actualPrice;
    });
  } else {
    totalCapacity = 500;
    const baseRatio = 0.72;
    const soldRatio = Math.min(0.99, baseRatio + (refreshTick * 0.015));
    estimatedSold = Math.floor(totalCapacity * soldRatio);
    const cleanPrice = typeof event.price === 'number' ? event.price : 150000;
    const actualPrice = cleanPrice < 1000 ? cleanPrice * 1000 : cleanPrice;
    grossRevenue = estimatedSold * actualPrice;
  }

  // Ensure reasonable baseline if calculated as 0
  if (estimatedSold === 0) estimatedSold = 180 + multiplier * 4;
  if (totalCapacity === 0) totalCapacity = estimatedSold + 100;
  if (grossRevenue === 0) grossRevenue = estimatedSold * 150000;

  const baseCheckInRate = 0.75 + ((numId % 20) / 100); // 75% to 95%
  const checkInRate = Math.min(0.99, baseCheckInRate + (refreshTick * 0.01));
  const checkInCount = Math.floor(estimatedSold * checkInRate);

  return {
    id: event.id,
    title: event.title,
    ticketsSold: estimatedSold,
    totalCapacity: Math.max(totalCapacity, estimatedSold),
    grossRevenue,
    checkInCount,
    date: event.date,
    category: event.category || 'Festival'
  };
}

export const OrganizerEventAnalytics: React.FC<OrganizerEventAnalyticsProps> = ({
  events,
  lang,
  currency = '₭',
  onSelectEventForModal
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [activeMetricTab, setActiveMetricTab] = useState<'revenue' | 'tickets'>('revenue');
  const [activeChartType, setActiveChartType] = useState<'timeline' | 'tiers' | 'checkin'>('timeline');
  const [isLiveUpdateEnabled, setIsLiveUpdateEnabled] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [showRefreshToast, setShowRefreshToast] = useState(false);

  // Handle the live update interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLiveUpdateEnabled) {
      interval = setInterval(() => {
        setRefreshTick(prev => prev + 1);
        setShowRefreshToast(true);
        setTimeout(() => setShowRefreshToast(false), 3000); // Hide after 3 seconds
      }, 60000); // 60 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveUpdateEnabled]);

  // Compute stats for each event
  const eventsStatsMap = useMemo(() => {
    const map = new Map<string, EventPerformanceStats>();
    events.forEach(e => {
      map.set(e.id, getEventStats(e, refreshTick));
    });
    return map;
  }, [events, refreshTick]);

  // Selected single event (if not 'all')
  const selectedEvent = useMemo(() => {
    if (selectedEventId === 'all') return null;
    return events.find(e => e.id === selectedEventId) || null;
  }, [selectedEventId, events]);

  // Aggregated or Selected Metrics
  const currentMetrics = useMemo(() => {
    if (selectedEvent) {
      const stats = eventsStatsMap.get(selectedEvent.id) || getEventStats(selectedEvent);
      const fillRate = stats.totalCapacity > 0 ? (stats.ticketsSold / stats.totalCapacity) * 100 : 0;
      const checkInRate = stats.ticketsSold > 0 ? (stats.checkInCount / stats.ticketsSold) * 100 : 0;
      const avgPrice = stats.ticketsSold > 0 ? stats.grossRevenue / stats.ticketsSold : 0;
      
      return {
        totalRevenue: stats.grossRevenue,
        totalSold: stats.ticketsSold,
        totalCapacity: stats.totalCapacity,
        fillRate: fillRate.toFixed(1),
        checkInCount: stats.checkInCount,
        checkInRate: checkInRate.toFixed(1),
        avgPrice: Math.round(avgPrice),
        activeCount: 1
      };
    }

    // Combined all events
    let totalRevenue = 0;
    let totalSold = 0;
    let totalCapacity = 0;
    let totalCheckIns = 0;

    eventsStatsMap.forEach(stats => {
      totalRevenue += stats.grossRevenue;
      totalSold += stats.ticketsSold;
      totalCapacity += stats.totalCapacity;
      totalCheckIns += stats.checkInCount;
    });

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
      activeCount: events.length
    };
  }, [selectedEvent, eventsStatsMap, events]);

  // Timeline Data (7 days or points leading to event)
  const timelineData = useMemo(() => {
    const baseRevenue = currentMetrics.totalRevenue;
    const baseTickets = currentMetrics.totalSold;

    const days = lang === 'lo' 
      ? ['ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ', 'ອາທິດ']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Realistic day-by-day distribution weights
    const weights = [0.08, 0.11, 0.13, 0.16, 0.22, 0.18, 0.12];

    let runningRev = 0;
    let runningTix = 0;

    return days.map((day, idx) => {
      const dayRev = Math.round(baseRevenue * weights[idx]);
      const dayTix = Math.round(baseTickets * weights[idx]);
      runningRev += dayRev;
      runningTix += dayTix;

      return {
        name: day,
        revenue: dayRev,
        cumulativeRevenue: runningRev,
        tickets: dayTix,
        cumulativeTickets: runningTix
      };
    });
  }, [currentMetrics, lang]);

  // Tier Breakdown Data (Pie / Donut)
  const tierData = useMemo(() => {
    if (selectedEvent && selectedEvent.ticketTiers && selectedEvent.ticketTiers.length > 0) {
      return selectedEvent.ticketTiers.map((tier, idx) => {
        const cleanPrice = typeof tier.price === 'number' 
          ? tier.price 
          : (Number(String(tier.price).replace(/,/g, '')) || 50);
        const actualPrice = cleanPrice < 1000 ? cleanPrice * 1000 : cleanPrice;
        const tierCap = tier.available || 100;
        const sold = Math.min(tierCap, Math.floor(tierCap * (0.6 + (idx * 0.12))));
        const rev = sold * actualPrice;

        return {
          name: tier.name || `Tier ${idx + 1}`,
          value: sold,
          revenue: rev,
          capacity: tierCap,
          price: actualPrice,
          color: TIER_COLORS[idx % TIER_COLORS.length]
        };
      });
    }

    // Default aggregated distribution for portfolio
    const tierNames = lang === 'lo'
      ? ['ປີ້ທົ່ວໄປ (Regular)', 'ປີ້ VIP Front Stage', 'ປີ້ Early Bird', 'ປີ້ກຸ່ມ/ໝູ່ເພື່ອນ']
      : ['Regular Admission', 'VIP Front Stage', 'Early Bird', 'Group Pass'];
    
    const ratios = [0.52, 0.24, 0.16, 0.08];
    const totalSold = currentMetrics.totalSold || 100;
    const totalRev = currentMetrics.totalRevenue || 1000000;

    return tierNames.map((name, idx) => ({
      name,
      value: Math.round(totalSold * ratios[idx]),
      revenue: Math.round(totalRev * ratios[idx]),
      color: TIER_COLORS[idx % TIER_COLORS.length]
    }));
  }, [selectedEvent, currentMetrics, lang]);

  // Hourly Check-in Velocity (BarChart)
  const checkinHourlyData = useMemo(() => {
    const totalAttendees = currentMetrics.checkInCount || 100;
    const hours = ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
    const distribution = [0.05, 0.12, 0.28, 0.26, 0.15, 0.08, 0.04, 0.02];

    return hours.map((hour, idx) => ({
      hour,
      checkedIn: Math.round(totalAttendees * distribution[idx]),
      peakTarget: Math.round(totalAttendees * 0.25)
    }));
  }, [currentMetrics]);

  // Handle CSV export of event analytics
  const handleExportCSV = () => {
    const rows = events.map(e => {
      const stats = eventsStatsMap.get(e.id) || getEventStats(e);
      return {
        Event_ID: e.id,
        Event_Title: `"${e.title.replace(/"/g, '""')}"`,
        Date: e.date,
        Category: e.category,
        Venue: `"${e.venue.replace(/"/g, '""')}"`,
        Tickets_Sold: stats.ticketsSold,
        Total_Capacity: stats.totalCapacity,
        Gross_Revenue_LAK: stats.grossRevenue,
        Check_Ins: stats.checkInCount,
        Fill_Rate_Percent: `${((stats.ticketsSold / stats.totalCapacity) * 100).toFixed(1)}%`
      };
    });

    if (!rows.length) return;
    const header = Object.keys(rows[0]).join(',');
    const csvContent = header + '\n' + rows.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `event_sales_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mock demographic data with simulated live updates
  const genderData = useMemo(() => {
    // slight variation based on refreshTick
    const maleOffset = (refreshTick % 3) - 1; // -1, 0, 1
    const maleBase = 58;
    return [
      { name: lang === 'lo' ? 'ຊາຍ' : 'Male', value: maleBase + maleOffset, color: '#3B82F6' },
      { name: lang === 'lo' ? 'ຍິງ' : 'Female', value: 100 - (maleBase + maleOffset), color: '#EC4899' }
    ];
  }, [lang, refreshTick]);

  const ageData = useMemo(() => {
    return [
      { age: '18-24', male: 35 + (refreshTick % 2), female: 25 + (refreshTick % 3) },
      { age: '25-34', male: 45 - (refreshTick % 2), female: 55 - (refreshTick % 4) },
      { age: '35-44', male: 15 + (refreshTick % 3), female: 10 + (refreshTick % 2) },
      { age: '45+', male: 5 + (refreshTick % 2), female: 10 - (refreshTick % 2) },
    ];
  }, [refreshTick]);

  return (
    <div className="space-y-6 relative">
      {/* Floating Refresh Toast */}
      <AnimatePresence>
        {showRefreshToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute top-4 right-1/2 translate-x-1/2 z-50 bg-emerald-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold">{lang === 'lo' ? 'ອັບເດດຂໍ້ມູນແລ້ວ' : 'Data Refreshed'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Filter & Selector Bar */}
      <div className="bg-white border border-gray-150 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base sm:text-lg font-black text-adv-slate">
              {lang === 'lo' ? 'ການວິເຄາະ ແລະ ສະຖິຕິກຣາບກິດຈະກຳ' : 'Event Analytics & Graph Intelligence'}
            </h3>
          </div>
          <p className="text-xs text-gray-500 font-medium">
            {lang === 'lo' 
              ? 'ຕິດຕາມຍອດຂາຍປີ້, ລາຍຮັບລວມ, ແລະ ອັດຕາການເຂົ້າຮ່ວມງານແບບລະອຽດ' 
              : 'Real-time sales velocity, gross revenue trajectory, and check-in flow'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Update Toggle */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl shadow-2xs">
            <RefreshCw 
              className={`w-3.5 h-3.5 ${isLiveUpdateEnabled ? 'text-emerald-500 animate-spin' : 'text-gray-400'}`} 
              style={{ animationDuration: '3s' }}
            />
            <span className="text-xs font-bold text-gray-700 hidden sm:inline">
              {lang === 'lo' ? 'ອັບເດດສົດ' : 'Live Update'}
            </span>
            <button
              onClick={() => setIsLiveUpdateEnabled(!isLiveUpdateEnabled)}
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                isLiveUpdateEnabled ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <motion.div
                layout
                className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"
                animate={{ x: isLiveUpdateEnabled ? 14 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>

          {/* Event Selector Dropdown */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <select
              id="organizer-event-graph-filter"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full appearance-none bg-gray-50 hover:bg-gray-100/80 border border-gray-200 text-adv-slate text-xs font-bold rounded-xl pl-3.5 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-adv-orange/30 cursor-pointer transition-colors"
            >
              <option value="all">
                {lang === 'lo' ? '📊 ທຸກກິດຈະກຳລວມກັນ (All Events)' : '📊 All Events Combined'}
              </option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Export Report */}
          <button
            onClick={handleExportCSV}
            id="export-organizer-analytics-csv"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200 hover:border-adv-orange text-gray-700 hover:text-adv-orange rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
            title={lang === 'lo' ? 'ດາວໂຫຼດ CSV' : 'Export CSV'}
          >
            <Download className="w-3.5 h-3.5 text-adv-orange" />
            <span className="hidden sm:inline">{lang === 'lo' ? 'ສົ່ງອອກ CSV' : 'Export CSV'}</span>
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
        {/* Gross Revenue Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs transition-all hover:border-gray-250"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
              {lang === 'lo' ? 'ລາຍຮັບລວມ' : 'Gross Ticket Revenue'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-adv-orange flex items-center justify-center font-black text-sm">
              {currency}
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-adv-slate truncate">
            {currentMetrics.totalRevenue.toLocaleString()} <span className="text-xs font-bold text-gray-400">{currency}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span>+16.4% {lang === 'lo' ? 'ທຽບກັບຮອບຜ່ານມາ' : 'vs last period'}</span>
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
              {lang === 'lo' ? 'ປີ້ທີ່ຂາຍໄດ້' : 'Total Tickets Sold'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-adv-slate">
            {currentMetrics.totalSold.toLocaleString()} <span className="text-xs font-bold text-gray-400">/ {currentMetrics.totalCapacity.toLocaleString()}</span>
          </div>
          {/* Mini Fill Progress Bar */}
          <div className="mt-2.5 space-y-1">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-adv-orange h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Number(currentMetrics.fillRate))}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400">
              <span>{lang === 'lo' ? 'ອັດຕາການຂາຍ' : 'Fill Rate'}</span>
              <span className="text-adv-orange">{currentMetrics.fillRate}%</span>
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
              {lang === 'lo' ? 'ການເຊັກອິນໜ້າປະຕູ' : 'Gate Check-In Rate'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-adv-slate">
            {currentMetrics.checkInCount.toLocaleString()} <span className="text-xs font-bold text-gray-400">{lang === 'lo' ? 'ຄົນ' : 'attendees'}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-emerald-600">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>{currentMetrics.checkInRate}% {lang === 'lo' ? 'ເຂົ້າຮ່ວມແລ້ວ' : 'attendance rate'}</span>
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
          {/* Chart Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
            <div>
              <h4 className="text-sm font-black text-adv-slate flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-adv-orange" />
                {activeChartType === 'timeline' && (lang === 'lo' ? 'ທ່າອ່ຽງຍອດຂາຍປະຈຳວັນ (Sales Trajectory)' : 'Daily Sales Trajectory & Volume')}
                {activeChartType === 'tiers' && (lang === 'lo' ? 'ການແບ່ງສັດສ່ວນຕາມປະເພດປີ້ (Tier Breakdown)' : 'Sales Breakdown by Ticket Tier')}
                {activeChartType === 'checkin' && (lang === 'lo' ? 'ຄວາມໜາແໜ້ນການເຊັກອິນຕໍ່ຊົ່ວໂມງ (Gate Flow)' : 'Hourly Gate Check-In Velocity')}
              </h4>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                {selectedEvent ? selectedEvent.title : (lang === 'lo' ? 'ສະແດງຂໍ້ມູນລວມທຸກກິດຈະກຳ' : 'Aggregated performance across all events')}
              </p>
            </div>

            {/* View Mode Switcher Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-50 border border-gray-200/80 rounded-xl shrink-0">
              <button
                onClick={() => setActiveChartType('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartType === 'timeline'
                    ? 'bg-white text-adv-orange shadow-2xs'
                    : 'text-gray-500 hover:text-adv-slate'
                }`}
              >
                {lang === 'lo' ? 'ກຣາບຍອດຂາຍ' : 'Timeline'}
              </button>
              <button
                onClick={() => setActiveChartType('tiers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartType === 'tiers'
                    ? 'bg-white text-adv-orange shadow-2xs'
                    : 'text-gray-500 hover:text-adv-slate'
                }`}
              >
                {lang === 'lo' ? 'ສັດສ່ວນປີ້' : 'Tier Mix'}
              </button>
              <button
                onClick={() => setActiveChartType('checkin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartType === 'checkin'
                    ? 'bg-white text-adv-orange shadow-2xs'
                    : 'text-gray-500 hover:text-adv-slate'
                }`}
              >
                {lang === 'lo' ? 'ຄວາມໜາແໜ້ນ' : 'Check-In'}
              </button>
            </div>
          </div>

          {/* Sub-metric toggle for Timeline (Revenue vs Ticket count) */}
          {activeChartType === 'timeline' && (
            <div className="flex items-center justify-end gap-2 mb-2">
              <span className="text-[11px] font-bold text-gray-400">{lang === 'lo' ? 'ສະແດງ:' : 'Metric:'}</span>
              <button
                onClick={() => setActiveMetricTab('revenue')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  activeMetricTab === 'revenue' 
                    ? 'bg-orange-50 text-adv-orange border border-orange-200/60' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {lang === 'lo' ? 'ລາຍຮັບ (LAK)' : 'Revenue (₭)'}
              </button>
              <button
                onClick={() => setActiveMetricTab('tickets')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  activeMetricTab === 'tickets' 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200/60' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {lang === 'lo' ? 'ຈຳນວນປີ້' : 'Tickets Sold'}
              </button>
            </div>
          )}

          {/* Chart Rendering */}
          <div className="h-72 w-full pt-2">
            {activeChartType === 'timeline' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(val) => {
                      if (activeMetricTab === 'revenue') {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                        if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                        return `${val}`;
                      }
                      return `${val}`;
                    }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      borderRadius: '12px', 
                      border: 'none', 
                      color: '#F8FAFC',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                    }}
                    formatter={(val: number) => [
                      activeMetricTab === 'revenue' ? `${val.toLocaleString()} ${currency}` : `${val.toLocaleString()} tickets`,
                      activeMetricTab === 'revenue' ? 'Daily Revenue' : 'Tickets Sold'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={activeMetricTab === 'revenue' ? 'revenue' : 'tickets'} 
                    stroke={activeMetricTab === 'revenue' ? '#FF6600' : '#2563EB'} 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill={`url(#${activeMetricTab === 'revenue' ? 'colorRevenue' : 'colorTickets'})`} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {activeChartType === 'tiers' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tierData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                      `${val.toLocaleString()} sold (${(item.payload.revenue || 0).toLocaleString()} ${currency})`,
                      'Tier Performance'
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

            {activeChartType === 'checkin' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={checkinHourlyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis 
                    dataKey="hour" 
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
                    formatter={(val: number) => [`${val.toLocaleString()} attendees`, 'Scanned at Door']}
                  />
                  <Bar dataKey="checkedIn" fill="#10B981" radius={[6, 6, 0, 0]} />
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
                {lang === 'lo' ? 'ສັດສ່ວນປະເພດປີ້' : 'Ticket Tier Ratio'}
              </h4>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {tierData.length} {lang === 'lo' ? 'ລະດັບ' : 'tiers'}
              </span>
            </div>

            {/* Donut Chart */}
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {tierData.map((entry, index) => (
                      <Cell key={`donut-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1E293B', 
                      borderRadius: '10px', 
                      border: 'none', 
                      color: '#fff',
                      fontSize: '11px' 
                    }}
                    formatter={(val: number) => [`${val.toLocaleString()} tix`, 'Volume']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-black text-adv-slate leading-none">
                  {currentMetrics.totalSold.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold text-gray-400 mt-0.5">
                  {lang === 'lo' ? 'ປີ້ທີ່ຂາຍ' : 'Sold'}
                </span>
              </div>
            </div>

            {/* Tier Legend & Metrics List */}
            <div className="space-y-2 mt-2">
              {tierData.map((tier, idx) => {
                const pct = currentMetrics.totalSold > 0 
                  ? ((tier.value / currentMetrics.totalSold) * 100).toFixed(0) 
                  : '0';
                return (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                      <span className="font-bold text-adv-slate truncate max-w-[120px]">{tier.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-adv-slate">{tier.value.toLocaleString()}</span>
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
                {lang === 'lo' ? 'ຊ່ວງອາຍຸຜູ້ເຂົ້າຮ່ວມ' : 'Attendee Age Demographics'}
              </h4>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                {lang === 'lo' ? 'ການກະຈາຍຕົວຂອງອາຍຸ ແລະ ເພດ' : 'Age distribution breakdown by gender'}
              </p>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis 
                  dataKey="age" 
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
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                  }}
                  cursor={{ fill: '#F8FAFC' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                <Bar dataKey="male" name={lang === 'lo' ? 'ຊາຍ' : 'Male'} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="female" name={lang === 'lo' ? 'ຍິງ' : 'Female'} fill="#EC4899" radius={[4, 4, 0, 0]} />
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
                {lang === 'lo' ? 'ສັດສ່ວນເພດ' : 'Gender Distribution'}
              </h4>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                {lang === 'lo' ? 'ພາບລວມເພດຜູ້ເຂົ້າຮ່ວມ' : 'Overall gender split'}
              </p>
            </div>
          </div>

          <div className="relative h-48 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    borderRadius: '10px', 
                    border: 'none', 
                    color: '#fff',
                    fontSize: '11px' 
                  }}
                  formatter={(val: number) => [`${val}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label for Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-black text-adv-slate leading-none">
                {currentMetrics.totalSold > 0 ? '100%' : '0%'}
              </span>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {genderData.map((gender, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: gender.color }} />
                  <span className="font-bold text-adv-slate truncate">{gender.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-black text-adv-slate">{gender.value}%</span>
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
