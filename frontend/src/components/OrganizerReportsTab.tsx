import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Ticket, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  ChevronRight, 
  Download,
  DollarSign,
  TrendingUp,
  User,
  Layers,
  ArrowRight,
  Bell,
  X,
  Clock,
  Check
} from 'lucide-react';
import { LaoEvent } from '../data/events';

interface OrganizerReportsTabProps {
  events: LaoEvent[];
  lang: 'en' | 'lo';
  t: any;
  currency: string;
}

export const OrganizerReportsTab: React.FC<OrganizerReportsTabProps> = ({
  events,
  lang,
  t,
  currency
}) => {
  // Local states
  const [reportCategoryFilter, setReportCategoryFilter] = useState<string>('All');
  const [reportSortOrder, setReportSortOrder] = useState<string>('highest');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Live Notifications State
  const [notifications, setNotifications] = useState<any[]>(() => {
    // Seed with initial realistic historic notifications
    return [
      {
        id: 'init-1',
        type: 'sale',
        title: lang === 'lo' ? 'ປີ້ຂາຍອອກແລ້ວ! 🎟️' : 'Ticket Sold! 🎟️',
        message: lang === 'lo' 
          ? 'ທ່ານ Somphone D. ໄດ້ຊື້ປີ້ VIP Front Stage ຈຳນວນ 1 ໃບ ສຳລັບ Vientiane Light Festival' 
          : 'Somphone D. purchased 1x VIP Front Stage for Vientiane Light Festival',
        amount: '150,000 ₭',
        time: lang === 'lo' ? '30 ນາທີກ່ອນ' : '30m ago',
        isUnread: false
      },
      {
        id: 'init-2',
        type: 'payout',
        title: lang === 'lo' ? 'ດຳເນີນການຈ່າຍເງິນແລ້ວ 💸' : 'Payout Processed 💸',
        message: lang === 'lo'
          ? 'ການຈ່າຍເງິນຈຳນວນ 12,000,000 ₭ ໄດ້ຖືກໂອນເຂົ້າບັນຊີ BCEL ຂອງທ່ານແລ້ວ.'
          : 'Payout of 12,000,000 ₭ has been successfully processed to your BCEL account.',
        amount: '12,000,000 ₭',
        time: lang === 'lo' ? '3 ຊົ່ວໂມງກ່ອນ' : '3h ago',
        isUnread: false
      }
    ];
  });

  const [toasts, setToasts] = useState<any[]>([]);

  // Live KPI offset state to show real-time sales ticking up
  const [liveRevenueOffset, setLiveRevenueOffset] = useState<number>(0);
  const [liveTicketOffset, setLiveTicketOffset] = useState<number>(0);

  // Core static sales data mapping
  const salesDataConfig: Record<string, { ticketsSold: number; revenue: number }> = {
    '1': { ticketsSold: 420, revenue: 135000000 },
    '2': { ticketsSold: 48, revenue: 18000000 },
    '3': { ticketsSold: 85, revenue: 25500000 },
    '4': { ticketsSold: 62, revenue: 18600000 },
    '5': { ticketsSold: 310, revenue: 95000000 },
    '6': { ticketsSold: 540, revenue: 27000000 },
    '7': { ticketsSold: 15, revenue: 14250000 },
    '8': { ticketsSold: 35, revenue: 15750000 },
    '9': { ticketsSold: 110, revenue: 38500000 },
    '10': { ticketsSold: 24, revenue: 4320000 },
  };

  // Enriched events with sales stats
  const enrichedEvents = useMemo(() => {
    return events.map(event => {
      const stats = salesDataConfig[event.id] || { ticketsSold: 15, revenue: 1500000 };
      
      let calculatedRevenue = 0;
      if (event.ticketTiers && event.ticketTiers.length > 0) {
        let remainingTickets = stats.ticketsSold;
        event.ticketTiers.forEach((tier, index) => {
          const distribution = index === 0 ? 0.75 : 0.25;
          const tierSold = Math.min(Math.ceil(stats.ticketsSold * distribution), remainingTickets);
          calculatedRevenue += tierSold * (tier.price || 50) * 1000;
          remainingTickets -= tierSold;
        });
        if (remainingTickets > 0 && event.ticketTiers[0]) {
          calculatedRevenue += remainingTickets * (event.ticketTiers[0].price || 50) * 1000;
        }
      } else {
        calculatedRevenue = stats.ticketsSold * (event.price || 50) * 1000;
      }

      return {
        ...event,
        ticketsSold: stats.ticketsSold,
        revenue: calculatedRevenue || stats.revenue,
      };
    });
  }, [events]);

  // Filter & Search
  const filteredEvents = useMemo(() => {
    return enrichedEvents.filter(event => {
      const matchesCategory = reportCategoryFilter === 'All' || event.category === reportCategoryFilter;
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            event.venue.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [enrichedEvents, reportCategoryFilter, searchQuery]);

  // Sort
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      if (reportSortOrder === 'highest') {
        return b.revenue - a.revenue;
      } else if (reportSortOrder === 'lowest') {
        return a.revenue - b.revenue;
      } else {
        return a.title.localeCompare(b.title);
      }
    });
  }, [filteredEvents, reportSortOrder]);

  // Total KPIs (Integrated with Live offsets)
  const totalRevenue = useMemo(() => filteredEvents.reduce((sum, e) => sum + e.revenue, 0) + liveRevenueOffset, [filteredEvents, liveRevenueOffset]);
  const totalTickets = useMemo(() => filteredEvents.reduce((sum, e) => sum + e.ticketsSold, 0) + liveTicketOffset, [filteredEvents, liveTicketOffset]);
  const averageTicketPrice = useMemo(() => totalTickets > 0 ? totalRevenue / totalTickets : 0, [totalRevenue, totalTickets]);

  // Selected event for details
  const currentSelectedEvent = useMemo(() => {
    if (selectedEventId) {
      const found = enrichedEvents.find(e => e.id === selectedEventId);
      if (found) return found;
    }
    return sortedEvents[0] || enrichedEvents[0] || null;
  }, [selectedEventId, sortedEvents, enrichedEvents]);

  // Mocked simple order history
  const recentOrders = useMemo(() => {
    if (!currentSelectedEvent) return [];
    
    // Create deterministic simple mock orders for the selected event
    const names = ['Sengaloun S.', 'Phanyadeth K.', 'Somphone D.', 'Anousone P.'];
    const times = ['19:28', '18:45', '17:15', '16:30'];
    
    return Array.from({ length: 4 }).map((_, i) => {
      const ticketsCount = (i % 2) + 1;
      const ticketPrice = currentSelectedEvent.price ? currentSelectedEvent.price * 1000 : 150000;
      return {
        id: 30240 + i,
        customer: names[i % names.length],
        tickets: ticketsCount,
        amount: ticketsCount * ticketPrice,
        time: times[i % times.length],
        status: 'Success'
      };
    });
  }, [currentSelectedEvent, lang]);

  // Notification Handler
  const triggerSimulatedEvent = useCallback((forcedType?: 'sale' | 'payout') => {
    const type = forcedType || (Math.random() < 0.75 ? 'sale' : 'payout');
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const nowTime = lang === 'lo' ? 'ຕອນນີ້' : 'Just now';

    let newAlert: any;

    if (type === 'sale') {
      // Pick a random event
      const randomEvent = events[Math.floor(Math.random() * events.length)] || events[0];
      const customerNames = [
        'Xaysana S.', 'Nalee V.', 'Phonepaseuth D.', 'Sithong K.', 'Noy M.', 
        'Anousone P.', 'Sengaloun S.', 'Phanyadeth K.', 'Somphone D.', 'Keoviengxay S.'
      ];
      const customer = customerNames[Math.floor(Math.random() * customerNames.length)];
      const qty = Math.floor(Math.random() * 3) + 1; // 1 to 3 tickets

      // Get standard pricing info
      const tier = (randomEvent.ticketTiers && randomEvent.ticketTiers.length > 0)
        ? randomEvent.ticketTiers[Math.floor(Math.random() * randomEvent.ticketTiers.length)]
        : { name: 'General Admission', price: randomEvent.price || 50 };

      const tierPrice = (tier.price || 50) * 1000;
      const saleAmount = qty * tierPrice;

      newAlert = {
        id,
        type: 'sale',
        title: lang === 'lo' ? 'ປີ້ຂາຍອອກແລ້ວ! 🎟️' : 'Ticket Sold! 🎟️',
        message: lang === 'lo'
          ? `${customer} ໄດ້ຊື້ປີ້ ${tier.name} ຈຳນວນ ${qty} ໃບ ສຳລັບ ${randomEvent.title}`
          : `${customer} purchased ${qty}x ${tier.name} for ${randomEvent.title}`,
        amount: `${saleAmount.toLocaleString()} ₭`,
        time: nowTime,
        isUnread: true
      };

      // Accumulate real-time sales indicators
      setLiveRevenueOffset(prev => prev + saleAmount);
      setLiveTicketOffset(prev => prev + qty);
    } else {
      // Payout notification
      const payoutAmounts = [3000000, 5000000, 8500000, 12000000, 15000000, 20000000];
      const payoutAmt = payoutAmounts[Math.floor(Math.random() * payoutAmounts.length)];
      const banks = ['BCEL', 'JDB'];
      const bank = banks[Math.floor(Math.random() * banks.length)];

      newAlert = {
        id,
        type: 'payout',
        title: lang === 'lo' ? 'ດຳເນີນການຈ່າຍເງິນແລ້ວ 💸' : 'Payout Processed 💸',
        message: lang === 'lo'
          ? `ການຈ່າຍເງິນຈຳນວນ ${payoutAmt.toLocaleString()} ₭ ໄດ້ຖືກໂອນເຂົ້າບັນຊີ ${bank} ຂອງທ່ານແລ້ວ.`
          : `Payout of ${payoutAmt.toLocaleString()} ₭ has been successfully processed to your ${bank} account.`,
        amount: `${payoutAmt.toLocaleString()} ₭`,
        time: nowTime,
        isUnread: true
      };
    }

    // Add to notification list (at the top)
    setNotifications(prev => [newAlert, ...prev]);

    // Add to active toast messages
    setToasts(prev => [newAlert, ...prev]);

    // Auto dismiss toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);

  }, [events, lang]);

  // Interval hook to simulate real-time notification engine
  useEffect(() => {
    const interval = setInterval(() => {
      triggerSimulatedEvent();
    }, 15000); // Ticks every 15 seconds

    return () => clearInterval(interval);
  }, [triggerSimulatedEvent]);

  // Notification management actions
  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isUnread: false } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const unreadCount = useMemo(() => notifications.filter(n => n.isUnread).length, [notifications]);

  // Simplified translations/labels
  const labels = {
    revenue: lang === 'lo' ? 'ລາຍຮັບທັງໝົດ' : 'Total Revenue',
    ticketsSold: lang === 'lo' ? 'ປີ້ທີ່ຂາຍໄດ້' : 'Tickets Sold',
    avgPrice: lang === 'lo' ? 'ລາຄາສະເລ່ຍ/ປີ້' : 'Avg. Ticket Value',
    all: lang === 'lo' ? 'ທັງໝົດ' : 'All Categories',
    sortHighest: lang === 'lo' ? 'ຈັດລຽງ: ລາຍຮັບສູງສຸດ' : 'Revenue: High to Low',
    sortLowest: lang === 'lo' ? 'ຈັດລຽງ: ລາຍຮັບຕ່ຳສຸດ' : 'Revenue: Low to High',
    sortAlphabetical: lang === 'lo' ? 'ຈັດລຽງ: A-Z' : 'Alphabetical A-Z',
    searchPlaceholder: lang === 'lo' ? 'ຄົ້ນຫາ event...' : 'Search event...',
    selectedEventDetails: lang === 'lo' ? 'ລາຍລະອຽດ event ທີ່ເລືອກ' : 'Selected Event Summary',
    noEvents: lang === 'lo' ? 'ບໍ່ພົບຂໍ້ມູນ event' : 'No events match your criteria',
    ticketTierSales: lang === 'lo' ? 'ຍອດຂາຍຕາມປະເພດປີ້' : 'Sales by Ticket Tier',
    recentOrdersLabel: lang === 'lo' ? 'ລາຍການຊື້ຫຼ້າສຸດ' : 'Recent Sales Activity',
    viewAll: lang === 'lo' ? 'ເບິ່ງທັງໝົດ' : 'View All',
    exportReport: lang === 'lo' ? 'ດາວໂຫຼດ Excel' : 'Export Report',
    eventTitleCol: lang === 'lo' ? 'event' : 'Event Name',
    revenueCol: lang === 'lo' ? 'ລາຍຮັບ' : 'Revenue',
    soldCol: lang === 'lo' ? 'ຈຳນວນປີ້' : 'Sold'
  };

  const handleExport = () => {
    const rows = filteredEvents.map(event => {
      let totalCapacity = 0;
      if (event.ticketTiers && event.ticketTiers.length > 0) {
        event.ticketTiers.forEach(tier => totalCapacity += (tier.available || 150));
      } else {
        totalCapacity = 500;
      }
      const ticketsSold = event.ticketsSold || Math.floor(totalCapacity * 0.72);
      const grossRevenue = event.revenue || (ticketsSold * 150000);

      return {
        Event_ID: event.id,
        Event_Title: `"${event.title.replace(/"/g, '""')}"`,
        Date: event.date,
        Category: event.category || 'General',
        Venue: `"${event.venue.replace(/"/g, '""')}"`,
        Tickets_Sold: ticketsSold,
        Total_Capacity: totalCapacity,
        Gross_Revenue: grossRevenue,
        Male_Attendees_Percent: '58%',
        Female_Attendees_Percent: '42%',
        Age_18_24_Percent: '30%',
        Age_25_34_Percent: '50%',
        Age_35_44_Percent: '15%',
        Age_45_Plus_Percent: '5%'
      };
    });

    if (!rows.length) return;

    const header = Object.keys(rows[0]).join(',');
    const csvContent = header + '\n' + rows.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `organizer_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 relative">
      {/* Mini Simple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-adv-slate flex items-center gap-2">
            <span className="p-1.5 bg-orange-50 text-adv-orange rounded-lg">📊</span>
            {t.reportsOverview}
          </h2>
          <p className="text-xs text-gray-500 font-medium mt-1">{t.analyticsDesc}</p>
        </div>
        
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-adv-orange text-gray-600 hover:text-adv-orange rounded-lg text-xs font-bold transition-colors bg-white shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          {labels.exportReport}
        </button>
      </div>

      {/* Clean 2-Column KPI Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {/* Total Revenue */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-gray-200 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ₭
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{labels.revenue}</span>
          </div>
          <div className="text-2xl font-black text-adv-slate">
            {totalRevenue.toLocaleString()} <span className="text-xs font-bold text-gray-400">{currency}</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {lang === 'lo' ? 'ອັດຕາການເຕີບໂຕຄົງທີ່' : 'Steady growth track'}
          </div>
        </motion.div>

        {/* Total Tickets Sold */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:border-gray-200 transition-all"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-adv-orange flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{labels.ticketsSold}</span>
          </div>
          <div className="text-2xl font-black text-adv-slate">
            {totalTickets.toLocaleString()} <span className="text-xs font-bold text-gray-400">{lang === 'lo' ? 'ປີ້' : 'tickets'}</span>
          </div>
          <div className="text-[10px] text-gray-400 font-bold mt-1">
            {filteredEvents.length} {lang === 'lo' ? 'event ທີ່ຖືກກັ່ນຕອງ' : 'filtered events active'}
          </div>
        </motion.div>
      </motion.div>

      {/* Search & Filter Bar */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full bg-white text-adv-slate border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-adv-orange placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Category Dropdown */}
          <select
            value={reportCategoryFilter}
            onChange={(e) => setReportCategoryFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-adv-slate focus:outline-none focus:ring-1 focus:ring-adv-orange cursor-pointer hover:bg-gray-50"
          >
            <option value="All">{labels.all}</option>
            <option value="Festival">Festival</option>
            <option value="Workshop">Workshop</option>
            <option value="Sports">Sports</option>
            <option value="Voucher">Voucher</option>
          </select>

          {/* Sort Order */}
          <select
            value={reportSortOrder}
            onChange={(e) => setReportSortOrder(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-adv-slate focus:outline-none focus:ring-1 focus:ring-adv-orange cursor-pointer hover:bg-gray-50"
          >
            <option value="highest">{labels.sortHighest}</option>
            <option value="lowest">{labels.sortLowest}</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Simple Table List (Left) + Focused Detail Summary / Notifications (Right) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        
        {/* Left 7 Columns: Simple Event Sales List */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-7 bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-2.5 font-bold">{labels.eventTitleCol}</th>
                  <th className="py-2.5 text-center font-bold">{labels.soldCol}</th>
                  <th className="py-2.5 text-right font-bold">{labels.revenueCol}</th>
                  <th className="py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-gray-400 font-medium">
                      {labels.noEvents}
                    </td>
                  </tr>
                ) : (
                  sortedEvents.map((event) => {
                    const isSelected = currentSelectedEvent?.id === event.id;
                    return (
                      <tr 
                        key={event.id}
                        onClick={() => setSelectedEventId(event.id)}
                        className={`cursor-pointer hover:bg-orange-50/20 transition-colors group ${isSelected ? 'bg-orange-50/30 font-semibold' : ''}`}
                      >
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={event.image} 
                              alt={event.title} 
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" 
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-adv-slate truncate max-w-[200px] group-hover:text-adv-orange transition-colors">
                                {event.title}
                              </div>
                              <div className="text-[10px] text-gray-400 font-medium truncate max-w-[180px] mt-0.5">
                                {event.venue}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center text-xs font-bold text-adv-slate">
                          {event.ticketsSold}
                        </td>
                        <td className="py-3 text-right text-xs font-black text-adv-slate">
                          {event.revenue.toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">₭</span>
                        </td>
                        <td className="py-3 text-right pl-2">
                          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-adv-orange translate-x-1' : 'text-gray-300'}`} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Right 5 Columns: Focused Event Detail, Live Alerts & Activity */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="lg:col-span-5 space-y-5"
        >
          
          {/* Live Simulated Notifications Panel */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bell className="w-4.5 h-4.5 text-adv-orange" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <h4 className="text-xs font-black text-adv-slate uppercase tracking-wider">
                  {lang === 'lo' ? 'ການແຈ້ງເຕືອນສົດ' : 'Live Alerts Feed'}
                </h4>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">
                  {lang === 'lo' ? 'ລະບົບຈຳລອງເຮັດວຽກ' : 'SIMULATION ACTIVE'}
                </span>
              </div>
            </div>

            {/* Quick Simulation Manual Controls */}
            <div className="bg-gray-50/70 border border-gray-100 rounded-lg p-2.5 space-y-2">
              <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest text-center">
                {lang === 'lo' ? 'ທົດລອງຈຳລອງເຫດການສົດ' : 'Manual Trigger Simulation'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => triggerSimulatedEvent('sale')}
                  className="px-2 py-1.5 bg-orange-50 hover:bg-orange-100/80 text-adv-orange border border-orange-100 hover:border-orange-200 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer shrink-0"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>{lang === 'lo' ? '+ ຂາຍປີ້' : '+ Ticket Sale'}</span>
                </button>
                <button 
                  onClick={() => triggerSimulatedEvent('payout')}
                  className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100/80 text-blue-600 border border-blue-100 hover:border-blue-200 rounded-md text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer shrink-0"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{lang === 'lo' ? '+ ຈ່າຍເງິນ' : '+ Payout'}</span>
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1 hide-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs font-semibold">
                  {lang === 'lo' ? 'ຍັງບໍ່ມີການແຈ້ງເຕືອນເທື່ອ' : 'No notifications yet'}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notif) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all relative overflow-hidden ${
                        notif.isUnread 
                          ? 'bg-orange-50/20 border-orange-100 shadow-sm' 
                          : 'bg-white border-gray-100/70'
                      }`}
                    >
                      {/* Left indicator accent strip */}
                      <div className={`absolute top-0 left-0 bottom-0 w-1 ${notif.type === 'sale' ? 'bg-adv-orange' : 'bg-blue-500'}`} />
                      
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${notif.type === 'sale' ? 'bg-orange-50 text-adv-orange' : 'bg-blue-50 text-blue-500'}`}>
                        {notif.type === 'sale' ? <Ticket className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-extrabold text-adv-slate leading-none truncate">{notif.title}</span>
                          <span className="text-[9px] text-gray-350 font-bold shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 font-medium leading-normal mt-1">{notif.message}</p>
                        {notif.amount && (
                          <div className="mt-1.5 flex items-center justify-between">
                            <span className={`font-black text-[11px] font-mono ${notif.type === 'sale' ? 'text-adv-orange' : 'text-blue-600'}`}>
                              {notif.type === 'sale' ? '+' : ''}{notif.amount}
                            </span>
                            {notif.isUnread && (
                              <button 
                                onClick={() => markAsRead(notif.id)}
                                className="text-[9px] text-gray-400 hover:text-adv-orange font-bold uppercase tracking-widest cursor-pointer"
                              >
                                {lang === 'lo' ? 'ອ່ານແລ້ວ' : 'Mark as read'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            
            {notifications.length > 0 && (
              <button 
                onClick={markAllNotificationsAsRead}
                className="w-full text-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-adv-orange transition-colors pt-2 border-t border-gray-50 cursor-pointer"
              >
                {lang === 'lo' ? 'ໝາຍທັງໝົດວ່າອ່ານແລ້ວ' : 'Mark all as read'}
              </button>
            )}
          </div>

          {currentSelectedEvent ? (
            <>
              {/* Event Summary Card */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {labels.selectedEventDetails}
                  </h4>
                  <span className="text-[9px] font-bold text-adv-orange bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    {currentSelectedEvent.category}
                  </span>
                </div>

                {/* Event mini banner */}
                <div className="flex gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <img 
                    src={currentSelectedEvent.image} 
                    alt={currentSelectedEvent.title} 
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-lg object-cover shrink-0 border border-gray-200" 
                  />
                  <div className="min-w-0 flex flex-col justify-center">
                    <h5 className="text-xs font-bold text-adv-slate truncate leading-snug">
                      {currentSelectedEvent.title}
                    </h5>
                    <p className="text-[10px] text-gray-400 font-semibold truncate mt-1">
                      📍 {currentSelectedEvent.venue}
                    </p>
                  </div>
                </div>

                {/* Sales distribution inside tiers */}
                <div className="space-y-2.5">
                  <h6 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                    {labels.ticketTierSales}
                  </h6>
                  <div className="space-y-2">
                    {currentSelectedEvent.ticketTiers.map((tier, idx) => {
                      const distributionRatio = idx === 0 ? 0.75 : 0.25;
                      const tierSold = Math.min(Math.ceil(currentSelectedEvent.ticketsSold * distributionRatio), currentSelectedEvent.ticketsSold);
                      const maxCapacity = tier.available || 500;
                      const percent = Math.min(Math.round((tierSold / maxCapacity) * 100), 100);

                      return (
                        <div key={tier.id} className="text-xs bg-gray-50/30 border border-gray-50 p-2 rounded-lg space-y-1">
                          <div className="flex justify-between font-bold text-adv-slate">
                            <span className="truncate">{tier.name}</span>
                            <span>{tierSold} sold</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-adv-orange rounded-full" 
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-400 font-semibold">
                            <span>{percent}% capacity reached</span>
                            <span>Price: {((tier.price || 50) * 1000).toLocaleString()} ₭</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Event Demographics Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {lang === 'lo' ? 'ຂໍ້ມູນພື້ນຖານຜູ້ເຂົ້າຮ່ວມ' : 'Attendee Demographics'}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Gender Distribution */}
                  <div className="space-y-2.5">
                    <h6 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                      {lang === 'lo' ? 'ເພດ' : 'Gender'}
                    </h6>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-adv-slate">
                          <span>{lang === 'lo' ? 'ຊາຍ' : 'Male'}</span>
                          <span>58%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '58%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-adv-slate">
                          <span>{lang === 'lo' ? 'ຍິງ' : 'Female'}</span>
                          <span>42%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-pink-500 rounded-full" style={{ width: '42%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Age Distribution */}
                  <div className="space-y-2.5">
                    <h6 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                      {lang === 'lo' ? 'ອາຍຸ' : 'Age Group'}
                    </h6>
                    <div className="space-y-2">
                      {[
                        { label: '18-24', pct: 35 },
                        { label: '25-34', pct: 45 },
                        { label: '35-44', pct: 15 },
                        { label: '45+', pct: 5 },
                      ].map(age => (
                        <div key={age.label} className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-500 w-8">{age.label}</span>
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-adv-orange rounded-full" style={{ width: `${age.pct}%` }}></div>
                          </div>
                          <span className="text-[9px] font-bold text-gray-400 w-5 text-right">{age.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Recent Sales Activity */}
              <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2.5">
                  {labels.recentOrdersLabel}
                </h4>
                
                <div className="space-y-2.5">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 font-bold text-[9px] flex items-center justify-center">
                          {order.customer[0]}
                        </div>
                        <div>
                          <div className="font-bold text-adv-slate">{order.customer}</div>
                          <div className="text-[10px] text-gray-400">{order.tickets} ticket(s) • {order.time}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-adv-orange">+{order.amount.toLocaleString()} ₭</span>
                        <div className="text-[9px] text-emerald-600 font-bold">Paid</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400">
              Select an event to load simple details
            </div>
          )}
        </motion.div>

      </motion.div>

      {/* Floating Real-time Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full pointer-events-none space-y-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-adv-slate/95 dark:bg-zinc-900/95 text-white p-4 rounded-2xl shadow-2xl border border-white/10 dark:border-zinc-800 pointer-events-auto flex items-start gap-3 backdrop-blur-sm relative overflow-hidden"
            >
              {/* Animated indicator vertical strip */}
              <div className={`absolute top-0 bottom-0 left-0 w-1 ${toast.type === 'sale' ? 'bg-adv-orange' : 'bg-blue-500'}`} />
              
              <div className={`p-2 rounded-xl shrink-0 ${toast.type === 'sale' ? 'bg-orange-500/15 text-adv-orange animate-pulse' : 'bg-blue-500/15 text-blue-400 animate-pulse'}`}>
                {toast.type === 'sale' ? <Ticket className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center justify-between gap-1">
                  <span className={`font-black text-[10px] uppercase tracking-wider ${toast.type === 'sale' ? 'text-adv-orange' : 'text-blue-400'}`}>
                    {toast.title}
                  </span>
                  <span className="text-[9px] font-semibold text-gray-400">{lang === 'lo' ? 'ຕອນນີ້' : 'Just now'}</span>
                </div>
                <p className="text-xs font-bold text-gray-150 mt-1 leading-normal">
                  {toast.message}
                </p>
                {toast.amount && (
                  <div className="mt-1.5 text-xs font-black font-mono flex items-center gap-1">
                    <span>{lang === 'lo' ? 'ຍອດເງິນ:' : 'Amount:'}</span>
                    <span className={toast.type === 'sale' ? 'text-adv-orange' : 'text-blue-400'}>
                      {toast.amount}
                    </span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => dismissToast(toast.id)}
                className="text-gray-400 hover:text-white transition-colors shrink-0 p-0.5 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
};
